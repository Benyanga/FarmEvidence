import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrialContext } from "../../context/TrialContext";
import { useSessionStore } from "../../store/sessionStore";
import { IconLeaf, IconMicroscope } from "../../components/ui/Icons";

const ROLES = [
  {
    name: "Farmer",
    icon: <IconLeaf className="w-8 h-8 text-canopy mx-auto mb-3" />,
    description: "Farm-level cost tracking and profitability analysis for your own plot",
    features: [
      "Single treatment tracking",
      "Season-to-season comparison",
      "Time-to-Profit projection",
      "Basic agronomic trend",
      "Bilingual (EN / Kinyarwanda)",
    ],
    button: "Enter as Farmer",
    langOptions: ["en", "kin"],
    defaultLang: "en",
  },
  {
    name: "Researcher",
    icon: <IconMicroscope className="w-8 h-8 text-sky mx-auto mb-3" />,
    description: "Full RCBD trial management with statistical analysis and multi-treatment comparison",
    features: [
      "CA vs CF comparison",
      "RCBD statistical testing (t-test / ANOVA)",
      "Full cost-tier model",
      "Scenario and risk analysis",
      "PDF report generation",
    ],
    button: "Enter as Researcher",
    defaultLang: "en",
  },
];

function RoleCard({ role, selectedLang, onLangChange, onEnter }) {
  return (
    <div className="group flex h-full flex-col justify-between rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-2 hover:border-[#2D5016] hover:shadow-xl sm:p-8">
      <div>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 text-3xl">{role.icon}</div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{role.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{role.description}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm text-slate-700">
          {role.features.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-[0.65rem] font-semibold">✓</span>
              <span className="leading-6">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {role.langOptions ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Language</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {role.langOptions.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onLangChange(lang)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selectedLang === lang
                    ? "border-[#2D5016] bg-[#2D5016] text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {lang === "en" ? "English" : "Kinyarwanda"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onEnter}
        className="mt-8 inline-flex w-full items-center justify-center rounded-3xl bg-[#2D5016] px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        {role.button}
      </button>
    </div>
  );
}

export default function RoleLogin() {
  const navigate = useNavigate();
  const { setMode, setRole, setLang } = useTrialContext();
  const setSessionMode = useSessionStore((s) => s.setMode);
  const setSessionRole = useSessionStore((s) => s.setRole);
  const setSessionLanguage = useSessionStore((s) => s.setLanguage);
  const [selectedLang, setSelectedLang] = useState("en");

  // If mode already set (return visit), go straight to dashboard
  useEffect(() => {
    try {
      const storedMode = localStorage.getItem("mode");
      if (storedMode) {
        navigate("/dashboard", { replace: true });
      }
    } catch {
      // ignore parse errors
    }
  }, [navigate]);

  const handleEnter = (roleName) => {
    const lang = roleName === "Farmer" ? selectedLang : "en";
    const mode = roleName === "Farmer" ? "farmer" : "researcher";
    const sessionMode = roleName === "Farmer" ? "FARMER" : "RESEARCH";

    setMode(mode);
    setRole(roleName);
    setLang(lang);
    setSessionMode(sessionMode);
    setSessionRole(roleName);
    setSessionLanguage(lang);
    navigate("/setup");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 rounded-[2rem] bg-white p-8 text-center shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">FarmEvidence</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900">Select your role</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Choose the mode that fits your work. Your selection configures the application experience and defaults for language and tools.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-full">
            <RoleCard
              role={{ ...ROLES[0], langOptions: ROLES[0].langOptions }}
              selectedLang={selectedLang}
              onLangChange={setSelectedLang}
              onEnter={() => handleEnter("Farmer")}
            />
          </div>
          <div className="h-full">
            <RoleCard
              role={ROLES[1]}
              selectedLang={selectedLang}
              onLangChange={() => {} }
              onEnter={() => handleEnter("Researcher")}
            />
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border-l-4 border-l-amber-500 bg-amber-50 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-900">Mode Selection</p>
          <p className="mt-3 text-base leading-7 text-amber-900">
            Once you enter a mode, you will only see features relevant to that mode.
            <br />
            To switch modes, sign out and log in again.
          </p>
        </div>

        <footer className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          FarmEvidence · Learn Pathway · Rwanda 2026
        </footer>
      </div>
    </div>
  );
}
