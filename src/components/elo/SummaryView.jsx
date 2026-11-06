import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

function Section({ title, items }) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-accent">{title}</p>
      <ul className="space-y-1.5">
        {list.map((item, index) => (
          <li key={index} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SummaryView({ session, showPeriod = true }) {
  if (!session) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-accent">
          <Sparkles className="mr-1 h-3 w-3" />
          Resumo por IA
        </Badge>
        {session.generation_mode === "demonstrativo" && (
          <Badge variant="outline" className="border-destructive/50 text-destructive">
            Modo demonstrativo
          </Badge>
        )}
        {showPeriod && session.period_label && (
          <span className="text-xs text-muted-foreground">Período: {session.period_label}</span>
        )}
      </div>

      {session.general_summary && (
        <p className="rounded-xl bg-secondary/70 p-3.5 text-sm leading-relaxed text-foreground/90">
          {session.general_summary}
        </p>
      )}

      <Section title="Principais acontecimentos" items={session.important_events} />
      <Section title="Emoções relatadas" items={session.reported_emotions} />
      <Section title="Situações recorrentes" items={session.recurring_topics} />
      <Section title="Aspectos positivos" items={session.positive_events} />
      <Section title="Preocupações mencionadas" items={session.concerns} />
      <Section title="Possíveis assuntos para a próxima sessão" items={session.discussion_topics} />

      <p className="border-t border-border/60 pt-3 text-[0.68rem] leading-relaxed text-muted-foreground">
        Organização dos relatos do paciente gerada automaticamente. Não é laudo, diagnóstico ou
        avaliação clínica.
      </p>
    </div>
  );
}