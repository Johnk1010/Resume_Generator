import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthPageShell } from "../views/layout/AuthPageShell";
import { useAuth } from "../models/context/auth-context";

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({ name, email, password });
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      title="Criar Conta"
      subtitle="Cadastre-se para montar e versionar seus currículos."
      footerText="Já tem conta?"
      footerLinkText="Entrar"
      footerTo="/login"
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-ink/80">
          Nome
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2"
            required
          />
        </label>

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
            minLength={6}
            required
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal px-4 py-2.5 font-semibold text-white transition hover:bg-teal/90 disabled:opacity-60"
        >
          {loading ? "Criando..." : "Cadastrar"}
        </button>
      </form>
    </AuthPageShell>
  );
};

