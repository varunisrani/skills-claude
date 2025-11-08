# OpenHands LLM Architecture - Quick Reference Guide

## Core Files at a Glance

| File | Lines | Purpose |
|------|-------|---------|
| `llm.py` | 842 | Main LLM wrapper with retry, metrics, function calling |
| `fn_call_converter.py` | 976 | Converts between native and simulated function calling |
| `metrics.py` | 278 | Cost, token, and latency tracking |
| `async_llm.py` | 134 | Async completion wrapper |
| `streaming_llm.py` | 117 | Streaming async completion wrapper |
| `retry_mixin.py` | 101 | Exponential backoff retry logic |
| `debug_mixin.py` | 74 | Debug logging for prompts/responses |
| `llm_registry.py` | 147 | Multi-LLM instance management |
| `model_features.py` | 143 | Feature detection (function calling, vision, cache) |
| `router/base.py` | 165 | Multi-model routing base class |

## Class Hierarchy

```
LLM (main class)
├── RetryMixin (exponential backoff)
└── DebugMixin (logging)

AsyncLLM(LLM)
└── StreamingLLM(AsyncLLM)

RouterLLM(LLM)
└── MultimodalRouter(RouterLLM)
```

## Key LiteLLM Integration Points

### Import Statements
```python
from litellm import completion, acompletion
from litellm import token_counter, get_model_info, supports_vision
from litellm import completion_cost
from litellm.exceptions import APIConnectionError, RateLimitError, ServiceUnavailableError
from litellm.utils import create_pretrained_tokenizer
```

### How They're Used
1. **litellm.completion()** - Main sync API call
2. **litellm.acompletion()** - Main async API call (also used for streaming with stream=True)
3. **litellm.token_counter()** - Count tokens in messages
4. **litellm.get_model_info()** - Fetch model capabilities (max tokens, supports_vision, etc.)
5. **litellm.completion_cost()** - Calculate API call costs
6. **litellm.supports_vision()** - Check if model supports vision

## Configuration Options (Top 20 Most Important)

```python
config = LLMConfig(
    # Model & API
    model="claude-sonnet-4-20250514",
    api_key="your-key",
    base_url="https://api.example.com",
    
    # Retry strategy
    num_retries=5,
    retry_multiplier=8,
    retry_min_wait=8,
    retry_max_wait=64,
    
    # Sampling
    temperature=0.0,
    top_p=1.0,
    max_output_tokens=4096,
    
    # Features
    disable_vision=False,
    caching_prompt=True,
    native_tool_calling=None,  # Auto-detect
    
    # Logging
    log_completions=False,
    log_completions_folder="/path/to/logs",
    
    # Cost tracking
    input_cost_per_token=None,
    output_cost_per_token=None,
)
```

## API Usage Patterns

### Basic Synchronous Completion
```python
llm = LLM(config, service_id='agent')
response = llm.completion(
    messages=[
        {'role': 'system', 'content': 'You are helpful.'},
        {'role': 'user', 'content': 'Hello!'}
    ]
)
text = response['choices'][0]['message']['content']
```

### With Function Calling
```python
response = llm.completion(
    messages=messages,
    tools=[{
        'type': 'function',
        'function': {
            'name': 'execute_bash',
            'description': 'Run bash command',
            'parameters': {'type': 'object', 'properties': {...}}
        }
    }]
)

# Access tool calls
tool_calls = response['choices'][0]['message'].get('tool_calls', [])
```

### Asynchronous Completion
```python
llm = AsyncLLM(config, service_id='agent')
response = await llm.async_completion(messages=messages)
```

### Streaming Completion
```python
llm = StreamingLLM(config, service_id='agent')
async for chunk in llm.async_streaming_completion(messages=messages):
    content = chunk['choices'][0]['delta'].get('content', '')
    print(content, end='', flush=True)
```

## Error Handling & Retries

### Automatically Retried Exceptions
- `APIConnectionError` - Network issues
- `RateLimitError` - Too many requests (429)
- `ServiceUnavailableError` - Service down (503)
- `litellm.Timeout` - Request timeout
- `litellm.InternalServerError` - Provider error (500)
- `LLMNoResponseError` - No valid response

### Retry Formula
```
wait_time = min(
    retry_min_wait * (retry_multiplier ** (attempt - 1)),
    retry_max_wait
)
# Example: min(8 * (8 ** n), 64) seconds
```

## Metrics Tracking

### What Gets Tracked
```python
metrics = llm.metrics

# Cost tracking
metrics.accumulated_cost  # Total USD spent
metrics.costs  # Per-call costs

# Token usage
metrics.accumulated_token_usage  # Total tokens
metrics.token_usages  # Per-call breakdown
  - prompt_tokens
  - completion_tokens
  - cache_read_tokens
  - cache_write_tokens

# Latency
metrics.response_latencies  # Per-response round-trip time
```

### Access Metrics
```python
metrics_dict = llm.metrics.get()
# Includes: accumulated_cost, accumulated_token_usage, costs, response_latencies, token_usages
```

## Model Feature Support

### Feature Detection (Pattern-Matched)
```python
from openhands.llm.model_features import get_features

features = get_features('claude-3-5-sonnet-20241022')
# Returns:
# - supports_function_calling: bool
# - supports_reasoning_effort: bool
# - supports_prompt_cache: bool
# - supports_stop_words: bool
```

### Supported Models for Key Features

**Function Calling:**
- Claude 3.5+, Sonnet 4+, Opus 4+
- GPT-4o, GPT-5
- Gemini 2.5+
- Qwen3, DeepSeek, Kimi

