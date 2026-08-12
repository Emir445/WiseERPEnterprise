# Release / Staging V1

## Objetivo

Empacotar o Wise One Enterprise em um ambiente de staging reproduzivel com Docker Compose, migrations via `prisma migrate deploy`, frontend estatico em Nginx e health/readiness.

## Primeira configuracao

1. Copie `.env.staging.example` para `.env.staging`.
2. Substitua todos os valores `CHANGE_ME` por secrets fortes.
3. Nao versione `.env.staging`.
4. Execute `scripts/finalize-release-staging-v1.ps1`.
5. Execute `scripts/staging-up.ps1`.
6. Execute `scripts/smoke-staging-v1.ps1`.

## URLs locais padrao

- Aplicacao: `http://localhost:8080`
- API: `http://localhost:8080/api`
- Swagger (quando habilitado): `http://localhost:8080/docs`

## Producao real

Este lote prepara staging local. Antes de exposicao publica ainda e necessario configurar proxy TLS/HTTPS, dominio, backups, observabilidade, rotacao de secrets e politica de atualizacao/rollback.
