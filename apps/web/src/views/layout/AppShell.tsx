import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../models/context/auth-context";

export const AppShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint via-cream to-white text-ink font-body">
      <header className="border-b border-teal/20 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/app" className="font-heading text-xl font-bold tracking-tight text-ink">
            Gerador de Currículo
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-ink/70 md:inline">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-full border border-coral px-4 py-2 text-sm font-semibold text-coral transition hover:bg-coral hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-5 py-6">
        <Outlet />
      </main>
    </div>
  );
};

