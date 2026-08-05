# Instalação no Windows

Destino oficial:

```text
C:\WiseERPEnterprise
```

## 1. Extrair o pacote

Extraia este ZIP em qualquer pasta temporária, por exemplo:

```text
C:\Downloads\wise-one-sprint-0.3.1
```

## 2. Executar o instalador

Abra o PowerShell como usuário normal e execute:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
cd C:\Downloads\wise-one-sprint-0.3.1
.\install.ps1
```

O script copiará o projeto para:

```text
C:\WiseERPEnterprise
```

## 3. Subir a infraestrutura

```powershell
cd C:\WiseERPEnterprise
docker compose up -d postgres redis minio
```

## 4. Preparar o backend

```powershell
cd C:\WiseERPEnterprise\apps\backend
copy .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init_core
npm run start:dev
```

## 5. Verificar

- API: `http://localhost:3000/api`
- Health check: `http://localhost:3000/api/health`
- Swagger: `http://localhost:3000/docs`
- MinIO: `http://localhost:9001`

> O frontend Flutter será incluído na próxima sprint.
