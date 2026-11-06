import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { CloudRain, Heart, Leaf, Moon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { saveCheckin } from "@/lib/server-fns";

const EMOTIONS = [
  { key: "calmo", label: "Calmo", icon: Leaf, className: "text-sky-300" },
  { key: "ansioso", label: "Ansioso", icon: CloudRain, className: "text-rose-300" },
  { key: "esperancoso", label: "Esperançoso", icon: Heart, className: "text-violet-300" },
  { key: "cansado", label: "Cansado", icon: Moon, className: "text-slate-300" },
];

export default function EmotionCheckin() {
  const save = useServerFn(saveCheckin);
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const choose = async (emotion) => {
    setSelected(emotion);
    setSaving(true);
    try {
      await save({ data: { emotion } });
      toast.success("Registrado. Obrigado por se observar hoje.");
    } catch (error) {
      toast.error("Não foi possível registrar agora.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-foreground">Como você está agora?</h2>
        <span className="text-[0.68rem] text-muted-foreground">Check-in emocional</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {EMOTIONS.map(({ key, label, icon: Icon, className }) => (
          <button
            key={key}
            type="button"
            disabled={saving}
            onClick={() => choose(key)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 text-[0.7rem] font-medium transition-colors",
              selected === key
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border/70 bg-card text-muted-foreground hover:border-primary/50",
            )}
          >
            <Icon className={cn("h-5 w-5", className)} />
            {label}
          </button>
        ))}
      </div>
      {selected && (
        <button
          type="button"
          onClick={() => navigate({ to: "/diario/$entryId", params: { entryId: "novo" } })}
          className="text-xs font-medium text-accent underline-offset-4 hover:underline"
        >
          Quer escrever um pouco sobre isso? Abrir o diário →
        </button>
      )}
      <p className="text-[0.68rem] leading-relaxed text-muted-foreground">
        Um registro de como você se sente agora. Isoladamente, isto não é uma avaliação clínica.
      </p>
    </div>
  );
}