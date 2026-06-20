export function useGate(gates) {
  const allPassed = gates.every((g) => g.pass);
  return { allPassed, failed: gates.filter((g) => !g.pass) };
}
