param(
  [Parameter(Mandatory = $true)]
  [string]$NeonUrl
)

$ErrorActionPreference = 'Stop'
$dump = Join-Path $PSScriptRoot '..\.dump\pmjay.sql'

if (-not (Test-Path $dump)) {
  throw "Dump not found: $dump. Ask the agent to dump the local DB first."
}

if ($NeonUrl -notmatch 'sslmode=require') {
  if ($NeonUrl.Contains('?')) { $NeonUrl = "$NeonUrl&sslmode=require" }
  else { $NeonUrl = "$NeonUrl`?sslmode=require" }
}

Write-Host "Copying dump into Docker..."
docker cp $dump pmjay-postgres:/tmp/pmjay.sql
if ($LASTEXITCODE -ne 0) { throw "docker cp failed. Is pmjay-postgres running?" }

Write-Host "Restoring into Neon (this can take a few minutes)..."
docker exec pmjay-postgres psql $NeonUrl -v ON_ERROR_STOP=0 -f /tmp/pmjay.sql
Write-Host "Done. Checking login users on Neon..."
docker exec pmjay-postgres psql $NeonUrl -c "SELECT username, role, active FROM app_auth.dashboard_users;"
