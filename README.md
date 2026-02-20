# Resume_Generator

Sistema web para criar, editar e exportar curriculos (PDF).

## Status atual (sem banco)

- Prisma removido.
- API usa persistencia local em arquivo: `apps/api/data/local-db.json`.
- Login e cadastro usam Local Storage no navegador.
- Curriculos e versoes no frontend usam Local Storage por padrao.
- Integracao com banco ficou para depois.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Node.js + TypeScript + Express + JWT
- Monorepo: npm Workspaces (`apps/web`, `apps/api`, `packages/shared`)

## Arquitetura MVC

- API (`apps/api/src`)
  - `models`: persistencia local (arquivo JSON)
  - `services`: regras de negocio
  - `controllers`: camada HTTP
  - `views`: serializacao e templates de exportacao
  - `routes`: mapeamento de endpoints
- Web (`apps/web/src`)
  - `models`: estado e utilitarios
  - `controllers`: paginas
  - `views`: componentes visuais

## Pre-requisitos

- Node.js 20+
- npm 10+

## Setup rapido

1. Instale dependencias:

```bash
npm install
```

2. Crie os arquivos `.env`:

Windows:

```bash
copy apps\\api\\.env.example apps\\api\\.env
copy apps\\web\\.env.example apps\\web\\.env
```

Linux/macOS:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

3. Inicie o projeto:

```bash
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:3333`

## Modo local (padrao)

- O frontend funciona sem API para login/cadastro/curriculos.
- Se quiser forcar chamadas para a API no frontend, adicione em `apps/web/.env`:

```bash
VITE_USE_API=true
```

## Ativar exportacao PDF (API)

1. Garanta os `.env`:

```bash
copy apps\\api\\.env.example apps\\api\\.env
copy apps\\web\\.env.example apps\\web\\.env
```

2. No `apps/web/.env`, deixe:

```bash
VITE_API_URL="http://localhost:3333"
VITE_USE_API="true"
```

3. Inicie:

```bash
npm run dev
```

4. Teste API:
- `http://localhost:3333/health` deve responder `{"status":"ok"}`.

5. No editor, use `Exportar PDF`.

Se o PDF falhar por navegador do Puppeteer:
- Defina no `apps/api/.env` o caminho do Chrome:

```bash
PUPPETEER_EXECUTABLE_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
```

## Login/Cadastro (temporario)

- Feitos via Local Storage do navegador.
- Cada navegador/maquina tem seus proprios usuarios locais.
- Esqueci senha/reset tambem funcionam localmente e mostram token no fluxo da tela/console.
- Usuario demo: `demo@curriculo.com` / `123456`

## Scripts uteis

- `npm run dev` -> sobe API + Web
- `npm run build` -> build completo
- `npm run test` -> testes (placeholders)
- `npm run db:migrate` -> placeholder (integracao de banco pendente)
- `npm run db:seed` -> placeholder (integracao de banco pendente)

## Rotas API

Auth:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

Usuario:
- `GET /me`

Curriculos:
- `GET /resumes`
- `POST /resumes`
- `GET /resumes/:id`
- `PUT /resumes/:id`
- `DELETE /resumes/:id`
- `POST /resumes/:id/duplicate`
- `GET /resumes/:id/versions`
- `POST /resumes/:id/versions`
- `POST /resumes/:id/versions/:versionId/restore`
- `GET /resumes/:id/export/pdf`

# Gerador de Curriculo

Sistema web para criar, editar e exportar curriculos (PDF).

## Status atual (sem banco)

- Prisma removido.
- API usa persistencia local em arquivo: `apps/api/data/local-db.json`.
- Login e cadastro usam Local Storage no navegador.
- Curriculos e versoes no frontend usam Local Storage por padrao.
- Integracao com banco ficou para depois.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Node.js + TypeScript + Express + JWT
- Monorepo: npm Workspaces (`apps/web`, `apps/api`, `packages/shared`)

## Arquitetura MVC

- API (`apps/api/src`)
  - `models`: persistencia local (arquivo JSON)
  - `services`: regras de negocio
  - `controllers`: camada HTTP
  - `views`: serializacao e templates de exportacao
  - `routes`: mapeamento de endpoints
- Web (`apps/web/src`)
  - `models`: estado e utilitarios
  - `controllers`: paginas
  - `views`: componentes visuais

## Pre-requisitos

- Node.js 20+
- npm 10+

## Setup rapido

1. Instale dependencias:

```bash
npm install
```

2. Crie os arquivos `.env`:

Windows:

```bash
copy apps\\api\\.env.example apps\\api\\.env
copy apps\\web\\.env.example apps\\web\\.env
```

Linux/macOS:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

3. Inicie o projeto:

```bash
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:3333`

## Modo local (padrao)

- O frontend funciona sem API para login/cadastro/curriculos.
- Se quiser forcar chamadas para a API no frontend, adicione em `apps/web/.env`:

```bash
VITE_USE_API=true
```

## Login/Cadastro (temporario)

- Feitos via Local Storage do navegador.
- Cada navegador/maquina tem seus proprios usuarios locais.
- Esqueci senha/reset tambem funcionam localmente e mostram token no fluxo da tela/console.
- Usuario demo: `demo@curriculo.com` / `123456`

## Scripts uteis

- `npm run dev` -> sobe API + Web
- `npm run build` -> build completo
- `npm run test` -> testes (placeholders)
- `npm run db:migrate` -> placeholder (integracao de banco pendente)
- `npm run db:seed` -> placeholder (integracao de banco pendente)

## Rotas API

Auth:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

Usuario:
- `GET /me`

Curriculos:
- `GET /resumes`
- `POST /resumes`
- `GET /resumes/:id`
- `PUT /resumes/:id`
- `DELETE /resumes/:id`
- `POST /resumes/:id/duplicate`
- `GET /resumes/:id/versions`
- `POST /resumes/:id/versions`
- `POST /resumes/:id/versions/:versionId/restore`
- `GET /resumes/:id/export/pdf`
