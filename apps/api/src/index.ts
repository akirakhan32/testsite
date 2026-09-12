import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";

const app = new Hono();

const PORT = Number(process.env.PORT ?? 8787);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:4321";
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? "contact@codifypros.io";
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER ?? "stub").toLowerCase();

app.use(
  "*",
  cors({
    origin: CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.use(
  "/api/contact",
  bodyLimit({
    maxSize: 32 * 1024,
    onError: (c) =>
      c.json({ ok: false as const, error: "Request body too large" }, 400),
  })
);

/** Simple in-memory sliding window: 5 requests / IP / 15 minutes.
 *  Production: swap for Redis/KV — this map resets on deploy/restart. */
const RATE_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

/** Locked budget bands (matches Frontend contact select). */
const budgetEnum = z.enum([
  "under-10k",
  "10-25k",
  "25-50k",
  "50k-plus",
  "not-sure",
]);

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid work email required").max(200),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a bit more (10+ characters)")
    .max(5000),
  budget: budgetEnum.optional().or(z.literal("")),
  /** Optional extras accepted but not required by contract */
  company: z.string().trim().max(200).optional(),
  service: z.string().trim().max(80).optional(),
  /** Honeypot — must be empty / absent */
  website: z.string().max(0).optional(),
  _hp: z.string().max(0).optional(),
});

app.get("/api/health", (c) =>
  c.json({ ok: true as const, status: "healthy", service: "codifypros-api" })
);

app.post("/api/contact", async (c) => {
  try {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "unknown";

    if (rateLimited(ip)) {
      return c.json(
        { ok: false as const, error: "Too many requests. Try again later." },
        429
      );
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ ok: false as const, error: "Invalid JSON body" }, 400);
    }

    // Honeypot: if filled, pretend success (don't tip off bots)
    if (
      body &&
      typeof body === "object" &&
      (("website" in body &&
        String((body as { website?: unknown }).website ?? "").length > 0) ||
        ("_hp" in body &&
          String((body as { _hp?: unknown })._hp ?? "").length > 0))
    ) {
      return c.json({ ok: true as const });
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return c.json(
        {
          ok: false as const,
          error: issue?.message ?? "Validation failed",
          field: issue?.path?.[0] != null ? String(issue.path[0]) : undefined,
        },
        400
      );
    }

    const data = parsed.data;
    const budget = data.budget || undefined;

    const brief = {
      at: new Date().toISOString(),
      ip,
      to: CONTACT_TO_EMAIL,
      name: data.name,
      email: data.email,
      company: data.company ?? null,
      service: data.service ?? null,
      budget: budget ?? null,
      message: data.message,
    };

    if (EMAIL_PROVIDER === "stub" || !process.env.RESEND_API_KEY) {
      console.log("[contact:stub]", {
        ...brief,
        message: data.message.slice(0, 200),
      });
    } else if (EMAIL_PROVIDER === "resend") {
      // Real send path — requires RESEND_API_KEY + CONTACT_FROM_EMAIL
      const from =
        process.env.CONTACT_FROM_EMAIL ?? "CodifyPros <noreply@codifypros.io>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [CONTACT_TO_EMAIL],
          reply_to: data.email,
          subject: `Brief from ${data.name}${data.company ? ` (${data.company})` : ""}`,
          text: [
            `Name: ${data.name}`,
            `Email: ${data.email}`,
            data.company ? `Company: ${data.company}` : null,
            data.service ? `Service: ${data.service}` : null,
            budget ? `Budget: ${budget}` : null,
            "",
            data.message,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("[contact:resend]", res.status, detail.slice(0, 300));
        return c.json(
          { ok: false as const, error: "Could not send brief. Try emailing us directly." },
          500
        );
      }
    } else {
      console.warn(`[contact] Unknown EMAIL_PROVIDER=${EMAIL_PROVIDER}; stubbing`);
      console.log("[contact:stub]", {
        ...brief,
        message: data.message.slice(0, 200),
      });
    }

    return c.json({ ok: true as const });
  } catch (err) {
    console.error("[contact]", err);
    return c.json(
      { ok: false as const, error: "Something went wrong. Try again or email us." },
      500
    );
  }
});

app.notFound((c) => c.json({ ok: false as const, error: "Not found" }, 404));

app.onError((err, c) => {
  console.error("[api]", err);
  return c.json(
    { ok: false as const, error: "Something went wrong." },
    500
  );
});

console.log(`CodifyPros API listening on http://localhost:${PORT}`);
serve({ fetch: app.fetch, port: PORT });
