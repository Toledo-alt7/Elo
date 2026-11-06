import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Image } from "@/components/ui/image";
import Logo from "@/components/elo/Logo";
import { useAuth } from "@/lib/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elo — Conectando você ao cuidado que importa" },
      {
        name: "description",
        content:
          "Elo é o espaço seguro entre sessões: registre o que sente, conversa com a Aurora e chegue à terapia com o que realmente importa.",
      },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) navigate({ to: "/inicio" });
  }, [isAuthenticated, isLoadingAuth, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-10%,hsl(var(--primary)/0.38),transparent_70%)]" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-[hsl(var(--accent)/0.18)] blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-8 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Logo />
          <Link
            to="/login"
            className="rounded-full border border-border/80 px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-primary/60 hover:text-foreground"
          >
            Entrar
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center gap-10 py-10 lg:grid lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14">
          <div className="flex flex-col gap-7">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Apoio emocional entre sessões
            </span>

            <h1 className="font-heading text-[2.6rem] font-semibold leading-[1.03] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-[4.2rem]">
              Conectando você ao cuidado que importa
            </h1>

            <p className="max-w-md text-[0.98rem] leading-relaxed text-muted-foreground sm:text-base">
              Durante a semana muita coisa acontece — e na consulta parte dela se perde. O Elo
              guarda o que você sentiu, a Aurora organiza suas palavras e sua terapeuta recebe
              apenas o que você autorizar.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-7 py-4 text-sm font-semibold tracking-wide text-primary-foreground shadow-[0_14px_36px_-12px_hsl(var(--primary)/0.85)] transition-colors hover:bg-primary/90"
              >
                Começar
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-border px-7 py-4 text-sm font-medium text-foreground/90 transition-colors hover:bg-secondary"
              >
                Já tenho conta
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-accent" />
                Diário privado por padrão
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                Compartilhamento só com sua autorização
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_70%_20%,hsl(var(--primary)/0.28),transparent_65%)] blur-2xl" />
            <Image
              src="https://media.base44.com/images/public/6aee001582598c8676d1c8b1/a71230d52_generated_image.png"
              alt="Formas fluidas em tons de azul profundo e violeta representando acolhimento"
              className="relative aspect-[4/3] w-full rounded-[1.75rem] border border-border/60 lg:aspect-[602/628]"
              fittingType="fill"
            />
          </div>
        </main>

        <footer className="space-y-3 border-t border-border/60 pt-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            O Elo não substitui atendimento psicológico, psiquiátrico ou qualquer avaliação
            profissional. A inteligência artificial organiza relatos — não diagnostica nem prescreve.
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            Em crise ou risco imediato, ligue 188 (CVV) ou procure o serviço de emergência mais próximo.
          </p>
        </footer>
      </div>
    </div>
  );
}