# Download YOLOv8n ONNX Model (Compatible with ONNX Runtime Web)
# YOLOv11n might not be compatible, so we use YOLOv8n which is proven to work

Write-Host "Downloading YOLOv8n ONNX model (compatible with browser)..." -ForegroundColor Green

$modelsDir = "public\models"
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null
}

# Try multiple sources
$sources = @(
    @{
        Name = "Ultralytics GitHub (YOLOv8n)"
        Url = "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx"
    },
    @{
        Name = "Hugging Face (YOLOv8n)"
        Url = "https://huggingface.co/Ultralytics/YOLOv8/resolve/main/yolov8n.onnx"
    }
)

$output = "$modelsDir\yolov11n.onnx"
$success = $false

foreach ($source in $sources) {
    Write-Host "`nTrying: $($source.Name)" -ForegroundColor Cyan
    Write-Host "URL: $($source.Url)" -ForegroundColor Gray
    
    try {
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($source.Url, $output)
        
        if (Test-Path $output) {
            $fileSize = (Get-Item $output).Length
            $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
            
            if ($fileSize -gt 1MB) {
                Write-Host "✅ Downloaded successfully ($fileSizeMB MB)" -ForegroundColor Green
                $success = $true
                break
            } else {
                Write-Host "⚠️  File too small, trying next source..." -ForegroundColor Yellow
                Remove-Item $output -Force
            }
        }
    } catch {
        Write-Host "❌ Failed: $_" -ForegroundColor Red
    }
}

if ($success) {
    Write-Host "`n🎉 YOLOv8n model downloaded successfully!" -ForegroundColor Green
    Write-Host "Location: $output" -ForegroundColor Cyan
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Hard refresh browser (Ctrl+Shift+R)" -ForegroundColor White
    Write-Host "2. Enable monitor and check console" -ForegroundColor White
} else {
    Write-Host "`n❌ All download attempts failed." -ForegroundColor Red
    Write-Host "`nManual download:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://github.com/ultralytics/assets/releases" -ForegroundColor White
    Write-Host "2. Download: yolov8n.onnx" -ForegroundColor White
    Write-Host "3. Save to: $output" -ForegroundColor White
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
