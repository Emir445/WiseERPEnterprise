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

## Seed administrativo seguro

O seed não possui mais senha padrão embutida no código. Antes de executá-lo, defina uma senha administrativa com pelo menos 12 caracteres no ambiente:

```powershell
$env:SEED_ADMIN_PASSWORD = "<defina-uma-senha-forte>"
$env:SEED_ADMIN_EMAIL = "admin@cerradusgelo.local"
$env:SEED_ADMIN_NAME = "Administrador"

cd apps/backend
npm run prisma:seed
```

`SEED_ADMIN_EMAIL` e `SEED_ADMIN_NAME` são opcionais. `SEED_ADMIN_PASSWORD` é obrigatória e a senha nunca é exibida pelo seed.

## Próximos passos

- ampliar testes automatizados de autenticação e permissões
- revisar cobertura de segurança dos módulos críticos
- consolidar bootstrap e operação dos módulos ERP já existentes
