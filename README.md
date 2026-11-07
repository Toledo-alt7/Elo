# Elo

**Conectando você ao cuidado que importa.**

Elo é um app de apoio emocional **entre sessões de terapia**. Durante a semana muita coisa acontece, e parte disso se perde até a próxima consulta. No Elo, o paciente registra o que sente, conversa com a **Aurora** (uma assistente de IA que só acolhe e organiza relatos) e o terapeuta recebe resumos estruturados, **apenas do que o paciente autorizar** por meio de um vínculo ativo.

> ⚠️ O Elo **não substitui** atendimento psicológico, psiquiátrico ou qualquer avaliação profissional. A IA organiza relatos: não diagnostica nem prescreve. Em crise ou risco imediato, ligue **188 (CVV)** ou procure o serviço de emergência mais próximo.

---

## Funcionalidades

### Para o paciente

| Área | Rota | O que faz |
| --- | --- | --- |
| Início | `/inicio` | Painel do paciente, com check-in rápido de emoção (calmo, ansioso, esperançoso, cansado). |
| Diário | `/diario`, `/diario/:entryId` | Registros privados com título, emoção, intensidade, tags e data. Podem ser rascunho ou publicados. |
| Aurora | `/aurora` | Conversa guiada com a Aurora para contar o que aconteceu. Ao encerrar, a conversa vira um resumo para a próxima sessão. |
| Resumos | `/resumos` | Histórico dos resumos gerados a partir das conversas encerradas. |
| Acalme-se | `/calma` | Exercícios de respiração guiada (4-7-8 e respiração quadrada). |
| Agenda | `/agenda` | Calendário com os temas principais de cada conversa. |
| Perfil | `/perfil` | Dados pessoais e vínculo com o terapeuta (via código de convite). |

### Para o profissional

| Área | Rota | O que faz |
| --- | --- | --- |
| Início | `/inicio` | Feed com os resumos recentes dos pacientes vinculados. |
| Pacientes | `/pacientes` | Lista de pacientes com vínculo ativo e data do último resumo. |
| Paciente | `/pacientes/:patientId` | Visão geral do paciente: resumos, check-ins de emoção recentes e **notas clínicas** privadas do profissional. |
| Agenda | `/agenda` | Temas de conversa dos pacientes organizados por data. |
| Perfil | `/perfil` | Registro profissional, especialidade e **código de convite** para os pacientes. |

### Fluxo principal

```
Cadastro → Onboarding (paciente ou profissional)
        → Paciente informa o código de convite do terapeuta → vínculo "pendente"
        → Profissional aprova → vínculo "ativo"
        → Paciente conversa com a Aurora → encerra (ou 1h de inatividade)
        → Resumo estruturado gerado por IA → aparece para o paciente e para o terapeuta
        → Tema principal entra na agenda
```

### Aurora: regras da assistente

A Aurora segue uma persona restrita (definida em `lib/server-fns.js`):

- responde em português do Brasil, em no máximo 2 frases curtas;
- acolhe repetindo o que a pessoa trouxe e pergunta se ela quer acrescentar algo;
- **nunca** dá conselhos, interpretações, diagnósticos ou fala de medicação;
- em caso de relato de risco de vida, diz que não é um canal de emergência e indica o CVV 188.

Ao encerrar uma conversa, um LLM gera um resumo fiel ao relato, com: resumo geral, eventos importantes, emoções relatadas, temas recorrentes, eventos positivos, preocupações, sugestões de assunto para a sessão e um título curto para a agenda. Se o serviço de IA falhar, o app gera um **resumo demonstrativo** sem IA (`generation_mode: "demonstrativo"`), e a experiência continua funcionando.

Para apresentações, `seedDemoData` cria dados de exemplo para um paciente.

---

## Stack

