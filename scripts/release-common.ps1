$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

function Assert-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Comando obrigatorio nao encontrado: $Name"
  }
}

function Assert-StagingEnv([string]$Root) {
  $envFile = Join-Path $Root '.env.staging'
  if (-not (Test-Path $envFile)) {
    throw "Arquivo .env.staging nao encontrado. Copie .env.staging.example para .env.staging e configure os secrets."
  }

  $raw = Get-Content $envFile -Raw
  if ($raw -match 'CHANGE_ME') {
    throw "O arquivo .env.staging ainda contem valores CHANGE_ME. Configure os secrets antes do deploy."
  }

  return $envFile
}

function Invoke-Compose([string]$Root, [string[]]$ComposeArgs) {
  & docker compose --env-file (Join-Path $Root '.env.staging') -f (Join-Path $Root 'docker-compose.staging.yml') @ComposeArgs
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose falhou com exit code $LASTEXITCODE"
  }
}

