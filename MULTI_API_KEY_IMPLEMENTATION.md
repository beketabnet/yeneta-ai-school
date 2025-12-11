# Multi-API Key Implementation Guide

## Overview
Comprehensive multi-API key management system with automatic failover and token limit tracking for OpenAI, Google Gemini, and SERP APIs.

## Architecture

### Components

1. **api_key_manager.py** - Core API Key Manager
   - Loads multiple API keys from environment variables
   - Tracks token usage per minute and per day
   - Provides key availability checking
   - Manages key activation/deactivation

2. **api_key_rotation.py** - Failover & Rotation Logic
   - Automatic failover to next available key
   - Rate limit detection and handling
   - Decorator support for easy integration
   - Global rotator instance management

3. **llm_service.py** - Unified LLM Service
   - Multi-provider support (OpenAI, Gemini, Ollama)
   - Automatic provider selection based on availability
   - Seamless failover between providers
   - Token usage tracking

4. **api_views.py** - Admin API Endpoints
   - GET `/api/admin/api-key-status/` - View all key status
   - POST `/api/admin/api-key-reset/` - Reset deactivated keys
   - GET `/api/admin/api-key-usage-report/` - Detailed usage report

5. **APIKeyManagementPanel.tsx** - Admin UI Component
   - Real-time key status monitoring
   - Usage percentage visualization
   - Manual key reset functionality
   - Provider-specific statistics

## Environment Configuration

### .env Format

```bash
# OpenAI Keys (comma-separated)
OPENAI_API_KEYS=sk-proj-key1,sk-proj-key2,sk-proj-key3
OPENAI_ORG_ID=org-your-org

# OpenAI Models (per key index)
OPENAI_MODEL_0=gpt-4o
OPENAI_MODEL_1=gpt-4o
OPENAI_MODEL_2=gpt-4o-mini

# OpenAI Token Limits (per key index)
OPENAI_MAX_TOKENS_PER_MINUTE_0=90000
OPENAI_MAX_TOKENS_PER_MINUTE_1=90000
OPENAI_MAX_TOKENS_PER_MINUTE_2=90000

OPENAI_MAX_TOKENS_PER_DAY_0=2000000
OPENAI_MAX_TOKENS_PER_DAY_1=2000000
OPENAI_MAX_TOKENS_PER_DAY_2=2000000

# Gemini Keys (comma-separated)
GEMINI_API_KEYS=AIza-key1,AIza-key2,AIza-key3

# Gemini Models (per key index)
GEMINI_MODEL_0=gemini-1.5-pro-latest
GEMINI_MODEL_1=gemini-1.5-flash-latest
GEMINI_MODEL_2=gemini-1.5-flash-8b-latest

# Gemini Token Limits (per key index)
GEMINI_MAX_TOKENS_PER_MINUTE_0=60000
GEMINI_MAX_TOKENS_PER_MINUTE_1=60000
GEMINI_MAX_TOKENS_PER_MINUTE_2=60000

GEMINI_MAX_TOKENS_PER_DAY_0=1000000
GEMINI_MAX_TOKENS_PER_DAY_1=1000000
GEMINI_MAX_TOKENS_PER_DAY_2=1000000

# SERP Keys (comma-separated)
SERP_API_KEYS=serp-key1,serp-key2,serp-key3

# SERP Token Limits (per key index)
SERP_MAX_TOKENS_PER_MINUTE_0=100
SERP_MAX_TOKENS_PER_MINUTE_1=100
SERP_MAX_TOKENS_PER_MINUTE_2=100

SERP_MAX_TOKENS_PER_DAY_0=100000
SERP_MAX_TOKENS_PER_DAY_1=100000
SERP_MAX_TOKENS_PER_DAY_2=100000
```

## Usage Examples

### Using LLM Service

```python
from llm_service import get_llm_service

llm = get_llm_service()

# Auto-select best provider
response = llm.generate_text(
    prompt="Explain quantum computing",
    temperature=0.7,
    max_tokens=1000
)

# Specific provider
response = llm.generate_text(
    prompt="Explain quantum computing",
    provider='openai',
    model='gpt-4o',
    max_tokens=1000
)
```

### Using API Key Rotator

```python
from api_key_rotation import get_api_key_rotator

rotator = get_api_key_rotator()

# Get available key
key_config = rotator.get_key_for_provider('openai', tokens_needed=2000)

# Execute with automatic failover
result = rotator.execute_with_fallback(
    provider='openai',
    operation=my_openai_function,
    tokens_needed=2000,
    model='gpt-4o'
)

# Get provider status
status = rotator.get_provider_status()
```

### Using Decorator

```python
from api_key_rotation import with_api_key_rotation

@with_api_key_rotation('openai', tokens_needed=2000)
def call_openai_api(api_key, prompt):
    # Use api_key to call OpenAI
    pass
```

## Key Features

### Automatic Failover
- When a key hits rate limits, system automatically switches to next available key
- No manual intervention required
- Seamless user experience

### Token Tracking
- Per-minute token tracking
- Per-day token tracking
- Automatic counter reset after time period
- Usage percentage calculation

### Provider Selection
- Automatic best-provider selection based on availability
- Priority: Ollama (free) > Gemini (subsidized) > OpenAI (paid)
- Manual provider override supported

### Admin Monitoring
- Real-time key status dashboard
- Usage percentage visualization
- Manual key reset functionality
- Detailed usage reports

## Integration Steps

1. **Update .env file** with multiple API keys
2. **Import services** in your views/services
3. **Use LLM Service** for text generation
4. **Monitor dashboard** for key usage
5. **Add more keys** as needed for scaling

## Rate Limit Handling

System automatically detects rate limit errors (429, 503, "quota exceeded", etc.) and:
1. Deactivates the current key
2. Tries next available key
3. Logs the event for monitoring
4. Continues operation seamlessly

## Monitoring & Alerts

Check dashboard for:
- Keys approaching limits (>80% usage)
- Deactivated keys
- Total active keys per provider
- Token usage trends

## Scaling Strategy

To handle more requests:
1. Add more API keys to .env
2. Increase `MAX_TOKENS_PER_MINUTE` limits if applicable
3. Monitor usage patterns
4. Add keys from different providers for redundancy

## Security Considerations

- Never commit .env file to version control
- Use environment-specific .env files
- Rotate keys periodically
- Monitor for unusual usage patterns
- Use separate keys for different environments (dev, staging, prod)

## Troubleshooting

### All keys deactivated
- Check .env configuration
- Verify API keys are valid
- Check rate limit policies
- Reset keys via admin panel

### High token usage
- Review request patterns
- Implement caching
- Use smaller models
- Optimize prompts

### Slow responses
- Check key availability
- Monitor network latency
- Review provider status
- Consider adding more keys
