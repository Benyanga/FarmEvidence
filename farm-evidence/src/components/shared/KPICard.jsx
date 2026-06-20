export function KPICard({ label, caValue, cfValue, format, advantage }) {
  const adv = advantage === 'CA'
    ? 'border-l-4 border-green-500'
    : advantage === 'CF'
    ? 'border-l-4 border-blue-500'
    : 'border-l-4 border-gray-300';

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm ${adv}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex justify-between">
        <div>
          <span className="text-xs font-semibold text-green-700">CA</span>
          <p className="text-lg font-bold text-gray-800">{format(caValue)}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-blue-700">CF</span>
          <p className="text-lg font-bold text-gray-800">{format(cfValue)}</p>
        </div>
      </div>
      {advantage && (
        <p className="text-xs mt-2 text-gray-500">
          Advantage: <span className={advantage === 'CA' ? 'text-green-700 font-semibold' : 'text-blue-700 font-semibold'}>{advantage}</span>
        </p>
      )}
    </div>
  );
}
