import { useState } from 'react';
import { useTrialContext } from '../../context/TrialContext';
import { IconClapperboard } from '../ui/Icons';

export function DemoBanner() {
  const { isDemoAccount, user } = useTrialContext();
  const [dismissed, setDismissed] = useState(false);

  if (!isDemoAccount || dismissed) return null;

  return (
    <div className="bg-amber/10 border-b border-amber/20 px-5 py-1.5 flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-amber-700 font-medium text-xs">
        <IconClapperboard className="w-4 h-4 flex-shrink-0" />
        Demo Mode — You're viewing {user?.mode === 'farmer' ? 'a sample farm' : 'a sample research trial'} with pre-loaded data. Changes you make here are sandboxed for this presentation.
      </span>
      <button onClick={() => setDismissed(true)} className="text-amber/50 hover:text-amber/80 transition-colors text-base leading-none ml-3">
        ×
      </button>
    </div>
  );
}
