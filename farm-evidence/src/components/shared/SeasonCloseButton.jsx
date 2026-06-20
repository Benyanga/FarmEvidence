import React, { useState, useMemo } from 'react';
import { IconCheckCircle } from '../ui/Icons';

/**
 * SeasonCloseButton - Season Close Action (Section 17)
 *
 * Shown on DataEntry and Dashboard pages once minimum dataset is met.
 * Orchestrates the season close workflow:
 * 1. Validates minimum dataset per plot
 * 2. Shows confirmation modal
 * 3. Calls API to close season and run analysis
 * 4. Displays results and refreshes parent page
 *
 * Props:
 *   trialId: ID of the trial to close
 *   plots: Array of plot objects
 *   onClosed: Callback function when season successfully closes
 */
export default function SeasonCloseButton({ trialId, plots = [], onClosed }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);
  const [resultType, setResultType] = useState(null); // 'success', 'error'
  const [errorList, setErrorList] = useState([]);

  // ============ DATASET READINESS CHECK ============
  const { readyPlots, notReadyPlots } = useMemo(() => {
    const ready = [];
    const notReady = [];

    plots.forEach((plot) => {
      const yieldKg = plot.yieldKg || 0;
      const inputCosts = plot.inputCosts || [];
      const labourCosts = plot.labourCosts || [];
      const totalCostRecords = inputCosts.length + labourCosts.length;

      if (yieldKg > 0 && totalCostRecords >= 3) {
        ready.push(plot);
      } else {
        notReady.push(plot);
      }
    });

    return { readyPlots: ready, notReadyPlots: notReady };
  }, [plots]);

  const allReady = notReadyPlots.length === 0;

  // ============ HANDLE SEASON CLOSE ============
  const handleConfirmClose = async () => {
    setLoading(true);
    setResultMessage(null);
    setResultType(null);
    setErrorList([]);

    try {
      const response = await fetch(`/api/seasons/close/${trialId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setResultType('error');
        setResultMessage(
          'Season close failed. Please resolve the violations below.'
        );
        setErrorList(errorData.violations || []);
        setLoading(false);
        setShowConfirm(false);
        return;
      }

      const data = await response.json();
      setResultType('success');
      setResultMessage(
        `Season ${data.seasonNumber || ''} closed successfully. Trajectory updated.`
      );
      setLoading(false);
      setShowConfirm(false);

      // Call parent callback after brief delay to show message
      setTimeout(() => {
        if (onClosed) onClosed();
      }, 1500);
    } catch (error) {
      setResultType('error');
      setResultMessage('Network error closing season. Please try again.');
      setErrorList([error.message]);
      setLoading(false);
      setShowConfirm(false);
    }
  };

  // ============ RENDER: NOT READY STATE ============
  if (!allReady) {
    return (
      <div className="space-y-2">
        <button
          disabled
          className="w-full px-4 py-2 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-medium text-sm cursor-not-allowed opacity-60"
        >
          Close Season ({readyPlots.length}/{plots.length} plots ready)
        </button>

        {/* List of not-ready plots */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <p className="font-semibold text-amber-800 mb-2">Not ready:</p>
          <ul className="space-y-1 text-amber-700">
            {notReadyPlots.map((plot) => {
              const yieldOk = (plot.yieldKg || 0) > 0;
              const costCount =
                (plot.inputCosts || []).length +
                (plot.labourCosts || []).length;
              const costOk = costCount >= 3;
              const missing = [];

              if (!yieldOk) missing.push('yield');
              if (!costOk)
                missing.push(`cost records (has ${costCount}, need 3)`);

              return (
                <li key={plot.id || plot.plotId}>
                  <span className="font-medium">{plot.label || plot.id}</span>
                  {': '}
                  {missing.join(', ')}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  // ============ RENDER: CONFIRMATION MODAL ============
  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Close Season & Run Analysis
          </h2>
          <p className="text-sm text-gray-700 mb-4">
            Closing the season will:
          </p>
          <ul className="space-y-2 text-sm text-soil mb-6">
            <li className="flex items-start gap-2">
              <IconCheckCircle className="w-4 h-4 text-canopy mt-0.5 flex-shrink-0" />
              <span>Run the full CBA computation (including phase, CSI, adoption cost)</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheckCircle className="w-4 h-4 text-canopy mt-0.5 flex-shrink-0" />
              <span>Save a permanent season record for trajectory analysis</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheckCircle className="w-4 h-4 text-canopy mt-0.5 flex-shrink-0" />
              <span>Lock all plot data for this season (edits will not be possible after close)</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheckCircle className="w-4 h-4 text-canopy mt-0.5 flex-shrink-0" />
              <span>Generate condition-based alerts</span>
            </li>
          </ul>
          <p className="text-sm font-semibold text-amber-800 mb-6">
            Are you sure?
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {loading ? 'Running...' : 'Close Season'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ RENDER: SUCCESS/ERROR RESULT ============
  if (resultMessage) {
    return (
      <div
        className={`rounded-lg p-4 mb-4 ${
          resultType === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}
      >
        <p
          className={`font-semibold ${
            resultType === 'success' ? 'text-green-800' : 'text-red-800'
          } mb-2`}
        >
          {resultMessage}
        </p>

        {resultType === 'error' && errorList.length > 0 && (
          <ul
            className={`mt-2 space-y-1 text-sm ${
              resultType === 'success' ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {errorList.map((err, idx) => (
              <li key={idx}>• {err}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // ============ RENDER: READY STATE ============
  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
    >
      Close Season & Run Full Analysis
      <span>→</span>
    </button>
  );
}
