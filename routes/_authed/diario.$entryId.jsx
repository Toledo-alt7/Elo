import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteDiaryEntry, getDiaryEntry, saveDiaryEntry } from "@/lib/server-fns";
import { EMOTION_LABELS, TAGS } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/diario/$entryId")({
  head: () => ({ meta: [{ title: "Registro — Elo" }] }),
  component: DiaryEntryPage,
});

const EMOTIONS = ["calmo", "ansioso", "esperancoso", "cansado", "triste", "grato", "irritado"];

const splitDate = (iso) => {
  const date = iso ? new Date(iso) : new Date();
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return { day, time };
};

function DiaryEntryPage() {
  const { entryId } = Route.useParams();
  const isNew = entryId === "novo";
  const navigate = useNavigate();
  const loadEntry = useServerFn(getDiaryEntry);
  const save = useServerFn(saveDiaryEntry);
  const remove = useServerFn(deleteDiaryEntry);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    emotion: "",
    intensity: 0,
    tags: [],
    ...splitDate(),
  });

  useEffect(() => {
    if (isNew) return;
    loadEntry({ data: { id: entryId } }).then((entry) => {
      if (!entry) {
        toast.error("Registro não encontrado.");
        navigate({ to: "/diario" });
        return;
      }
      setForm({
        title: entry.title || "",
        content: entry.content || "",
        emotion: entry.emotion || "",
        intensity: entry.intensity || 0,
        tags: entry.tags || [],
        ...splitDate(entry.occurred_at),
        status: entry.status,
      });
      setLoading(false);
    });
  }, [entryId]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const toggleTag = (tag) =>
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((item) => item !== tag) : [...prev.tags, tag],
    }));

  const persist = async (status) => {
    if (!form.content.trim()) {
      toast.error("Escreva o que aconteceu antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      await save({
        data: {
          id: isNew ? undefined : entryId,
          title: form.title,
          content: form.content,
          emotion: form.emotion || undefined,
          intensity: form.intensity || undefined,
          tags: form.tags,
          occurred_at: new Date(`${form.day}T${form.time}:00`).toISOString(),
          status,
        },
      });
      toast.success(status === "draft" ? "Rascunho salvo." : "Registro salvo.");
      navigate({ to: "/diario" });
    } catch (error) {
      toast.error("Não foi possível salvar o registro.");
    } finally {
      setSaving(false);
    }
  };

  const destroy = async () => {
    await remove({ data: { id: entryId } });
    toast.success("Registro excluído.");
    navigate({ to: "/diario" });
  };

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/diario" })}
          className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="font-heading text-lg font-semibold text-foreground">
            {isNew ? "Novo registro" : "Editar registro"}
          </h1>
          <p className="text-xs text-muted-foreground">Privado por padrão. Só você vê este diário.</p>
        </div>
        {!isNew && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Excluir registro"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      {confirmDelete && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-foreground">
          Excluir este registro?
          <span className="flex gap-2">
            <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full px-3 py-1 hover:bg-secondary">
              Cancelar
            </button>
            <button type="button" onClick={destroy} className="rounded-full bg-destructive px-3 py-1 font-semibold text-destructive-foreground">
              Excluir
            </button>
          </span>
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="day">Data</Label>
            <Input id="day" type="date" value={form.day} onChange={set("day")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Horário</Label>
            <Input id="time" type="time" value={form.time} onChange={set("time")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Título (opcional)</Label>
          <Input id="title" value={form.title} onChange={set("title")} placeholder="Uma semana difícil na faculdade" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">O que aconteceu?</Label>
          <Textarea
            id="content"
            value={form.content}
            onChange={set("content")}
            rows={7}
            placeholder="Escreva do jeito que vier. Ninguém além de você e, se quiser, sua terapeuta terá acesso."
          />
        </div>

        <div className="space-y-2">
          <Label>Emoção predominante (opcional)</Label>
          <div className="flex flex-wrap gap-1.5">
            {EMOTIONS.map((emotion) => (
              <button
                key={emotion}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, emotion: prev.emotion === emotion ? "" : emotion }))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  form.emotion === emotion
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border/70 text-muted-foreground hover:border-primary/50",
                )}
              >
                {EMOTION_LABELS[emotion]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Intensidade emocional (1 a 5)</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, intensity: prev.intensity === level ? 0 : level }))}
                className={cn(
                  "h-9 flex-1 rounded-xl border text-xs font-semibold transition-colors",
                  form.intensity >= level
                    ? "border-primary bg-primary/25 text-foreground"
                    : "border-border/70 text-muted-foreground",
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tags (opcional)</Label>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  form.tags.includes(tag)
                    ? "border-accent bg-accent/15 text-foreground"
                    : "border-border/70 text-muted-foreground hover:border-accent/50",
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={() => persist("published")}
          disabled={saving}
          className="flex-1 rounded-full py-6 text-sm font-semibold"
        >
          {saving ? "Salvando…" : "Salvar registro"}
        </Button>
        <Button
          onClick={() => persist("draft")}
          disabled={saving}
          variant="outline"
          className="rounded-full py-6 text-sm"
        >
          Salvar rascunho
        </Button>
      </div>
    </div>
  );
}