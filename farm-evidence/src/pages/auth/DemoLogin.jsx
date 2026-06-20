import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function DemoLogin() {
  const { mode: modeParam } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect demo login to the Clerk sign-in page for the selected mode
    if (modeParam) navigate(`/welcome/${modeParam}/login`, { replace: true });
    else navigate('/welcome', { replace: true });
  }, [modeParam, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">Redirecting to sign-in…</div>
    </div>
  );
}
