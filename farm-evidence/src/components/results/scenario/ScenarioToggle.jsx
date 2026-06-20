export function ScenarioToggle({ scenario, setScenario }) {
  const options = ["worst", "normal", "best"];
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setScenario(opt)}
          className={`btn ${scenario === opt ? "btn-primary" : "btn-secondary"}`}
        >
          {opt.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

