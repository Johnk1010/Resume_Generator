import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../models/context/auth-context";

export const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="min-h-screen bg-cream text-ink grid place-items-center font-body">
        <p className="text-lg">Carregando sessão...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

