import { useNavigate } from "react-router-dom";

export function SetupBreadcrumb({ items }) {
  const navigate = useNavigate();

  return (
    <nav className="breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="breadcrumb__item">
          {item.to ? (
            <button type="button" className="breadcrumb__link" onClick={() => navigate(item.to)}>
              {item.label}
            </button>
          ) : (
            <span className="breadcrumb__current">{item.label}</span>
          )}
          {index < items.length - 1 && <span className="breadcrumb__separator">›</span>}
        </span>
      ))}
    </nav>
  );
}
