/* eslint-disable no-console */

const REQUIRED_ENVS = ["METIS_PROD_BASE_URL", "METIS_SMOKE_ISSUE_ID"];

function requireEnv(name) {
  const v = process.env[name];
  if (!v || v.trim().length === 0) throw new Error(`Missing required env var: ${name}`);
  return v.trim();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function urlJoin(base, path) {
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}

function nowIso() {
  return new Date().toISOString();
}

function pickDifferent(current, allowed) {
  const next = allowed.find((v) => v !== current);
  return next ?? allowed[0];
}

async function httpJson(method, url, { body, timeoutMs } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, text };
  } finally {
    clearTimeout(t);
  }
}

function printLine(kind, label, detail) {
  const tag = kind.toUpperCase().padEnd(4, " ");
  console.log(`[${tag}] ${label}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  for (const k of REQUIRED_ENVS) requireEnv(k);

  const baseUrl = requireEnv("METIS_PROD_BASE_URL");
  const issueId = requireEnv("METIS_SMOKE_ISSUE_ID");
  const timeoutMs = Number(process.env.METIS_SMOKE_TIMEOUT_MS ?? "15000");

  const priorityAllowed = ["Critical", "High", "Normal", "Low"];
  const postureAllowed = ["Monitoring", "Active", "Holding", "Closed"];

  // Optional: allow explicit compare ids if you want the compare API check to run.
  const compareFromId = (process.env.METIS_SMOKE_COMPARE_FROM_ID ?? "").trim() || null;
  const compareToId = (process.env.METIS_SMOKE_COMPARE_TO_ID ?? "").trim() || null;

  let baseline = null;
  let mutated = { priority: false, operatorPosture: false };

  const startedAt = nowIso();
  console.log(`Metis prod smoke started at ${startedAt}`);
  console.log(`Target: ${baseUrl} (issue ${issueId})`);

  try {
    // Issue fetch (baseline)
    {
      const url = urlJoin(baseUrl, `/api/issues/${issueId}`);
      const res = await httpJson("GET", url, { timeoutMs });
      if (!res.ok) {
        printLine("fail", "GET issue", `HTTP ${res.status}`);
        throw new Error(`GET ${url} failed: ${res.status}`);
      }
      const issue = res.json;
      baseline = {
        priority: issue.priority,
        operatorPosture: issue.operatorPosture,
        lastActivityAt: issue.lastActivityAt,
      };
      printLine("pass", "GET issue", `priority=${baseline.priority}, posture=${baseline.operatorPosture}`);
    }

    // Priority mutation
    {
      const nextPriority = pickDifferent(baseline.priority, priorityAllowed);
      const url = urlJoin(baseUrl, `/api/issues/${issueId}`);
      const res = await httpJson("PATCH", url, { timeoutMs, body: { priority: nextPriority } });
      if (!res.ok) {
        printLine("fail", "PATCH priority", `HTTP ${res.status}`);
        throw new Error(`PATCH priority failed: ${res.status}`);
      }
      mutated.priority = true;
      if (res.json?.priority !== nextPriority) {
        printLine("fail", "PATCH priority", `expected ${nextPriority}, got ${res.json?.priority ?? "?"}`);
        throw new Error("Priority did not update in response");
      }
      printLine("pass", "PATCH priority", `set to ${nextPriority}`);

      // Verify activity + lastActivityAt coherence
      const actUrl = urlJoin(baseUrl, `/api/issues/${issueId}/activity?limit=5`);
      const actRes = await httpJson("GET", actUrl, { timeoutMs });
      if (!actRes.ok) {
        printLine("fail", "GET activity", `HTTP ${actRes.status}`);
        throw new Error(`GET activity failed: ${actRes.status}`);
      }
      const items = actRes.json?.items ?? [];
      const newest = items[0] ?? null;
      if (!newest) {
        printLine("fail", "Activity after priority", "no activity items returned");
        throw new Error("Expected at least one activity item");
      }
      const issueUrl = urlJoin(baseUrl, `/api/issues/${issueId}`);
      const issueRes = await httpJson("GET", issueUrl, { timeoutMs });
      if (!issueRes.ok) throw new Error(`GET issue after priority failed: ${issueRes.status}`);
      if (issueRes.json?.lastActivityAt !== newest.createdAt) {
        printLine("fail", "lastActivityAt sync (priority)", `issue=${issueRes.json?.lastActivityAt}, activity=${newest.createdAt}`);
        throw new Error("lastActivityAt mismatch after priority mutation");
      }
      printLine("pass", "Activity + lastActivityAt (priority)", `${newest.summary} @ ${newest.createdAt}`);
    }

    // Operator posture mutation
    {
      const nextPosture = pickDifferent(baseline.operatorPosture, postureAllowed);
      const url = urlJoin(baseUrl, `/api/issues/${issueId}`);
      const res = await httpJson("PATCH", url, { timeoutMs, body: { operatorPosture: nextPosture } });
      if (!res.ok) {
        printLine("fail", "PATCH operatorPosture", `HTTP ${res.status}`);
        throw new Error(`PATCH operatorPosture failed: ${res.status}`);
      }
      mutated.operatorPosture = true;
      if (res.json?.operatorPosture !== nextPosture) {
        printLine("fail", "PATCH operatorPosture", `expected ${nextPosture}, got ${res.json?.operatorPosture ?? "?"}`);
        throw new Error("operatorPosture did not update in response");
      }
      printLine("pass", "PATCH operatorPosture", `set to ${nextPosture}`);

      const actUrl = urlJoin(baseUrl, `/api/issues/${issueId}/activity?limit=5`);
      const actRes = await httpJson("GET", actUrl, { timeoutMs });
      if (!actRes.ok) throw new Error(`GET activity after posture failed: ${actRes.status}`);
      const items = actRes.json?.items ?? [];
      const newest = items[0] ?? null;
      if (!newest) throw new Error("Expected activity after operatorPosture mutation");

      const issueUrl = urlJoin(baseUrl, `/api/issues/${issueId}`);
      const issueRes = await httpJson("GET", issueUrl, { timeoutMs });
      if (!issueRes.ok) throw new Error(`GET issue after posture failed: ${issueRes.status}`);
      if (issueRes.json?.lastActivityAt !== newest.createdAt) {
        printLine("fail", "lastActivityAt sync (posture)", `issue=${issueRes.json?.lastActivityAt}, activity=${newest.createdAt}`);
        throw new Error("lastActivityAt mismatch after operatorPosture mutation");
      }
      printLine("pass", "Activity + lastActivityAt (posture)", `${newest.summary} @ ${newest.createdAt}`);
    }

    // Brief latest (mode=full)
    let latestBrief = null;
    {
      const url = urlJoin(baseUrl, `/api/issues/${issueId}/brief-versions/latest?mode=full`);
      const res = await httpJson("GET", url, { timeoutMs });
      if (res.status === 404) {
        printLine("skip", "GET latest brief (full)", "no brief versions yet");
      } else if (!res.ok) {
        printLine("fail", "GET latest brief (full)", `HTTP ${res.status}`);
        throw new Error(`GET latest brief failed: ${res.status}`);
      } else {
        latestBrief = res.json;
        printLine("pass", "GET latest brief (full)", `briefVersionId=${latestBrief.id}`);
      }
    }

    // Compare API (optional)
    {
      if (compareFromId && compareToId) {
        const url = urlJoin(baseUrl, `/api/issues/${issueId}/compare`);
        const res = await httpJson("POST", url, {
          timeoutMs,
          body: { mode: "full", fromBriefVersionId: compareFromId, toBriefVersionId: compareToId },
        });
        if (!res.ok) {
          printLine("fail", "POST compare", `HTTP ${res.status}`);
          throw new Error(`POST compare failed: ${res.status}`);
        }
        printLine("pass", "POST compare", `changeCount=${res.json?.changeCount ?? "?"}`);
      } else {
        printLine("skip", "POST compare", "set METIS_SMOKE_COMPARE_FROM_ID and METIS_SMOKE_COMPARE_TO_ID to enable");
      }
    }

    // Export API (executive-brief)
    {
      if (!latestBrief) {
        printLine("skip", "POST export", "no latest brief to export");
      } else {
        const url = urlJoin(baseUrl, `/api/issues/${issueId}/export`);
        const res = await httpJson("POST", url, {
          timeoutMs,
          body: {
            briefVersionId: latestBrief.id,
            format: "executive-brief",
            logEvent: { eventType: "prepared", channel: "file" },
          },
        });
        if (!res.ok) {
          printLine("fail", "POST export", `HTTP ${res.status}`);
          throw new Error(`POST export failed: ${res.status}`);
        }
        printLine("pass", "POST export", `exportId=${res.json?.exportId ?? "?"}`);
      }
    }

    // Key issue-scoped routes return 200
    {
      const pages = [
        `/issues/${issueId}/brief?mode=full`,
        `/issues/${issueId}/sources`,
        `/issues/${issueId}/gaps`,
        `/issues/${issueId}/input`,
        `/issues/${issueId}/compare?mode=full`,
        `/issues/${issueId}/export`,
        `/issues/${issueId}/activity`,
      ];

      for (const path of pages) {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(urlJoin(baseUrl, path), { signal: controller.signal });
          if (res.status === 200) {
            printLine("pass", `GET ${path}`, "200");
          } else {
            printLine("fail", `GET ${path}`, `HTTP ${res.status}`);
            throw new Error(`Route check failed: ${path} (${res.status})`);
          }
        } finally {
          clearTimeout(t);
        }
        // Small spacing to avoid slamming prod; keep minimal.
        await sleep(150);
      }
    }

    console.log(`Metis prod smoke finished at ${nowIso()}`);
  } finally {
    // Production safety: always restore original triage values if we mutated them.
    if (!baseline) return;
    if (!mutated.priority && !mutated.operatorPosture) return;

    const url = urlJoin(baseUrl, `/api/issues/${issueId}`);
    try {
      const res = await httpJson("PATCH", url, {
        timeoutMs,
        body: { priority: baseline.priority, operatorPosture: baseline.operatorPosture },
      });
      if (!res.ok) {
        printLine("fail", "RESTORE triage", `HTTP ${res.status} (manual restore may be needed)`);
        return;
      }
      const ok =
        res.json?.priority === baseline.priority && res.json?.operatorPosture === baseline.operatorPosture;
      if (ok) {
        printLine("pass", "RESTORE triage", `priority=${baseline.priority}, posture=${baseline.operatorPosture}`);
      } else {
        printLine(
          "fail",
          "RESTORE triage",
          `expected priority=${baseline.priority}, posture=${baseline.operatorPosture}`,
        );
      }
    } catch (e) {
      printLine("fail", "RESTORE triage", `exception: ${e?.message ?? String(e)}`);
    }
  }
}

main().catch((err) => {
  printLine("fail", "smoke", err?.message ?? String(err));
  process.exitCode = 1;
});

