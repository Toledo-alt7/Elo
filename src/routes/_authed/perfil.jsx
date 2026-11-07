import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Copy, LogOut, ShieldCheck, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/components/elo/ProfileProvider";
import { useAuth } from "@/lib/AuthContext";
import {
  approveLink,
  endLink,
  requestLink,
  seedDemoData,
  updateProfile,
  verifyProfessional,
} from "@/lib/server-fns";
import { formatDay, initials } from "@/lib/format";

export const Route = createFileRoute("/_authed/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Elo" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, refresh } = useProfile();
  const { user, logout } = useAuth();
  const saveProfile = useServerFn(updateProfile);
  const verify = useServerFn(verifyProfessional);
  const askLink = useServerFn(requestLink);
  const approve = useServerFn(approveLink);
  const unlink = useServerFn(endLink);
  const seedDemo = useServerFn(seedDemoData);
  const [seeding, setSeeding] = useState(false);

  const isProfessional = profile?.role === "professional";
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    professional_registration: profile?.professional_registration || "",
    specialty: profile?.specialty || "",
  });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await saveProfile({ data: form });
      await refresh();
      toast.success("Perfil atualizado.");
    } catch (error) {
      toast.error("Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  };

  const link = profile?.link;

  const submitCode = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      await askLink({ data: { invite_code: code } });
      await refresh();
      setCode("");
      toast.success("Solicitação enviada. Aguarde a aprovação do profissional.");
    } catch (error) {
      toast.error(error?.message || "Código não encontrado.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] text-lg font-semibold text-white">
          {initials(profile?.full_name)}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-lg font-semibold text-foreground">
            {profile?.full_name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="border-border text-muted-foreground">
              {isProfessional ? "Profissional" : "Paciente"}
            </Badge>
            {isProfessional && (
              <Badge
                variant="outline"
                className={
                  profile?.verification_status === "verified"
                    ? "border-success/50 text-success"
                    : "border-border text-muted-foreground"
                }
              >
                {profile?.verification_status === "verified" ? "Verificado" : "Verificação pendente"}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <p className="text-xs text-muted-foreground">{user?.email}</p>

      {!isProfessional && (
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Meu vínculo</h2>
          {link && link.status !== "ended" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/70 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{link.professional_name}</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    {link.status === "active" ? "Vínculo ativo" : "Aguardando aprovação"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={link.status === "active" ? "border-success/50 text-success" : "border-border text-muted-foreground"}
                >
                  {link.status === "active" ? "Ativo" : "Pendente"}
                </Badge>
              </div>
              {link.status === "active" && (
                <button
                  type="button"
                  onClick={async () => {
                    await unlink({ data: { linkId: link.id } });
                    await refresh();
                    toast.success("Vínculo encerrado.");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-destructive"
                >
                  <UserRoundX className="h-3.5 w-3.5" /> Encerrar vínculo
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Digite o código de convite do seu terapeuta para solicitar vínculo.
              </p>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="CÓDIGO"
                  maxLength={8}
                />
                <Button onClick={submitCode} disabled={busy} className="rounded-full px-5">
                  Solicitar
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {isProfessional && (
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Código de convite</h2>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/70 p-3">
            <p className="font-mono text-lg tracking-[0.2em] text-accent">{profile?.invite_code}</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(profile?.invite_code || "");
                toast.success("Código copiado.");
              }}
              className="rounded-full p-2 text-muted-foreground hover:bg-card hover:text-foreground"
              aria-label="Copiar código"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
            Envie este código ao paciente. Ele solicita o vínculo e você aprova em Pacientes.
          </p>
          {profile?.verification_status !== "verified" && (
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={async () => {
                await verify();
                await refresh();
                toast.success("Verificação aprovada (modo demonstração).");
              }}
            >
              <ShieldCheck className="mr-2 h-4 w-4" /> Aprovar verificação (demonstração)
            </Button>
          )}
        </section>
      )}

      <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Dados do perfil</h2>
        <form onSubmit={save} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input id="full_name" value={form.full_name} onChange={update("full_name")} />
          </div>
          {isProfessional && (
            <>
              <div className="space-y-2">
                <Label htmlFor="registration">Registro profissional</Label>
                <Input
                  id="registration"
                  value={form.professional_registration}
                  onChange={update("professional_registration")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Abordagem</Label>
                <Input id="specialty" value={form.specialty} onChange={update("specialty")} />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={form.phone} onChange={update("phone")} />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-full py-5 text-sm font-semibold">
            {busy ? "Salvando…" : "Salvar alterações"}
          </Button>
        </form>
      </section>

      {!isProfessional && (
        <section className="space-y-3 rounded-2xl border border-dashed border-border/70 p-4">
          <h2 className="text-sm font-semibold text-foreground">Modo demonstração</h2>
          <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
            Carrega registros de exemplo e um resumo marcado como demonstrativo, para testar o fluxo
            na hackathon sem depender de dados reais.
          </p>
          <Button
            variant="outline"
            disabled={seeding}
            className="w-full rounded-full"
            onClick={async () => {
              setSeeding(true);
              try {
                await seedDemo();
                toast.success("Dados de demonstração carregados.");
              } catch (error) {
                toast.error("Não foi possível carregar os dados agora.");
              } finally {
                setSeeding(false);
              }
            }}
          >
            {seeding ? "Carregando…" : "Carregar dados de demonstração"}
          </Button>
        </section>
      )}

      <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Privacidade e segurança</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Seu diário é privado. Sua terapeuta recebe apenas os resumos organizados pela Aurora.
        </p>
        <Link to="/forgot-password" className="block text-xs font-medium text-accent underline-offset-4 hover:underline">
          Alterar minha senha
        </Link>
      </section>

      <Button variant="outline" onClick={() => logout()} className="w-full rounded-full py-5 text-sm">
        <LogOut className="mr-2 h-4 w-4" /> Sair da conta
      </Button>

      <p className="pb-2 text-center text-[0.65rem] leading-relaxed text-muted-foreground">
        O Elo organiza relatos e não substitui acompanhamento profissional.
        {" "}Em crise, ligue 188 (CVV).
      </p>
    </div>
  );
}