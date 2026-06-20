export function computeTTP(profitCA_history, profitCF_history) {
  const len = Math.min(profitCA_history.length, profitCF_history.length);
  for (let i = 0; i < len; i += 1) {
    if (profitCA_history[i] > profitCF_history[i]) {
      return { reached: true, season: i + 1 };
    }
  }
  return { reached: false, season: null };
}

export function computeCNB(profitCA_history, profitCF_history) {
  const len = Math.min(profitCA_history.length, profitCF_history.length);
  let running = 0;
  const out = [];
  for (let i = 0; i < len; i += 1) {
    running += profitCA_history[i] - profitCF_history[i];
    out.push(running);
  }
  return out;
}
