# Simple Ollama + PageKite Menu
param([switch]$Help)

if ($Help) {
    Write-Host "Ollama + PageKite Management Menu"
    Write-Host "Interactive menu for managing services"
    exit
}

function Write-Status {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-OllamaLocal {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -TimeoutSec 5
        Write-Status "Ollama is running locally" "Green"
        return $true
    } catch {
        Write-Status "Ollama is not responding" "Red"
        return $false
    }
}

function Show-Status {
    Write-Status "Checking service status..." "Cyan"
    
    $ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
    if ($ollamaProcess) {
        Write-Status "Ollama process: RUNNING" "Green"
    } else {
        Write-Status "Ollama process: NOT FOUND" "Red"
    }
    
    Test-OllamaLocal | Out-Null
}

function Stop-Services {
    Write-Status "Stopping services..." "Yellow"
    Get-Process -Name "ollama" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Status "Services stopped" "Green"
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host " Ollama + PageKite Manager" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

do {
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "1. Quick Start (lucacirillo1234)"
    Write-Host "2. Custom Start"
    Write-Host "3. Check Status"
    Write-Host "4. Stop Services"
    Write-Host "5. Exit"
    Write-Host ""
    
    $choice = Read-Host "Select option (1-5)"
    
    switch ($choice) {
        "1" {
            Write-Status "Starting with default subdomain..." "Cyan"
            & ".\launch-ollama-pagekite.ps1"
        }
        "2" {
            $subdomain = Read-Host "Enter subdomain"
            if ($subdomain) {
                & ".\launch-ollama-pagekite.ps1" -Subdomain $subdomain
            }
        }
        "3" {
            Show-Status
            Read-Host "Press Enter to continue"
        }
        "4" {
            Stop-Services
            Start-Sleep 2
        }
        "5" {
            Write-Status "Goodbye!" "Green"
            exit
        }
        default {
            Write-Status "Invalid choice" "Red"
        }
    }
    
    Write-Host ""
} while ($true)
