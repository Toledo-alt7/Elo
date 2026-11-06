import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Pause, Play, RotateCcw, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/calma")({
  head: () => ({ meta: [{ title: "Acalme-se — Elo" }] }),
  component: CalmPage,
});

const TECHNIQUES = {
  "478": {
    label: "Respiração guiada",
    hint: "4 · 7 · 8",
    steps: [
      { label: "Inspire pelo nariz", secs: 4, scale: 1 },
      { label: "Segure o ar", secs: 7, scale: 1 },
      { label: "Expire pela boca", secs: 8, scale: 0.66 },
    ],
  },
  quadrada: {
    label: "Respiração quadrada",
    hint: "4 · 4 · 4 · 4",
    steps: [
      { label: "Inspire", secs: 4, scale: 1 },
      { label: "Segure", secs: 4, scale: 1 },
      { label: "Expire", secs: 4, scale: 0.66 },
      { label: "Segure", secs: 4, scale: 0.66 },
    ],
  },
};

function CalmPage() {
  const [key, setKey] = useState("478");
  const technique = TECHNIQUES[key];
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState({ phase: 0, remaining: technique.steps[0].secs });

  useEffect(() => {
    setRunning(false);
    setTick({ phase: 0, remaining: TECHNIQUES[key].steps[0].secs });
  }, [key]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTick((prev) => {
        if (prev.remaining > 1) return { ...prev, remaining: prev.remaining - 1 };
        const next = (prev.phase + 1) % technique.steps.length;
        return { phase: next, remaining: technique.steps[next].secs };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, technique]);

  const step = technique.steps[tick.phase];

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Acalme-se</h1>
        <p className="text-sm text-muted-foreground">
          Práticas opcionais para desacelerar. Interrompa quando quiser.
        </p>
      </header>

      <div className="flex gap-2">
        {Object.entries(TECHNIQUES).map(([optionKey, option]) => (
          <button
            key={optionKey}
            type="button"
            onClick={() => setKey(optionKey)}
            className={cn(
              "flex-1 rounded-2xl border px-3 py-2.5 text-left transition-colors",
              key === optionKey
                ? "border-primary bg-primary/12"
                : "border-border/70 bg-card hover:border-primary/50",
            )}
          >
            <span className="block text-xs font-semibold text-foreground">{option.label}</span>
            <span className="block text-[0.65rem] text-muted-foreground">{option.hint}</span>
          </button>
        ))}
      </div>

      <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl border border-border/70 bg-card px-5 py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,hsl(var(--primary)/0.22),transparent_65%)]" />
        <div className="relative flex h-52 w-52 items-center justify-center">
          <div
            className="absolute h-44 w-44 rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.55),hsl(var(--primary)/0.15))] blur-md transition-transform ease-in-out"
            style={{
              transform: `scale(${running ? step.scale : 0.8})`,
              transitionDuration: `${running ? step.secs : 0.6}s`,
            }}
          />
          <div className="relative z-10 text-center">
            <p className="text-4xl font-semibold text-foreground">{running ? tick.remaining : "—"}</p>
            <p className="mt-1 max-w-[8.5rem] text-xs font-medium text-foreground/80">
              {running ? step.label : "Pronto quando você estiver"}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <Button
            onClick={() => setRunning((prev) => !prev)}
            className="rounded-full px-5 py-5 text-sm font-semibold"
          >
            {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {running ? "Pausar" : "Iniciar"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRunning(false);
              setTick({ phase: 0, remaining: technique.steps[0].secs });
            }}
            className="rounded-full px-4 py-5 text-sm"
          >
            <RotateCcw className="mr-1.5 h-4 w-4" /> Encerrar
          </Button>
        </div>
      </div>

      <p className="rounded-2xl bg-secondary/60 p-4 text-[0.7rem] leading-relaxed text-muted-foreground">
        Respiração lenta é uma prática de relaxamento, não um tratamento médico. Se sentir
        desconforto, tontura ou falta de ar, pare e respire normalmente.
      </p>

      <div className="grid gap-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-sky-300" />
            <p className="text-sm font-semibold text-foreground">Atenção plena 5-4-3-2-1</p>
          </div>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">
            <li>5 coisas que você pode ver.</li>
            <li>4 que pode tocar.</li>
            <li>3 que pode ouvir.</li>
            <li>2 que pode cheirar.</li>
            <li>1 sabor que pode sentir.</li>
          </ul>
        </div>

        <Link
          to="/diario/$entryId"
          params={{ entryId: "novo" }}
          className="rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/50"
        >
          <p className="text-sm font-semibold text-foreground">Registro emocional</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Escrever sobre o que sentiu também é uma forma de acalmar.
          </p>
        </Link>

        <div className="rounded-2xl border border-dashed border-border/70 p-4">
          <p className="text-sm font-semibold text-foreground">Sons da natureza</p>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">
            Conteúdo demonstrativo — o áudio ainda não está disponível nesta versão.
          </p>
        </div>
      </div>
    </div>
  );
}