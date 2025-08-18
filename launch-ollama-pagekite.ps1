# Ollama + PageKite Launcher Script
# Starts both Ollama and PageKite tunnel for remote access

param(
    [string]$Subdomain = "lucacirillo1234",
    [switch]$Help
)

if ($Help) {
    Write-Host "Ollama + PageKite Launcher" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\launch-ollama-pagekite.ps1 [-Subdomain <subdomain>]"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\launch-ollama-pagekite.ps1"
    Write-Host "  .\launch-ollama-pagekite.ps1 -Subdomain myapp"
    exit
}

function Write-Status {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Clean up any existing Ollama processes
Write-Status "Stopping any running Ollama processes..." "Yellow"
Get-Process -Name "ollama" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Set environment variables for CORS
$env:OLLAMA_ORIGINS = "*"
$env:OLLAMA_HOST = "0.0.0.0:11434"

Write-Status "Starting services..." "Green"
Write-Status "OLLAMA_ORIGINS: $($env:OLLAMA_ORIGINS)" "Cyan"
Write-Status "OLLAMA_HOST: $($env:OLLAMA_HOST)" "Cyan"
Write-Status "PageKite URL: https://$Subdomain.pagekite.me" "Cyan"

# Start Ollama in background
Write-Status "Starting Ollama server..." "Yellow"
$ollamaJob = Start-Job -ScriptBlock { ollama serve }

# Wait for Ollama to be ready
Write-Status "Waiting for Ollama to start..." "Yellow"
$timeout = 30
$elapsed = 0

do {
    Start-Sleep -Seconds 2
    $elapsed += 2
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Status "Ollama is ready!" "Green"
            break
        }
    } catch {
        Write-Status "Still waiting for Ollama... ($elapsed/$timeout seconds)" "Yellow"
    }
} while ($elapsed -lt $timeout)

if ($elapsed -ge $timeout) {
    Write-Status "ERROR: Ollama failed to start in time" "Red"
    Stop-Job $ollamaJob -ErrorAction SilentlyContinue
    Remove-Job $ollamaJob -Force -ErrorAction SilentlyContinue
    exit 1
}

# Test local connection
try {
    $test = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -TimeoutSec 5
    Write-Status "Local Ollama test: SUCCESS" "Green"
} catch {
    Write-Status "Local Ollama test: FAILED" "Red"
    Stop-Job $ollamaJob -ErrorAction SilentlyContinue
    Remove-Job $ollamaJob -Force -ErrorAction SilentlyContinue
    exit 1
}

# Start PageKite tunnel
Write-Status "" 
Write-Status "Starting PageKite tunnel..." "Green"
Write-Status "Keep this window open to maintain the tunnel!" "Yellow"
Write-Status "Press Ctrl+C to stop both services" "Yellow"

# Cleanup handler
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Host "Cleaning up..."
    Stop-Job $ollamaJob -ErrorAction SilentlyContinue
    Remove-Job $ollamaJob -Force -ErrorAction SilentlyContinue
    Get-Process -Name "ollama" -ErrorAction SilentlyContinue | Stop-Process -Force
}

try {
    # Start PageKite (this blocks until Ctrl+C)
    python pagekite_clean.py 11434 "$Subdomain.pagekite.me"
} catch {
    Write-Status "PageKite stopped or error occurred" "Yellow"
} finally {
    # Cleanup
    Write-Status "Stopping services..." "Yellow"
    Stop-Job $ollamaJob -ErrorAction SilentlyContinue
    Remove-Job $ollamaJob -Force -ErrorAction SilentlyContinue
    Get-Process -Name "ollama" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Status "Services stopped" "Green"
}
