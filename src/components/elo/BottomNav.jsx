import { Link, useLocation } from "@tanstack/react-router";
import { CalendarDays, Home, MessagesSquare, NotebookPen, Sparkles, User, Users, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = {
  patient: [
    { to: "/inicio", label: "Início", icon: Home },
    { to: "/diario", label: "Diário", icon: NotebookPen },
    { to: "/aurora", label: "Aurora", icon: Sparkles },
    { to: "/calma", label: "Acalme-se", icon: Wind },
    { to: "/perfil", label: "Perfil", icon: User },
  ],
  professional: [
    { to: "/inicio", label: "Início", icon: Home },
    { to: "/pacientes", label: "Pacientes", icon: Users },
    { to: "/resumos", label: "Resumos", icon: MessagesSquare },
    { to: "/agenda", label: "Agenda", icon: CalendarDays },
    { to: "/perfil", label: "Perfil", icon: User },
  ],
};

export default function BottomNav({ role = "patient" }) {
  const location = useLocation();
  const items = NAV[role] ?? NAV.patient;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-[hsl(var(--background)/0.92)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-stretch justify-between px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[0.68rem] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_10px_hsl(var(--primary)/0.7)]")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}