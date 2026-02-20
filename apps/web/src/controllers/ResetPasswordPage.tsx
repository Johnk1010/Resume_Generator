import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthPageShell } from "../views/layout/AuthPageShell";
import { resetPasswordRequest } from "../models/auth";

export const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const initialToken = useMemo(() => params.get("token") ?? "", [params]);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await resetPasswordRequest({ token, newPassword });
      setMessage(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível redefinir senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      title="Redefinir Senha"
      subtitle="Use o token gerado em forgot-password para alterar sua senha."
      footerText="Já atualizou?"
      footerLinkText="Fazer login"
      footerTo="/login"
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-ink/80">
          Token
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2"
            required
          />
        </label>

        <label className="block text-sm font-semibold text-ink/80">
          Nova senha
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2"
            minLength={6}
            required
          />
        </label>

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal px-4 py-2.5 font-semibold text-white transition hover:bg-teal/90 disabled:opacity-60"
        >
          {loading ? "Atualizando..." : "Atualizar senha"}
        </button>
      </form>
    </AuthPageShell>
  );
};

