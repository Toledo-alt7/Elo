import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

const HOUR = 60 * 60 * 1000;
const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();

async function profileOf(base44, userId) {
  const list = await base44.entities.Profile.filter({ user_id: userId });
  return list[0] ?? null;
}

async function currentLink(base44, userId) {
  const [asPatient, asProfessional] = await Promise.all([
    base44.entities.Link.filter({ patient_user_id: userId }),
    base44.entities.Link.filter({ professional_user_id: userId }),
  ]);
  const live = [...asPatient, ...asProfessional].filter((l) => l.status !== "ended");
  return live.sort((a, b) => (a.created_date < b.created_date ? 1 : -1))[0] ?? null;
}

async function activeLinkBetween(base44, professionalId, patientId) {
  const links = await base44.entities.Link.filter({
    professional_user_id: professionalId,
    patient_user_id: patientId,
    status: "active",
  });
  return links[0] ?? null;
}

/* ------------------------------- perfil -------------------------------- */

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const profile = await profileOf(base44, context.user.id);
    if (!profile) return null;
    return { ...profile, link: await currentLink(base44, context.user.id) };
  });

export const saveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      role: z.enum(["patient", "professional"]),
      full_name: z.string().min(2),
      phone: z.string().optional(),
      professional_registration: z.string().optional(),
      specialty: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const existing = await profileOf(base44, context.user.id);
    const payload = {
      user_id: context.user.id,
      full_name: data.full_name,
      role: data.role,
      phone: data.phone || "",
      onboarded: true,
    };
    if (data.role === "professional") {
      payload.professional_registration = data.professional_registration || "";
      payload.specialty = data.specialty || "";
      payload.verification_status = existing?.verification_status || "pending";
      payload.invite_code = existing?.invite_code || code();
    }
    if (existing) return base44.entities.Profile.update(existing.id, payload);
    return base44.entities.Profile.create(payload);
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      full_name: z.string().min(2).optional(),
      phone: z.string().optional(),
      professional_registration: z.string().optional(),
      specialty: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const profile = await profileOf(base44, context.user.id);
    if (!profile) throw new Error("Perfil não encontrado");
    return base44.entities.Profile.update(profile.id, data);
  });

export const verifyProfessional = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const profile = await profileOf(base44, context.user.id);
    if (!profile || profile.role !== "professional") throw new Error("Apenas profissionais");
    return base44.entities.Profile.update(profile.id, { verification_status: "verified" });
  });

/* -------------------------------- vínculo ------------------------------- */

export const requestLink = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ invite_code: z.string().min(4) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const patient = await profileOf(base44, context.user.id);
    if (!patient) throw new Error("Crie seu perfil primeiro");
    const found = await base44.entities.Profile.filter({
      invite_code: data.invite_code.trim().toUpperCase(),
      role: "professional",
    });
    const professional = found[0];
    if (!professional) throw new Error("Código não encontrado. Confira com seu terapeuta.");
    const already = await base44.entities.Link.filter({
      patient_user_id: context.user.id,
      professional_user_id: professional.user_id,
    });
    const live = already.find((l) => l.status !== "ended");
    if (live) return live;
    return base44.entities.Link.create({
      patient_user_id: context.user.id,
      patient_name: patient.full_name,
      professional_user_id: professional.user_id,
      professional_name: professional.full_name,
      status: "pending",
    });
  });

export const approveLink = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ linkId: z.string() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const link = await base44.entities.Link.get(data.linkId);
    if (link.professional_user_id !== context.user.id) throw new Error("Não autorizado");
    return base44.entities.Link.update(link.id, { status: "active" });
  });

export const endLink = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ linkId: z.string() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const link = await base44.entities.Link.get(data.linkId);
    if (link.professional_user_id !== context.user.id && link.patient_user_id !== context.user.id)
      throw new Error("Não autorizado");
    return base44.entities.Link.update(link.id, { status: "ended" });
  });

export const listMyLinks = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const [asPatient, asProfessional] = await Promise.all([
      base44.entities.Link.filter({ patient_user_id: context.user.id }),
      base44.entities.Link.filter({ professional_user_id: context.user.id }),
    ]);
    return [...asPatient, ...asProfessional].sort((a, b) => (a.created_date < b.created_date ? 1 : -1));
  });

