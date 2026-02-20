import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthPageShell } from "../views/layout/AuthPageShell";
import { useAuth } from "../models/context/auth-context";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("demo@curriculo.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      const target = (location.state as { from?: string } | null)?.from ?? "/app";
      navigate(target, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      title="Entrar"
      subtitle="Acesse sua conta para continuar editando seus currículos."
      footerText="Não tem conta?"
      footerLinkText="Cadastre-se"
      footerTo="/register"
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-ink/80">
          E-mail
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2"
            required
          />
        </label>

        <label className="block text-sm font-semibold text-ink/80">
          Senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2"
            required
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal px-4 py-2.5 font-semibold text-white transition hover:bg-teal/90 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <Link to="/forgot-password" className="block text-center text-sm font-semibold text-teal">
          Esqueci minha senha
        </Link>
      </form>
    </AuthPageShell>
  );
};

