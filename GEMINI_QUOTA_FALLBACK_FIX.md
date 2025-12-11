# Gemini Quota Fallback Fix - November 8, 2025

## Problem

The application was failing with "Failed to generate question" when Gemini API quota was exceeded.

### Error Observed:

```
429 You exceeded your current quota
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests
limit: 50
Internal Server Error: /api/ai-tools/generate-practice-question/
```

**Impact**:
- ❌ Users see "Failed to generate question. Please try again."
- ❌ No fallback mechanism
- ❌ Application unusable until quota resets (24 hours)
- ❌ Poor user experience

---

## Root Cause

### **Gemini Free Tier Limits**:
- **50 requests per day** per project per model
- **Quota resets**: Every 24 hours
- **Error code**: 429 (Too Many Requests)

### **No Fallback Strategy**:
The application was only using Gemini API with no automatic fallback when quota was exceeded.

---

## Solution Implemented

### **Automatic Ollama Fallback on Quota Errors**

**File**: `yeneta_backend/ai_tools/llm/llm_service.py` (lines 208-267)

**Strategy**:
1. ✅ Detect 429 quota errors from Gemini
2. ✅ Automatically fallback to Ollama (free, offline)
3. ✅ Provide clear error messages if both fail
4. ✅ Log all fallback attempts for monitoring

---

## How It Works

### **Step 1: Try Gemini API**
```python
try:
    gemini_model = genai.GenerativeModel(model.value)
    response = gemini_model.generate_content(
        full_prompt,
        generation_config=genai.GenerationConfig(
            temperature=request.temperature,
            max_output_tokens=request.max_tokens,
        ),
    )
    content = response.text
    return content, input_tokens, output_tokens
```

### **Step 2: Detect Quota Error**
```python
except Exception as e:
    error_str = str(e)
    
    # Check if it's a quota/rate limit error (429)
    if '429' in error_str or 'quota' in error_str.lower() or 'rate limit' in error_str.lower():
        logger.warning(f"Gemini quota exceeded: {e}. Attempting fallback to Ollama...")
```

**Detection Criteria**:
- Error code contains "429"
- Error message contains "quota"
- Error message contains "rate limit"

### **Step 3: Fallback to Ollama**
```python
# Try Ollama fallback if available
if self.ollama_available:
    try:
        logger.info("Falling back to Ollama due to Gemini quota limit")
        return self._generate_ollama(request, LLMModel.OLLAMA_GEMMA2_9B)
    except Exception as ollama_error:
        logger.error(f"Ollama fallback also failed: {ollama_error}")
        raise RuntimeError(
            "Gemini API quota exceeded and Ollama fallback failed. "
            "Please try again later or contact support."
        ) from e
```

**Fallback Model**: `OLLAMA_GEMMA2_9B` (9B parameter model)
- Free and offline
- Good quality for educational content
- No API limits

### **Step 4: Clear Error Messages**
```python
else:
    raise RuntimeError(
        "Gemini API quota exceeded (50 requests/day limit reached). "
        "Ollama is not available for fallback. Please try again tomorrow or upgrade your Gemini API plan."
    ) from e
```

---

## Behavior Scenarios

### **Scenario 1: Gemini Works** ✅
```
User Request → Gemini API → Success → Response
```
**Result**: Normal operation, fast response

---

### **Scenario 2: Gemini Quota Exceeded + Ollama Available** ✅
```
User Request → Gemini API (429 Error) → Ollama Fallback → Success → Response
```

**Logs**:
```
WARNING: Gemini quota exceeded: 429 You exceeded your current quota. Attempting fallback to Ollama...
INFO: Falling back to Ollama due to Gemini quota limit
```

**Result**: Request succeeds using Ollama, slightly slower but works

---

### **Scenario 3: Gemini Quota Exceeded + Ollama Unavailable** ❌
```
User Request → Gemini API (429 Error) → Ollama Not Available → Clear Error Message
```

**Error Message**:
```
Gemini API quota exceeded (50 requests/day limit reached). 
Ollama is not available for fallback. 
Please try again tomorrow or upgrade your Gemini API plan.
```

**Result**: User gets clear explanation of the problem and solutions

---

### **Scenario 4: Both Gemini and Ollama Fail** ❌
```
User Request → Gemini API (429 Error) → Ollama Fallback (Error) → Clear Error Message
```

**Error Message**:
```
Gemini API quota exceeded and Ollama fallback failed. 
Please try again later or contact support.
```

**Result**: User knows both systems failed and should contact support

---

## Benefits

### **1. Improved Reliability** ✅
- **Before**: 100% failure when quota exceeded
- **After**: Automatic fallback to Ollama
- **Uptime**: Significantly improved

### **2. Better User Experience** ✅
- **Before**: Generic "Failed to generate question"
- **After**: Clear error messages with solutions
- **Transparency**: Users understand what happened

### **3. Cost Optimization** ✅
- **Ollama**: Free, no API costs
- **Gemini Free Tier**: 50 requests/day
- **Automatic switching**: Uses free Ollama when Gemini quota exceeded

