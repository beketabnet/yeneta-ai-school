# Grade Entry Dev Server Restart Script
# This script completely restarts the dev server with cache clearing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Grade Entry Dev Server Restart Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all node processes
Write-Host "[1/5] Killing all node processes..." -ForegroundColor Yellow
try {
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Node processes killed" -ForegroundColor Green
} catch {
    Write-Host "✓ No node processes found" -ForegroundColor Green
}

# Wait a moment
Start-Sleep -Seconds 2

# Step 2: Delete node_modules and package-lock.json
Write-Host "[2/5] Deleting cache files..." -ForegroundColor Yellow
try {
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
        Write-Host "✓ Deleted node_modules" -ForegroundColor Green
    }
    if (Test-Path "package-lock.json") {
        Remove-Item "package-lock.json" -ErrorAction SilentlyContinue
        Write-Host "✓ Deleted package-lock.json" -ForegroundColor Green
    }
} catch {
    Write-Host "✓ Cache files cleaned" -ForegroundColor Green
}

# Step 3: Clear npm cache
Write-Host "[3/5] Clearing npm cache..." -ForegroundColor Yellow
try {
    npm cache clean --force
    Write-Host "✓ npm cache cleared" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to clear npm cache" -ForegroundColor Red
}

# Step 4: Reinstall dependencies
Write-Host "[4/5] Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 5: Start dev server
Write-Host "[5/5] Starting dev server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dev server starting..." -ForegroundColor Cyan
Write-Host "Wait for 'Compiled successfully!' message" -ForegroundColor Cyan
Write-Host "Then open: http://localhost:3000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm start
