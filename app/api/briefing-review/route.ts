import { NextResponse } from "next/server";

type BriefingReviewPayload = {
  name?: unknown;
  email?: unknown;
  organisation?: unknown;
  role?: unknown;
  issueType?: unknown;
  briefingNeed?: unknown;
  consent?: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: BriefingReviewPayload;

  try {
    body = (await request.json()) as BriefingReviewPayload;
  } catch {
    return NextResponse.json({ message: "Please submit the form again with valid details." }, { status: 400 });
  }

  const lead = {
    name: asTrimmedString(body.name),
    email: asTrimmedString(body.email).toLowerCase(),
    organisation: asTrimmedString(body.organisation),
    role: asTrimmedString(body.role),
    issueType: asTrimmedString(body.issueType),
    briefingNeed: asTrimmedString(body.briefingNeed),
    consent: body.consent === true,
    source: "metisbriefing.com/briefing-review",
    submittedAt: new Date().toISOString(),
  };

  if (!lead.name || !lead.email || !lead.organisation || !lead.briefingNeed || !lead.consent) {
    return NextResponse.json(
      { message: "Please complete the required fields and confirm consent before submitting." },
      { status: 400 },
    );
  }

  if (!isValidEmail(lead.email)) {
    return NextResponse.json({ message: "Please enter a valid work email address." }, { status: 400 });
  }

  const webhookUrl = process.env.METIS_BRIEFING_REVIEW_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(lead),
      });

      if (!webhookResponse.ok) {
        console.error("Briefing review webhook failed", webhookResponse.status, await webhookResponse.text().catch(() => ""));
      }
    } catch (error) {
      console.error("Briefing review webhook error", error);
    }
  } else {
    console.info("Briefing review signup", lead);
  }

  return NextResponse.json({
    ok: true,
    message: "Thank you. Your briefing review request has been received.",
  });
}
