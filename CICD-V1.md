# CI/CD V1

## CI automático
`.github/workflows/ci.yml` executa backend, Prisma validate/generate, testes Jest (aceitando ausência de testes), frontend e build das imagens Docker de staging.

## Staging
`.github/workflows/staging.yml` sempre valida o Compose. O deploy real fica bloqueado por `vars.STAGING_DEPLOY_ENABLED == 'true'` e exige um runner GitHub self-hosted com labels `self-hosted` e `staging`.

No Environment `staging` do GitHub, crie o secret `STAGING_ENV_FILE` com o conteúdo completo do `.env.staging` do servidor. Nunca versione esse arquivo.

Quando o runner estiver instalado no host de staging e o secret configurado, defina a variável do repositório `STAGING_DEPLOY_ENABLED=true`. Até lá, o workflow apenas valida a configuração e não tenta deploy.

## Validação local
No Windows PowerShell:

    powershell -ExecutionPolicy Bypass -File .\scripts\finalize-cicd-v1.ps1

Resultado esperado:

    LOTE CI/CD V1 CONCLUIDO COM SUCESSO.
