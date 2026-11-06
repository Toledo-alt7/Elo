import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import SummaryView from "@/components/elo/SummaryView";
import { addClinicalNote, getPatientOverview } from "@/lib/server-fns";
import { EMOTION_LABELS, formatDateTime, formatDay, initials } from "@/lib/format";

export const Route = createFileRoute("/_authed/pacientes/$patientId")({
  head: () => ({ meta: [{ title: "Paciente — Elo" }] }),
  component: PatientDetailPage,
});

function PatientDetailPage() {
  const { patientId } = Route.useParams();
  const fetchOverview = useServerFn(getPatientOverview);
  const addNote = useServerFn(addClinicalNote);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [openSummary, setOpenSummary] = useState(null);

  const load = async () => {
    try {
      const overview = await fetchOverview({ data: { patientId } });
      setData(overview);
    } catch (err) {
      setError("Você não tem autorização para ver este paciente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (error)
    return (
      <div className="space-y-3 pt-6">
        <p className="text-sm text-foreground">{error}</p>
        <Link to="/pacientes" className="text-xs text-accent">
          Voltar para pacientes
        </Link>
      </div>
    );

  const name = data?.link?.patient_name || "Paciente";

  const submitNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await addNote({ data: { patientId, content: note } });
      setNote("");
      await load();
      toast.success("Anotação salva.");
    } catch (err) {
      toast.error("Não foi possível salvar a anotação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Link
          to="/pacientes"
          className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] text-sm font-semibold text-white">
          {initials(name)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-lg font-semibold text-foreground">{name}</h1>
          <p className="text-[0.7rem] text-muted-foreground">
            Vínculo ativo desde {formatDay(data?.link?.created_date)}
          </p>
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Check-ins emocionais recentes
        </h2>
        {data?.checkins?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {data.checkins.slice(0, 10).map((checkin) => (
              <span
                key={checkin.id}
                className="rounded-full border border-border/70 bg-card px-2.5 py-1 text-[0.68rem] text-foreground/90"
              >
                {EMOTION_LABELS[checkin.emotion] || checkin.emotion} · {formatDay(checkin.created_date)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum check-in registrado.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Resumos compartilhados
        </h2>
        {data?.sessions?.length ? (
          data.sessions.map((session) => (
            <Card key={session.id} className="border-border/70 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{session.main_topic}</p>
                  <p className="text-[0.68rem] text-muted-foreground">
                    {formatDateTime(session.finished_at || session.created_date)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenSummary(openSummary === session.id ? null : session.id)}
                  className="text-[0.7rem] font-medium text-accent"
                >
                  {openSummary === session.id ? "Fechar" : "Ver"}
                </button>
              </div>
              {openSummary === session.id ? (
                <div className="mt-3 border-t border-border/60 pt-3">
                  <SummaryView session={session} />
                </div>
              ) : (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {session.general_summary}
                </p>
              )}
            </Card>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            Nenhum resumo compartilhado ainda.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Anotações clínicas privadas
        </h2>
        <div className="space-y-2 rounded-2xl border border-border/70 bg-card p-3.5">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Anotação visível apenas para você."
          />
          <Button onClick={submitNote} disabled={saving} size="sm" className="rounded-full">
            <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar anotação
          </Button>
        </div>
        {data?.notes?.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border/70 bg-secondary/50 p-3.5">
            <p className="text-sm leading-relaxed text-foreground/90">{item.content}</p>
            <p className="mt-1.5 text-[0.65rem] text-muted-foreground">{formatDateTime(item.created_date)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}