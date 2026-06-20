import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useSessionStore } from "../../store/sessionStore";
import "./ScreenTopbar.css";

const modeClass = {
  FARMER: "pill pill-farmer",
  RESEARCH: "pill pill-research",
};

const statusClass = {
  synced: "pill sync-pill",
  saving: "pill saving-pill",
  error: "pill error-pill",
  offline: "pill offline-pill",
};

function deduceModeFromPath(pathname) {
  if (
    pathname.startsWith("/analysis") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/help") ||
    pathname.startsWith("/mode-rules")
  ) {
    return "RESEARCH";
  }
  if (pathname.startsWith("/data-entry") || pathname.startsWith("/setup")) {
    return "FARMER";
  }
  return null;
}

export function ScreenTopbar({ superText, title, meta, mode, status, statusTone = "synced", activeFarmLabel, avatarLabel, extraPills = [] }) {
  const location = useLocation();
  const sessionMode = useSessionStore((s) => s.mode);
  const effectiveMode = mode || sessionMode || deduceModeFromPath(location.pathname);

  const modeLabel = useMemo(() => {
    if (effectiveMode === "RESEARCH") return "Research Mode";
    if (effectiveMode === "FARMER") return "Farmer Mode";
    return null;
  }, [effectiveMode]);

  const activeContextLabel = useMemo(() => {
    if (!activeFarmLabel) return null;
    const prefix = effectiveMode === "RESEARCH" ? "Active Trial" : effectiveMode === "FARMER" ? "Active Farm" : "Active";
    return `${prefix}: ${activeFarmLabel}`;
  }, [activeFarmLabel, effectiveMode]);

  return (
    <div className="topbar">
      <div className="tb-left">
        {superText ? <div className="tb-super">{superText}</div> : null}
        {title ? <div className="tb-title">{title}</div> : null}
        {meta ? <div className="tb-meta">{meta}</div> : null}
      </div>
      <div className="tb-right">
        {activeContextLabel ? (
          <div className="pill farm-pill">
            <span className="dot" />
            {activeContextLabel}
          </div>
        ) : null}
        {modeLabel ? (
          <div className={modeClass[effectiveMode] || "pill"}>
            <span className="dot" />
            {modeLabel}
          </div>
        ) : null}
        {status ? (
          <div className={statusClass[statusTone] || statusClass.synced}>
            <span className="dot" />
            {status}
          </div>
        ) : null}
        {extraPills.map((pill, index) => (
          <div key={index} className={`pill ${pill.className || ""}`}>
            <span className="dot" />
            {pill.label}
          </div>
        ))}
        {avatarLabel ? <div className="avatar">{avatarLabel}</div> : null}
      </div>
    </div>
  );
}