export const listPatients = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const links = await base44.entities.Link.filter({ professional_user_id: context.user.id });
    const sessions = await base44.entities.AuroraSession.filter({ professional_user_id: context.user.id });
    const latest = {};
    for (const s of sessions) {
      if (s.status !== "finished") continue;
      if (!latest[s.patient_user_id] || latest[s.patient_user_id] < s.finished_at)
        latest[s.patient_user_id] = s.finished_at;
    }
    return links
      .map((l) => ({ ...l, last_summary_at: latest[l.patient_user_id] ?? null }))
      .sort((a, b) => (a.created_date < b.created_date ? 1 : -1));
  });

export const getPatientOverview = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ patientId: z.string() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const link = await activeLinkBetween(base44, context.user.id, data.patientId);
    if (!link) throw new Error("Vínculo não autorizado");
    const [sessions, notes, checkins] = await Promise.all([
      base44.entities.AuroraSession.filter({
        patient_user_id: data.patientId,
        professional_user_id: context.user.id,
        status: "finished",
      }),
      base44.entities.ClinicalNote.filter({
        patient_user_id: data.patientId,
        professional_user_id: context.user.id,
      }),
      base44.entities.EmotionCheckin.filter({ patient_user_id: data.patientId }),
    ]);
    const sortDesc = (a, b) => (a.created_date < b.created_date ? 1 : -1);
    return {
      link,
      sessions: sessions.sort(sortDesc),
      notes: notes.sort(sortDesc),
      checkins: checkins.sort(sortDesc).slice(0, 20),
    };
  });

/* --------------------------------- diário -------------------------------- */

export const listDiary = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ search: z.string().optional(), from: z.string().optional(), to: z.string().optional() }).optional())
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const query = { patient_user_id: context.user.id };
    if (data?.search) {
      query.$or = [
        { title: { $regex: data.search } },
        { content: { $regex: data.search } },
      ];
    }
    if (data?.from) query.occurred_at = { $gte: data.from };
    if (data?.to) query.occurred_at = { ...(query.occurred_at || {}), $lte: `${data.to}T23:59:59.999Z` };
    const entries = await base44.entities.DiaryEntry.filter(query);
    return entries.sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
  });

export const getDiaryEntry = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const entry = await base44.entities.DiaryEntry.get(data.id).catch((e) => {
      if (e?.status === 404) return null;
      throw e;
    });
    if (!entry || entry.patient_user_id !== context.user.id) return null;
    return entry;
  });

export const saveDiaryEntry = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string().optional(),
      title: z.string().optional(),
      content: z.string().min(1),
      emotion: z.string().optional(),
      intensity: z.number().min(1).max(5).optional(),
      tags: z.array(z.string()).optional(),
      occurred_at: z.string(),
      status: z.enum(["published", "draft"]).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const { id, ...payload } = data;
    if (id) {
      const existing = await base44.entities.DiaryEntry.get(id);
      if (existing.patient_user_id !== context.user.id) throw new Error("Não autorizado");
      return base44.entities.DiaryEntry.update(id, payload);
    }
    return base44.entities.DiaryEntry.create({ ...payload, patient_user_id: context.user.id });
  });

export const deleteDiaryEntry = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const entry = await base44.entities.DiaryEntry.get(data.id);
    if (entry.patient_user_id !== context.user.id) throw new Error("Não autorizado");
    await base44.entities.DiaryEntry.delete(data.id);
    return { ok: true };
  });

/* ------------------------------- emoções -------------------------------- */

export const saveCheckin = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ emotion: z.enum(["calmo", "ansioso", "esperancoso", "cansado"]), note: z.string().optional() }))
  .handler(async ({ data, context }) =>
    context.getBase44().entities.EmotionCheckin.create({
      patient_user_id: context.user.id,
      emotion: data.emotion,
      note: data.note || "",
    }),
  );

export const listCheckins = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const checkins = await base44.entities.EmotionCheckin.filter({ patient_user_id: context.user.id });
    return checkins.sort((a, b) => (a.created_date < b.created_date ? 1 : -1)).slice(0, 30);
  });

/* --------------------------------- Aurora -------------------------------- */

const AURORA_PERSONA = `Você é Aurora, assistente do aplicativo Elo, que ajuda pacientes a registrar o que viveram entre sessões de terapia.
Regras absolutas:
- Responda em português do Brasil, em no máximo 2 frases curtas.
- Acolha em uma frase, repetindo em poucas palavras o que a pessoa trouxe ("Entendi que...").
- Termine SEMPRE perguntando se ela já terminou de contar ou se quer acrescentar mais alguma coisa.
- Nunca dê conselhos, interpretações, diagnósticos, hipóteses clínicas ou sugestões de tratamento. Nunca mencione medicação.
- Nunca diga que é terapeuta. Você apenas organiza relatos para a próxima sessão.
- Se a pessoa relatar risco de vida, responda com acolhimento breve, diga que não é um canal de emergência e indique o CVV 188, mantendo no máximo 3 frases.`;

const SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    period_label: { type: "string" },
    general_summary: { type: "string" },
    important_events: { type: "array", items: { type: "string" } },
    reported_emotions: { type: "array", items: { type: "string" } },
    recurring_topics: { type: "array", items: { type: "string" } },
    positive_events: { type: "array", items: { type: "string" } },
    concerns: { type: "array", items: { type: "string" } },
    discussion_topics: { type: "array", items: { type: "string" } },
    main_topic: { type: "string" },
  },
  required: [
    "period_label",
    "general_summary",
    "important_events",
    "reported_emotions",
    "recurring_topics",
    "positive_events",
    "concerns",
    "discussion_topics",
    "main_topic",
  ],
};

function transcript(messages) {
  return messages
    .map((m) => `${m.sender === "patient" ? "Paciente" : "Aurora"}: ${m.content}`)
    .join("\n");
}

async function summarizeSession(base44, session, messages) {
  const patientMessages = messages.filter((m) => m.sender === "patient");
  const periodLabel = new Date(session.created_date).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  let result = null;
  let mode = "ai";
  try {
    result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      prompt: `Você organiza relatos de pacientes para o terapeuta que os acompanha. Leia a conversa abaixo e produza um resumo fiel.

${transcript(messages)}

Regras:
- Baseie cada informação exclusivamente no que o paciente relatou. Não invente fatos, emoções ou causas.
- Nunca faça diagnóstico, não afirme doenças, não prescreva nada, não produza avaliação clínica.
- Use linguagem como "O paciente relatou...", "Segundo os registros...", "Foi mencionado...".
- Se algo não foi mencionado, use a frase "Não houve relato sobre isso." no campo correspondente.
- period_label: a data do relato no formato DD/MM/AAAA (${periodLabel}).
- main_topic: um título curto (máx. 60 caracteres) do assunto principal, para o calendário.
- discussion_topics: assuntos que o paciente talvez queira conversar na próxima sessão, sempre como sugestão de conversa.`,
      response_json_schema: SUMMARY_SCHEMA,
    });
  } catch (error) {
    result = null;
  }
  if (!result || !result.general_summary) {
    mode = "demonstrativo";
    const joined = patientMessages.map((m) => m.content).join(" ");
    result = {
      period_label: periodLabel,
      general_summary: `Resumo demonstrativo gerado sem o serviço de IA. Segundo os registros, o paciente relatou: ${
        joined.slice(0, 400) || "nenhum relato registrado."
      }`,
      important_events: patientMessages.slice(0, 3).map((m) => m.content.slice(0, 120)),
      reported_emotions: ["Não foi possível extrair emoções no modo demonstrativo."],
      recurring_topics: ["Não houve relato sobre isso."],
      positive_events: ["Não houve relato sobre isso."],
      concerns: ["Não houve relato sobre isso."],
      discussion_topics: ["Retomar com o paciente os relatos desta conversa."],
      main_topic: (patientMessages[0]?.content || "Conversa com a Aurora").slice(0, 60),
    };
  }
  return { ...result, generation_mode: mode };
}

async function finishOne(base44, session) {
  const messages = await base44.entities.AuroraMessage.filter({ session_id: session.id });
  const ordered = messages.sort((a, b) => (a.created_date < b.created_date ? -1 : 1));
  const summary = await summarizeSession(base44, session, ordered);
  const finished = await base44.entities.AuroraSession.update(session.id, {
    status: "finished",
    finished_at: new Date().toISOString(),
    ...summary,
    topic_date: new Date(session.created_date).toISOString().slice(0, 10),
  });
  await base44.entities.CalendarTopic.create({
    patient_user_id: session.patient_user_id,
    patient_name: session.patient_name || "",
    professional_user_id: session.professional_user_id || "",
    title: summary.main_topic,
    date: finished.topic_date,
    session_id: session.id,
  });
  return finished;
}

