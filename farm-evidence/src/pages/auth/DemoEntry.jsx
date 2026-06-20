import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function DemoEntry() {
  const { mode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect demo entry to the standard welcome flow where Clerk sign-in is used
    if (mode) navigate(`/welcome/${mode}`, { replace: true });
    else navigate('/welcome', { replace: true });
  }, [mode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">Redirecting to welcome…</div>
    </div>
  );
}
