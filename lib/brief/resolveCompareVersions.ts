/**
 * Determines which brief versions to compare from URL-style params and rows for one mode,
 * newest first. Used by the compare page and exercised by fixtures.
 */

export type CompareVersionRowLite = {
  id: string;
  versionNumber: number;
  createdAt: Date;
};

export type ResolveCompareCoercion =
  | "none"
  | "invalid_params_ignored"
  | "same_version"
  /** When only `from` is omitted and inferred from selected `to`. */
  | "inferred_from"
  /** When only `to` is omitted and inferred from selected `from`. */
  | "inferred_to";

export type ResolveComparePairResult = {
  from: CompareVersionRowLite | null;
  to: CompareVersionRowLite | null;
  sameVersionSelected: boolean;
  selectionCoercion: ResolveCompareCoercion;
};

function trimmed(raw: string | undefined) {
  const t = raw?.trim();
  return t && t.length ? t : undefined;
}

/**
 * `orderedNewestFirst[0]` is the newest revision for the mode.
 *
 * Defaults when both params missing: `to = newest`, `from = previous` (second row) or null if only one.
 */
export function resolveCompareVersionPair(
  orderedNewestFirst: CompareVersionRowLite[],
  fromQuery: string | undefined,
  toQuery: string | undefined,
): ResolveComparePairResult {
  if (orderedNewestFirst.length === 0) {
    return { from: null, to: null, sameVersionSelected: false, selectionCoercion: "none" };
  }

  if (orderedNewestFirst.length === 1) {
    const only = orderedNewestFirst[0];
    const fq = trimmed(fromQuery);
    const tq = trimmed(toQuery);
    const bad = Boolean((fq && fq !== only.id) || (tq && tq !== only.id));
    return {
      from: null,
      to: only,
      sameVersionSelected: false,
      selectionCoercion: bad ? "invalid_params_ignored" : "none",
    };
  }

  const idSet = new Set(orderedNewestFirst.map((v) => v.id));
  const resolveId = (id: string | undefined) => {
    const t = trimmed(id);
    return t && idSet.has(t) ? orderedNewestFirst.find((v) => v.id === t)! : null;
  };

  let fromValid = resolveId(fromQuery);
  let toValid = resolveId(toQuery);
  const hadFromQuery = Boolean(trimmed(fromQuery));
  const hadToQuery = Boolean(trimmed(toQuery));
  let invalidParams = Boolean((hadFromQuery && !fromValid) || (hadToQuery && !toValid));

  if (invalidParams) {
    fromValid = null;
    toValid = null;
    const toDefault = orderedNewestFirst[0];
    const fromDefault = orderedNewestFirst[1] ?? null;
    return {
      from: fromDefault,
      to: toDefault,
      sameVersionSelected: false,
      selectionCoercion: "invalid_params_ignored",
    };
  }

  // Neither param → latest pair.
  if (!fromValid && !toValid) {
    return {
      from: orderedNewestFirst[1] ?? null,
      to: orderedNewestFirst[0],
      sameVersionSelected: false,
      selectionCoercion: "none",
    };
  }

  if (toValid && !fromValid) {
    const idx = orderedNewestFirst.indexOf(toValid);
    const older = orderedNewestFirst[idx + 1] ?? null;
    return {
      from: older,
      to: toValid,
      sameVersionSelected: false,
      selectionCoercion: older ? "inferred_from" : "none",
    };
  }

  if (fromValid && !toValid) {
    const idx = orderedNewestFirst.indexOf(fromValid);
    const newer = idx > 0 ? orderedNewestFirst[idx - 1]! : fromValid;
    const same = newer.id === fromValid.id;
    return {
      from: fromValid,
      to: newer,
      sameVersionSelected: same,
      selectionCoercion: same ? "same_version" : "inferred_to",
    };
  }

  if (fromValid && toValid) {
    if (fromValid.id === toValid.id) {
      return {
        from: fromValid,
        to: toValid,
        sameVersionSelected: true,
        selectionCoercion: "same_version",
      };
    }

    return {
      from: fromValid,
      to: toValid,
      sameVersionSelected: false,
      selectionCoercion: "none",
    };
  }

  /** Unreachable — all `(from,to)` subsets covered above — kept for exhaustive safety. */
  return {
    from: orderedNewestFirst[1] ?? null,
    to: orderedNewestFirst[0],
    sameVersionSelected: false,
    selectionCoercion: "none",
  };
}
