export type Service = {
  slug: string;
  name: string;
  tag: string;
  outcome: string;
  problem: string;
  ships: string[];
  stack: string[];
  home: boolean;
};

export const services: Service[] = [
  {
    slug: "operations",
    name: "Intelligent Operations",
    tag: "Operations",
    outcome:
      "Replace manual ops with bots, integrations, and workflows that run without babysitting.",
    problem:
      "Leads stall in inboxes. Status lives in five spreadsheets. Handoffs die in chat. Your team spends hours on work that should already be done.",
    ships: [
      "Workflow maps of the real process — not the org chart fiction",
      "Integrations across CRM, email, sheets, and internal tools",
      "Bots and agents that move work forward without ping-pong",
      "Dashboards that show exceptions, not vanity noise",
      "Runbooks so the system survives when people change",
    ],
    stack: ["n8n", "Python", "Zapier", "Make", "Webhooks"],
    home: true,
  },
  {
    slug: "systems",
    name: "Custom Software Systems",
    tag: "Systems",
    outcome: "The right system for how you already work — not another tool pile.",
    problem:
      "Off-the-shelf tools force your process to bend. Shadow spreadsheets proliferate. Nobody trusts the “source of truth.”",
    ships: [
      "Internal tools matched to how operators actually work",
      "Data models that unify fragmented sources",
      "Permissions and audit trails for real accountability",
      "APIs that connect what you already paid for",
      "Migration plans that don’t freeze the business",
    ],
    stack: ["TypeScript", "Postgres", "React", "Node", "REST/GraphQL"],
    home: true,
  },
  {
    slug: "product",
    name: "Product & Platform Builds",
    tag: "Product",
    outcome: "Web, mobile, and platforms teams actually ship on.",
    problem:
      "Roadmaps stall between design and engineering. Platforms accrue debt. Customers wait while the team rebuilds the same screens.",
    ships: [
      "Web and mobile products with clear scope and ship dates",
      "Platform foundations: auth, billing hooks, multi-tenant patterns",
      "Design systems that stay lean and usable",
      "CI/CD and environments that don’t surprise you",
      "Handoff docs so your team can own what ships",
    ],
    stack: ["Astro", "Next.js", "React Native", "Tailwind", "Vercel"],
    home: true,
  },
  {
    slug: "ai",
    name: "Applied AI",
    tag: "AI",
    outcome: "Agents and models wired into real processes — not demos.",
    problem:
      "Chatbots that don’t know your data. Pilots that never leave staging. Models that sound smart and still create more cleanup work.",
    ships: [
      "Agents grounded in your docs, tickets, and systems of record",
      "Retrieval and tool-use wired to approved actions",
      "Human-in-the-loop gates where judgment still matters",
      "Eval harnesses so quality doesn’t silently rot",
      "Cost and latency budgets you can live with",
    ],
    stack: ["OpenAI", "Anthropic", "LangChain", "RAG", "Python"],
    home: true,
  },
  {
    slug: "cloud",
    name: "Cloud & Run",
    tag: "Cloud",
    outcome: "Keep systems hosted, observed, and compounding after launch.",
    problem:
      "Launch day is not the finish line. Unowned infra drifts. Alerts go unread. Small fixes never get scheduled.",
    ships: [
      "Hosting and environments with clear ownership",
      "Observability: logs, metrics, and actionable alerts",
      "On-call rhythms sized for a small team",
      "Steady improvements on a compounding cadence",
      "Cost visibility before the bill surprises you",
    ],
    stack: ["AWS", "GCP", "Docker", "Terraform", "Grafana"],
    home: false,
  },
];

export const methodSteps = [
  {
    index: "01",
    title: "Audit",
    body: "Map the manual work and where hours actually burn.",
  },
  {
    index: "02",
    title: "Build",
    body: "Design and ship the system that fits how you operate.",
  },
  {
    index: "03",
    title: "Activate",
    body: "Wire people, data, and agents so it runs in production.",
  },
  {
    index: "04",
    title: "Compound",
    body: "Steady, observe, tighten — Cloud & Run when you want us on the wheel.",
  },
];

export const beliefs = [
  {
    n: "01",
    title: "Replace manual ops with intelligent systems",
    body: "Software, agents, and workflows should run the work — people keep the judgment.",
  },
  {
    n: "02",
    title: "The right system, not more software",
    body: "We refuse tool sprawl. Fit beats feature checklists.",
  },
  {
    n: "03",
    title: "Honest small-team scale",
    body: "Pakistan HQ, US reach. We take work we can ship well — not vanity headcount.",
  },
  {
    n: "04",
    title: "Proof over promises",
    body: "Hours saved, steps removed, systems connected. Metrics you can verify.",
  },
];

export const whoWeHelp = [
  {
    title: "Construction ops",
    body: "Field updates, procurement, and schedules that currently live in chat and sheets.",
  },
  {
    title: "Real estate teams",
    body: "Lead routing, listing ops, and follow-ups that stall without a system owner.",
  },
  {
    title: "Operators drowning in tools",
    body: "Too many SaaS seats, not enough connected truth. We cut the busywork.",
  },
];

export const fitIf = [
  "You know where hours burn and want a system, not another dashboard.",
  "You’re ready to change process — not just buy software.",
  "You want a small team that ships and sticks around after launch.",
  "You value clear scope and honest “no” over endless discovery.",
];

export const notFitIf = [
  "You need a 40-person agency theater or enterprise RFP pageantry.",
  "You’re shopping for a chatbot demo with no process behind it.",
  "You want us to “do AI” without naming the work it replaces.",
  "You need staff augmentation with no ownership of outcomes.",
];
