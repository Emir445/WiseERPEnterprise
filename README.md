# Wise One Enterprise — Sprint 0.3

Fundação inicial do backend e banco de dados do Wise One.

## Incluído

- Docker Compose com PostgreSQL, Redis e MinIO
- Backend NestJS
- Prisma ORM
- Modelos iniciais: Company, Branch, User, Role, Permission, Session e AuditLog
- Health check
- Swagger em `/docs`
- Validação global
- Estrutura pronta para autenticação e módulos da Cerradu's Gelo

## Requisitos

- Docker Desktop
- Node.js 22 LTS
- npm 10+

## Executar a infraestrutura

```bash
cp .env.example .env
docker compose up -d postgres redis minio
```

## Executar o backend

```bash
cd apps/backend
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init_core
npm run start:dev
```

Acesse:

- API: http://localhost:3000/api
- Health: http://localhost:3000/api/health
- Swagger: http://localhost:3000/docs
- MinIO Console: http://localhost:9001

## Próxima sprint

- Seed do administrador
- Login com JWT e refresh token
- Empresas, usuários, perfis e permissões
