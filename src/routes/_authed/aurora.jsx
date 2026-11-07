import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, LifeBuoy, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/components/elo/ProfileProvider";
import SummaryView from "@/components/elo/SummaryView";
import {
  closeStaleSessions,
  finishAuroraSession,
  getOpenSession,
  listMySessions,
  sendAuroraMessage,
  startAuroraSession,
} from "@/lib/server-fns";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/aurora")({
  head: () => ({ meta: [{ title: "Aurora — Elo" }] }),
  component: AuroraPage,
});

const RISK = /(me matar|suic[ií]d|tirar minha vida|n[aã]o quero mais viver|me machucar|me cortar)/i;

function AuroraPage() {
  const { profile } = useProfile();
  const closeStale = useServerFn(closeStaleSessions);
  const getOpen = useServerFn(getOpenSession);
  const startSession = useServerFn(startAuroraSession);
  const sendMessage = useServerFn(sendAuroraMessage);
  const finishSession = useServerFn(finishAuroraSession);
  const fetchSessions = useServerFn(listMySessions);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState(null);
  const [risk, setRisk] = useState(false);
  const bottomRef = useRef(null);

  const load = async () => {
    const { closed } = await closeStale();
    if (closed > 0) {
      const sessions = await fetchSessions();
      if (sessions[0]) setResult(sessions[0]);
      toast.info("Sua conversa anterior foi encerrada e o resumo organizado.");
    }
    const open = await getOpen();
    setSession(open?.session ?? null);
    setMessages(open?.messages ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(async () => {
      const { closed } = await closeStale();
      if (closed > 0) {
        const sessions = await fetchSessions();
        setResult(sessions[0] ?? null);
        setSession(null);
        setMessages([]);
      }
    }, 60000);
    return () => clearInterval(id);
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const start = async () => {
    setLoading(true);
    setResult(null);
    const created = await startSession();
    setSession(created.session);
    setMessages(created.messages);
    setLoading(false);
  };

  const send = async () => {
    if (!text.trim() || !session) return;
    const content = text.trim();
    setText("");
    setSending(true);
    if (RISK.test(content)) setRisk(true);
    try {
      const { messages: created } = await sendMessage({ data: { sessionId: session.id, content } });
      setMessages((prev) => [...prev, ...created]);
    } catch (error) {
      toast.error("Não foi possível enviar agora.");
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const finish = async () => {
    setFinishing(true);
    try {
      const finished = await finishSession({ data: { sessionId: session.id } });
      setResult(finished);
      setSession(null);
      setMessages([]);
    } catch (error) {
      toast.error("Não foi possível organizar o resumo agora.");
    } finally {
      setFinishing(false);
    }
  };

  if (profile?.role === "professional") {
    return (
      <div className="space-y-3 pt-6">
        <h1 className="font-heading text-xl font-semibold text-foreground">Área da Aurora</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A Aurora conversa com os pacientes. Os resumos que ela organiza chegam para você em{" "}
          <Link to="/resumos" className="text-accent underline-offset-4 hover:underline">
            Resumos
          </Link>
          .
        </p>
      </div>
    );
  }

  if (loading) return <p className="pt-8 text-sm text-muted-foreground">Abrindo a Aurora…</p>;

  if (result) {
    return (
      <div className="space-y-5">
        <header className="flex items-center gap-3">
          <span className="rounded-full bg-primary/15 p-2 text-accent">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h1 className="font-heading text-lg font-semibold text-foreground">Resumo da conversa</h1>
            <p className="text-xs text-muted-foreground">{formatDateTime(result.finished_at)}</p>
          </div>
        </header>

        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <SummaryView session={result} />
        </div>

        <div className="rounded-2xl bg-secondary/60 p-4 text-xs leading-relaxed text-muted-foreground">
          {result.professional_user_id
            ? "Este resumo foi enviado para a sua terapeuta no Elo. Ela vê apenas este conteúdo, não o seu diário."
            : "Você ainda não tem uma terapeuta vinculada, então este resumo ficou privado com você. Para compartilhar, peça o código de convite no perfil."}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={start} className="rounded-full py-6 text-sm font-semibold">
            Nova conversa com a Aurora
          </Button>
          <Button asChild variant="outline" className="rounded-full py-6 text-sm">
            <Link to="/inicio">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-5">
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold text-foreground">Aurora</h1>
          <p className="text-sm text-muted-foreground">Sua assistente entre sessões.</p>
        </header>

        <div className="rounded-3xl border border-border/70 bg-card p-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-accent">
            <Sparkles className="h-3 w-3" /> Como funciona
          </span>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/90">
            <li>1. Você escreve o que aconteceu desde a última sessão.</li>
            <li>2. A Aurora acolhe e pergunta se você já terminou de contar.</li>
            <li>3. Se ficar 1 hora sem escrever, ela encerra e organiza o resumo.</li>
            <li>4. O resumo vai para o chat da sua terapeuta e vira um tópico no calendário.</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-secondary/60 p-4 text-xs leading-relaxed text-muted-foreground">
          A Aurora não é terapeuta e não faz diagnósticos. Ela apenas organiza o que você relatou.
          Em caso de risco imediato, ligue 188 (CVV) ou procure o serviço de emergência mais próximo.
        </div>

        <Button onClick={start} className="w-full rounded-full py-6 text-sm font-semibold">
          Iniciar conversa
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col">
      <header className="flex items-center gap-3 border-b border-border/60 pb-3">
        <Link
          to="/inicio"
          className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-primary/15 p-2 text-accent">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Aurora</p>
            <p className="text-[0.68rem] text-muted-foreground">Encerra após 1 hora sem mensagens</p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex gap-2", message.sender === "patient" ? "justify-end" : "justify-start")}
          >
            {message.sender === "aurora" && (
              <span className="mt-1 h-7 w-7 shrink-0 rounded-full bg-primary/20 p-1.5 text-accent">
                <Sparkles className="h-4 w-4" />
              </span>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                message.sender === "patient"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border/70 bg-card text-foreground/90",
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {sending && (
          <p className="text-xs text-muted-foreground">Aurora está ouvindo…</p>
        )}
        {risk && (
          <div className="flex gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs leading-relaxed text-foreground">
            <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <span>
              Se você está pensando em se machucar, procure ajuda agora: CVV 188 (ligação gratuita,
              24h) ou o serviço de emergência mais próximo (SAMU 192). O Elo não é monitorado em tempo
              real.
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-2 border-t border-border/60 pt-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Conte o que aconteceu…"
            className="resize-none"
          />
          <Button
            onClick={send}
            disabled={sending || !text.trim()}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
            aria-label="Enviar mensagem"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <button
          type="button"
          onClick={finish}
          disabled={finishing || messages.filter((m) => m.sender === "patient").length === 0}
          className="w-full text-center text-[0.7rem] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-40"
        >
          {finishing ? "Organizando o resumo…" : "Encerrar agora e organizar o resumo"}
        </button>
      </div>
    </div>
  );
}