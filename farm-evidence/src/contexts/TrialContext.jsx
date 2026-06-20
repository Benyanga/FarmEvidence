import { createContext } from "react";

const TrialContext = createContext({
  activeTrial: null,
  setActiveTrial: () => {},
  userRole: null,
  setUserRole: () => {},
});

export default TrialContext;
