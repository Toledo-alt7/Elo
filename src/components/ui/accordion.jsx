import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const iso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function TopicsCalendar({ topics = [] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(iso(today));

  const byDate = useMemo(() => {
    const map = {};
    for (const topic of topics) {
      if (!topic.date) continue;
      map[topic.date] = map[topic.date] || [];
      map[topic.date].push(topic);
    }
    return map;
  }, [topics]);

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const offset = first.getDay();
    const list = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1)
      list.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    return list;
  }, [cursor]);

  const selectedTopics = byDate[selected] || [];
  const shift = (delta) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold capitalize text-foreground">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </p>
          <button
            type="button"
            onClick={() => shift(1)}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase text-muted-foreground">
          {WEEKDAYS.map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((date, index) => {
            if (!date) return <span key={`empty-${index}`} />;
            const key = iso(date);
            const hasTopic = Boolean(byDate[key]);
            const isSelected = key === selected;
            const isToday = key === iso(today);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  "relative flex h-10 flex-col items-center justify-center rounded-xl text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-secondary",
                  !isSelected && isToday && "ring-1 ring-primary/60",
                )}
              >
                {date.getDate()}
                {hasTopic && (
                  <span
                    className={cn(
                      "absolute bottom-1 h-1 w-1 rounded-full",
                      isSelected ? "bg-primary-foreground" : "bg-accent",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {selected.split("-").reverse().join("/")}
        </p>
        {selectedTopics.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            Nenhum tópico neste dia.
          </p>
        ) : (
          selectedTopics.map((topic) => (
            <div key={topic.id} className="rounded-2xl border border-border/70 bg-card p-3.5">
              <p className="text-sm font-medium text-foreground">{topic.title}</p>
              {topic.patient_name && (
                <p className="mt-0.5 text-xs text-muted-foreground">{topic.patient_name}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}