**Vision:**
- GPT-4 Vision and later
- Claude 3+
- Gemini all
- Others detected via LiteLLM

**Prompt Caching:**
- Claude 3.5+, Opus 4.x
- (Provider-specific cache headers via LiteLLM)

**Reasoning Effort:**
- o1, o3, o4-mini families
- Gemini 2.5 Flash/Pro
- GPT-5
- DeepSeek R1
- Claude 4.5 Sonnet/Haiku

## Function Calling Flow

### Native Function Calling (Supported Models)
1. Pass `tools` parameter to completion
2. Model directly returns `tool_calls` in response
3. No conversion needed

### Simulated Function Calling (Unsupported Models)
1. Convert function calls to text format: `<function=name>...<parameter=key>value</parameter>...</function>`
2. Inject system prompt with tool descriptions
3. Add in-context learning examples
4. Model returns text with function tags
5. Parse response to extract tool calls
6. Convert back to native format

## Message Types & Serialization

### Supported Message Content
- **Text**: `{'role': 'user', 'content': 'text'}`
- **Images**: `{'role': 'user', 'content': [{'type': 'image_url', 'image_url': {'url': '...'}}]}`
- **Tool Calls**: `{'role': 'assistant', 'tool_calls': [...]}`
- **Tool Results**: `{'role': 'tool', 'content': 'result', 'tool_call_id': '...'}`

### Message Formatting
```python
# Converts Message objects to dicts with proper flags
messages_dict = llm.format_messages_for_llm(message_objects)
# Sets: cache_enabled, vision_enabled, function_calling_enabled
```

## Model-Specific Quirks Handled

| Model | Special Handling |
|-------|-----------------|
| Azure | Uses `max_tokens` instead of `max_completion_tokens` |
| Gemini | Format restrictions, safety settings, thinking budget |
| Claude Opus 4.1 | Disables thinking, can't use temperature + top_p together |
| o-series | Removes temperature/top_p, uses reasoning_effort |
| HuggingFace | Forces top_p=0.9 (doesn't support 1.0) |
| Bedrock | AWS credentials passed as parameters |
| OpenHands Proxy | Rewrites model name to litellm_proxy format |

## Token Counting

```python
# Count tokens in messages
token_count = llm.get_token_count(messages)

# With custom tokenizer
if llm.config.custom_tokenizer:
    # Uses specified tokenizer
    # Gracefully falls back to 0 if fails
```

## Registry & Multi-LLM Support

### Get LLM Instance
```python
from openhands.llm.llm_registry import LLMRegistry

registry = LLMRegistry(config)
llm = registry.get_llm('service_id', llm_config)

# One-off completion
result = registry.request_extraneous_completion(
    'service_id', llm_config, messages
)
```

### Model Routing
```python
# Routes between primary and secondary models based on:
# 1. Image presence (routes to primary)
# 2. Token count vs secondary model's limit
llm = registry.get_router(agent_config)
# Same API as regular LLM
response = llm.completion(messages)
```

## Logging & Debugging

### Enable Completion Logging
```python
config = LLMConfig(
    log_completions=True,
    log_completions_folder="/path/to/logs",
)
```

### Log File Structure
```json
{
    "messages": [...],
    "response": {...},
    "timestamp": 1234567890.0,
    "cost": 0.00123,
    "fncall_messages": [...],  // If function calling mocked
    "fncall_response": {...}
}
```

### Debug Logging
```python
# Automatically logs at DEBUG level
# log_prompt() - System and user messages
# log_response() - LLM responses with tool calls
```

## Performance Tips

1. **Enable Streaming** for long responses (lower latency perception)
2. **Use Prompt Caching** for repetitive system prompts (reduce cost)
3. **Set Reasonable Timeouts** - default None means unlimited
4. **Monitor Metrics** - track cost and token usage
5. **Use Custom Tokenizers** for accurate token counting
6. **Adjust Retry Parameters** - reduce wait times for low-rate-limit APIs
7. **Disable Vision** if not needed - reduces input size
8. **Use Function Calling** natively when supported (cheaper than simulated)

## Common Issues & Solutions

### Issue: No response choices
**Solution:** Increase temperature from 0 to 1.0 on retry (handled automatically)

### Issue: Function calling doesn't work
**Solution:** Check `is_function_calling_active()` - may need to enable simulated mode

### Issue: Vision requests are slow
**Solution:** Disable vision with `disable_vision=True` if not needed

### Issue: Rate limits exceeded
**Solution:** Increase `retry_min_wait` and `retry_max_wait`

### Issue: High costs
**Solution:** 
- Use cheaper model for text-only with `MultimodalRouter`
- Enable prompt caching
- Reduce token limits
- Monitor per-token costs with metrics

## File Locations

```
openhands/llm/
├── llm.py (main class)
├── async_llm.py (async wrapper)
├── streaming_llm.py (streaming wrapper)
├── fn_call_converter.py (function calling conversion)
├── metrics.py (cost/token/latency tracking)
├── model_features.py (feature detection)
├── retry_mixin.py (retry logic)
├── debug_mixin.py (logging)
├── llm_registry.py (instance management)
├── llm_utils.py (utilities)
├── bedrock.py (AWS support)
└── router/
    ├── base.py (RouterLLM base)
    └── rule_based/impl.py (MultimodalRouter)

openhands/core/config/
└── llm_config.py (LLMConfig class - 105 fields)
```

---

**Report Generated:** 2025-11-08  
**Total Analysis Lines:** 1,130  
**Code Coverage:** 6,642 lines of llm module code  
**Files Analyzed:** 14 core files + router module

See `LITELLM_ARCHITECTURE_ANALYSIS.md` for complete detailed documentation.
