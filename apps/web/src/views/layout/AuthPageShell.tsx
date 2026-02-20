import { Link } from "react-router-dom";

interface AuthPageShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerTo: string;
}

export const AuthPageShell = ({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerTo
}: AuthPageShellProps) => {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#d3f0e4_0,#fffdf7_42%,#ffffff_100%)] px-4 py-8 font-body">
      <section className="w-full max-w-lg rounded-3xl border border-teal/20 bg-white/90 p-8 shadow-glow backdrop-blur-sm">
        <h1 className="font-heading text-3xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink/70">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-5 text-sm text-ink/70">
          {footerText} <Link to={footerTo} className="font-semibold text-teal">{footerLinkText}</Link>
        </p>
      </section>
    </main>
  );
};

