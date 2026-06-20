/**
 * ACTION SELECT — three options after mode is chosen.
 * Design: clean, centered, card-based. Background is mist with a subtle
 * colored bar across the top (mode-colored) giving continuity from ModeSelect.
 * The Demo card is visually distinguished — it's the suggested/primary action
 * for a first visit, so it gets slightly more visual weight.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { IconPlay, IconPenLine, IconKey } from '../../components/ui/Icons';

const MODE_CONFIG = {
  farmer: {
    label: 'Farmer Mode',
    color: 'bg-canopy',
    textColor: 'text-canopy',
    iconBg: 'bg-canopy-pale',
    demoDescription: 'Explore a demo farm with 3 seasons of recorded data — Beans, Maize, then Beans again.'
  },
  researcher: {
    label: 'Researcher Mode',
    color: 'bg-sky',
    textColor: 'text-sky',
    iconBg: 'bg-sky-pale',
    demoDescription: 'Explore a demo RCBD trial — 8 plots comparing CA vs CF over 3 closed seasons.'
  }
};

export default function ActionSelect() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const config = MODE_CONFIG[mode] || MODE_CONFIG.researcher;

  const actions = [
    {
      key: 'demo',
      icon: <IconPlay className="w-6 h-6" />,
      title: 'Try the Demo',
      description: config.demoDescription,
      tag: 'No account needed',
      path: `/welcome/${mode}/demo`,
      featured: true
    },
    {
      key: 'register',
      icon: <IconPenLine className="w-6 h-6" />,
      title: 'Create an Account',
      description: 'Register with your phone number or email to start recording your own data.',
      path: `/welcome/${mode}/register`,
      featured: false
    },
    {
      key: 'login',
      icon: <IconKey className="w-6 h-6" />,
      title: 'Log In',
      description: 'You already have an account for this mode.',
      path: `/welcome/${mode}/login`,
      featured: false
    }
  ];

  return (
    <div className="min-h-screen bg-mist flex flex-col">

      {/* Mode color bar */}
      <div className={`h-1.5 ${config.color}`} />

      {/* Back nav */}
      <div className="px-6 pt-6">
        <button
          onClick={() => navigate('/welcome')}
          className="flex items-center gap-1.5 text-soil-faint text-sm hover:text-soil transition-colors"
        >
          <span>←</span>
          <span>Choose a different mode</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">

        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <span className={`inline-block text-xs font-semibold uppercase tracking-widest
              ${config.textColor} mb-3`}>
              {config.label}
            </span>
            <h1 className="text-display-sm text-soil">How would you like to continue?</h1>
          </div>

          <div className="space-y-3">
            {actions.map(action => (
              <button
                key={action.key}
                onClick={() => navigate(action.path)}
                className={`
                  w-full text-left rounded-xl p-5 border transition-all duration-200
                  hover:-translate-y-0.5 active:translate-y-0
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canopy/30
                  group
                  ${action.featured
                    ? 'bg-paper border-ledger shadow-raised hover:shadow-float'
                    : 'bg-paper/70 border-ledger-soft shadow-card hover:shadow-raised hover:bg-paper'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                    flex-shrink-0 ${action.featured ? config.iconBg : 'bg-mist'}
                    group-hover:scale-105 transition-transform`}
                    style={{ color: action.featured ? undefined : 'var(--soil-faint)' }}>
                    <span className={action.featured ? config.textColor : 'text-soil-faint'}>
                      {action.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-card-title">{action.title}</span>
                      {action.tag && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-canopy-pale
                          text-canopy font-medium">
                          {action.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-meta text-soil-soft leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                  <span className="text-soil-faint group-hover:text-soil group-hover:translate-x-0.5
                    transition-all self-center flex-shrink-0">
                    →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-8 text-center">
        <p className="text-meta">FarmEvidence · SNV P4FP Learn Pathway · Rwanda 2026</p>
      </div>
    </div>
  );
}
