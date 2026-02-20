import { FormEvent, useState } from "react";
import { AuthPageShell } from "../views/layout/AuthPageShell";
import { forgotPasswordRequest } from "../models/auth";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await forgotPasswordRequest({ email });
      setMessage(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar token de reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      title="Recuperar Senha"
      subtitle="Informe seu e-mail para gerar um token de reset (simulado no console da API)."
      footerText="Lembrou da senha?"
      footerLinkText="Voltar ao login"
      footerTo="/login"
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

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal px-4 py-2.5 font-semibold text-white transition hover:bg-teal/90 disabled:opacity-60"
        >
          {loading ? "Gerando..." : "Enviar token"}
        </button>
      </form>
    </AuthPageShell>
  );
};

