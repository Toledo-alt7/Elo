import { Link } from "@tanstack/react-router";
import { ArrowRight, NotebookPen, Sparkles, Stethoscope, Wind } from "lucide-react";
import EmotionCheckin from "./EmotionCheckin";

export default function PatientHome({ profile }) {
  const firstName = profile?.full_name?.split(" ")[0] ?? "você";
  const link = profile?.link;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bem-vindo</p>
        <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">
          Olá, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">Como você está chegando hoje?</p>
      </header>

      <Link
        to="/diario/$entryId"
        params={{ entryId: "novo" }}
        className="block rounded-3xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] p-5 shadow-[0_22px_45px_-24px_hsl(var(--primary)/0.9)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-white">
              <NotebookPen className="h-3 w-3" /> Meu Diário
            </span>
            <h2 className="text-lg font-semibold leading-snug text-white">
              Um espaço seguro para registrar o que importa.
            </h2>
            <p className="text-xs leading-relaxed text-white/80">
              Escreva o que aconteceu hoje — sua terapeuta vê só o que você autorizar.
            </p>
          </div>
          <span className="rounded-full bg-white/20 p-2 text-white">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>

      <Link
        to="/aurora"
        className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/50"
      >
        <span className="rounded-xl bg-primary/15 p-2.5 text-accent">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-foreground">Conversar com a Aurora</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            Conte o que aconteceu desde a última sessão. Ela organiza e envia o resumo.
          </span>
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <EmotionCheckin />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/calma"
          className="rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/50"
        >
          <Wind className="h-5 w-5 text-sky-300" />
          <p className="mt-2 text-sm font-semibold text-foreground">Acalme-se</p>
          <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">
            Respirar com calma, no seu tempo.
          </p>
        </Link>
        <Link
          to="/perfil"
          className="rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/50"
        >
          <Stethoscope className="h-5 w-5 text-violet-300" />
          <p className="mt-2 text-sm font-semibold text-foreground">
            {link?.status === "active" ? link.professional_name : "Vincular terapeuta"}
          </p>
          <p className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">
            {link?.status === "active"
              ? "Acompanhando você no Elo"
              : link?.status === "pending"
                ? "Aguardando aprovação"
                : "Use o código do seu terapeuta"}
          </p>
        </Link>
      </div>

      <p className="rounded-2xl bg-secondary/60 p-4 text-xs leading-relaxed text-muted-foreground">
        Autocuidado de hoje: você não precisa resolver tudo agora. Registrar já é um passo.
      </p>
    </div>
  );
}