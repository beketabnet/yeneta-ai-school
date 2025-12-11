# Ollama Installation Guide - Quick Setup

## Why Install Ollama?

**Problem**: Gemini API has a free tier limit of 50 requests/day. When exceeded, the application fails.

**Solution**: Ollama provides **free, unlimited, offline** AI models that run on your computer.

**Benefits**:
- ✅ **Free** - No API costs
- ✅ **Unlimited** - No request limits
- ✅ **Offline** - Works without internet
- ✅ **Fast** - Runs locally on your machine
- ✅ **Automatic fallback** - Works when Gemini quota exceeded

---

## Quick Installation (5 Minutes)

### **Windows**

#### **Option 1: Using Winget (Recommended)**
```powershell
# Install Ollama
winget install Ollama.Ollama

# Pull the Gemma 2 2B model (smaller, faster)
ollama pull gemma2:2b
```

#### **Option 2: Manual Download**
1. Visit: https://ollama.ai/download
2. Download **Ollama for Windows**
3. Run the installer
4. Open PowerShell and run:
```powershell
ollama pull gemma2:2b
```

---

### **Verify Installation**

```powershell
# Check Ollama is running
ollama list

# Should show:
# NAME            ID              SIZE      MODIFIED
# gemma2:2b       abc123...       1.6 GB    2 minutes ago
```

---

### **Test It Works**

```powershell
# Test generation
ollama run gemma2:2b "What is 2+2?"

# Should respond with an answer
```

---

## Restart Django Server

After installing Ollama, restart your Django server:

```powershell
# Stop the server (Ctrl+C)
# Then restart
cd d:\django_project\yeneta-ai-school\yeneta_backend
python manage.py runserver
```

**Look for this log**:
```
Ollama available: True
```

---

## How It Works

### **Before Ollama**:
```
User Request → Gemini API → 429 Quota Error → ❌ FAIL
```

### **After Ollama**:
```
User Request → Gemini API → 429 Quota Error → Ollama Fallback → ✅ SUCCESS
```

---

## Models Available

### **Gemma 2 2B** (Recommended)
```powershell
ollama pull gemma2:2b
```
- **Size**: 1.6 GB
- **RAM**: 4 GB minimum
- **Speed**: Very fast
- **Quality**: Good for educational content

### **Gemma 2 9B** (Better Quality)
```powershell
ollama pull gemma2:9b
```
- **Size**: 5.4 GB
- **RAM**: 8 GB minimum
- **Speed**: Moderate
- **Quality**: Excellent

### **Llama 3.2 1B** (Smallest)
```powershell
ollama pull llama3.2:1b
```
- **Size**: 1.3 GB
- **RAM**: 2 GB minimum
- **Speed**: Fastest
- **Quality**: Basic

---

## Troubleshooting

### **"Ollama is not running"**

**Windows**:
1. Open Task Manager
2. Check if "Ollama" is running
3. If not, search for "Ollama" in Start Menu and launch it

### **"Model not found"**

```powershell
# Pull the model
ollama pull gemma2:2b

# Verify
ollama list
```

### **"Out of memory"**

Use a smaller model:
```powershell
ollama pull llama3.2:1b
```

### **"Connection refused"**

Ollama might not be running:
```powershell
# Check status
ollama list

# If error, restart Ollama from Start Menu
```

---

## System Requirements

### **Minimum**:
- **RAM**: 4 GB
- **Disk**: 2 GB free space
- **OS**: Windows 10/11, macOS, Linux

### **Recommended**:
- **RAM**: 8 GB
- **Disk**: 10 GB free space
- **GPU**: Optional (speeds up generation)

---

## Current Status

After installation, you'll see in Django logs:

### **Success**:
```
Ollama available: True
LLMRouter initialized. Default: gemini-flash, Ollama fallback: True
```

### **When Gemini Quota Exceeded**:
```
WARNING: Gemini quota exceeded. Attempting fallback to Ollama...
INFO: Falling back to Ollama due to Gemini quota limit
```

---

## Uninstall (If Needed)

### **Windows**:
```powershell
# Uninstall via Settings
winget uninstall Ollama.Ollama

# Or via Control Panel → Programs → Uninstall
```

### **Remove Models**:
```powershell
# List models
ollama list

# Remove a model
ollama rm gemma2:2b
```

---

## Summary

**Installation**:
```powershell
# 1. Install Ollama
winget install Ollama.Ollama

# 2. Pull model
ollama pull gemma2:2b

# 3. Verify
ollama list

# 4. Restart Django server
python manage.py runserver
```

**Result**:
- ✅ Free, unlimited AI generation
- ✅ Automatic fallback when Gemini quota exceeded
- ✅ Works offline
- ✅ No more "Failed to generate question" errors

---

**Time Required**: 5 minutes  
**Disk Space**: 1.6 GB (for gemma2:2b)  
**Cost**: FREE  
**Benefit**: Unlimited AI requests

---

**Created**: November 8, 2025  
**Updated**: November 8, 2025
