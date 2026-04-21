import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seededIssues = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    title: "European customer portal outage following security containment",
    summary:
      "Customer self-service remains degraded across three markets while the security team verifies whether the incident reflects unauthorized access or defensive isolation only.",
    issueType: "Cyber incident",
    severity: "Critical",
    status: "Ready to brief",
    ownerName: "Amina Shah",
    audience: "CEO, COO, GC",
    sourcesCount: 9,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    title: "Regulator signals accelerated review of sustainability disclosure claims",
    summary:
      "A formal inquiry is expected this week; current messaging needs alignment on timeline, exposure, and what has already been stated publicly.",
    issueType: "Regulatory announcement",
    severity: "High",
    status: "Active",
    ownerName: "Jonas Reed",
    audience: "Corporate Affairs, Legal",
    sourcesCount: 11,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    title: "Activist coalition reframes supply-chain dispute as worker-safety failure",
    summary:
      "The narrative is spreading across trade press and campaign channels, but operational facts and likely escalation path are still mixed.",
    issueType: "Reputational controversy",
    severity: "Moderate",
    status: "Monitoring",
    ownerName: "Lena Brooks",
    audience: "External Affairs",
    sourcesCount: 14,
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    title: "Pricing change rumor begins trending after partner forum leak",
    summary:
      "A partial screenshot from a partner channel is being interpreted as a confirmed price increase; internal validation and spokesperson guidance required.",
    issueType: "Market rumor",
    severity: "High",
    status: "Needs validation",
    ownerName: null,
    audience: "CMO, Sales, Support",
    sourcesCount: 6,
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    title: "Product safety incident reported by local media ahead of internal confirmation",
    summary:
      "Local coverage is limited but fast-moving; we need clarity on incident scope, injury claims, and whether any recall language is warranted.",
    issueType: "Safety incident",
    severity: "Critical",
    status: "Open gap",
    ownerName: "Priya Nair",
    audience: "CEO, COO, Comms",
    sourcesCount: 4,
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    title: "Planned service maintenance miscommunicated as unplanned disruption",
    summary:
      "Customer questions are rising because the maintenance window was described inconsistently across regions; unify language and clarify expected impact.",
    issueType: "Operational update",
    severity: "Moderate",
    status: "Ready for review",
    ownerName: "Miguel Alvarez",
    audience: "Support, Regional Leads",
    sourcesCount: 7,
  },
] as const;

async function main() {
  for (const issue of seededIssues) {
    await prisma.issue.upsert({
      where: { id: issue.id },
      create: issue,
      update: {
        title: issue.title,
        summary: issue.summary,
        issueType: issue.issueType,
        severity: issue.severity,
        status: issue.status,
        ownerName: issue.ownerName,
        audience: issue.audience,
        sourcesCount: issue.sourcesCount,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

