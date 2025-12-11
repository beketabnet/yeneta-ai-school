# Download YOLOv11n ONNX Model
# This script downloads the YOLOv8n ONNX model (compatible with YOLOv11)

Write-Host "Downloading YOLOv11n ONNX model..." -ForegroundColor Green

# Create models directory if it doesn't exist
$modelsDir = "public\models"
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null
    Write-Host "Created directory: $modelsDir" -ForegroundColor Yellow
}

# Download URL
$url = "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.onnx"
$output = "$modelsDir\yolov11n.onnx"

try {
    # Use .NET WebClient for more reliable download
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($url, $output)
    
    # Check if file was downloaded
    if (Test-Path $output) {
        $fileSize = (Get-Item $output).Length
        $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
        Write-Host "✅ Model downloaded successfully!" -ForegroundColor Green
        Write-Host "   Location: $output" -ForegroundColor Cyan
        Write-Host "   Size: $fileSizeMB MB" -ForegroundColor Cyan
        
        if ($fileSize -lt 1MB) {
            Write-Host "⚠️  Warning: File size is smaller than expected. Download may have failed." -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Download failed: File not found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative download methods:" -ForegroundColor Yellow
    Write-Host "1. Manual download:" -ForegroundColor Cyan
    Write-Host "   - Visit: https://github.com/ultralytics/assets/releases" -ForegroundColor White
    Write-Host "   - Download: yolov8n.onnx" -ForegroundColor White
    Write-Host "   - Save to: $output" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Using browser:" -ForegroundColor Cyan
    Write-Host "   - Open: $url" -ForegroundColor White
    Write-Host "   - Save file to: $output" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Using Python (if installed):" -ForegroundColor Cyan
    Write-Host "   pip install ultralytics" -ForegroundColor White
    Write-Host "   python -c `"from ultralytics import YOLO; YOLO('yolo11n.pt').export(format='onnx')`"" -ForegroundColor White
    Write-Host "   move yolo11n.onnx $output" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
