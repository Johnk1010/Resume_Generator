# Resume_Generator

Sistema web para criar, editar e exportar curriculos (PDF e DOCX).

## Status atual (sem banco)

- Prisma removido.
- API usa persistencia local em arquivo: `apps/api/data/local-db.json`.
- Login e cadastro usam Local Storage no navegador.
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

## Login/Cadastro (temporario)

- Feitos via Local Storage do navegador.
- Cada navegador/maquina tem seus proprios usuarios locais.
- Esqueci senha/reset tambem funcionam localmente e mostram token no fluxo da tela/console.

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
- `GET /resumes/:id/export/docx`