export const startAuroraSession = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const profile = await profileOf(base44, context.user.id);
    const link = await currentLink(base44, context.user.id);
    const session = await base44.entities.AuroraSession.create({
      patient_user_id: context.user.id,
      patient_name: profile?.full_name || "",
      professional_user_id: link?.status === "active" ? link.professional_user_id : "",
      status: "open",
      last_activity_at: new Date().toISOString(),
      generation_mode: "ai",
    });
    const greeting = await base44.entities.AuroraMessage.create({
      session_id: session.id,
      patient_user_id: context.user.id,
      sender: "aurora",
      content:
        "Oi! Eu sou a Aurora. Pode me contar o que aconteceu desde a sua última sessão — do jeito que vier. Quando terminar, é só me avisar.",
    });
    return { session, messages: [greeting] };
  });

export const getAuroraThread = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ sessionId: z.string() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const session = await base44.entities.AuroraSession.get(data.sessionId);
    if (session.patient_user_id !== context.user.id) throw new Error("Não autorizado");
    const messages = await base44.entities.AuroraMessage.filter({ session_id: session.id });
    return { session, messages: messages.sort((a, b) => (a.created_date < b.created_date ? -1 : 1)) };
  });

export const getOpenSession = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const sessions = await base44.entities.AuroraSession.filter({
      patient_user_id: context.user.id,
      status: "open",
    });
    if (!sessions.length) return null;
    const session = sessions.sort((a, b) => (a.created_date < b.created_date ? 1 : -1))[0];
    const messages = await base44.entities.AuroraMessage.filter({ session_id: session.id });
    return { session, messages: messages.sort((a, b) => (a.created_date < b.created_date ? -1 : 1)) };
  });

export const sendAuroraMessage = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ sessionId: z.string(), content: z.string().min(1).max(4000) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const session = await base44.entities.AuroraSession.get(data.sessionId);
    if (session.patient_user_id !== context.user.id) throw new Error("Não autorizado");
    if (session.status !== "open") throw new Error("Esta conversa já foi encerrada");

    const patientMessage = await base44.entities.AuroraMessage.create({
      session_id: session.id,
      patient_user_id: context.user.id,
      sender: "patient",
      content: data.content,
    });

    const history = await base44.entities.AuroraMessage.filter({ session_id: session.id });
    const ordered = history.sort((a, b) => (a.created_date < b.created_date ? -1 : 1));
    let reply =
      "Entendi o que você trouxe. Você já terminou de contar, ou quer acrescentar mais alguma coisa?";
    try {
      const text = await base44.asServiceRole.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `${AURORA_PERSONA}\n\nConversa até agora:\n${transcript(ordered.slice(-12))}\n\nResponda à última mensagem do paciente seguindo as regras.`,
      });
      if (typeof text === "string" && text.trim()) reply = text.trim().slice(0, 400);
    } catch (error) {
      // mantém a resposta padrão quando o provedor de IA não responde
    }

    const auroraMessage = await base44.entities.AuroraMessage.create({
      session_id: session.id,
      patient_user_id: context.user.id,
      sender: "aurora",
      content: reply,
    });
    await base44.entities.AuroraSession.update(session.id, { last_activity_at: new Date().toISOString() });
    return { messages: [patientMessage, auroraMessage] };
  });

export const finishAuroraSession = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ sessionId: z.string() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const session = await base44.entities.AuroraSession.get(data.sessionId);
    if (session.patient_user_id !== context.user.id) throw new Error("Não autorizado");
    if (session.status === "finished") return session;
    return finishOne(base44, session);
  });

export const closeStaleSessions = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const sessions = await base44.entities.AuroraSession.filter({
      patient_user_id: context.user.id,
      status: "open",
    });
    const limit = Date.now() - HOUR;
    let closed = 0;
    for (const session of sessions) {
      const last = new Date(session.last_activity_at || session.created_date).getTime();
      if (last <= limit) {
        await finishOne(base44, session);
        closed += 1;
      }
    }
    return { closed };
  });

export const listMySessions = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const sessions = await base44.entities.AuroraSession.filter({
      patient_user_id: context.user.id,
      status: "finished",
    });
    return sessions.sort((a, b) => (a.created_date < b.created_date ? 1 : -1));
  });

export const getProfessionalFeed = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const sessions = await base44.entities.AuroraSession.filter({
      professional_user_id: context.user.id,
      status: "finished",
    });
    return sessions.sort((a, b) => (a.created_date < b.created_date ? 1 : -1));
  });

