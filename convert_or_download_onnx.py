"""
Convert YOLOv8n.pt to ONNX or download pre-converted ONNX model
"""
import os
import sys

def convert_pt_to_onnx():
    """Try to convert .pt to .onnx using ultralytics"""
    try:
        from ultralytics import YOLO
        print("✅ ultralytics package found")
        
        pt_path = "public/models/yolov8n.pt"
        if not os.path.exists(pt_path):
            print(f"❌ {pt_path} not found")
            return False
        
        print(f"📦 Loading model from {pt_path}...")
        model = YOLO(pt_path)
        
        print("🔄 Exporting to ONNX format...")
        success = model.export(
            format='onnx',
            imgsz=640,
            simplify=True,
            opset=12
        )
        
        # Move to correct location
        if os.path.exists("yolov8n.onnx"):
            import shutil
            shutil.move("yolov8n.onnx", "public/models/yolov11n.onnx")
            print("✅ Converted and saved as public/models/yolov11n.onnx")
            return True
        
        return False
        
    except ImportError:
        print("❌ ultralytics package not installed")
        print("\nInstall with: pip install ultralytics")
        return False
    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        return False

def download_onnx():
    """Try to download pre-converted ONNX model"""
    try:
        import urllib.request
        
        urls = [
            "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.onnx",
            "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx",
        ]
        
        for url in urls:
            try:
                print(f"\n📥 Trying to download from: {url}")
                urllib.request.urlretrieve(url, "public/models/yolov11n.onnx")
                
                size = os.path.getsize("public/models/yolov11n.onnx")
                if size > 1_000_000:  # > 1 MB
                    print(f"✅ Downloaded successfully ({size / 1_000_000:.2f} MB)")
                    return True
                else:
                    print("⚠️  File too small, trying next URL...")
                    os.remove("public/models/yolov11n.onnx")
            except Exception as e:
                print(f"❌ Failed: {e}")
        
        return False
        
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("YOLOv8n ONNX Converter/Downloader")
    print("=" * 60)
    
    # Try conversion first (faster if ultralytics installed)
    print("\n🔄 Attempting conversion from .pt to .onnx...")
    if convert_pt_to_onnx():
        print("\n🎉 Success! Model ready to use.")
        print("\nNext steps:")
        print("1. Hard refresh browser (Ctrl+Shift+R)")
        print("2. Enable monitor and check console")
        sys.exit(0)
    
    # If conversion fails, try download
    print("\n📥 Attempting to download pre-converted ONNX model...")
    if download_onnx():
        print("\n🎉 Success! Model ready to use.")
        print("\nNext steps:")
        print("1. Hard refresh browser (Ctrl+Shift+R)")
        print("2. Enable monitor and check console")
        sys.exit(0)
    
    # Both failed
    print("\n" + "=" * 60)
    print("❌ Automatic methods failed")
    print("=" * 60)
    print("\nMANUAL DOWNLOAD REQUIRED:")
    print("\n1. Visit: https://github.com/ultralytics/assets/releases")
    print("2. Find and download: yolov8n.onnx (NOT .pt)")
    print("3. Save to: public/models/yolov11n.onnx")
    print("4. File should be ~6 MB")
    print("\nAlternatively, install ultralytics:")
    print("  pip install ultralytics")
    print("  python convert_or_download_onnx.py")
