import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import TopicsCalendar from "@/components/elo/TopicsCalendar";
import { listTopics } from "@/lib/server-fns";

export const Route = createFileRoute("/_authed/agenda")({
  head: () => ({ meta: [{ title: "Agenda — Elo" }] }),
  component: AgendaPage,
});

function AgendaPage() {
  const fetchTopics = useServerFn(listTopics);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics()
      .then(setTopics)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Agenda</h1>
        <p className="text-sm text-muted-foreground">
          Cada conversa com a Aurora vira um tópico no dia em que aconteceu.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando tópicos…</p>
      ) : (
        <TopicsCalendar topics={topics} />
      )}

      <p className="rounded-2xl bg-secondary/60 p-4 text-[0.7rem] leading-relaxed text-muted-foreground">
        Os tópicos são gerados automaticamente a partir do assunto principal de cada conversa. Esta
        agenda não faz agendamento de sessões.
      </p>
    </div>
  );
}