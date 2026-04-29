import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_ACTOR = "demo.operator@metis.local";

/**
 * Demo-quality, non-incident corporate affairs / comms briefing scenarios.
 * Seed IDs are fixed so the dataset is idempotent and easy to reset.
 */
const seededIssues = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Proposed service opening-hours consultation: briefing pack and stakeholder line",
    summary:
      "A fictional local authority is preparing a consultation on proposed changes to library opening hours across four sites. Corporate affairs needs a coherent briefing: what is confirmed, what is still under discussion, how to evidence the rationale, and what messages are appropriate for staff, elected members, and community groups.",
    issueType: "Consultation briefing",
    severity: "Normal",
    status: "Ready for review",
    priority: "Normal",
    operatorPosture: "Monitoring",
    ownerName: "Casey Morgan",
    audience:
      "Leadership, Corporate Affairs, Service Leads. Stakeholders: councillors, library users, unions, community partners.",
    confirmedFacts:
      [
        "- A public consultation is planned (dates to be confirmed) covering four library sites.",
        "- The proposal under review is to reduce low-footfall weekday hours and extend two weekend sessions at two sites.",
        "- No decisions have been formally taken; consultation materials are in draft.",
      ].join("\n"),
    context:
      [
        "Background: the service is reviewing hours as part of a budget balancing exercise and a broader access plan.",
        "Comms posture: treat this as leadership-facing and stakeholder-sensitive; avoid implying a final decision.",
        "The briefing should reconcile evidence (footfall, staffing, equality considerations) with clear consultation language and practical next steps.",
      ].join("\n\n"),
    openQuestions:
      [
        "What specific hours-change options will be consulted on for each site (by day/time)?",
        "What is the consultation timeline (draft sign-off, launch, close, decision point)?",
        "What evidence will be cited publicly (footfall, cost, access impact) and what can remain internal?",
      ].join("\n"),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    title: "Community criticism of redevelopment consultation: alignment on narrative and evidence",
    summary:
      "A fictional redevelopment programme is facing community criticism that the consultation is not accessible and that key decisions feel pre-determined. The goal is a calm, evidence-based briefing that clarifies what is confirmed, what is still genuinely open, and how to respond to stakeholder concerns without escalating the tone.",
    issueType: "Stakeholder narrative",
    severity: "High",
    status: "Active",
    priority: "High",
    operatorPosture: "Active",
    ownerName: "Ruth Patel",
    audience: "Leadership, Corporate Affairs, Programme Director. Stakeholders: residents, community groups, local press.",
    confirmedFacts:
      [
        "- Two in-person consultation sessions have been held; attendance was modest and skewed toward one neighbourhood.",
        "- An online survey is live and will remain open for a further two weeks (fictional timeline).",
        "- The programme has published a high-level concept brief and an FAQ; a technical report exists internally.",
      ].join("\n"),
    context:
      [
        "The redevelopment aims to improve access and modernise facilities, but stakeholders are concerned about disruption and perceived displacement.",
        "The briefing should stay leadership-facing: focus on process integrity, accessibility, and evidence, not on debate-winner phrasing.",
        "Ensure the message set distinguishes between what is already constrained (budget, planning rules) and what is genuinely open to consultation input.",
      ].join("\n\n"),
    openQuestions:
      [
        "Which design elements are explicitly open to change vs fixed constraints (budget, planning, safety)?",
        "What accessibility support is available for consultation participation (languages, formats, assisted sessions)?",
        "What is the internal threshold for ‘material change’ driven by feedback, and who signs it off?",
      ].join("\n"),
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    title: "CEO stakeholder roundtable briefing: priorities, proof points, and follow-ups",
    summary:
      "A fictional CEO roundtable is scheduled with civic and business stakeholders. The CEO needs a compact briefing that aligns on the organisation’s near-term priorities, evidence-backed proof points, and a disciplined set of follow-ups. This is not crisis comms: it is leadership-facing relationship management.",
    issueType: "Leadership briefing",
    severity: "Normal",
    status: "Ready for review",
    priority: "Normal",
    operatorPosture: "Monitoring",
    ownerName: "Eli Park",
    audience: "CEO, Corporate Affairs, Public Affairs. Stakeholders: business leaders, community partners, civic officials.",
    confirmedFacts:
      [
        "- The roundtable is scheduled for next month (fictional date) with 10–12 invitees.",
        "- Agenda topics include service access, redevelopment plans, and local partnership opportunities.",
        "- A short CEO opening statement is expected, followed by moderated Q&A and follow-up commitments.",
      ].join("\n"),
    context:
      [
        "Stakeholders expect clarity on priorities and delivery, plus reassurance on consultation integrity and accessibility.",
        "The briefing should include disciplined boundaries: what we can commit to, what needs validation, and what requires a follow-up pathway.",
        "Use evidence language (“sources”) and “gaps” to keep the conversation credible and avoid over-claiming.",
      ].join("\n\n"),
    openQuestions:
      [
        "Which stakeholder-specific concerns are expected (by sector/community) and who will support the CEO with details?",
        "What concrete partnership offers (if any) can be mentioned without committing procurement or budget?",
        "What follow-up cadence will be offered (written note, next meeting, named owner)?",
      ].join("\n"),
  },
] as const;