- **[Base44](https://docs.base44.com)**: backend (entidades, autenticação, integrações de IA, deploy)
- **[TanStack Start](https://tanstack.com/start)**: React 19, rotas por arquivo, server functions, SSR
- **Cloudflare Workers** (`workerd`) como runtime do servidor, via `@cloudflare/vite-plugin`
- **Vite**, **Tailwind CSS** e **shadcn/ui** (Radix)
- **TanStack Query**, **zod**, **date-fns**, **lucide-react**, **framer-motion**
- JavaScript/JSX puro (sem TypeScript)

---

## Modelo de dados

As entidades ficam em [`base44/entities/`](base44/entities/):

| Entidade | Descrição |
| --- | --- |
| `Profile` | Perfil do usuário: papel (`patient` / `professional`), nome, telefone, registro profissional, especialidade, status de verificação, código de convite. |
| `Link` | Vínculo paciente ↔ profissional (`pending` → `active` → `ended`). |
| `DiaryEntry` | Registro do diário: conteúdo, emoção, intensidade, tags, data, status. |
| `EmotionCheckin` | Check-in rápido de emoção com nota opcional. |
| `AuroraSession` | Conversa com a Aurora (`open` / `finished`) e o resumo gerado. |
| `AuroraMessage` | Mensagens da conversa (`patient` / `aurora`). |
| `CalendarTopic` | Tema principal de uma conversa, exibido na agenda. |
| `ClinicalNote` | Nota privada do profissional sobre um paciente. |
| `User` | Usuário da plataforma Base44 (`admin` / `user`). |

Toda a lógica de dados está em `lib/server-fns.js`. Cada server function exige usuário autenticado (`requireUser`), valida a entrada com zod e confere se o usuário tem permissão sobre o registro, ou seja, se é o dono ou tem vínculo ativo com o paciente.

---

## Como rodar localmente

Pré-requisitos: **Node.js 20+** e uma conta na Base44.

```bash
# 1. Instalar dependências
npm install

# 2. (Opcional) Instalar a CLI e as skills da Base44
npm install -g base44
npx skills add base44/skills

# 3. Vincular o projeto a um app Base44 (gera base44/.app.jsonc, que não é versionado)
base44 link

# 4. Servidor de desenvolvimento
npm run dev
```

### Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (Vite + `workerd`) |
| `npm run build` | Gera `dist/client`, `dist/server` e `.wrangler/deploy/config.json` |
| `npm run preview` | Pré-visualiza o build |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint com correção automática |

### Deploy

```bash
base44 deploy
```

Segredos são configurados com `base44 secrets set NOME` e lidos só no servidor via `secrets.get("NOME")` de `base44:runtime`. Nunca coloque segredos em variáveis `VITE_*`.

---

## Estrutura do projeto

O TanStack Start está configurado com `srcDirectory: "src"`, e todos os imports usam o alias `@/` → `src/`. A estrutura esperada é:

```
src/
├── routes/                 # páginas (rotas por arquivo)
│   ├── __root.jsx          # documento HTML + providers
│   ├── index.jsx           # landing page (/)
│   ├── login.jsx, register.jsx, forgot-password.jsx, reset-password.jsx, mfa.jsx
│   ├── _authed.jsx         # gate de login
│   ├── _authed/            # páginas que exigem sessão
│   └── api/                # server routes (HTTP)
├── lib/                    # server-fns, auth, IA, utilitários
├── api/base44Client.js     # cliente Base44 do navegador
├── hooks/
├── components/
│   ├── auth/               # telas de autenticação e MFA
│   ├── elo/                # componentes do Elo (home, check-in, agenda, resumo…)
│   └── ui/                 # shadcn/ui
├── index.css
├── router.jsx
├── server.js               # gerenciado pela Base44, não editar
└── start.js
base44/
├── config.jsonc
└── entities/               # esquemas das entidades
```

### ⚠️ Status atual do repositório

O repositório **ainda não compila** como está. Antes de rodar, é preciso corrigir:

1. **Pastas fora de `src/`:** `routes/`, `lib/`, `api/` e `hooks/` estão na raiz e devem ser movidas para dentro de `src/`.
2. **Nomes de arquivos divergentes dos imports:**
   - `src/components/auth/ForgotPassword.jsx` → `ForgotPasswordPage.jsx`
   - `src/components/auth/GoogleIcons.jsx` → `GoogleIcon.jsx`
   - `src/components/auth/ConsetPage.jsx` → `ConsentPage.jsx`
   - `src/components/ui/taxtrea.jsx` → `textarea.jsx`
   - outros componentes de UI com nomes digitados errado (`breadrumb`, `chackbox`, `collapsable`, `content-menu`) devem voltar aos nomes do shadcn (`breadcrumb`, `checkbox`, `collapsible`, `context-menu`)
3. **Arquivos faltando:** `src/components/DefaultCatchBoundary.jsx` e `src/components/NotFound.jsx`, que são importados por `__root.jsx`.

---

## Privacidade e segurança

- O diário é **privado por padrão**. O profissional só vê resumos e check-ins de pacientes com **vínculo ativo**.
- Notas clínicas só são visíveis para o profissional que as escreveu.
- Toda server function é um endpoint público. Por isso, cada uma valida autenticação, entrada e permissão no servidor, e não depende da interface para proteger os dados.
- Cabeçalhos de requisição nunca são logados nem repassados, e segredos ficam somente no servidor.

---

## Licença

[MIT](LICENSE) © 2026 Felipe de Toledo Moraes
