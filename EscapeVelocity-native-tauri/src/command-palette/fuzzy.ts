/** Subsequence fuzzy match. Returns a score (higher is better) or -1 for no
 *  match. Rewards consecutive runs and word-boundary hits, lightly penalizes
 *  longer candidates so tighter matches sort first. */
export function fuzzyScore(query: string, text: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  let score = 0;
  let lastIdx = -1;
  let streak = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      streak = lastIdx === ti - 1 ? streak + 1 : 0;
      score += 1 + streak * 2;
      if (ti === 0 || /[\s\-_/.]/.test(t[ti - 1])) score += 3; // word boundary
      lastIdx = ti;
      qi++;
    }
  }

  return qi === q.length ? score - text.length * 0.01 : -1;
}
