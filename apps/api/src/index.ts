import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import { randomUUID } from "node:crypto";

const app = new Hono();

const PORT = Number(process.env.PORT ?? 8787);
/** Comma-separated allowlist. Prod example: https://www.codifypros.com,https://codifypros.com */
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:4321";
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? "contact@codifypros.io";
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER ?? "stub").toLowerCase();
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const CONTACT_FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL ?? "CodifyPros <noreply@codifypros.io>";

const corsOrigins = CORS_ORIGIN.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  "*",
  cors({
    origin: corsOrigins,
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
  company: z.string().trim().max(200).optional(),
  service: z.string().trim().max(80).optional(),
  website: z.string().max(0).optional(),
  _hp: z.string().max(0).optional(),
});

type ContactData = z.infer<typeof contactSchema>;

function emailReady(): { ready: boolean; reason?: string } {
  if (EMAIL_PROVIDER === "stub") return { ready: true };
  if (EMAIL_PROVIDER === "resend") {
    if (!RESEND_API_KEY) {
      return { ready: false, reason: "EMAIL_PROVIDER=resend but RESEND_API_KEY missing" };
    }
    return { ready: true };
  }
  return { ready: false, reason: `Unknown EMAIL_PROVIDER=${EMAIL_PROVIDER}` };
}

function logStubBrief(opts: {
  id: string;
  ip: string;
  data: ContactData;
  budget?: string;
}) {
  const { id, ip, data, budget } = opts;
  const lines = [
    "======== contact brief (stub) ========",
    `id:       ${id}`,
    `at:       ${new Date().toISOString()}`,
    `ip:       ${ip}`,
    `to:       ${CONTACT_TO_EMAIL}`,
    `provider: stub (set EMAIL_PROVIDER=resend + RESEND_API_KEY to send)`,
    `name:     ${data.name}`,
    `email:    ${data.email}`,
    data.company ? `company:  ${data.company}` : null,
    data.service ? `service:  ${data.service}` : null,
    budget ? `budget:   ${budget}` : null,
    `chars:    ${data.message.length}`,
    "---- message ----",
    data.message,
    "======== end brief ========",
  ].filter(Boolean);
  console.log(lines.join("\n"));
}

/** Liveness — process is up */
app.get("/api/health", (c) =>
  c.json({ ok: true as const, status: "healthy", service: "codifypros-api" })
);

/** Readiness — safe to take contact traffic */
app.get("/api/ready", (c) => {
  const mail = emailReady();
  const corsOk = corsOrigins.length > 0;
  const ready = mail.ready && corsOk;
  const body = {
    ok: ready,
    status: ready ? ("ready" as const) : ("not_ready" as const),
    checks: {
      cors: corsOk,
      email: mail.ready,
      emailProvider: EMAIL_PROVIDER,
      contactTo: CONTACT_TO_EMAIL,
    },
    ...(mail.reason ? { reason: mail.reason } : {}),
  };
  return c.json(body, ready ? 200 : 503);
});

app.post("/api/contact", async (c) => {
  const id = randomUUID().slice(0, 8);
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

    if (
      body &&
      typeof body === "object" &&
      (("website" in body &&
        String((body as { website?: unknown }).website ?? "").length > 0) ||
        ("_hp" in body &&
          String((body as { _hp?: unknown })._hp ?? "").length > 0))
    ) {
      console.log(`[contact:${id}] honeypot trip ip=${ip}`);
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
    const mail = emailReady();

    // Prefer stub logging when provider isn't actually ready
    if (EMAIL_PROVIDER === "stub" || !mail.ready) {
      if (EMAIL_PROVIDER !== "stub" && !mail.ready) {
        console.warn(`[contact:${id}] falling back to stub: ${mail.reason}`);
      }
      logStubBrief({ id, ip, data, budget });
      return c.json({ ok: true as const });
    }

    if (EMAIL_PROVIDER === "resend") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: CONTACT_FROM_EMAIL,
          to: [CONTACT_TO_EMAIL],
          reply_to: data.email,
          subject: `Brief from ${data.name}${data.company ? ` (${data.company})` : ""}`,
          text: [
            `Name: ${data.name}`,
            `Email: ${data.email}`,
            data.company ? `Company: ${data.company}` : null,
            data.service ? `Service: ${data.service}` : null,
            budget ? `Budget: ${budget}` : null,
            `id: ${id}`,
            "",
            data.message,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error(`[contact:${id}:resend]`, res.status, detail.slice(0, 300));
        // Keep the brief — don't lose leads on mail outage
        logStubBrief({ id, ip, data, budget });
        return c.json(
          {
            ok: false as const,
            error: "Could not send brief. Try emailing us directly.",
          },
          500
        );
      }
      console.log(`[contact:${id}] sent via resend to=${CONTACT_TO_EMAIL}`);
      return c.json({ ok: true as const });
    }

    logStubBrief({ id, ip, data, budget });
    return c.json({ ok: true as const });
  } catch (err) {
    console.error(`[contact:${id}]`, err);
    return c.json(
      {
        ok: false as const,
        error: "Something went wrong. Try again or email us.",
      },
      500
    );
  }
});

app.notFound((c) => c.json({ ok: false as const, error: "Not found" }, 404));

app.onError((err, c) => {
  console.error("[api]", err);
  return c.json({ ok: false as const, error: "Something went wrong." }, 500);
});

console.log(
  `CodifyPros API on :${PORT} · CORS=${corsOrigins.join("|")} · email=${EMAIL_PROVIDER}`
);
serve({ fetch: app.fetch, port: PORT });