### **4. Monitoring & Debugging** ✅
- **Detailed logs**: All quota errors logged
- **Fallback tracking**: Know when fallbacks occur
- **Error context**: Full error messages preserved

---

## Setting Up Ollama (Recommended)

To enable the fallback functionality, install Ollama:

### **Windows**:
```powershell
# Download and install from https://ollama.ai/download
# Or use winget
winget install Ollama.Ollama

# Pull the Gemma 2 9B model
ollama pull gemma2:9b
```

### **Linux/Mac**:
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the Gemma 2 9B model
ollama pull gemma2:9b
```

### **Verify Installation**:
```bash
ollama list
# Should show: gemma2:9b
```

---

## Alternative Solutions

### **Option 1: Upgrade Gemini API Plan** 💰
- **Gemini Pro**: Higher quota limits
- **Cost**: Pay-per-use pricing
- **Benefit**: No fallback needed

### **Option 2: Use Multiple Gemini API Keys** 🔑
- Create multiple Google Cloud projects
- Each gets 50 requests/day
- Rotate between keys
- **Complexity**: Requires key management

### **Option 3: Implement Request Queuing** ⏱️
- Queue requests when quota exceeded
- Process when quota resets
- **Downside**: Users wait up to 24 hours

### **Option 4: Use Ollama as Primary** 🆓
- Set Ollama as default LLM
- Use Gemini only for complex tasks
- **Benefit**: Zero API costs
- **Requirement**: Ollama must be installed

---

## Monitoring Quota Usage

### **Check Current Usage**:
Visit: https://ai.dev/usage?tab=rate-limit

### **Quota Limits**:
- **Free Tier**: 50 requests/day per model
- **Resets**: Every 24 hours (UTC)
- **Models**: Separate quotas for each model

### **Recommendations**:
1. Monitor daily usage
2. Set up Ollama for fallback
3. Consider upgrading if consistently hitting limits
4. Implement caching to reduce API calls

---

## Error Messages Reference

### **Gemini Quota Exceeded (No Ollama)**:
```
Gemini API quota exceeded (50 requests/day limit reached). 
Ollama is not available for fallback. 
Please try again tomorrow or upgrade your Gemini API plan.
```

**Solutions**:
1. Wait 24 hours for quota reset
2. Install Ollama for fallback
3. Upgrade Gemini API plan

---

### **Both Systems Failed**:
```
Gemini API quota exceeded and Ollama fallback failed. 
Please try again later or contact support.
```

**Solutions**:
1. Check Ollama is running: `ollama list`
2. Restart Ollama service
3. Check logs for Ollama errors
4. Contact support if issue persists

---

## Testing

### **Test 1: Simulate Quota Error**
```python
# Temporarily modify code to always raise 429
raise Exception("429 You exceeded your current quota")
```
**Expected**: Automatic fallback to Ollama

### **Test 2: Ollama Unavailable**
```bash
# Stop Ollama service
# Try generating question
```
**Expected**: Clear error message about quota and Ollama

### **Test 3: Normal Operation**
```bash
# Ensure Gemini quota available
# Generate question
```
**Expected**: Uses Gemini, fast response

---

## Logs to Monitor

### **Successful Fallback**:
```
WARNING: Gemini quota exceeded: 429 You exceeded your current quota. Attempting fallback to Ollama...
INFO: Falling back to Ollama due to Gemini quota limit
```

### **Failed Fallback**:
```
WARNING: Gemini quota exceeded: 429 You exceeded your current quota. Attempting fallback to Ollama...
ERROR: Ollama fallback also failed: Ollama is not available
```

### **Quota Error (No Fallback)**:
```
ERROR: Gemini generation failed: 429 You exceeded your current quota
```

---

## Technical Details

### **Error Detection Regex**:
```python
if '429' in error_str or 'quota' in error_str.lower() or 'rate limit' in error_str.lower():
```

**Matches**:
- "429 You exceeded your current quota"
- "Quota exceeded for metric"
- "Rate limit exceeded"
- "QUOTA_EXCEEDED"

### **Fallback Model Selection**:
```python
return self._generate_ollama(request, LLMModel.OLLAMA_GEMMA2_9B)
```

**Why Gemma 2 9B**:
- Good quality for educational content
- Faster than larger models
- Fits in most GPUs
- Free and offline

---

## Summary

**Problem**: Gemini API quota exceeded (50/day), application fails

**Solution**: 
1. ✅ Detect 429 quota errors
2. ✅ Automatically fallback to Ollama
3. ✅ Provide clear error messages
4. ✅ Log all fallback attempts

**Result**: 
- ✅ Improved reliability
- ✅ Better user experience
- ✅ Clear error messages
- ✅ Automatic fallback to free Ollama

**Files Modified**:
- ✅ `yeneta_backend/ai_tools/llm/llm_service.py` (lines 208-267)

**Recommendation**:
- ✅ Install Ollama for automatic fallback
- ✅ Monitor quota usage daily
- ✅ Consider upgrading Gemini plan if needed

**Status**: FIXED ✅

---

**Fixed By**: Cascade AI Assistant  
**Date**: November 8, 2025  
**Time**: 07:35 AM UTC+03:00
