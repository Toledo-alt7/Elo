import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { HeartHandshake, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/elo/Logo";
import { useProfile } from "@/components/elo/ProfileProvider";
import { saveOnboarding } from "@/lib/server-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/onboarding")({ component: OnboardingPage });

const ROLES = [
  { key: "patient", label: "Sou paciente", hint: "Quero registrar meu dia e conversar com a Aurora", icon: HeartHandshake },
  { key: "professional", label: "Sou profissional", hint: "Acompanho pacientes e recebo resumos autorizados", icon: Stethoscope },
];

function OnboardingPage() {
  const { refresh } = useProfile();
  const navigate = useNavigate();
  const save = useServerFn(saveOnboarding);
  const [role, setRole] = useState("patient");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    professional_registration: "",
    specialty: "",
  });
  const [saving, setSaving] = useState(false);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (form.full_name.trim().length < 2) {
      toast.error("Informe seu nome completo.");
      return;
    }
    if (role === "professional" && !form.professional_registration.trim()) {
      toast.error("Informe seu registro profissional.");
      return;
    }
    setSaving(true);
    try {
      await save({ data: { role, ...form } });
      await refresh();
      navigate({ to: "/inicio", replace: true });
    } catch (error) {
      toast.error("Não foi possível salvar seu perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-3 pt-2">
        <Logo />
        <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">
          Vamos criar o seu espaço
        </h1>
        <p className="text-sm text-muted-foreground">
          Escolha como você vai usar o Elo. Isso define o que você vê e o que pode acessar.
        </p>
      </div>

      <div className="grid gap-3">
        {ROLES.map(({ key, label, hint, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setRole(key)}
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
              role === key
                ? "border-primary bg-primary/12 shadow-[0_10px_30px_-18px_hsl(var(--primary))]"
                : "border-border/70 bg-card hover:border-primary/50",
            )}
          >
            <span className="mt-0.5 rounded-xl bg-secondary p-2 text-accent">
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{hint}</span>
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome completo</Label>
          <Input id="full_name" value={form.full_name} onChange={update("full_name")} placeholder="Como devemos te chamar" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone (opcional)</Label>
          <Input id="phone" value={form.phone} onChange={update("phone")} placeholder="(11) 90000-0000" />
        </div>

        {role === "professional" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="registration">Registro profissional (CRP/CRM)</Label>
              <Input
                id="registration"
                value={form.professional_registration}
                onChange={update("professional_registration")}
                placeholder="CRP 00/000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Abordagem profissional</Label>
              <Input
                id="specialty"
                value={form.specialty}
                onChange={update("specialty")}
                placeholder="Terapia cognitivo-comportamental"
              />
            </div>
            <p className="rounded-xl bg-secondary/60 p-3 text-[0.7rem] leading-relaxed text-muted-foreground">
              No Elo, contas profissionais passam por uma etapa de verificação antes de receber
              resumos. Nesta demonstração, a liberação é feita na tela de perfil.
            </p>
          </>
        )}

        <Button type="submit" disabled={saving} className="w-full rounded-full py-6 text-sm font-semibold">
          {saving ? "Salvando..." : "Criar meu espaço"}
        </Button>
      </form>
    </div>
  );
}