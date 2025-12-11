"""
Export YOLOv8n model to ONNX format compatible with ONNX Runtime Web
"""

try:
    from ultralytics import YOLO
    print("✅ ultralytics package found")
    
    print("📦 Loading YOLOv8n model...")
    model = YOLO('yolov8n.pt')
    
    print("🔄 Exporting to ONNX format...")
    model.export(
        format='onnx',
        imgsz=640,
        simplify=True,  # Simplify for better browser compatibility
        opset=12  # Use opset 12 for better compatibility
    )
    
    print("✅ Export complete!")
    print("📁 Model saved as: yolov8n.onnx")
    print("\nNext steps:")
    print("1. Move yolov8n.onnx to public/models/yolov11n.onnx")
    print("2. Hard refresh browser (Ctrl+Shift+R)")
    
except ImportError:
    print("❌ ultralytics package not installed")
    print("\nInstall with:")
    print("  pip install ultralytics")
    print("\nThen run this script again")
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nTry manual download:")
    print("1. Visit: https://github.com/ultralytics/ultralytics/releases")
    print("2. Download pre-trained yolov8n.onnx")
    print("3. Save to: public/models/yolov11n.onnx")
