import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/components/elo/ProfileProvider";
import { approveLink, listPatients } from "@/lib/server-fns";
import { formatDateTime, initials } from "@/lib/format";

export const Route = createFileRoute("/_authed/pacientes/")({
  head: () => ({ meta: [{ title: "Pacientes — Elo" }] }),
  component: PatientsPage,
});

function PatientsPage() {
  const { profile } = useProfile();
  const fetchPatients = useServerFn(listPatients);
  const approve = useServerFn(approveLink);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    const result = await fetchPatients();
    setLinks(result);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (profile?.role !== "professional") {
    return (
      <p className="pt-6 text-sm leading-relaxed text-muted-foreground">
        Esta área é exclusiva de profissionais.
      </p>
    );
  }

  const term = search.trim().toLowerCase();
  const visible = links.filter((link) => link.patient_name?.toLowerCase().includes(term));
  const pending = visible.filter((link) => link.status === "pending");
  const active = visible.filter((link) => link.status === "active");

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Meus pacientes</h1>
        <p className="text-sm text-muted-foreground">
          Você vê apenas pacientes com vínculo autorizado.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar por nome"
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Solicitações de vínculo
              </h2>
              {pending.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-3.5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/25 text-xs font-semibold text-foreground">
                    {initials(link.patient_name)}
                  </span>
                  <p className="flex-1 text-sm font-medium text-foreground">{link.patient_name}</p>
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={async () => {
                      await approve({ data: { linkId: link.id } });
                      toast.success("Vínculo aprovado.");
                      load();
                    }}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" /> Aprovar
                  </Button>
                </div>
              ))}
            </section>
          )}

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vínculos ativos
            </h2>
            {active.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/70 p-4 text-sm leading-relaxed text-muted-foreground">
                Nenhum paciente vinculado ainda. Compartilhe seu código de convite, disponível no
                seu perfil.
              </p>
            ) : (
              active.map((link) => (
                <Link
                  key={link.id}
                  to="/pacientes/$patientId"
                  params={{ patientId: link.patient_user_id }}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 transition-colors hover:border-primary/50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] text-xs font-semibold text-white">
                    {initials(link.patient_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{link.patient_name}</p>
                    <p className="text-[0.7rem] text-muted-foreground">
                      {link.last_summary_at
                        ? `Último resumo em ${formatDateTime(link.last_summary_at)}`
                        : "Nenhum resumo recebido"}
                    </p>
                  </div>
                  {link.last_summary_at && (
                    <Badge variant="outline" className="border-accent/40 text-accent">
                      Novo
                    </Badge>
                  )}
                </Link>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}