// Node.js backend utility for RCBD plot generation and validation
export function generatePlots(treatments, replications) {
  const plots = [];
  treatments.forEach(treatment => {
    for (let r = 1; r <= replications; r++) {
      plots.push({
        plotId: `${treatment}-R${r}`,
        treatment,
        replicate: r,
      });
    }
  });
  return plots;
}
