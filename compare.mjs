export function crossover(minutesA, passesA, passesB) {
  if (!Number.isFinite(minutesA) || minutesA <= 0 || passesA <= 0 || passesB <= 0) return null;
  const tie = minutesA * passesB / passesA;
  return Number.isFinite(tie) ? { tie, faster: Math.ceil(tie) - 1 } : null;
}

export function compare(routes) {
  const maps = routes.map(route => {
    const seen = new Map();
    for (const row of route.rows) {
      const id = row.id.trim().toLowerCase();
      if (!id) continue;
      const prev = seen.get(id);
      if (!prev) seen.set(id, { ...row });
      else if (prev.status !== row.status) seen.set(id, { status: 'pending', gap: '复核结果冲突' });
    }
    return seen;
  });
  const shared = [...maps[0].keys()].filter(id => maps[1].has(id));
  const overlap = new Set(shared);
  const summaries = maps.map((map, index) => {
    let pass = 0, exclusivePass = 0, pending = 0;
    const gaps = new Map();
    for (const [id, row] of map) {
      if (row.status === 'pass') { pass++; if (!overlap.has(id)) exclusivePass++; }
      else {
        if (row.status === 'pending') pending++;
        const gap = row.gap.trim();
        if (gap) gaps.set(gap, (gaps.get(gap) || 0) + 1);
      }
    }
    const minutes = Number(routes[index].minutes);
    const topCount = Math.max(0, ...gaps.values());
    const topGap = [...gaps].filter(([, n]) => n === topCount).map(([gap]) => gap).join('、');
    return { unique: map.size, pass, exclusivePass, pending, topGap, perHour: minutes > 0 ? exclusivePass * 60 / minutes : null };
  });
  const [a, b] = summaries;
  const preferred = a.unique && b.unique && a.perHour !== null && b.perHour !== null && a.perHour !== b.perHour ? Number(b.perHour > a.perHour) : null;
  return { routes: summaries, unique: a.unique + b.unique - shared.length, shared: shared.length, preferred };
}
