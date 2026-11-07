import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listDiary } from "@/lib/server-fns";
import { EMOTION_LABELS, formatDay } from "@/lib/format";

export const Route = createFileRoute("/_authed/diario/")({
  head: () => ({ meta: [{ title: "Meu Diário — Elo" }] }),
  component: DiaryPage,
});

function DiaryPage() {
  const fetchEntries = useServerFn(listDiary);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async (query = {}) => {
    setLoading(true);
    try {
      const result = await fetchEntries({ data: query });
      setEntries(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const applyFilters = (event) => {
    event.preventDefault();
    load({ search: search || undefined, from: from || undefined, to: to || undefined });
  };

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Meu Diário</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Um espaço seguro para registrar o que importa.
          </p>
        </div>
        <Link
          to="/diario/$entryId"
          params={{ entryId: "novo" }}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Novo
        </Link>
      </header>

      <form onSubmit={applyFilters} className="space-y-2.5 rounded-2xl border border-border/70 bg-card p-3.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar nos seus registros"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="De" />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="Até" />
          <button
            type="submit"
            className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground/90 hover:bg-secondary"
          >
            Filtrar
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando registros…</p>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center">
          <p className="text-sm font-medium text-foreground">Nenhum registro encontrado</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Comece escrevendo como foi o seu dia — leva dois minutos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              to="/diario/$entryId"
              params={{ entryId: entry.id }}
              className="block rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold leading-snug text-foreground">
                  {entry.title || "Registro sem título"}
                </p>
                <span className="shrink-0 text-[0.68rem] text-muted-foreground">
                  {formatDay(entry.occurred_at)}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {entry.content}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {entry.status === "draft" && (
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    Rascunho
                  </Badge>
                )}
                {entry.emotion && entry.emotion !== "sem_emocao" && (
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-accent">
                    {EMOTION_LABELS[entry.emotion] || entry.emotion}
                  </Badge>
                )}
                {entry.intensity ? (
                  <span className="text-[0.65rem] text-muted-foreground">Intensidade {entry.intensity}/5</span>
                ) : null}
                {(entry.tags || []).slice(0, 2).map((tag) => (
                  <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}