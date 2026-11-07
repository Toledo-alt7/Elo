import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useProfile } from "@/components/elo/ProfileProvider";
import SummaryView from "@/components/elo/SummaryView";
import { getProfessionalFeed } from "@/lib/server-fns";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authed/resumos")({
  head: () => ({ meta: [{ title: "Resumos — Elo" }] }),
  component: SummariesPage,
});

function SummariesPage() {
  const { profile } = useProfile();
  const fetchFeed = useServerFn(getProfessionalFeed);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    fetchFeed()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  if (profile?.role !== "professional") {
    return (
      <p className="pt-6 text-sm leading-relaxed text-muted-foreground">
        Esta área reúne os resumos recebidos pelos profissionais.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Resumos da Aurora</h1>
        <p className="text-sm text-muted-foreground">
          O que seus pacientes relataram entre as sessões, organizado por data.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/70 p-5 text-sm leading-relaxed text-muted-foreground">
          Nenhum resumo recebido ainda. Quando um paciente encerrar uma conversa com a Aurora, o
          resumo aparece aqui automaticamente.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id} className="border-border/70 bg-card p-4">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 rounded-full bg-primary/20 p-1.5 text-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {session.patient_name || "Paciente"}
                    </p>
                    <span className="shrink-0 text-[0.65rem] text-muted-foreground">
                      {formatDateTime(session.finished_at || session.created_date)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.7rem] font-medium text-accent">{session.main_topic}</p>

                  {open === session.id ? (
                    <div className="mt-3 border-t border-border/60 pt-3">
                      <SummaryView session={session} />
                    </div>
                  ) : (
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {session.general_summary}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setOpen(open === session.id ? null : session.id)}
                    className="mt-2 text-[0.7rem] font-medium text-accent underline-offset-4 hover:underline"
                  >
                    {open === session.id ? "Recolher resumo" : "Abrir resumo completo"}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}