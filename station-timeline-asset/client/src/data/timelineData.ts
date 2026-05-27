// METIS Station Timeline — Bramley Junction Scenario
// Design: Signal & Noise — deep navy, amber-gold outputs, teal issue record, slate-blue inputs

export type Lane = 'input' | 'issue' | 'output';

export interface TimelineEvent {
  id: string;
  time: string;
  day: string;
  lane: Lane;
  title: string;
  summary: string;
  fullRecord: string;
  metisFeature: string;
  demoValue: string;
  relatedIds?: string[];
  tags?: string[];
  source?: string;
  status?: 'open' | 'closed' | 'updated' | 'active' | 'managed';
}

export const LANE_CONFIG = {
  input: {
    label: 'Inputs',
    sublabel: 'Sources & Evidence',
    color: '#4A7FA5',
    bgColor: 'rgba(74, 127, 165, 0.12)',
    borderColor: 'rgba(74, 127, 165, 0.5)',
    glowColor: 'rgba(74, 127, 165, 0.3)',
    textColor: '#7EB8D9',
    icon: '⬇',
  },
  issue: {
    label: 'Issue Record',
    sublabel: 'Claims, Questions & Observations',
    color: '#2A9D8F',
    bgColor: 'rgba(42, 157, 143, 0.12)',
    borderColor: 'rgba(42, 157, 143, 0.5)',
    glowColor: 'rgba(42, 157, 143, 0.3)',
    textColor: '#5ECEC2',
    icon: '◈',
  },
  output: {
    label: 'METIS Outputs',
    sublabel: 'Generated Communications',
    color: '#E9C46A',
    bgColor: 'rgba(233, 196, 106, 0.10)',
    borderColor: 'rgba(233, 196, 106, 0.5)',
    glowColor: 'rgba(233, 196, 106, 0.35)',
    textColor: '#F4D88A',
    icon: '✦',
  },
};

