import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, ArrowRight, BadgeCheck, MessagesSquare, Users } from "lucide-react";
import { getProfessionalFeed, listPatients } from "@/lib/server-fns";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export default function ProfessionalHome({ profile }) {
  const fetchPatients = useServerFn(listPatients);
  const fetchFeed = useServerFn(getProfessionalFeed);
  const [links, setLinks] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchPatients(), fetchFeed()])
      .then(([patientLinks, summaries]) => {
        if (!alive) return;
        setLinks(patientLinks);
        setFeed(summaries);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const active = links.filter((l) => l.status === "active");
  const pending = links.filter((l) => l.status === "pending");
  const firstName = profile?.full_name?.split(" ").slice(0, 2).join(" ") ?? "";

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bem-vindo</p>
        <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">
          {firstName}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{profile?.professional_registration || "Registro não informado"}</span>
          <Badge
            variant="outline"
            className={
              profile?.verification_status === "verified"
                ? "border-success/50 text-success"
                : "border-border text-muted-foreground"
            }
          >
            <BadgeCheck className="mr-1 h-3 w-3" />
            {profile?.verification_status === "verified" ? "Verificado" : "Verificação pendente"}
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Pacientes", value: active.length, icon: Users },
          { label: "Solicitações", value: pending.length, icon: AlertCircle },
          { label: "Resumos", value: feed.length, icon: MessagesSquare },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border/70 bg-card p-3">
            <Icon className="h-4 w-4 text-accent" />
            <p className="mt-2 text-xl font-semibold text-foreground">{loading ? "—" : value}</p>
            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <Link
          to="/pacientes"
          className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4"
        >
          <AlertCircle className="h-5 w-5 text-accent" />
          <span className="flex-1 text-xs leading-relaxed text-foreground/90">
            {pending.length === 1
              ? "Você tem 1 solicitação de vínculo aguardando aprovação."
              : `Você tem ${pending.length} solicitações de vínculo aguardando aprovação.`}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Resumos da Aurora</h2>
          <Link to="/resumos" className="text-xs font-medium text-accent">
            Ver todos
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : feed.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 p-4 text-sm leading-relaxed text-muted-foreground">
            Nenhum resumo recebido ainda. Quando um paciente encerrar uma conversa com a Aurora, o
            resumo aparece aqui.
          </p>
        ) : (
          feed.slice(0, 3).map((session) => (
            <Link
              key={session.id}
              to="/resumos"
              className="block rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{session.patient_name || "Paciente"}</p>
                <span className="text-[0.68rem] text-muted-foreground">
                  {formatDateTime(session.finished_at || session.created_date)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {session.general_summary}
              </p>
            </Link>
          ))
        )}
      </section>

      <p className="rounded-2xl bg-secondary/60 p-4 text-[0.7rem] leading-relaxed text-muted-foreground">
        Os resumos organizam relatos do paciente. Eles não são laudos, diagnósticos ou avaliações
        clínicas.
      </p>
    </div>
  );
}