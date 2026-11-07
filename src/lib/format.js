export function formatDay(value) {
  if (!value) return "";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  if (!day) return "";
  return `${day}/${month}/${year}`;
}

export function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export const EMOTION_LABELS = {
  calmo: "Calmo",
  ansioso: "Ansioso",
  esperancoso: "Esperançoso",
  cansado: "Cansado",
  triste: "Triste",
  grato: "Grato",
  irritado: "Irritado",
  sem_emocao: "Sem emoção definida",
};

export const TAGS = [
  "Família",
  "Trabalho",
  "Estudos",
  "Relacionamentos",
  "Ansiedade",
  "Conquistas",
  "Sono",
  "Outros",
];