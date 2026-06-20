import { useState } from "react";
import { useSessionStore } from "../../store/sessionStore";
import { useComputationStore } from "../../store/computationStore";
// session store imported once

export function ComputationRunner({ seasonId, sessionData }) {
  const activeFarm = useSessionStore((s) => s.activeFarm);
  const seasonKey = activeFarm ? `${activeFarm.year}-${activeFarm.season}` : "season-1";
  const effectiveSeasonId = seasonId ?? seasonKey;
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const mode = useSessionStore((s) => s.mode);
  const runAnalysis = useComputationStore((s) => s.runAnalysis);

  const handleRunAnalysis = async () => {
    setIsRunning(true);
    setProgress(0);
    setStatusMessage("Initializing analysis...");

    try {
      // Simulate progress updates for better UX
      const progressSteps = [
        { progress: 10, message: "Loading session data..." },
        { progress: 25, message: "Validating input data..." },
        { progress: 40, message: "Computing profit indicators..." },
        { progress: 60, message: "Analyzing cost differentials..." },
        { progress: 75, message: "Calculating adoption costs..." },
        { progress: 90, message: "Generating insights..." },
      ];

      for (const step of progressSteps) {
        setProgress(step.progress);
        setStatusMessage(step.message);
        await new Promise(resolve => setTimeout(resolve, 200)); // Brief pause for UX
      }

      await runAnalysis(effectiveSeasonId, sessionData, mode);

      setProgress(100);
      setStatusMessage("Analysis complete! View results below.");
      setTimeout(() => {
        setIsRunning(false);
        setProgress(0);
        setStatusMessage("");
      }, 2000);

    } catch (error) {
      setStatusMessage("Analysis failed. Please check your data and try again.");
      setIsRunning(false);
      setProgress(0);
      console.error("Analysis error:", error);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        className={`btn btn-primary w-full ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleRunAnalysis}
        disabled={isRunning}
      >
        {isRunning ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Running Analysis...
          </div>
        ) : (
          "🚀 Run Analysis"
        )}
      </button>

      {isRunning && (
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="font-medium text-blue-900">{statusMessage}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-slate-600 mt-2">{progress}% complete</p>
        </div>
      )}

      {!isRunning && statusMessage && (
        <div className="card state-positive">
          <div className="flex items-center gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <span className="font-medium">{statusMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

