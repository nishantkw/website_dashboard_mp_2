param(
  [Parameter(Mandatory = $true)]
  [string]$NeonUrl
)

$ErrorActionPreference = 'Stop'
$backendRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$dump = Join-Path $backendRoot '.dump\pmjay.sql'
$newTablesSql = Join-Path $backendRoot 'sql\010_pmjay_schema_ref_tables.sql'

if (-not (Test-Path $dump)) {
  throw "Dump not found: $dump"
}
if (-not (Test-Path $newTablesSql)) {
  throw "New tables SQL not found: $newTablesSql"
}

if ($NeonUrl -notmatch 'sslmode=require') {
  if ($NeonUrl.Contains('?')) { $NeonUrl = "$NeonUrl&sslmode=require" }
  else { $NeonUrl = "$NeonUrl`?sslmode=require" }
}

# Pooler host is bad for big restore — warn if user pasted pooled URL
if ($NeonUrl -match '-pooler\.') {
  Write-Host "WARNING: This looks like a pooled URL. Prefer Connect with Connection pooling OFF for restore." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 1/3: Restoring main dump (pmjay.sql) into Neon..." -ForegroundColor Cyan
Write-Host "This can take several minutes."
docker run --rm `
  -v "${backendRoot}\.dump:/dump" `
  postgres:16 `
  psql $NeonUrl -v ON_ERROR_STOP=0 -f /dump/pmjay.sql
if ($LASTEXITCODE -ne 0) {
  Write-Host "Dump restore finished with some errors (often OK). Continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2/3: Creating newer website tables (010)..." -ForegroundColor Cyan
docker run --rm `
  -v "${backendRoot}\sql:/sql" `
  postgres:16 `
  psql $NeonUrl -v ON_ERROR_STOP=0 -f /sql/010_pmjay_schema_ref_tables.sql
if ($LASTEXITCODE -ne 0) {
  throw "Failed creating new tables"
}

Write-Host ""
Write-Host "Step 3/3: Checking table count..." -ForegroundColor Cyan
docker run --rm postgres:16 `
  psql $NeonUrl -c "SELECT count(*) AS table_count FROM information_schema.tables WHERE table_schema IN ('app_auth','bis_raw','dmart_mp','ump_raw');"

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "Next: in Neon turn pooling ON, copy connection string, put it in Render DATABASE_URL, then Manual Deploy."
