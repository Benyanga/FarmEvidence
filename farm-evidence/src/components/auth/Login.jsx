import { useState } from "react";
import { SignIn, SignUp, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { useSessionStore } from "../../store/sessionStore";

const hasClerk = !["pk_test_replace_me", "pk_test_your_publishable_key"].includes(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_replace_me",
);

const FallbackSignedIn = ({ children }) => <>{children}</>;
const FallbackSignedOut = () => null;
const FallbackUserButton = () => null;

export function Login() {
  const [isCreate, setIsCreate] = useState(false);
  const mode = useSessionStore((s) => s.mode);
  const role = useSessionStore((s) => s.role);
  const setRole = useSessionStore((s) => s.setRole);
  const setMode = useSessionStore((s) => s.setMode);
  const sessionLocked = useSessionStore((s) => s.sessionLocked);
  const language = useSessionStore((s) => s.language);
  const setLanguage = useSessionStore((s) => s.setLanguage);
  const lockSession = useSessionStore((s) => s.lockSession);
  const authComponents = {
    SignedIn: hasClerk ? SignedIn : FallbackSignedIn,
    SignedOut: hasClerk ? SignedOut : FallbackSignedOut,
    UserButton: hasClerk ? UserButton : FallbackUserButton,
    SignIn,
    SignUp,
  };

  const ROLE_DETAILS = {
    Farmer: {
      description: "Farmer Mode is for single-system cost-benefit tracking, trend dashboards, and bilingual UI.",
      mode: "FARMER",
    },
    Researcher: {
      description: "Researcher mode enables research workflows for trial comparison, RCBD validation, statistics, and explainability outputs.",
      mode: "RESEARCH",
    },
  };

  const lockedView = (
    <div style={{ borderRadius: "14px", border: "1px solid var(--fe-border-default)", boxShadow: "var(--fe-shadow-surface)", background: "var(--fe-white)", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div>
          <span style={{ fontSize: "18px", fontWeight: 600, color: "var(--fe-grey-900)", display: "block" }}>FarmEvidence</span>
          <span style={{ fontSize: "12px", color: "var(--fe-text-muted)", marginTop: "2px", display: "block" }}>Field school data platform</span>
        </div>
        {hasClerk && <authComponents.UserButton />}
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button type="button" className={isCreate ? "btn btn-primary" : "btn btn-secondary"} onClick={() => setIsCreate(true)}>Create account</button>
        <button type="button" className={!isCreate ? "btn btn-primary" : "btn btn-secondary"} onClick={() => setIsCreate(false)}>Login</button>
      </div>
      <div style={{ background: "var(--fe-grey-050)", borderRadius: "14px", padding: "16px", border: "1px solid var(--fe-border-default)" }}>
        {hasClerk ? (
          isCreate ? <SignUp routing="hash" signInUrl="#/sign-in" /> : <SignIn routing="hash" signUpUrl="#/sign-up" />
        ) : (
          <span style={{ fontSize: "13px", color: "var(--fe-text-muted)" }}>Clerk authentication is disabled — use the buttons above to create an account, sign in, or reset your password.</span>
        )}
      </div>
    </div>
  );

  const modeView = (
    <div style={{ borderRadius: "14px", border: "1px solid var(--fe-border-default)", boxShadow: "var(--fe-shadow-surface)", background: "var(--fe-white)", padding: "20px" }}>
      <div style={{ marginBottom: "16px" }}>
        <span style={{ fontSize: "18px", fontWeight: 600, color: "var(--fe-grey-900)", display: "block", marginBottom: "4px" }}>Choose your user type</span>
        <span style={{ fontSize: "13px", color: "var(--fe-text-muted)", display: "block" }}>You must log in first. After signing in, select Farmer or Researcher to lock the session.</span>
      </div>
      <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "16px" }}>
        {Object.entries(ROLE_DETAILS).map(([roleName, details]) => (
          <button
            key={roleName}
            type="button"
            disabled={sessionLocked}
            onClick={() => {
              setRole(roleName);
              setMode(details.mode);
            }}
            style={{ padding: "14px 16px", borderRadius: "14px", border: "1px solid", borderColor: role === roleName ? "var(--fe-teal-900)" : "var(--fe-border-default)", background: role === roleName ? "var(--fe-teal-100)" : "var(--fe-white)", boxShadow: role === roleName ? "var(--fe-shadow-surface)" : "none", textAlign: "left", cursor: sessionLocked ? "not-allowed" : "pointer" }}
          >
            <span style={{ fontSize: "14px", fontWeight: 600, color: role === roleName ? "var(--fe-teal-900)" : "var(--fe-grey-900)" }}>{roleName}</span>
            <span style={{ fontSize: "11px", color: "var(--fe-text-muted)", marginTop: "4px", display: "block", lineHeight: 1.4 }}>{details.description}</span>
          </button>
        ))}
      </div>
      <div style={{ background: "var(--fe-grey-050)", borderRadius: "14px", padding: "14px 16px", border: "1px solid var(--fe-border-default)", marginBottom: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div><span style={{ fontSize: "11px", color: "var(--fe-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Selected role</span><span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)", marginTop: "2px", display: "block" }}>{role}</span></div>
          <div><span style={{ fontSize: "11px", color: "var(--fe-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Session mode</span><span style={{ fontSize: "14px", fontWeight: 600, color: "var(--fe-grey-900)", marginTop: "2px", display: "block" }}>{ROLE_DETAILS[role]?.mode ?? mode}</span></div>
        </div>
        <span style={{ fontSize: "12px", color: "var(--fe-text-muted)", display: "block", marginTop: "10px" }}>Research mode uses English only. Sign in first to continue.</span>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button type="button" className={language === "en" ? "btn btn-primary" : "btn btn-secondary"} onClick={() => setLanguage("en")} disabled={sessionLocked}>English</button>
        <button type="button" className={language === "rw" ? "btn btn-primary" : "btn btn-secondary"} onClick={() => setLanguage("rw")} disabled={sessionLocked || mode === "RESEARCH"}>Kinyarwanda</button>
      </div>
      <button type="button" className="btn btn-primary w-full" onClick={lockSession} disabled={sessionLocked || !role}>Confirm and lock session</button>
    </div>
  );

  if (!hasClerk) {
    return sessionLocked ? (
      <div style={{ borderRadius: "14px", border: "1px solid var(--fe-green-700)", borderLeft: "4px solid var(--fe-green-700)", background: "var(--fe-green-100)", boxShadow: "var(--fe-shadow-surface)", padding: "16px 20px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--fe-green-900)" }}>Session locked — continue to setup and season workflows</span>
      </div>
    ) : (
      modeView
    );
  }

  return (
    <>
      <authComponents.SignedOut>{lockedView}</authComponents.SignedOut>
      <authComponents.SignedIn>{sessionLocked ? <div style={{ borderRadius: "14px", border: "1px solid var(--fe-green-700)", borderLeft: "4px solid var(--fe-green-700)", background: "var(--fe-green-100)", boxShadow: "var(--fe-shadow-surface)", padding: "16px 20px" }}><span style={{ fontSize: "13px", fontWeight: 500, color: "var(--fe-green-900)" }}>Session locked — continue to setup and season workflows</span></div> : modeView}</authComponents.SignedIn>
    </>
  );}
