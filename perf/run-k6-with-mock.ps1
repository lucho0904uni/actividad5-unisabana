param(
    [string]$Port = '8087',
    [string]$Scenario = 'smoke',
    [string]$DataFile = '..\..\data\consultas.json'
)

$ErrorActionPreference = 'Continue'

# Convert port to int
$IntPort = [int]::Parse($Port)

# Find k6
$k6 = Get-Command k6 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $k6) {
    $k6 = 'C:\Program Files\k6\k6.exe'
    if (-not (Test-Path $k6)) {
        throw 'k6 not found'
    }
}

# Kill any existing processes on the port
Write-Host "Cleaning up port $Port..."
try {
    $existingProcesses = Get-NetTCPConnection -LocalPort $IntPort -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Get-Unique
    if ($existingProcesses) {
        foreach ($pid in $existingProcesses) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 500
        }
    }
} catch {
    # If Get-NetTCPConnection is not available, try alternative cleanup
    Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'node' } | Stop-Process -Force -ErrorAction SilentlyContinue
}

Write-Host "Starting mock server on port $Port..."
$env:PORT = $Port

# Start mock server
$mockProcess = Start-Process -FilePath node -ArgumentList 'perf\mock-server.js' -NoNewWindow -PassThru -ErrorAction SilentlyContinue

# Wait for server
Write-Host "Waiting for server to be ready..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/actuator/health" -TimeoutSec 1 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $ready = $true
            Write-Host "Server ready!"
            # Extra wait to ensure server is fully initialized
            Start-Sleep -Milliseconds 500
            break
        }
    } catch {
        Start-Sleep -Milliseconds 200
    }
}

if (-not $ready) {
    Write-Warning "Server startup timeout, continuing anyway..."
}

# Run k6
Write-Host "Running k6..."
$env:BASE_URL = "http://localhost:$Port"
$env:DATA_FILE = $DataFile

$k6ExitCode = 0
try {
    & $k6 run perf/scripts/multas_k6.js --env SCENARIO=$Scenario --env BASE_URL="http://localhost:$Port" --env DATA_FILE="$DataFile" -o "json=perf/results/$Scenario.json"
    $k6ExitCode = $LASTEXITCODE
} catch {
    Write-Error "Error running k6: $_"
    $k6ExitCode = 1
}

# Cleanup
Write-Host "Stopping mock server..."
if ($mockProcess -and -not $mockProcess.HasExited) {
    try {
        Stop-Process -Id $mockProcess.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    } catch {
        Write-Warning "Could not stop mock process: $_"
    }
}

# Kill any remaining node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Exit with k6's exit code
exit $k6ExitCode
