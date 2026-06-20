/**
 * MODESELECT — the first screen every user and every presenter sees.
 * Design goals:
 *   1. Immediately communicates "this is a professional, purposeful tool"
 *   2. The two mode cards feel like a genuine choice, not a form
 *   3. The background isn't blank white/grey — it has presence
 *
 * Background treatment: split-grain canvas. The left ~55% of the viewport
 * uses a dark green gradient (canopy → deep soil) with very faint topographic
 * lines (SVG pattern). The right 45% is mist white. The two mode cards sit
 * centered straddling this split — one half visually "in the field," one
 * half "at the desk." This communicates the app's dual identity in the
 * background itself, not just in the copy.
 *
 * The FarmEvidence wordmark sits top-left in white (on the dark half).
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrialContext } from '../../context/TrialContext';
import { IconLeaf, IconMicroscope } from '../../components/ui/Icons';

export default function ModeSelect() {
  const { user, authLoading } = useTrialContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard');
  }, [user, authLoading]);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">

      {/* ── Diagonal split background ── */}
      <div className="absolute inset-0 flex" aria-hidden="true">
        {/* Dark green field half */}
        <div className="w-1/2 bg-gradient-to-br from-[#1A3009] via-canopy to-[#2D3A1A] relative">
          {/* Topographic SVG pattern overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="topo" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <ellipse cx="60" cy="60" rx="50" ry="30" fill="none" stroke="white" strokeWidth="0.8" />
                <ellipse cx="60" cy="60" rx="38" ry="22" fill="none" stroke="white" strokeWidth="0.6" />
                <ellipse cx="60" cy="60" rx="26" ry="14" fill="none" stroke="white" strokeWidth="0.5" />
                <ellipse cx="60" cy="60" rx="14" ry="7"  fill="none" stroke="white" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#topo)" />
          </svg>
        </div>
        {/* Mist paper half */}
        <div className="w-1/2 bg-mist" />
      </div>

      {/* ── Diagonal clip overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(105deg, #1A3009 0%, #1A3009 42%, #F7F5EF 42%, #F7F5EF 100%)'
        }}
        aria-hidden="true"
      />

      {/* ── Content layer ── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Top wordmark */}
        <div className="px-8 pt-8">
          <span className="text-white font-display text-xl font-medium tracking-tight">
            FarmEvidence
          </span>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">

          {/* Headline */}
          <div className="text-center mb-12">
            <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/15 bg-white/85 px-8 py-8 shadow-modal backdrop-blur-sm">
              <h1 className="text-display text-soil mb-3">
                How are you using this?
              </h1>
              <p className="text-soil-soft text-base max-w-sm mx-auto leading-relaxed">
                Choose your role to access the tools built for how you work.
              </p>
            </div>
          </div>

          {/* Mode cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">

            {/* Farmer */}
            <button
              onClick={() => navigate('/welcome/farmer')}
              className="group bg-white/95 backdrop-blur-sm rounded-2xl p-7 text-left
                shadow-modal border border-white/60
                hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(45,36,24,0.18)]
                active:translate-y-0
                transition-all duration-[280ms] cubic-bezier(0.16,1,0.3,1)
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canopy/50"
            >
              <div className="w-12 h-12 rounded-xl bg-canopy-pale flex items-center
                justify-center mb-5 group-hover:bg-canopy group-hover:text-white
                transition-colors duration-200">
                <IconLeaf className="w-6 h-6 text-canopy group-hover:text-white" />
              </div>
              <h2 className="text-card-title mb-2">Farmer</h2>
              <p className="text-body text-sm">
                Track your farm's costs, yields, and profitability across
                seasons. Compare what changed and why.
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-canopy text-sm font-medium">
                <span>Continue</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            {/* Researcher */}
            <button
              onClick={() => navigate('/welcome/researcher')}
              className="group bg-white/95 backdrop-blur-sm rounded-2xl p-7 text-left
                shadow-modal border border-white/60
                hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(45,36,24,0.18)]
                active:translate-y-0
                transition-all duration-[280ms] cubic-bezier(0.16,1,0.3,1)
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/50"
            >
              <div className="w-12 h-12 rounded-xl bg-sky-pale flex items-center
                justify-center mb-5 group-hover:bg-sky group-hover:text-white
                transition-colors duration-200">
                <IconMicroscope className="w-6 h-6 text-sky group-hover:text-white" />
              </div>
              <h2 className="text-card-title mb-2">Researcher</h2>
              <p className="text-body text-sm">
                Run RCBD trials, compare farming systems statistically,
                and generate evidence for extension programmes.
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-sky text-sm font-medium">
                <span>Continue</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="relative pb-8 text-center">
          <p className="text-soil-soft text-xs">
            FarmEvidence · SNV P4FP Learn Pathway · Rwanda 2026
          </p>
        </div>
      </div>
    </div>
  );
}