export const events: TimelineEvent[] = [
  {
    id: 'e01',
    time: '20:00',
    day: 'Sun',
    lane: 'input',
    title: 'Planned works notice',
    summary: 'Overnight concourse work confirmed. Handback expected 05:30. No planned service disruption.',
    fullRecord: `PLANNED WORKS NOTICE — Bramley Junction Station

Date: Sunday evening into Monday morning
Works scope: Overnight concourse lighting upgrade, ticket gate maintenance and wayfinding refresh.
Contractor: Apex Facilities Group
Expected handback: Monday 05:30
Service impact: None planned. All platforms remain accessible throughout works.
Authorised by: Infrastructure Programme Manager

This notice confirms the planned activity and sets the baseline expectation for Monday morning operations. No passenger-facing disruption is anticipated.`,
    metisFeature: 'Source capture, issue setup, planned context',
    demoValue: 'Shows Metis can start with planned activity, not only crisis response.',
    source: 'Infrastructure Programme Manager',
    tags: ['planned works', 'baseline'],
    relatedIds: ['e02', 'e03'],
  },
  {
    id: 'e02',
    time: '21:15',
    day: 'Sun',
    lane: 'input',
    title: 'Contractor mobilisation update',
    summary: 'Contractor confirms team on site, access granted, lighting and gate maintenance started.',
    fullRecord: `CONTRACTOR MOBILISATION UPDATE

Time: Sunday 21:15
From: Apex Facilities Group — Site Supervisor
To: Station Operations

Team on site as planned. Access granted via maintenance entrance. Lighting rig installation underway in main concourse. Ticket gate maintenance team has started on gates 3–7. Wayfinding panels staged for installation.

No issues to report at this stage. Works proceeding to schedule.`,
    metisFeature: 'Source timeline, operational input capture',
    demoValue: 'Establishes a normal baseline before the issue develops.',
    source: 'Apex Facilities Group — Site Supervisor',
    tags: ['contractor', 'baseline'],
    relatedIds: ['e01', 'e03'],
  },
  {
    id: 'e03',
    time: '04:28',
    day: 'Mon',
    lane: 'input',
    title: 'Contractor handback note',
    summary: 'Most works complete. Ceiling panel sign-off near main entrance is pending.',
    fullRecord: `CONTRACTOR HANDBACK NOTE

Time: Monday 04:28
From: Apex Facilities Group — Site Supervisor
To: Station Manager

Most works are complete and ready for handback:
✓ Concourse lighting upgrade — complete
✓ Ticket gates 3–7 maintenance — complete
✓ Wayfinding panels installed — complete

PENDING: Ceiling panel sign-off near main entrance. A small section of new panelling has not been signed off due to a suspected water ingress issue from a roof drain. Area is visually secure but requires formal inspection before handback can be completed.

Recommend station manager review before main entrance opening.`,
    metisFeature: 'Evidence capture, source attribution',
    demoValue: 'Creates the first uncertainty and shows why an issue record is needed.',
    source: 'Apex Facilities Group — Site Supervisor',
    tags: ['handback', 'ceiling', 'uncertainty'],
    relatedIds: ['e04', 'e05', 'e08'],
    status: 'open',
  },
  {
    id: 'e04',
    time: '04:35',
    day: 'Mon',
    lane: 'input',
    title: 'Station manager alert',
    summary: 'Main entrance may not be ready for 05:30. Side entrance can be used if approved.',
    fullRecord: `STATION MANAGER ALERT — INTERNAL NOTE

Time: Monday 04:35
From: Station Manager (Bramley Junction)
To: Duty Manager, Operations Control

Main entrance may not be ready for 05:30 opening. Contractor has flagged a ceiling panel sign-off issue near the main entrance. I have not yet seen the area but the contractor's note suggests it is a precautionary hold rather than a safety emergency.

Side entrance (Gate B) can be used as the primary passenger access point if approved. We have barriers available and can increase staffing.

Requesting guidance on:
1. Whether to proceed with side entrance opening at 05:30
2. Whether to notify passengers in advance
3. Who authorises the formal inspection

Awaiting your direction.`,
    metisFeature: 'Internal input, issue escalation',
    demoValue: 'Shows how frontline operational updates become structured issue intelligence.',
    source: 'Station Manager',
    tags: ['escalation', 'side entrance', 'decision required'],
    relatedIds: ['e05', 'e06', 'e07'],
    status: 'open',
  },
  {
    id: 'e05',
    time: '04:40',
    day: 'Mon',
    lane: 'issue',
    title: 'Issue workspace created',
    summary: 'New issue: "Bramley Junction main concourse reopening delay after planned works."',
    fullRecord: `ISSUE WORKSPACE — CREATED

Issue title: Bramley Junction main concourse reopening delay after planned works
Created: Monday 04:40
Status: Active — operational disruption
Owner: Duty Manager
Priority: Medium — time-sensitive, passenger-facing

Context: Planned overnight works at Bramley Junction have been completed in most areas. However, main entrance handback is delayed due to a ceiling panel sign-off issue. Station remains partially accessible via side entrance. Trains are unaffected.

This issue workspace will capture all incoming evidence, track open questions, record observations and generate audience-specific outputs as the situation develops.`,
    metisFeature: 'Issue workspace, setup/intake',
    demoValue: 'Shows the core Metis container for a live issue.',
    tags: ['workspace', 'setup'],
    relatedIds: ['e06', 'e07', 'e08'],
    status: 'active',
  },
  {
    id: 'e06',
    time: '04:43',
    day: 'Mon',
    lane: 'issue',
    title: 'Initial claims added',
    summary: '3 claims added: works mostly complete, main entrance delayed, side entrance may allow partial reopening.',
    fullRecord: `CLAIMS ADDED TO ISSUE RECORD

Time: Monday 04:43

Claim 1: Planned overnight works have been completed in most areas of the concourse.
Source: Contractor handback note (04:28)
Status: Confirmed

Claim 2: Main entrance handback is delayed due to a ceiling panel sign-off issue near the entrance.
Source: Contractor handback note (04:28), Station manager alert (04:35)
Status: Confirmed

Claim 3: Side entrance (Gate B) may allow partial reopening for passengers if approved by the duty manager.
Source: Station manager alert (04:35)
Status: Pending approval

These claims form the initial factual basis of the issue record. They will be updated as new evidence arrives.`,
    metisFeature: 'Claims extraction, structured record building',
    demoValue: 'Demonstrates how Metis turns unstructured updates into clear claims.',
    tags: ['claims', 'structured record'],
    relatedIds: ['e05', 'e07', 'e08'],
    status: 'active',
  },
  {
    id: 'e07',
    time: '04:45',
    day: 'Mon',
    lane: 'issue',
    title: 'Initial open questions added',
    summary: '3 open questions: ceiling safety, side entrance capacity, revised opening time.',
    fullRecord: `OPEN QUESTIONS ADDED

Time: Monday 04:45

Q1: Is the ceiling area near the main entrance safe for passengers?
Status: Open
Evidence needed: Formal inspection by facilities or structural engineer
Priority: High — blocks main entrance opening decision

Q2: Can the side entrance handle peak commuter flow from 05:30?
Status: Open
Evidence needed: Security supervisor confirmation of staffing and barrier capacity
Priority: High — affects opening plan

Q3: What is the revised opening time for the main entrance?
Status: Open
Evidence needed: Inspection outcome and contractor sign-off
Priority: Medium — needed for passenger communications

These questions will be tracked and updated as evidence arrives. No output should assert answers to these questions until they are resolved.`,
    metisFeature: 'Open questions, uncertainty management',
    demoValue: 'Shows that Metis does not pretend uncertainty has been resolved.',
    tags: ['questions', 'uncertainty'],
    relatedIds: ['e06', 'e10', 'e17'],
    status: 'open',
  },
  {
    id: 'e08',
    time: '04:50',
    day: 'Mon',
    lane: 'input',
    title: 'Security supervisor update',
    summary: 'Queue barriers available. Side entrance staffing can be increased from 05:45.',
    fullRecord: `SECURITY SUPERVISOR UPDATE

Time: Monday 04:50
From: Security Supervisor (Bramley Junction)
To: Station Manager, Duty Manager

Queue barriers are available and can be deployed at the side entrance within 20 minutes. I can increase staffing at the side entrance from 05:45 — I need one additional officer from the central pool, which I can arrange now.

Current side entrance capacity assessment: manageable for moderate flow. If peak commuter volume arrives before 06:30 without main entrance opening, we may need to consider a queuing protocol.

I am ready to proceed on your instruction.`,
    metisFeature: 'Operational evidence, source linking',
    demoValue: 'Shows multiple departmental inputs feeding one record.',
    source: 'Security Supervisor',
    tags: ['security', 'side entrance', 'capacity'],
    relatedIds: ['e07', 'e09'],
  },
  {
    id: 'e09',
    time: '04:55',
    day: 'Mon',
    lane: 'input',
    title: 'Network operations update',
    summary: 'Trains continue calling. Passengers should be directed through the side entrance.',
    fullRecord: `NETWORK OPERATIONS UPDATE

Time: Monday 04:55
From: Operations Control Centre
To: Station Manager, Duty Manager

Train services are unaffected by the station access issue. All scheduled services will continue to call at Bramley Junction as planned.

Operational instruction: Passengers should be directed through the side entrance (Gate B) until further notice. Platform access is not affected. Departure boards and platform information are operating normally.

We are monitoring the situation and will update if any service changes are required. No passenger information amendments have been issued yet — awaiting station confirmation of the access arrangement.`,
    metisFeature: 'Dependency tracking, operational context',
    demoValue: 'Separates station access issue from train service disruption.',
    source: 'Operations Control Centre',
    tags: ['trains', 'service unaffected'],
    relatedIds: ['e10', 'e11'],
  },
  {
    id: 'e10',
    time: '05:00',
    day: 'Mon',
    lane: 'issue',
    title: 'Observations added',
    summary: 'Train service unaffected. Customer impact at entrance level. Early commuter confusion likely.',
    fullRecord: `OBSERVATIONS ADDED TO ISSUE RECORD

Time: Monday 05:00

Observation 1: Train service is confirmed unaffected. The issue is limited to station access, not the rail network.
Basis: Operations Control Centre update (04:55)
Significance: This is a key distinction for all passenger communications.

Observation 2: Customer impact is likely to be concentrated at the main entrance and ticket gate level. Passengers arriving by habit at the main entrance will find it closed.
Basis: Site layout knowledge, station manager alert
Significance: Signage and staff positioning at the main entrance are critical.

Observation 3: Early commuter confusion is likely between 05:30 and 06:30. Passengers unfamiliar with the side entrance may be disoriented.
Basis: Operational assessment
Significance: Communications should be proactive, not reactive.

These observations are interpretive and should be distinguished from confirmed claims in all outputs.`,
    metisFeature: 'Observations, sense-making layer',
    demoValue: 'Shows Metis distinguishing facts, claims and interpretation.',
    tags: ['observations', 'sense-making'],
    relatedIds: ['e09', 'e11', 'e12'],
  },
  {
    id: 'e11',
    time: '05:05',
    day: 'Mon',
    lane: 'output',
    title: 'Internal staff holding update',
    summary: 'Short message for station staff: what is known, what to say, what not to speculate on.',
    fullRecord: `INTERNAL STAFF HOLDING UPDATE
Generated by METIS — Monday 05:05

FOR STATION STAFF — BRAMLEY JUNCTION

Situation as of 05:05:
The main concourse entrance is not yet open following overnight planned works. A ceiling panel near the main entrance requires a final inspection before it can be signed off for public use. This is a precautionary measure.

What is open: The side entrance (Gate B) is open and staffed. All platforms are accessible. Trains are running normally.

What to say to passengers:
"The main entrance is temporarily closed for a final inspection following overnight works. Please use the side entrance on [street name]. Trains are running normally."

What not to say:
Do not speculate on the cause of the delay. Do not give a specific reopening time — we do not yet have a confirmed time. Do not describe the ceiling issue in detail.

We will update you as soon as we have more information.`,
    metisFeature: 'Audience-specific output, message discipline',
    demoValue: 'Shows Metis producing usable communications quickly.',
    tags: ['staff', 'internal', 'holding line'],
    relatedIds: ['e10', 'e12'],
  },
  {
    id: 'e12',
    time: '05:12',
    day: 'Mon',
    lane: 'output',
    title: 'Passenger information draft',
    summary: 'Station announcement and website/app update: main entrance delayed, use side entrance, trains running.',
    fullRecord: `PASSENGER INFORMATION DRAFT
Generated by METIS — Monday 05:12

STATION ANNOUNCEMENT (PA SCRIPT):
"Attention passengers at Bramley Junction. The main concourse entrance is temporarily closed this morning following overnight maintenance work. Passengers are asked to use the side entrance on [street name]. All trains are running normally and platforms are fully accessible. We apologise for any inconvenience."

WEBSITE / APP UPDATE:
Bramley Junction — Main entrance temporarily closed
The main entrance at Bramley Junction is currently closed while a final inspection is completed following overnight maintenance. The side entrance remains open and all trains are running as normal. We expect to provide an update on the main entrance shortly. Thank you for your patience.

DIGITAL DISPLAY (SHORT FORM):
Main entrance closed — use side entrance
All trains running normally

Note: Do not publish a specific reopening time until confirmed. Review against latest issue record before publishing.`,
    metisFeature: 'Public-facing message generation',
    demoValue: 'Demonstrates practical outputs for immediate operational use.',
    tags: ['passenger', 'public', 'announcement'],
    relatedIds: ['e11', 'e13'],
  },
  {
    id: 'e13',
    time: '05:20',
    day: 'Mon',
    lane: 'input',
    title: 'Maintenance engineer photo note',
    summary: 'Ceiling panel is secure. Roof drain residue visible. Formal inspection still needed.',
    fullRecord: `MAINTENANCE ENGINEER — PHOTO NOTE

Time: Monday 05:20
From: Senior Maintenance Engineer
To: Station Manager, Duty Manager

I have inspected the ceiling panel area near the main entrance. My initial assessment:

Physical condition: The ceiling panel itself appears secure and is not at risk of falling. The fixings look intact.

Concern: There is visible residue from the roof drain around the panel edge. This suggests water has tracked down from the drain at some point — possibly during recent rainfall. The area is dry now but the drain should be checked.

Recommendation: The panel is likely safe for public access, but I would want a formal sign-off from the facilities team before I confirm this in writing. I have taken photographs and can share them.

I am on site and available for the formal inspection. Estimated time for formal sign-off: 45–60 minutes if facilities can attend now.`,
    metisFeature: 'Source attachment, provenance',
    demoValue: 'Lets the modal show realistic evidence, not just summary text.',
    source: 'Senior Maintenance Engineer',
    tags: ['inspection', 'ceiling', 'evidence'],
    relatedIds: ['e14', 'e17'],
  },
  {
    id: 'e14',
    time: '05:25',
    day: 'Mon',
    lane: 'issue',
    title: 'Question partially answered',
    summary: 'Ceiling appears secure, but formal inspection still pending. Q1 status updated.',
    fullRecord: `OPEN QUESTION UPDATE — PARTIAL ANSWER

Time: Monday 05:25

Q1: Is the ceiling area near the main entrance safe for passengers?
Previous status: Open
Updated status: Partially answered

New evidence: Maintenance engineer has inspected the area. Panel appears physically secure. Roof drain residue is visible but the area is dry. Engineer recommends formal facilities sign-off before confirming safety in writing.

What this means for the issue record:
— The immediate risk appears lower than initially uncertain
— Formal sign-off is still required before the main entrance can open
— This question cannot be closed until facilities confirm

Impact on outputs: Communications should not yet state that the ceiling is confirmed safe. The holding line remains appropriate.

Next action: Facilities team to attend for formal inspection. Estimated sign-off: 45–60 minutes.`,
    metisFeature: 'Question status, source-linked updates',
    demoValue: 'Shows nuance: not closed until evidence is sufficient.',
    tags: ['question update', 'partial answer'],
    relatedIds: ['e07', 'e13', 'e17'],
    status: 'updated',
  },
  {
    id: 'e15',
    time: '05:32',
    day: 'Mon',
    lane: 'input',
    title: 'Customer service desk update',
    summary: 'Several passengers asking why main doors are closed. No significant crowding yet.',
    fullRecord: `CUSTOMER SERVICE DESK UPDATE

Time: Monday 05:32
From: Customer Service Desk (Bramley Junction)
To: Station Manager

We have had approximately 8–10 passengers approach the desk asking why the main doors are closed. The questions are polite — no frustration or confrontation at this stage.

The most common question: "Is the station closed?" We have been directing people to the side entrance and confirming trains are running.

No significant crowding at the side entrance. Flow appears manageable. A few passengers looked confused when they arrived at the main entrance and found it closed — the temporary signage we put up is helping.

One passenger asked if this was related to the works they saw advertised last week. We confirmed it was connected to the overnight works.

No social media activity observed from our end yet.`,
    metisFeature: 'Frontline input, sentiment/context capture',
    demoValue: 'Shows customer impact being added to the issue record.',
    source: 'Customer Service Desk',
    tags: ['customer impact', 'frontline'],
    relatedIds: ['e16', 'e18'],
  },
  {
    id: 'e16',
    time: '05:40',
    day: 'Mon',
    lane: 'output',
    title: 'Duty manager briefing note',
    summary: 'Situation, current impact, likely questions, next actions for the duty manager.',
    fullRecord: `DUTY MANAGER BRIEFING NOTE
Generated by METIS — Monday 05:40

BRAMLEY JUNCTION — MAIN ENTRANCE DELAY
Briefing for: Duty Manager
Time: 05:40 Monday

SITUATION
Planned overnight works at Bramley Junction were largely completed on schedule. However, main entrance handback has been delayed because a ceiling panel near the entrance requires a formal inspection following the discovery of roof drain residue. The panel appears physically secure but has not been formally signed off.

CURRENT POSITION
• Main entrance: Closed. Formal inspection in progress.
• Side entrance (Gate B): Open. Staffed. Barriers deployed.
• Train services: Unaffected. Running normally.
• Passenger impact: Low-level confusion at main entrance. No crowding. No safety concerns.
• Media: No confirmed press contact yet.

LIKELY QUESTIONS YOU WILL BE ASKED
1. When will the main entrance reopen? — Estimated 45–60 minutes from 05:25 if facilities confirm sign-off. Do not commit to a specific time publicly.
2. Is the station safe? — Yes. Side entrance is open and fully accessible.
3. Why wasn't this identified during the works? — The ceiling panel issue emerged during the final handback check. This is the process working as intended.

NEXT ACTIONS
→ Facilities team to complete formal inspection
→ Confirm revised opening time once sign-off received
→ Update passenger communications once time is known
→ Monitor social media for escalation`,
    metisFeature: 'Brief generation, operational briefing',
    demoValue: 'Shows Metis supporting internal decision-makers.',
    tags: ['briefing', 'duty manager', 'internal'],
    relatedIds: ['e15', 'e17', 'e18'],
  },
  {
    id: 'e17',
    time: '05:48',
    day: 'Mon',
    lane: 'input',
    title: 'Social media monitoring note',
    summary: 'Comms team notes three local social posts claiming the station is "shut".',
    fullRecord: `SOCIAL MEDIA MONITORING NOTE

Time: Monday 05:48
From: Communications Team
To: Duty Manager, Station Manager

Three posts have been identified on local social media platforms in the last 20 minutes:

Post 1 (Twitter/X, local commuter account, ~340 followers):
"Bramley Junction completely shut this morning, no warning. Missed my train. Absolute joke."
Assessment: Inaccurate — station is open via side entrance. Trains are running.

Post 2 (Facebook, local community group, ~2,400 members):
"Anyone else finding Bramley Junction closed? Main doors locked."
Assessment: Partially accurate — main entrance is closed, but station is accessible.

Post 3 (Twitter/X, local news account, ~1,200 followers):
"Reports of Bramley Junction station closure this morning. Anyone know what's happening?"
Assessment: Enquiry rather than assertion. May escalate.

Recommendation: A short approved social response line would allow us to correct the "station is shut" narrative before it spreads. Suggest preparing a response for the duty manager to approve.`,
    metisFeature: 'External signal capture, misinformation risk',
    demoValue: 'Shows Metis recognising reputation risk without overreacting.',
    source: 'Communications Team',
    tags: ['social media', 'misinformation', 'reputation'],
    relatedIds: ['e18', 'e19'],
  },
  {
    id: 'e18',
    time: '05:55',
    day: 'Mon',
    lane: 'issue',
    title: 'Claims refined',
    summary: 'Claim updated: "station reopening delayed" → "main entrance delayed; station accessible via side entrance."',
    fullRecord: `CLAIM REFINEMENT — ISSUE RECORD UPDATE

Time: Monday 05:55

Original Claim 2 (added 04:43):
"Main entrance handback is delayed due to a ceiling panel sign-off issue."

Refined Claim 2:
"The main entrance reopening is delayed pending a formal facilities inspection. The station remains fully accessible via the side entrance (Gate B). Train services are unaffected."

Reason for refinement:
Social media posts are characterising the situation as "station closed." This is inaccurate. The claim in the issue record should reflect the precise position: the station is open, but the main entrance is not yet available.

This refined claim should be used as the basis for all subsequent outputs, including social response lines and press lines.

Version note: Original claim retained in record for audit purposes. Refinement timestamped and attributed to duty manager review.`,
    metisFeature: 'Claim refinement, version discipline',
    demoValue: 'Shows how Metis improves accuracy as evidence arrives.',
    tags: ['claim refinement', 'version control'],
    relatedIds: ['e06', 'e17', 'e19'],
    status: 'updated',
  },
  {
    id: 'e19',
    time: '06:00',
    day: 'Mon',
    lane: 'output',
    title: 'Social response line',
    summary: 'Approved response: station open via side entrance, trains running, main entrance inspection underway.',
    fullRecord: `SOCIAL RESPONSE LINE
Generated by METIS — Monday 06:00

APPROVED RESPONSE FOR SOCIAL MEDIA

For use in replies to posts claiming station closure:

"Bramley Junction is open this morning. Passengers can access all platforms via the side entrance on [street name]. Trains are running normally. The main entrance is temporarily closed while a final inspection is completed following overnight maintenance work. We apologise for any inconvenience and will update you shortly."

SHORT FORM (for character-limited platforms):
"Bramley Junction is open — use the side entrance on [street name]. All trains running. Main entrance closed for a final inspection after overnight works. Update to follow."

Usage guidance:
— Use for replies to posts claiming the station is "shut" or "closed"
— Do not engage with individual complaints about missed trains at this stage
— Do not speculate on reopening time
— Route any press enquiries to the communications team

Approved by: Duty Manager (verbal approval 05:58)`,
    metisFeature: 'Channel-specific output, approved line',
    demoValue: 'Shows controlled messaging for social channels.',
    tags: ['social', 'response', 'approved line'],
    relatedIds: ['e17', 'e18', 'e20'],
  },
  {
    id: 'e20',
    time: '06:08',
    day: 'Mon',
    lane: 'input',
    title: 'Press office call log',
    summary: 'Local reporter asks whether station failed to reopen after planned works and whether passengers were locked out.',
    fullRecord: `PRESS OFFICE CALL LOG

Time: Monday 06:08
From: Press Office
To: Duty Manager, Communications Team

Received call from: [Local newspaper — name withheld in demo]
Reporter: General news reporter
Nature of enquiry: The reporter is asking two specific questions:

Question 1: "Did the station fail to reopen after planned overnight works?"
Question 2: "Were passengers locked out of the station this morning?"

The reporter says they have seen social media posts and a tip from a regular commuter. They are on deadline and would like a comment by 06:30.

Assessment: This is a manageable enquiry. The facts are on our side — the station is open, trains are running, and the delay is a precautionary measure, not a failure. The risk is in the framing: "failed to reopen" and "locked out" are both inaccurate but could become the narrative if we do not respond.

Recommendation: Prepare a holding press line for duty manager approval before 06:30.`,
    metisFeature: 'Press enquiry capture, stakeholder pressure',
    demoValue: 'Creates a realistic comms moment without needing a major incident.',
    source: 'Press Office',
    tags: ['press', 'media enquiry', 'deadline'],
    relatedIds: ['e21', 'e22'],
  },
  {
    id: 'e21',
    time: '06:15',
    day: 'Mon',
    lane: 'output',
    title: 'Holding press line',
    summary: 'Press line: planned works took place, main entrance delayed for final inspection, station accessible.',
    fullRecord: `HOLDING PRESS LINE
Generated by METIS — Monday 06:15

FOR MEDIA ENQUIRIES — BRAMLEY JUNCTION

Approved holding line for press:

"Planned maintenance work took place at Bramley Junction overnight as scheduled. During the final handback check, a precautionary inspection was identified for a ceiling panel near the main entrance. As a result, the main entrance has not yet reopened. The station remains fully accessible via the side entrance, and all train services are running normally. We are working to complete the inspection as quickly as possible and will update passengers when the main entrance is ready to reopen. We apologise for any inconvenience caused."

Key points to hold:
— This was planned maintenance, not an emergency
— The station is open; the main entrance is not
— Trains are unaffected
— The inspection is precautionary

Do not say:
— Do not confirm or deny a specific reopening time
— Do not describe the ceiling issue in technical detail
— Do not characterise this as a "failure"

Approved by: Duty Manager
Time: 06:14`,
    metisFeature: 'Press line generation, tone control',
    demoValue: 'Shows Metis helping comms respond before every detail is known.',
    tags: ['press line', 'media', 'approved'],
    relatedIds: ['e20', 'e22'],
  },
  {
    id: 'e22',
    time: '06:22',
    day: 'Mon',
    lane: 'input',
    title: 'Station manager update',
    summary: 'Side entrance open, two extra staff deployed, passenger flow manageable, no safety concerns.',
    fullRecord: `STATION MANAGER UPDATE

Time: Monday 06:22
From: Station Manager
To: Duty Manager

Side entrance is operating well. Two additional staff members have been deployed — one at the main entrance to redirect passengers, one at the side entrance to assist with flow.

Passenger flow is manageable. The peak has not yet arrived but we are prepared. No safety concerns have been reported.

The temporary signage is working — most passengers are finding the side entrance without needing to be redirected. A few people have been frustrated but nothing beyond what you would expect.

The maintenance engineer and facilities team are still working on the formal inspection. I expect an update from them within the next 30–45 minutes.

No further escalation from my end at this point.`,
    metisFeature: 'Operational status update',
    demoValue: 'Lets the issue record move from uncertainty to managed impact.',
    source: 'Station Manager',
    tags: ['operational update', 'managed'],
    relatedIds: ['e23', 'e24'],
  },
  {
    id: 'e23',
    time: '06:30',
    day: 'Mon',
    lane: 'issue',
    title: 'Open question closed',
    summary: 'Q2 closed: station can open safely via side entrance. Evidence: station manager and security updates.',
    fullRecord: `OPEN QUESTION CLOSED — AUDIT RECORD

Time: Monday 06:30

Q2: Can the station open safely via side entrance?
Previous status: Open
Updated status: Closed — answered

Evidence supporting closure:
1. Security supervisor update (04:50): Barriers deployed, additional staffing confirmed from 05:45.
2. Station manager update (06:22): Side entrance operating well, flow manageable, no safety concerns.
3. Customer service desk update (05:32): No crowding, passengers being directed successfully.

Decision: Yes — the station can operate safely via the side entrance for the duration of the main entrance closure.

Decision logged by: Duty Manager
Time: 06:28

Audit note: This question is closed based on accumulated operational evidence. The decision is recorded here for governance and post-incident review purposes. The main entrance question (Q1) remains open pending formal facilities sign-off.`,
    metisFeature: 'Open question closure, evidence-backed decision log',
    demoValue: 'Demonstrates the audit trail behind a decision.',
    tags: ['question closed', 'audit trail', 'decision'],
    relatedIds: ['e07', 'e22', 'e24'],
    status: 'closed',
  },
  {
    id: 'e24',
    time: '06:38',
    day: 'Mon',
    lane: 'output',
    title: 'Executive brief V1',
    summary: 'What happened, customer impact, media risk, current position and next decision points.',
    fullRecord: `EXECUTIVE BRIEF — VERSION 1
Generated by METIS — Monday 06:38

BRAMLEY JUNCTION STATION — MAIN ENTRANCE DELAY
Prepared for: Executive / Senior Leadership
Classification: Internal — not for external distribution

WHAT HAPPENED
Planned overnight maintenance at Bramley Junction was completed largely on schedule. During the final handback check at 04:28, the contractor identified that a ceiling panel near the main entrance required a formal inspection due to visible roof drain residue. As a precaution, the main entrance was not opened at the planned 05:30 time.

CURRENT POSITION (as of 06:35)
• Main entrance: Closed. Formal facilities inspection in progress.
• Side entrance: Open. Staffed. Operating normally.
• Train services: Unaffected. All services running as scheduled.
• Passenger impact: Low-level confusion and inconvenience. No safety incidents. No crowding.

MEDIA AND REPUTATION
A local reporter has made an enquiry. A holding press line has been issued. Three social media posts characterised the situation as a station closure — a social response line has been approved and deployed. No significant escalation at this stage.

KEY RISKS
1. Main entrance inspection takes longer than expected — passenger frustration increases
2. Media narrative shifts from "delay" to "failure" — holding line needs to hold
3. Accessibility concerns if side entrance becomes congested

NEXT DECISION POINTS
→ Facilities sign-off expected within 30–45 minutes
→ Main entrance reopening target: approximately 08:00
→ Updated passenger communications to be issued once time is confirmed

RECOMMENDED ACTION
No executive intervention required at this stage. Situation is managed. Monitor for escalation.`,
    metisFeature: 'Executive Brief Version, concise leadership output',
    demoValue: 'Shows the leadership-facing value of Metis.',
    tags: ['executive brief', 'V1', 'leadership'],
    relatedIds: ['e23', 'e25', 'e32'],
    status: 'active',
  },
  {
    id: 'e25',
    time: '06:50',
    day: 'Mon',
    lane: 'issue',
    title: 'Brief comparison created',
    summary: 'V1 brief compared against latest issue record. Changed wording and new evidence highlighted.',
    fullRecord: `BRIEF COMPARISON — ISSUE RECORD vs EXECUTIVE BRIEF V1

Time: Monday 06:50

METIS has compared Executive Brief V1 (generated 06:38) against the current issue record.

CHANGES SINCE BRIEF WAS GENERATED:

1. Station manager update (06:22) — received after brief was generated
   Brief states: "Formal facilities inspection in progress"
   Current record: "Inspection ongoing, estimated completion 30–45 minutes from 06:22"
   Significance: Brief is still accurate but could be more specific on timing.

2. No new evidence has changed the core claims or key risks in the brief.

3. The social response line has been deployed (confirmed 06:05) — brief correctly notes this.

ASSESSMENT: Brief V1 remains accurate and does not require immediate revision. A V2 brief should be generated once the facilities inspection is complete and a reopening time is confirmed.

This comparison is recorded to demonstrate that outputs are not static — they are tracked against the live issue record.`,
    metisFeature: 'Compare, version clarity',
    demoValue: 'Shows that outputs are not static drafts detached from the live record.',
    tags: ['comparison', 'version tracking'],
    relatedIds: ['e24', 'e26'],
  },
  {
    id: 'e26',
    time: '07:05',
    day: 'Mon',
    lane: 'input',
    title: 'Facilities inspection update',
    summary: 'Ceiling panel confirmed safe. Small roof drain repair needed later today.',
    fullRecord: `FACILITIES INSPECTION UPDATE

Time: Monday 07:05
From: Facilities Manager
To: Station Manager, Duty Manager

Formal inspection of the ceiling panel area near the main entrance is now complete.

FINDINGS:
1. Ceiling panel: Confirmed structurally secure. All fixings intact. Panel is safe for public access.
2. Roof drain: A small section of the drain has a partial blockage that has caused water to track along the panel edge during recent rainfall. This is not an immediate safety risk but should be repaired.
3. Recommended action: Repair the roof drain blockage later today (non-urgent). No further action required on the ceiling panel.

SIGN-OFF: I am formally signing off the ceiling panel for public access. The main entrance can reopen.

Estimated time to prepare entrance for reopening: 15–20 minutes (barriers to be removed, signage updated).

I will arrange the drain repair for this afternoon.`,
    metisFeature: 'Evidence update, risk clarification',
    demoValue: 'Gives a clean way to close a key uncertainty.',
    source: 'Facilities Manager',
    tags: ['inspection complete', 'sign-off', 'safe'],
    relatedIds: ['e27', 'e28'],
  },
  {
    id: 'e27',
    time: '07:12',
    day: 'Mon',
    lane: 'issue',
    title: 'Risk level updated',
    summary: 'Status moved from "active operational disruption" to "managed delay, reopening expected shortly".',
    fullRecord: `ISSUE STATUS UPDATE

Time: Monday 07:12

Previous status: Active — operational disruption
Updated status: Managed delay — reopening expected shortly

Basis for update:
— Facilities inspection complete (07:05): ceiling panel confirmed safe
— Main entrance formally signed off for public access
— Reopening preparation underway (estimated 15–20 minutes)
— Train services unaffected throughout
— No safety incidents recorded
— Media position held with approved press line

Outstanding items:
— Q1 (ceiling safety): Now closed — confirmed safe by facilities manager
— Q3 (revised opening time): Approximately 08:00 — to be confirmed once preparation complete
— Roof drain repair: Scheduled for this afternoon — non-urgent

This status update should trigger a refresh of passenger communications and an update to the executive brief.`,
    metisFeature: 'Status management, readiness signal',
    demoValue: 'Shows progression and control.',
    tags: ['status update', 'managed', 'progression'],
    relatedIds: ['e26', 'e28', 'e29'],
    status: 'managed',
  },
  {
    id: 'e28',
    time: '07:20',
    day: 'Mon',
    lane: 'output',
    title: 'Updated passenger message',
    summary: 'Main entrance expected to reopen around 08:00. Side entrance remains open.',
    fullRecord: `UPDATED PASSENGER MESSAGE
Generated by METIS — Monday 07:20

STATION ANNOUNCEMENT (PA SCRIPT):
"Good morning, passengers at Bramley Junction. We can now confirm that the main concourse entrance is expected to reopen at approximately 08:00 this morning. The inspection following overnight maintenance work has been completed successfully. The side entrance remains open until the main entrance is ready. All trains are running normally. We apologise for the inconvenience this morning and thank you for your patience."

WEBSITE / APP UPDATE:
Bramley Junction — Main entrance reopening at approximately 08:00
The inspection following overnight maintenance has been completed. The main entrance at Bramley Junction is expected to reopen at approximately 08:00. The side entrance remains open. All trains are running normally.

DIGITAL DISPLAY (SHORT FORM):
Main entrance reopening approx. 08:00
Side entrance open — all trains running

SOCIAL MEDIA UPDATE:
"Update: Bramley Junction main entrance is expected to reopen at approximately 08:00. Inspection complete. Side entrance still open. All trains running normally. Thank you for your patience this morning."`,
    metisFeature: 'Updated audience output',
    demoValue: 'Shows Metis can regenerate outputs as the record changes.',
    tags: ['passenger update', 'reopening time', 'public'],
    relatedIds: ['e27', 'e29'],
  },
  {
    id: 'e29',
    time: '07:35',
    day: 'Mon',
    lane: 'output',
    title: 'Councillor and stakeholder note',
    summary: 'Short note for local authority, accessibility group and transport stakeholders.',
    fullRecord: `STAKEHOLDER NOTE
Generated by METIS — Monday 07:35

FOR: Local authority transport team, Accessibility advisory group, Transport users' forum

RE: Bramley Junction — Main entrance delay following planned maintenance

Dear colleagues,

I am writing to update you on a brief operational issue at Bramley Junction this morning.

Planned overnight maintenance work was completed largely on schedule. However, during the final handback check, a precautionary inspection was required for a ceiling panel near the main entrance. As a result, the main entrance did not open at the planned 05:30 time.

The station has remained accessible throughout via the side entrance, and all train services have run normally. The inspection has now been completed and the main entrance is expected to reopen at approximately 08:00.

We are aware that the temporary closure of the main entrance may have caused inconvenience, particularly for passengers who rely on step-free access. We can confirm that step-free access has been available throughout via the side entrance. We are reviewing signage to ensure this is clearer in any future situation.

We will follow up with a brief post-incident note once the situation is fully resolved.

If you have any questions, please do not hesitate to contact us.`,
    metisFeature: 'Audience groups, stakeholder-specific messaging',
    demoValue: 'Shows Metis is not just press and social.',
    tags: ['stakeholder', 'councillor', 'accessibility'],
    relatedIds: ['e28', 'e30'],
  },
  {
    id: 'e30',
    time: '07:50',
    day: 'Mon',
    lane: 'input',
    title: 'Accessibility team note',
    summary: 'Step-free access available via side entrance. Signage should be improved.',
    fullRecord: `ACCESSIBILITY TEAM NOTE

Time: Monday 07:50
From: Accessibility and Inclusion Manager
To: Station Manager, Duty Manager

I have reviewed the situation from an accessibility perspective.

STEP-FREE ACCESS: Step-free access has been available throughout the incident via the side entrance. This is positive. However, the temporary signage at the main entrance did not clearly indicate that step-free access was available via the side entrance. Several passengers with mobility aids had to ask staff for directions.

RECOMMENDATION: For any future planned works or temporary access changes, the signage protocol should include explicit step-free access information from the outset. This should be added to the planned works checklist.

IMMEDIATE ACTION: If possible, add a step-free access indicator to the temporary signage at the main entrance before it is removed.

I will raise this as a learning point in the post-incident review.`,
    metisFeature: 'Internal input, stakeholder concern capture',
    demoValue: 'Shows Metis handling service quality and inclusivity.',
    source: 'Accessibility and Inclusion Manager',
    tags: ['accessibility', 'step-free', 'learning'],
    relatedIds: ['e31', 'e32'],
  },
  {
    id: 'e31',
    time: '08:05',
    day: 'Mon',
    lane: 'issue',
    title: 'Final observations added',
    summary: 'Impact limited to main entrance. Service ran normally. Signage caused confusion. Stakeholder line should acknowledge inconvenience.',
    fullRecord: `FINAL OBSERVATIONS — ISSUE RECORD

Time: Monday 08:05

Observation 4: The operational impact of the incident was limited to the main entrance. Train services ran normally throughout. No safety incidents were recorded. The side entrance handled the additional passenger flow without significant difficulty.

Observation 5: Temporary signage caused some confusion, particularly for passengers with accessibility needs. The signage did not clearly indicate step-free access via the side entrance. This is a process gap for future planned works.

Observation 6: The social media narrative ("station closed") was corrected quickly through the approved response line. No significant media escalation occurred. The press enquiry was handled within the holding line.

Observation 7: All stakeholder communications were issued before the main entrance reopened. This is the correct sequence — stakeholders should not learn about an issue from the media.

Observation 8: The issue record provides a clear audit trail from the first uncertainty (04:28) to formal resolution. This record should be retained for post-incident review and governance purposes.`,
    metisFeature: 'Learning capture, operational analysis',
    demoValue: 'Shows the issue record becoming a post-incident knowledge asset.',
    tags: ['final observations', 'learning', 'audit'],
    relatedIds: ['e30', 'e32', 'e33'],
  },
  {
    id: 'e32',
    time: '08:12',
    day: 'Mon',
    lane: 'output',
    title: 'Main entrance reopened update',
    summary: 'Final public update: main entrance reopened, apology for inconvenience, thanks for patience.',
    fullRecord: `MAIN ENTRANCE REOPENED — PUBLIC UPDATE
Generated by METIS — Monday 08:12

STATION ANNOUNCEMENT (PA SCRIPT):
"Good morning, passengers at Bramley Junction. We are pleased to confirm that the main concourse entrance is now open. We apologise for the inconvenience caused this morning following overnight maintenance work. Thank you for your patience. All trains are running normally."

WEBSITE / APP UPDATE:
Bramley Junction — Main entrance now open
The main entrance at Bramley Junction has reopened. We apologise for the inconvenience caused this morning. All trains are running normally. Thank you for your patience.

SOCIAL MEDIA:
"Bramley Junction main entrance is now open. Thank you for your patience this morning. We apologise for the inconvenience. All trains running normally. 🚉"

DIGITAL DISPLAY: Main entrance now open — normal service resumed`,
    metisFeature: 'Closure communications',
    demoValue: 'Shows a clean close to the public-facing issue.',
    tags: ['reopened', 'closure', 'public'],
    relatedIds: ['e31', 'e33'],
  },
  {
    id: 'e33',
    time: '08:25',
    day: 'Mon',
    lane: 'output',
    title: 'Executive brief V2',
    summary: 'Confirmed reopening, final impact, media position and recommended follow-up.',
    fullRecord: `EXECUTIVE BRIEF — VERSION 2
Generated by METIS — Monday 08:25

BRAMLEY JUNCTION STATION — INCIDENT CLOSED
Prepared for: Executive / Senior Leadership
Classification: Internal — not for external distribution

RESOLUTION
The main entrance at Bramley Junction reopened at 08:12 this morning. The formal facilities inspection confirmed the ceiling panel was safe. A minor roof drain repair has been scheduled for this afternoon.

FINAL IMPACT SUMMARY
• Duration of main entrance closure: 02:42 (05:30 planned opening to 08:12 actual)
• Passenger impact: Low. Side entrance operated throughout. No safety incidents. No crowding.
• Train services: Unaffected throughout.
• Media: One press enquiry received and handled within approved holding line. No negative coverage confirmed.
• Social media: Three posts characterising situation as "station closed" — corrected with approved response. No significant escalation.

WHAT WORKED WELL
— Precautionary approach to ceiling panel was correct
— Side entrance plan executed smoothly
— Communications issued quickly and held throughout
— Stakeholder note issued before reopening

WHAT TO REVIEW
— Signage protocol for step-free access during temporary closures
— Planned works handback checklist to include ceiling/roof drain inspection

RECOMMENDED FOLLOW-UP
→ Post-incident review note to be circulated within 48 hours
→ Planned works checklist to be updated before next scheduled works
→ Accessibility team recommendation to be actioned`,
    metisFeature: 'Executive versioning, final brief',
    demoValue: 'Shows leadership can see the final position, not just the first draft.',
    tags: ['executive brief', 'V2', 'final'],
    relatedIds: ['e24', 'e34', 'e35'],
    status: 'closed',
  },
  {
    id: 'e34',
    time: '08:40',
    day: 'Mon',
    lane: 'output',
    title: 'Post-incident review note',
    summary: 'What happened, what worked, what caused confusion, actions for future planned works.',
    fullRecord: `POST-INCIDENT REVIEW NOTE
Generated by METIS — Monday 08:40

BRAMLEY JUNCTION — MAIN ENTRANCE DELAY
Post-incident review for internal circulation

WHAT HAPPENED
Planned overnight maintenance at Bramley Junction was completed largely on schedule. During the final handback check, a ceiling panel near the main entrance was identified as requiring a formal inspection due to visible roof drain residue. The main entrance did not open at the planned 05:30 time. It reopened at 08:12 following a formal facilities inspection that confirmed the panel was safe.

WHAT WORKED
1. The precautionary approach was correct. The decision to delay opening pending inspection was the right call.
2. The side entrance plan was executed smoothly. Staffing, barriers and signage were deployed quickly.
3. Communications were issued promptly. Staff, passengers, media and stakeholders all received appropriate messages before the situation escalated.
4. The issue record provided a clear, real-time picture of the situation for decision-makers.

WHAT CAUSED CONFUSION
1. Signage at the main entrance did not clearly indicate step-free access via the side entrance. Several passengers with mobility aids needed staff assistance.
2. Initial social media posts characterised the situation as a full station closure. This was corrected but required a reactive response.

ACTIONS FOR FUTURE PLANNED WORKS
Action 1: Update the planned works handback checklist to include a ceiling and roof drain inspection as a standard item.
Owner: Infrastructure Programme Manager
Deadline: Before next scheduled works

Action 2: Update the temporary signage protocol to include explicit step-free access information from the outset.
Owner: Accessibility and Inclusion Manager
Deadline: Within 14 days

Action 3: Brief the contractor on the importance of flagging ceiling/drain issues earlier in the works process.
Owner: Station Manager
Deadline: Next contractor briefing`,
    metisFeature: 'Export, governance, organisational learning',
    demoValue: 'Shows Metis as a durable issue-handling system, not a one-off writing tool.',
    tags: ['post-incident', 'review', 'governance', 'learning'],
    relatedIds: ['e33', 'e35'],
  },
  {
    id: 'e35',
    time: '09:00',
    day: 'Mon',
    lane: 'issue',
    title: 'Circulation audit',
    summary: 'Audit record shows who received the staff update, press line, stakeholder note and executive brief.',
    fullRecord: `CIRCULATION AUDIT — ISSUE RECORD

Time: Monday 09:00

METIS has generated a circulation audit for this issue. The following outputs were generated and their distribution is recorded below.

OUTPUT 1: Internal staff holding update (05:05)
Distributed to: All station staff (Bramley Junction), Duty Manager
Method: Internal messaging system
Confirmed receipt: Yes

OUTPUT 2: Passenger information draft (05:12)
Distributed to: PA system, website/app team, digital display operators
Method: Operational communications channel
Confirmed receipt: Yes

OUTPUT 3: Duty manager briefing note (05:40)
Distributed to: Duty Manager
Method: Direct message
Confirmed receipt: Yes

OUTPUT 4: Social response line (06:00)
Distributed to: Communications team (for social media use)
Approved by: Duty Manager
Confirmed receipt: Yes

OUTPUT 5: Holding press line (06:15)
Distributed to: Press Office
Approved by: Duty Manager
Confirmed receipt: Yes

OUTPUT 6: Councillor and stakeholder note (07:35)
Distributed to: Local authority transport team, Accessibility advisory group, Transport users' forum
Method: Email
Confirmed receipt: Pending

OUTPUT 7: Executive brief V1 (06:38) and V2 (08:25)
Distributed to: Senior leadership team
Method: Secure briefing channel
Confirmed receipt: Yes

OUTPUT 8: Post-incident review note (08:40)
Distributed to: Station Manager, Duty Manager, Infrastructure Programme Manager, Accessibility Manager
Method: Internal document system
Confirmed receipt: Pending

AUDIT SUMMARY: 8 outputs generated. 6 confirmed received. 2 pending confirmation. No outputs were issued without approval. All press and stakeholder outputs were approved by the Duty Manager before distribution.`,
    metisFeature: 'Circulation audit, governance',
    demoValue: 'Shows control, traceability and confidence in what was shared.',
    tags: ['audit', 'circulation', 'governance', 'traceability'],
    relatedIds: ['e34'],
    status: 'closed',
  },
];
