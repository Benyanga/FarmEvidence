import { useComputationStore } from "../store/computationStore";

export function useComputation() {
  return useComputationStore();
}
