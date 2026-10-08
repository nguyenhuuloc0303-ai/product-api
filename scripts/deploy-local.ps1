# Automated Deployment Script for Windows (Local Docker Engine)
param (
    [string]$DockerUsername = ""
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 CAB SYSTEM - DEPLOY TO LOCAL DOCKER ENGINE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Load .env if exists
if (Test-Path ".env") {
    Get-Content .env | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line.Split('=', 2)
            if ($parts.Length -eq 2) {
                [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim())
            }
        }
    }
}

if (-not $DockerUsername) {
    $DockerUsername = [System.Environment]::GetEnvironmentVariable("DOCKERHUB_USERNAME")
}

if (-not $DockerUsername) {
    $DockerUsername = "nguyenhuuloc0303"
}

$env:DOCKERHUB_USERNAME = $DockerUsername
Write-Host "📦 Using Docker Hub Username: $DockerUsername" -ForegroundColor Yellow

Write-Host "`n[1/3] Pulling latest images from Docker Hub..." -ForegroundColor Green
docker compose -f docker-compose-prod.yaml pull

Write-Host "`n[2/3] Starting containers on Local Docker Engine..." -ForegroundColor Green
docker compose -f docker-compose-prod.yaml up -d --remove-orphans

Write-Host "`n[3/3] Checking container health status..." -ForegroundColor Green
Start-Sleep -Seconds 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Health Check Succeeded!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "⚠️ API is starting up. Check status with: docker compose -f docker-compose-prod.yaml ps" -ForegroundColor Yellow
}

Write-Host "`nDeployment completed! 🎉" -ForegroundColor Cyan