const stakeholderGroups = [
  {
    id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
    name: "Leadership",
    description: "Leadership-facing briefings: disciplined, evidence-based, action-oriented.",
    defaultSensitivity: "Sensitive; suitable for leadership circulation only until reviewed.",
    defaultChannels: "Email, briefing note, in-person update",
    defaultToneGuidance: "Calm, factual, avoid over-claiming; separate confirmed vs unclear.",
    displayOrder: 10,
  },
  {
    id: "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
    name: "Staff and service teams",
    description: "Internal stakeholders who need practical clarity and consistent language.",
    defaultSensitivity: "Internal; keep aligned with published consultation wording.",
    defaultChannels: "All-staff note, intranet update, manager cascade",
    defaultToneGuidance: "Clear, practical, avoid speculation; explain what happens next.",
    displayOrder: 20,
  },
  {
    id: "aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
    name: "Community and residents",
    description: "Public/community stakeholders: trust, process integrity, accessibility.",
    defaultSensitivity: "External-facing; ensure process integrity and accessibility details.",
    defaultChannels: "Web update, community meetings, social posts (careful), press lines",
    defaultToneGuidance: "Respectful, accessible, avoid defensiveness; invite participation.",
    displayOrder: 30,
  },
  {
    id: "aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4",
    name: "Elected members and officials",
    description: "Decision-makers and civic partners requiring clear options and constraints.",
    defaultSensitivity: "Sensitive; align with governance and formal decision points.",
    defaultChannels: "Member briefing, committee pack, 1:1 briefings",
    defaultToneGuidance: "Structured, options-based; highlight constraints and decision points.",
    displayOrder: 40,
  },
] as const;