export const addClinicalNote = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ patientId: z.string(), content: z.string().min(1).max(4000) }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const link = await activeLinkBetween(base44, context.user.id, data.patientId);
    if (!link) throw new Error("Vínculo não autorizado");
    return base44.entities.ClinicalNote.create({
      patient_user_id: data.patientId,
      professional_user_id: context.user.id,
      content: data.content,
    });
  });

/* ------------------------------- calendário ------------------------------ */

export const listTopics = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const [asProfessional, asPatient] = await Promise.all([
      base44.entities.CalendarTopic.filter({ professional_user_id: context.user.id }),
      base44.entities.CalendarTopic.filter({ patient_user_id: context.user.id }),
    ]);
    const seen = new Set();
    return [...asProfessional, ...asPatient]
      .filter((t) => (seen.has(t.id) ? false : seen.add(t.id)))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  });

export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const base44 = context.getBase44();
    const profile = await profileOf(base44, context.user.id);
    if (!profile || profile.role !== "patient") throw new Error("Disponível para pacientes");
    const link = await currentLink(base44, context.user.id);
    const professionalId = link?.status === "active" ? link.professional_user_id : "";

    const today = new Date();
    const at = (daysAgo, hour) => {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(hour, 0, 0, 0);
      return date.toISOString();
    };

    const entries = [
      {
        title: "Uma semana difícil na faculdade",
        content:
          "Hoje tive uma apresentação na faculdade e fiquei muito nervoso. Comecei a pensar que não conseguiria explicar meu projeto. Depois da apresentação, percebi que consegui fazer tudo melhor do que imaginava. Mesmo assim, fiquei preocupado com a próxima avaliação.",
        emotion: "ansioso",
        intensity: 4,
        tags: ["Estudos", "Ansiedade"],
        occurred_at: at(3, 21),
      },
      {
        title: "Consegui organizar o dia",
        content:
          "Acordei cedo e fiz uma lista do que precisava entregar. Consegui terminar duas das quatro tarefas, o que já foi melhor do que na semana passada.",
        emotion: "esperancoso",
        intensity: 3,
        tags: ["Conquistas", "Estudos"],
        occurred_at: at(2, 20),
      },
      {
        title: "Almoço em família",
        content:
          "Almocei com meus pais e foi tranquilo. Conversamos sobre coisas simples e eu ri bastante. Senti que estava mais leve do que nos últimos dias.",
        emotion: "calmo",
        intensity: 2,
        tags: ["Família"],
        occurred_at: at(1, 14),
      },
    ];

    await base44.entities.DiaryEntry.bulkCreate(
      entries.map((entry) => ({ ...entry, patient_user_id: context.user.id, status: "published" })),
    );

    const session = await base44.entities.AuroraSession.create({
      patient_user_id: context.user.id,
      patient_name: profile.full_name,
      professional_user_id: professionalId,
      status: "finished",
      last_activity_at: at(1, 22),
      finished_at: at(1, 23),
      period_label: new Date(at(3, 0)).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      general_summary:
        "Dados de demonstração. Durante a semana, o paciente relatou ansiedade relacionada às atividades acadêmicas e descreveu satisfação após conseguir concluir uma apresentação que inicialmente considerava difícil. Também mencionou um almoço tranquilo em família.",
      important_events: ["Apresentação de trabalho na faculdade.", "Almoço em família no fim de semana."],
      reported_emotions: ["Ansiedade antes da apresentação e satisfação após sua conclusão.", "Sensação de leveza após o almoço em família."],
      recurring_topics: ["Preocupação antecipatória com avaliações."],
      positive_events: ["Conseguiu concluir a apresentação melhor do que esperava."],
      concerns: ["Preocupação com a próxima avaliação."],
      discussion_topics: ["Conversar sobre a preocupação antecipatória relatada antes de apresentações."],
      main_topic: "Ansiedade antes de apresentação na faculdade",
      topic_date: at(3, 12).slice(0, 10),
      generation_mode: "demonstrativo",
    });

    await base44.entities.CalendarTopic.create({
      patient_user_id: context.user.id,
      patient_name: profile.full_name,
      professional_user_id: professionalId,
      title: "Ansiedade antes de apresentação na faculdade",
      date: at(3, 12).slice(0, 10),
      session_id: session.id,
    });

    return { ok: true, entries: entries.length };
  });

export const deleteTopic = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const topic = await base44.entities.CalendarTopic.get(data.id);
    if (topic.patient_user_id !== context.user.id && topic.professional_user_id !== context.user.id)
      throw new Error("Não autorizado");
    await base44.entities.CalendarTopic.delete(data.id);
    return { ok: true };
  });