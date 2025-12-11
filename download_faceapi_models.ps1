# Download face-api.js Models
# This script downloads the required face-api.js models for expression detection

Write-Host "Downloading face-api.js models..." -ForegroundColor Green

# Create models directory if it doesn't exist
$modelsDir = "public\models"
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null
    Write-Host "Created directory: $modelsDir" -ForegroundColor Yellow
}

# Base URL for face-api.js models
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# Models to download
$models = @(
    @{
        Name = "tiny_face_detector_model-weights_manifest.json"
        Url = "$baseUrl/tiny_face_detector_model-weights_manifest.json"
    },
    @{
        Name = "tiny_face_detector_model-shard1"
        Url = "$baseUrl/tiny_face_detector_model-shard1"
    },
    @{
        Name = "face_expression_model-weights_manifest.json"
        Url = "$baseUrl/face_expression_model-weights_manifest.json"
    },
    @{
        Name = "face_expression_model-shard1"
        Url = "$baseUrl/face_expression_model-shard1"
    }
)

$successCount = 0
$failCount = 0

foreach ($model in $models) {
    $output = Join-Path $modelsDir $model.Name
    
    Write-Host "Downloading $($model.Name)..." -ForegroundColor Cyan
    
    try {
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($model.Url, $output)
        
        if (Test-Path $output) {
            $fileSize = (Get-Item $output).Length
            $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
            Write-Host "  ✅ Downloaded successfully ($fileSizeKB KB)" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  ❌ Download failed: File not found" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "  ❌ Download failed: $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "Download Summary:" -ForegroundColor Yellow
Write-Host "  ✅ Success: $successCount" -ForegroundColor Green
Write-Host "  ❌ Failed: $failCount" -ForegroundColor Red

if ($successCount -eq 4) {
    Write-Host ""
    Write-Host "🎉 All face-api.js models downloaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Hard refresh browser (Ctrl+Shift+R)" -ForegroundColor White
    Write-Host "2. Enable monitor in Student Dashboard" -ForegroundColor White
    Write-Host "3. Check console for detection logs" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️  Some models failed to download." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual download:" -ForegroundColor Cyan
    Write-Host "Visit: https://github.com/justadudewhohacks/face-api.js/tree/master/weights" -ForegroundColor White
    Write-Host "Download the 4 files listed above and place them in: $modelsDir" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
