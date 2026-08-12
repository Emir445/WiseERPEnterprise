# WiseERPEnterprise - Operação v1.1.0

## Fluxo de desenvolvimento

Atualizar:
git checkout main
git pull

Criar feature:
git checkout -b feature/nome

Validar:
docker compose -f docker-compose.staging.yml config

Commit:
git add .
git commit -m "tipo: descrição"

Enviar:
git push origin branch

## Staging

Subir:
powershell -ExecutionPolicy Bypass -File .\scripts\staging-up.ps1

Saúde:
powershell -ExecutionPolicy Bypass -File .\scripts\staging-health.ps1

Smoke:
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-staging-v1.ps1

## Releases

Criar tag:

git tag -a v1.x.x -m "Release v1.x.x"

Enviar:

git push origin v1.x.x
