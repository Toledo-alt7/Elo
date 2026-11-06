import { createFileRoute } from "@tanstack/react-router";
import { useProfile } from "@/components/elo/ProfileProvider";
import PatientHome from "@/components/elo/PatientHome";
import ProfessionalHome from "@/components/elo/ProfessionalHome";

export const Route = createFileRoute("/_authed/inicio")({
  head: () => ({ meta: [{ title: "Início — Elo" }] }),
  component: HomePage,
});

function HomePage() {
  const { profile } = useProfile();
  return profile?.role === "professional" ? (
    <ProfessionalHome profile={profile} />
  ) : (
    <PatientHome profile={profile} />
  );
}