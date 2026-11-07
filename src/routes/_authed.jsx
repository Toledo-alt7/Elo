import { useEffect } from "react";
import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { AuthGateError, requireSignedIn } from "@/components/auth/AuthGate";
import { ProfileProvider, useProfile } from "@/components/elo/ProfileProvider";
import BottomNav from "@/components/elo/BottomNav";

export const Route = createFileRoute("/_authed")({
  ssr: false,
  beforeLoad: requireSignedIn,
  errorComponent: AuthGateError,
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <ProfileProvider>
      <Shell />
    </ProfileProvider>
  );
}

function Shell() {
  const { profile, loading } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const onOnboarding = location.pathname === "/onboarding";

  useEffect(() => {
    if (loading) return;
    if (!profile && !onOnboarding) navigate({ to: "/onboarding", replace: true });
    if (profile && onOnboarding) navigate({ to: "/inicio", replace: true });
  }, [loading, profile, onOnboarding, navigate]);

  if (loading || (!profile && !onOnboarding)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_65%_100%_at_50%_0%,hsl(var(--primary)/0.18),transparent_72%)]" />
      <div className="relative mx-auto w-full max-w-2xl px-5 pb-28 pt-6">
        <Outlet />
      </div>
      {profile && <BottomNav role={profile.role} />}
    </div>
  );
}