async function main() {
  // Remove prior fixed-id demo issues so reseeding is deterministic and non-incident by default.
  await prisma.issue.deleteMany({
    where: {
      id: {
        in: [
          "11111111-1111-1111-1111-111111111111",
          "22222222-2222-2222-2222-222222222222",
          "33333333-3333-3333-3333-333333333333",
          "44444444-4444-4444-4444-444444444444",
          "55555555-5555-5555-5555-555555555555",
          "66666666-6666-6666-6666-666666666666",
        ],
      },
    },
  });

  for (const group of stakeholderGroups) {
    await prisma.stakeholderGroup.upsert({
      where: { name: group.name },
      create: group,
      update: {
        description: group.description,
        defaultSensitivity: group.defaultSensitivity,
        defaultChannels: group.defaultChannels,
        defaultToneGuidance: group.defaultToneGuidance,
        displayOrder: group.displayOrder,
        isActive: true,
      },
    });
  }

  for (const issue of seededIssues) {
    const sources = (() => {
      if (issue.id.startsWith("11111111")) {
        return [
          {
            id: "11111111-0000-0000-0000-000000000101",
            sourceCode: "SRC-01",
            tier: "Official",
            title: "Draft consultation overview (internal working draft)",
            note:
              "Fictional draft outlining the purpose of the hours consultation, high-level options, and the intended decision path. Not yet approved for external publication.",
            snippet:
              "We propose to consult on revised opening hours to balance access, cost, and service demand. No final decisions have been taken; feedback will inform the recommended option presented for decision.",
            reliability: "High (internal working draft; subject to change)",
            linkedSection: "Consultation approach",
            url: null,
            timestampLabel: "Draft v0.6 (fictional)",
          },
          {
            id: "11111111-0000-0000-0000-000000000102",
            sourceCode: "SRC-02",
            tier: "Internal",
            title: "Footfall and session demand summary (last 12 months)",
            note:
              "Fictional internal analysis showing low weekday morning attendance at two sites and higher weekend demand. Used as evidence base for options design.",
            snippet:
              "Across the period, weekend sessions show materially higher utilisation at Sites B and D. Weekday morning sessions at Site A are consistently low. Data should be paired with equality/access considerations before publication.",
            reliability: "Medium–High (internal analysis; validate methodology before external use)",
            linkedSection: "Evidence base",
            url: null,
            timestampLabel: "FY trend snapshot (fictional)",
          },
          {
            id: "11111111-0000-0000-0000-000000000103",
            sourceCode: "SRC-03",
            tier: "Official",
            title: "Equality impact screening checklist (template) + initial notes",
            note:
              "Fictional screening notes indicating where further assessment is required (access, disability, carers, travel time).",
            snippet:
              "Initial screening suggests potential access impacts for shift workers and disabled residents depending on site-specific hours. Further input needed from accessibility advisors before finalising options.",
            reliability: "Medium (early screening; requires formal review)",
            linkedSection: "Equality and accessibility",
            url: null,
            timestampLabel: "Screening notes (fictional)",
          },
        ];
      }
      if (issue.id.startsWith("22222222")) {
        return [
          {
            id: "22222222-0000-0000-0000-000000000201",
            sourceCode: "SRC-01",
            tier: "Official",
            title: "Programme concept brief (published summary)",
            note:
              "Fictional published high-level description of the redevelopment intent and process. Useful as the external anchor.",
            snippet:
              "The programme aims to modernise facilities and improve access. Consultation will gather views on priorities and design considerations within constraints such as budget, planning policy, and safety requirements.",
            reliability: "High (published summary; keep aligned)",
            linkedSection: "Public narrative",
            url: "https://example.test/programme/concept-brief",
            timestampLabel: "Published (fictional)",
          },
          {
            id: "22222222-0000-0000-0000-000000000202",
            sourceCode: "SRC-02",
            tier: "Major media",
            title: "Local news article: residents question consultation accessibility",
            note:
              "Fictional local reporting quoting a community group calling the process ‘hard to engage with’. Potential reputational sensitivity but not crisis-level.",
            snippet:
              "Residents said sessions were ‘not well advertised’ and that the survey language felt technical. The article calls for more accessible formats and clearer explanation of what can change.",
            reliability: "Medium (media summary; cross-check quotes)",
            linkedSection: "Stakeholder criticism",
            url: "https://example.test/news/consultation-criticism",
            timestampLabel: "This week (fictional)",
          },
          {
            id: "22222222-0000-0000-0000-000000000203",
            sourceCode: "SRC-03",
            tier: "Internal",
            title: "Consultation participation snapshot (attendance + survey)",
            note:
              "Fictional internal participation summary. Useful for leadership: where engagement is uneven and what mitigation is planned.",
            snippet:
              "Attendance is uneven by neighbourhood, with lower participation from older residents and non-native speakers. The team is planning additional assisted sessions and translated summaries.",
            reliability: "Medium–High (internal tracking; keep updated)",
            linkedSection: "Consultation integrity",
            url: null,
            timestampLabel: "Week 1–2 snapshot (fictional)",
          },
        ];
      }
      return [
        {
          id: "33333333-0000-0000-0000-000000000301",
          sourceCode: "SRC-01",
          tier: "Official",
          title: "Roundtable agenda draft + invitee list (internal)",
          note:
            "Fictional agenda with intended topics and invitees. Useful for preparing proof points and sensitive boundaries.",
          snippet:
            "Agenda: 1) Access priorities 2) Consultation lessons learned 3) Partnership opportunities 4) Q&A. Invitees include business and community leaders; expect questions on delivery milestones and accessibility.",
          reliability: "High (internal draft; subject to finalisation)",
          linkedSection: "Roundtable preparation",
          url: null,
          timestampLabel: "Draft v0.3 (fictional)",
        },
        {
          id: "33333333-0000-0000-0000-000000000302",
          sourceCode: "SRC-02",
          tier: "Internal",
          title: "Performance proof points: access metrics and service improvements (one-pager)",
          note:
            "Fictional metrics pack with cautious claims and suggested wording. Intended for leadership-facing briefing, not a press release.",
          snippet:
            "Proof points should be phrased as directional and evidence-backed. Where numbers are used, cite source and timeframe; avoid implying causality without validation.",
          reliability: "Medium–High (internal; validate before external use)",
          linkedSection: "Evidence base",
          url: null,
          timestampLabel: "Q2 snapshot (fictional)",
        },
        {
          id: "33333333-0000-0000-0000-000000000303",
          sourceCode: "SRC-03",
          tier: "Official",
          title: "Stakeholder feedback themes from prior engagements (published summary)",
          note:
            "Fictional public-facing summary of themes (what stakeholders asked for, what was heard).",
          snippet:
            "Themes: accessibility, transparency on constraints, and clear follow-up commitments. Stakeholders value specific next steps over broad assurances.",
          reliability: "High (published summary; align language)",
          linkedSection: "Stakeholder lens",
          url: "https://example.test/stakeholder/themes",
          timestampLabel: "Last quarter (fictional)",
        },
      ];
    })();

    const gaps = (() => {
      if (issue.id.startsWith("11111111")) {
        return [
          {
            id: "11111111-0000-0000-0000-000000000401",
            title: "Define the site-by-site hours options for consultation",
            whyItMatters: "Without precise options, the consultation narrative will sound vague and invite avoidable criticism.",
            stakeholder: "Leadership / Service Leads",
            linkedSection: "Consultation approach",
            severity: "Important",
            status: "Open",
            prompt: "What exact hours options will be presented for each library site (day/time), and which are constraints vs choices?",
          },
          {
            id: "11111111-0000-0000-0000-000000000402",
            title: "Confirm the governance timeline and decision point",
            whyItMatters: "Stakeholders will ask when input changes outcomes; leadership needs a clear decision path.",
            stakeholder: "Elected members / Officials",
            linkedSection: null,
            severity: "Important",
            status: "Open",
            prompt: "What is the consultation timeline (launch/close) and the formal decision point (committee/date)?",
          },
          {
            id: "11111111-0000-0000-0000-000000000403",
            title: "Accessibility and equality considerations require a clear plan",
            whyItMatters: "Participation and credibility depend on accessible formats and clear mitigations.",
            stakeholder: "Community and residents",
            linkedSection: "Equality and accessibility",
            severity: "Watch",
            status: "Open",
            prompt: "What accessibility support will be offered (formats, languages, assisted sessions), and how will equality impacts be assessed?",
          },
        ];
      }
      if (issue.id.startsWith("22222222")) {
        return [
          {
            id: "22222222-0000-0000-0000-000000000501",
            title: "Clarify what is genuinely open to change",
            whyItMatters: "If stakeholders believe decisions are pre-set, trust declines and the process becomes reputationally fragile.",
            stakeholder: "Community and residents",
            linkedSection: "Public narrative",
            severity: "Critical",
            status: "Open",
            prompt: "Which design elements are open to change based on feedback, and which are fixed constraints (budget/planning/safety)?",
          },
          {
            id: "22222222-0000-0000-0000-000000000502",
            title: "Improve participation balance with targeted support",
            whyItMatters: "Uneven participation can be interpreted as exclusion; leadership will be asked for mitigations.",
            stakeholder: "Leadership",
            linkedSection: "Consultation integrity",
            severity: "Important",
            status: "Open",
            prompt: "What additional consultation access steps will be taken (assisted sessions, translations, outreach) and when?",
          },
          {
            id: "22222222-0000-0000-0000-000000000503",
            title: "Define decision threshold for material change",
            whyItMatters: "The organisation needs an internal rule for what feedback triggers a change vs explanation.",
            stakeholder: "Programme Director",
            linkedSection: null,
            severity: "Important",
            status: "Open",
            prompt: "What is the internal threshold for ‘material change’ driven by consultation feedback, and who signs it off?",
          },
        ];
      }
      return [
        {
          id: "33333333-0000-0000-0000-000000000601",
          title: "Confirm CEO proof points that can be stated as confirmed facts",
          whyItMatters: "A leadership briefing must avoid over-claiming; proof points need evidence and safe wording.",
          stakeholder: "Leadership",
          linkedSection: "Evidence base",
          severity: "Important",
          status: "Open",
          prompt: "Which proof points are confirmed (with sources) and which need softer wording or validation before the roundtable?",
        },
        {
          id: "33333333-0000-0000-0000-000000000602",
          title: "Map likely stakeholder questions and assign owners",
          whyItMatters: "The CEO needs credible follow-ups; owners prevent dropped commitments.",
          stakeholder: "Corporate Affairs",
          linkedSection: "Roundtable preparation",
          severity: "Important",
          status: "Open",
          prompt: "What questions are most likely by stakeholder group, and who is the named owner for each follow-up?",
        },
        {
          id: "33333333-0000-0000-0000-000000000603",
          title: "Define follow-up cadence and documentation",
          whyItMatters: "Stakeholders value clear next steps; a follow-up plan strengthens trust without making dramatic promises.",
          stakeholder: "CEO Office",
          linkedSection: null,
          severity: "Watch",
          status: "Open",
          prompt: "What follow-up cadence will be offered (written note, next meeting, named owner), and how will commitments be tracked?",
        },
      ];
    })();

    const internalInputs = (() => {
      if (issue.id.startsWith("11111111")) {
        return [
          {
            id: "11111111-0000-0000-0000-000000000701",
            role: "Service Lead",
            name: "Jordan Ellis",
            response:
              "The team is trying to protect peak after-school sessions while reducing low-attendance weekday mornings. We should avoid language that sounds like closures; it’s about rebalancing hours by site.",
            confidence: "Likely",
            excludedFromBrief: false,
            linkedSection: "Consultation approach",
            visibility: "Internal",
            timestampLabel: "Notes from planning meeting (fictional)",
          },
          {
            id: "11111111-0000-0000-0000-000000000702",
            role: "Accessibility Advisor",
            name: "Samira Khan",
            response:
              "If we cite footfall, we must also address access barriers: travel time, disability access, and carers. Provide assisted participation routes and plain-language summaries.",
            confidence: "High",
            excludedFromBrief: false,
            linkedSection: "Equality and accessibility",
            visibility: "Internal",
            timestampLabel: "Accessibility review note (fictional)",
          },
          {
            id: "11111111-0000-0000-0000-000000000703",
            role: "Comms",
            name: "Avery Chen",
            response:
              "A simple stakeholder-safe message set should distinguish: 1) what’s proposed for consultation, 2) what’s constrained, 3) how feedback is used. Avoid defensive phrasing; show process integrity.",
            confidence: "Likely",
            excludedFromBrief: false,
            linkedSection: "Stakeholder lens",
            visibility: "Internal",
            timestampLabel: "Comms draft note (fictional)",
          },
        ];
      }
      if (issue.id.startsWith("22222222")) {
        return [
          {
            id: "22222222-0000-0000-0000-000000000801",
            role: "Programme Lead",
            name: "Taylor Brooks",
            response:
              "We can change phasing and some design features, but not the overall footprint due to planning constraints. We need a clear table of ‘open vs fixed’ before the next stakeholder session.",
            confidence: "Likely",
            excludedFromBrief: false,
            linkedSection: "Public narrative",
            visibility: "Internal",
            timestampLabel: "Programme update (fictional)",
          },
          {
            id: "22222222-0000-0000-0000-000000000802",
            role: "Community Liaison",
            name: "Noah Singh",
            response:
              "Criticism is more about accessibility than intent. People want clearer meeting times, translations, and a way to ask questions live. A defensive tone will backfire; offer practical improvements.",
            confidence: "High",
            excludedFromBrief: false,
            linkedSection: "Consultation integrity",
            visibility: "Internal",
            timestampLabel: "Stakeholder feedback note (fictional)",
          },
          {
            id: "22222222-0000-0000-0000-000000000803",
            role: "Legal",
            name: "Mina Duarte",
            response:
              "Avoid implying outcomes are pre-determined. Be precise about constraints and about how feedback will be evaluated and documented. Keep a clean audit trail of changes to materials.",
            confidence: "High",
            excludedFromBrief: false,
            linkedSection: "Governance",
            visibility: "Internal",
            timestampLabel: "Legal guidance (fictional)",
          },
        ];
      }
      return [
        {
          id: "33333333-0000-0000-0000-000000000901",
          role: "CEO Office",
          name: "Morgan Reyes",
          response:
            "Stakeholders will ask ‘what’s different this year’ and ‘how you’ll follow up’. The CEO should offer a clear cadence and named owners rather than broad promises.",
          confidence: "Likely",
          excludedFromBrief: false,
          linkedSection: "Roundtable preparation",
          visibility: "Internal",
          timestampLabel: "Briefing note (fictional)",
        },
        {
          id: "33333333-0000-0000-0000-000000000902",
          role: "Public Affairs",
          name: "Imran Wallace",
          response:
            "Civic officials care about consultation integrity and accessibility. Proof points should be framed as ‘what we’ve heard’ + ‘what we’ll do next’, with evidence references ready if challenged.",
          confidence: "High",
          excludedFromBrief: false,
          linkedSection: "Stakeholder lens",
          visibility: "Internal",
          timestampLabel: "Public affairs prep (fictional)",
        },
        {
          id: "33333333-0000-0000-0000-000000000903",
          role: "Comms",
          name: "Elena Rossi",
          response:
            "For external lines, avoid jargon and keep the tone calm. In the room, the CEO can acknowledge constraints while emphasising transparency and follow-up commitments.",
          confidence: "Likely",
          excludedFromBrief: false,
          linkedSection: "Message discipline",
          visibility: "Internal",
          timestampLabel: "Comms note (fictional)",
        },
      ];
    })();

    const issueStakeholders = (() => {
      if (issue.id.startsWith("11111111")) {
        return [
          {
            stakeholderGroupName: "Community and residents",
            priority: "High",
            needsToKnow:
              "That this is a consultation on options (not a final decision), how to participate, and how feedback will be used.",
            issueRisk:
              "Perception of stealth cuts or ‘done deal’ framing; risk increases if accessibility support is unclear.",
            channelGuidance: "Publish clear consultation page + plain-language summary; community meetings; avoid defensive social tone.",
            toneAdjustment: "Respectful, practical, invite participation; avoid implying closure.",
          },
          {
            stakeholderGroupName: "Elected members and officials",
            priority: "High",
            needsToKnow:
              "Site-by-site options, governance timeline, and how equality/access considerations will be handled.",
            issueRisk: "Questions on fairness and evidence; risk of politicisation if detail is vague.",
            channelGuidance: "Member briefing note + Q&A pack; align with committee timetable.",
            toneAdjustment: "Options-based; explicit constraints vs choices.",
          },
        ];
      }
      if (issue.id.startsWith("22222222")) {
        return [
          {
            stakeholderGroupName: "Community and residents",
            priority: "High",
            needsToKnow:
              "What is genuinely open for input, how to participate, and what accessibility support exists.",
            issueRisk:
              "Trust and process integrity criticism; risk of reputational drag if participation is uneven.",
            channelGuidance: "Accessible formats, assisted sessions, transparent ‘what changed’ updates.",
            toneAdjustment: "Non-defensive; show listening and practical improvements.",
          },
          {
            stakeholderGroupName: "Leadership",
            priority: "High",
            needsToKnow: "Current stakeholder sentiment, evidence base, and the plan to improve accessibility and documentation.",
            issueRisk: "Leadership-facing reputational concern; demands for proof of integrity and decision discipline.",
            channelGuidance: "Briefing pack; disciplined Q&A; keep audit trail of material changes.",
            toneAdjustment: "Evidence-first; calm; avoid debate-winner phrasing.",
          },
        ];
      }
      return [
        {
          stakeholderGroupName: "Leadership",
          priority: "High",
          needsToKnow: "CEO proof points with sources, clear boundaries on commitments, and follow-up owners/cadence.",
          issueRisk: "Over-claiming or vague promises undermining credibility.",
          channelGuidance: "Roundtable pack + follow-up note; log commitments and owners.",
          toneAdjustment: "Concise, disciplined, evidence-backed.",
        },
        {
          stakeholderGroupName: "Elected members and officials",
          priority: "Normal",
          needsToKnow: "How consultation integrity and accessibility will be handled across programmes.",
          issueRisk: "Requests for formal commitments beyond what is validated.",
          channelGuidance: "Structured briefing; options and constraints; clear next decision points.",
          toneAdjustment: "Structured and pragmatic.",
        },
      ];
    })();

    const createdIssue = await prisma.issue.create({
      data: {
        id: issue.id,
        title: issue.title,
        summary: issue.summary,
        confirmedFacts: issue.confirmedFacts,
        openQuestions: issue.openQuestions,
        context: issue.context,
        issueType: issue.issueType,
        severity: issue.severity,
        status: issue.status,
        priority: issue.priority,
        operatorPosture: issue.operatorPosture,
        ownerName: issue.ownerName,
        audience: issue.audience,
        openGapsCount: gaps.filter((g) => g.status === "Open").length,
        sourcesCount: sources.length,
      },
    });

    for (const s of sources) {
      await prisma.source.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          issueId: createdIssue.id,
          sourceCode: s.sourceCode,
          tier: s.tier,
          title: s.title,
          note: s.note,
          snippet: s.snippet,
          reliability: s.reliability,
          linkedSection: s.linkedSection,
          url: s.url,
          timestampLabel: s.timestampLabel,
        },
        update: {
          sourceCode: s.sourceCode,
          tier: s.tier,
          title: s.title,
          note: s.note,
          snippet: s.snippet,
          reliability: s.reliability,
          linkedSection: s.linkedSection,
          url: s.url,
          timestampLabel: s.timestampLabel,
        },
      });
    }

    for (const g of gaps) {
      await prisma.gap.upsert({
        where: { id: g.id },
        create: {
          id: g.id,
          issueId: createdIssue.id,
          title: g.title,
          whyItMatters: g.whyItMatters,
          stakeholder: g.stakeholder,
          linkedSection: g.linkedSection,
          severity: g.severity,
          status: g.status,
          prompt: g.prompt,
          resolvedByInternalInputId: null,
        },
        update: {
          title: g.title,
          whyItMatters: g.whyItMatters,
          stakeholder: g.stakeholder,
          linkedSection: g.linkedSection,
          severity: g.severity,
          status: g.status,
          prompt: g.prompt,
        },
      });
    }

    for (const i of internalInputs) {
      await prisma.internalInput.upsert({
        where: { id: i.id },
        create: {
          id: i.id,
          issueId: createdIssue.id,
          role: i.role,
          name: i.name,
          response: i.response,
          confidence: i.confidence,
          excludedFromBrief: i.excludedFromBrief,
          linkedSection: i.linkedSection,
          visibility: i.visibility,
          timestampLabel: i.timestampLabel,
        },
        update: {
          role: i.role,
          name: i.name,
          response: i.response,
          confidence: i.confidence,
          excludedFromBrief: i.excludedFromBrief,
          linkedSection: i.linkedSection,
          visibility: i.visibility,
          timestampLabel: i.timestampLabel,
        },
      });
    }

    for (const lens of issueStakeholders) {
      const group = await prisma.stakeholderGroup.findUnique({ where: { name: lens.stakeholderGroupName } });
      if (!group) continue;
      await prisma.issueStakeholder.upsert({
        where: { issueId_stakeholderGroupId: { issueId: createdIssue.id, stakeholderGroupId: group.id } },
        create: {
          issueId: createdIssue.id,
          stakeholderGroupId: group.id,
          priority: lens.priority,
          needsToKnow: lens.needsToKnow,
          issueRisk: lens.issueRisk,
          channelGuidance: lens.channelGuidance,
          toneAdjustment: lens.toneAdjustment,
          notes: null,
        },
        update: {
          priority: lens.priority,
          needsToKnow: lens.needsToKnow,
          issueRisk: lens.issueRisk,
          channelGuidance: lens.channelGuidance,
          toneAdjustment: lens.toneAdjustment,
          notes: null,
        },
      });
    }

    // Minimal audit trail to make the Activity page useful in demos.
    // Keep timestamps staggered but deterministic in order.
    const base = new Date("2026-04-01T09:00:00.000Z");
    const steps = [
      { kind: "issue_created", summary: `Issue created: ${createdIssue.title}`, refType: "Issue", refId: createdIssue.id },
      { kind: "source_created", summary: `Source ${sources[0]?.sourceCode ?? "SRC"} created`, refType: "Source", refId: sources[0]?.id ?? null },
      { kind: "internal_input_created", summary: "Internal input created", refType: "InternalInput", refId: internalInputs[0]?.id ?? null },
      { kind: "gap_created", summary: "Gap created", refType: "Gap", refId: gaps[0]?.id ?? null },
    ] as const;

    const activityIdsByIssue: Record<string, [string, string, string, string]> = {
      "11111111-1111-1111-1111-111111111111": [
        "11111111-aaaa-aaaa-aaaa-aaaaaaaaaa01",
        "11111111-aaaa-aaaa-aaaa-aaaaaaaaaa02",
        "11111111-aaaa-aaaa-aaaa-aaaaaaaaaa03",
        "11111111-aaaa-aaaa-aaaa-aaaaaaaaaa04",
      ],
      "22222222-2222-2222-2222-222222222222": [
        "22222222-bbbb-bbbb-bbbb-bbbbbbbbbb01",
        "22222222-bbbb-bbbb-bbbb-bbbbbbbbbb02",
        "22222222-bbbb-bbbb-bbbb-bbbbbbbbbb03",
        "22222222-bbbb-bbbb-bbbb-bbbbbbbbbb04",
      ],
      "33333333-3333-3333-3333-333333333333": [
        "33333333-cccc-cccc-cccc-cccccccccc01",
        "33333333-cccc-cccc-cccc-cccccccccc02",
        "33333333-cccc-cccc-cccc-cccccccccc03",
        "33333333-cccc-cccc-cccc-cccccccccc04",
      ],
    };

    const activityIds = activityIdsByIssue[createdIssue.id];
    for (let idx = 0; idx < steps.length; idx += 1) {
      const step = steps[idx];
      const createdAt = new Date(base.getTime() + idx * 60 * 60 * 1000);
      await prisma.issueActivity.create({
        data: {
          id: activityIds[idx],
          issueId: createdIssue.id,
          kind: step.kind,
          summary: step.summary,
          refType: step.refType,
          refId: step.refId,
          actorLabel: DEMO_ACTOR,
          createdAt,
        },
      });
      await prisma.issue.update({
        where: { id: createdIssue.id },
        data: { lastActivityAt: createdAt },
      });
    }
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

