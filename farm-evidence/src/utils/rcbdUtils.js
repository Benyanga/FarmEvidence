// Utility to generate plot IDs and metadata for RCBD
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
