import { AXIS_FACETS, FACET_LABELS } from "../data/scentQuestions";
import type { Axis, Facet } from "../data/scentQuestions";
import { scents } from "../data/scents";
import type { Scent } from "../data/scents";

/** 한글 마지막 글자 받침 여부 */
function hasBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** 받침 유무에 따라 "을" 또는 "를" 붙여 반환 */
function withEulReul(word: string): string {
  return word + (hasBatchim(word) ? "을" : "를");
}

export interface MatchResult {
  scent: Scent;
  matchScore: number;
  primaryFacet: Facet;
  reason: string;
}

/**
 * rawScores: { [facet]: 1~4 } — raw option values from the quiz
 * Returns: { [facet]: 0~100 } — normalized facet scores (higher = healthier)
 */
export function computeFacetScores(rawScores: Record<string, number>): Record<Facet, number> {
  const result = {} as Record<Facet, number>;
  for (const [facet, raw] of Object.entries(rawScores)) {
    result[facet as Facet] = ((raw - 1) / 3) * 100;
  }
  return result;
}

/**
 * Returns one best scent per facet, ordered by facet need (most needed first).
 * Each facet gets the best scent by that facet's profile score, no duplicates.
 */
export function matchScentPerFacet(
  facetScores: Record<string, number>,
  axis: Axis
): MatchResult[] {
  const facets = AXIS_FACETS[axis];
  const axisScents = scents.filter((s) => s.axis === axis);

  // Sort facets: lowest score = highest need = comes first
  const sortedFacets = [...facets].sort(
    (a, b) => (facetScores[a] ?? 0) - (facetScores[b] ?? 0)
  );

  const usedIds = new Set<string>();
  const results: MatchResult[] = [];

  sortedFacets.forEach((facet, i) => {
    const available = axisScents.filter((s) => !usedIds.has(s.id));
    if (available.length === 0) return;

    // Best scent for this specific facet
    const best = available.reduce((a, b) =>
      (b.profile[facet] ?? 0) > (a.profile[facet] ?? 0) ? b : a
    );

    usedIds.add(best.id);
    const reason =
      i === 0
        ? `${FACET_LABELS[facet]}, ${withEulReul(best.nameKo)} 먼저 추천해요`
        : `${FACET_LABELS[facet]}, ${withEulReul(best.nameKo)} 추천해요`;

    results.push({
      scent: best,
      matchScore: best.profile[facet] ?? 0,
      primaryFacet: facet,
      reason,
    });
  });

  return results;
}
