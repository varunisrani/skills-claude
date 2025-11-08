# OpenHands LLM Architecture Analysis

## Executive Summary

The OpenHands project uses **LiteLLM** as its primary abstraction layer for Large Language Model interactions. The architecture provides a sophisticated multi-layered abstraction that supports:

- Multiple LLM providers (OpenAI, Anthropic, Gemini, Bedrock, etc.)
- Synchronous and asynchronous completions
- Streaming responses
- Function calling (both native and simulated)
- Retry logic with exponential backoff
- Comprehensive metrics tracking (cost, tokens, latency)
- Model routing capabilities
- Prompt caching support

**Total Lines of Code**: 6,642 lines across the llm directory

---

## 1. Directory Structure & Files

### Core LLM Files (11 main files)

```
openhands/llm/
├── __init__.py                    # Package exports (LLM, AsyncLLM, StreamingLLM)
├── llm.py                         # Main LLM class (842 lines)
├── async_llm.py                   # Async LLM wrapper (134 lines)
├── streaming_llm.py               # Streaming LLM implementation (117 lines)
├── retry_mixin.py                 # Retry logic mixin (101 lines)
├── debug_mixin.py                 # Debug logging mixin (74 lines)
├── fn_call_converter.py           # Function call conversion (976 lines)
├── llm_registry.py                # LLM registry management (147 lines)
├── llm_utils.py                   # Utility functions (45 lines)
├── metrics.py                     # Metrics tracking (278 lines)
├── model_features.py              # Model feature detection (143 lines)
├── bedrock.py                     # AWS Bedrock support (33 lines)
├── tool_names.py                  # Tool name constants (9 lines)
└── router/                        # Model routing system
    ├── __init__.py                # Router exports
    ├── base.py                    # RouterLLM base class (165 lines)
    └── rule_based/impl.py         # MultimodalRouter implementation (75 lines)
```

---

## 2. LiteLLM Integration & Imports

### Direct LiteLLM Imports in llm.py:

```python
import litellm
from litellm import Message as LiteLLMMessage
from litellm import ModelInfo, PromptTokensDetails
from litellm import completion as litellm_completion
from litellm import completion_cost as litellm_completion_cost
from litellm.exceptions import (
    APIConnectionError,
    RateLimitError,
    ServiceUnavailableError,
)
from litellm.types.utils import CostPerToken, ModelResponse, Usage
from litellm.utils import create_pretrained_tokenizer
```

### LiteLLM Functions Used:

1. **litellm.completion()** - Synchronous LLM completions
2. **litellm.acompletion()** - Asynchronous LLM completions
3. **litellm.token_counter()** - Token counting for messages
4. **litellm.get_model_info()** - Fetch model metadata (max tokens, capabilities)
5. **litellm.supports_vision()** - Check vision capability
6. **litellm.completion_cost()** - Calculate API costs
7. **create_pretrained_tokenizer()** - Create custom tokenizers

---

## 3. Architecture Layers & Abstraction

### Layer 1: LiteLLM (External Library)
- Raw LLM API calls
- Provider-agnostic completion interface
- Built-in cost calculation
- Multi-provider support

### Layer 2: Core LLM Classes

#### **LLM Class** (Main synchronous wrapper)
```python
class LLM(RetryMixin, DebugMixin)
```

**Key Responsibilities:**
- Wraps `litellm.completion()` with retry logic
- Manages LLM configuration
- Tracks metrics (cost, tokens, latency)
- Handles function calling conversion
- Supports prompt caching
- Manages vision capabilities
- Logs completions to disk (optional)

**Key Methods:**
- `completion()` - Returns wrapped completion function
- `init_model_info()` - Fetches model capabilities
- `get_token_count()` - Counts tokens in messages
- `_post_completion()` - Processes response, updates metrics
- `_completion_cost()` - Calculates and tracks costs
- `format_messages_for_llm()` - Serializes Message objects
- `vision_is_active()` - Checks vision capability
- `is_function_calling_active()` - Checks function calling support
- `is_caching_prompt_active()` - Checks prompt cache support

#### **AsyncLLM Class** (Async wrapper)
```python
class AsyncLLM(LLM)
```

**Key Differences:**
- Uses `litellm.acompletion()` for async completions
- Inherits all LLM functionality
- Supports user cancellation
- Includes shutdown listener integration

#### **StreamingLLM Class** (Streaming async wrapper)
```python
class StreamingLLM(AsyncLLM)
```

**Key Differences:**
- Enables `stream=True` in acompletion
- Yields chunks as async generator
- Supports streaming cancellation
- Per-chunk processing

### Layer 3: Mixins (Cross-cutting Concerns)

#### **RetryMixin**
Implements exponential backoff retry logic:
- Uses Tenacity library
- Customizable retry parameters (num_retries, multiplier, min/max wait)
- Handles specific exception types:
  - `APIConnectionError`
  - `RateLimitError`
  - `ServiceUnavailableError`
  - `litellm.Timeout`
  - `litellm.InternalServerError`
  - `LLMNoResponseError`
- Special handling for LLMNoResponseError: increases temperature to 1.0 if 0
- Supports retry listeners for external notification

#### **DebugMixin**
Provides detailed logging:
- `log_prompt()` - Logs message prompts
- `log_response()` - Logs LLM responses with tool calls
- `_format_message_content()` - Formats complex message structures
- `_format_content_element()` - Handles text, images, etc.

### Layer 4: Supporting Systems

#### **LLMRegistry**
Manages LLM instances:
- Maps service IDs to LLM instances
- Creates LLMs on demand
- Handles model routing
- Supports agent-to-LLM configuration mapping
- Notification/subscription system for registry events

#### **Metrics**
Comprehensive metrics tracking:
- Cost tracking (accumulated and per-call)
- Token usage tracking:
  - Prompt tokens
  - Completion tokens
  - Cache read tokens (from prompt cache hits)
  - Cache write tokens (cache creation)
  - Context window tracking
- Response latency tracking
- Token usage merging and diffing
- Budget limits support

#### **ModelFeatures**
Feature detection system (with pattern matching):
```python
@dataclass(frozen=True)
class ModelFeatures:
    supports_function_calling: bool
    supports_reasoning_effort: bool
    supports_prompt_cache: bool
    supports_stop_words: bool
```

**Pattern-based Detection:**
- Supports glob patterns for model name matching
- Centralized feature definitions:
  - Function calling: Claude 3.5+, GPT-4o, Gemini 2.5+, etc.
  - Reasoning effort: o1, o3, Gemini 2.5, Claude 4.5, DeepSeek R1
  - Prompt cache: Claude 3.5+, Opus 4.x
  - Stop words: All except o1 family, DeepSeek R1, Grok-4

#### **Function Calling Converter**
Converts between native and simulated function calling:

**When to Use Conversion:**
- Model doesn't support native function calling
- Agent has tools defined but model can't use them

**Conversion Process:**
1. Inject system prompt with tool descriptions
2. Convert assistant tool calls to text format: `<function=name>...<parameter=key>value</parameter>...</function>`
3. Convert model text responses back to tool call format
4. Supports in-context learning examples for guidance

**Format:**
```
<function=execute_bash>
<parameter=command>pwd</parameter>
</function>
```

---

## 4. Configuration System

### LLMConfig Class
**Location:** `openhands/core/config/llm_config.py`

**Configuration Fields (105 total):**

**Model & API:**
- `model` - Model name (default: claude-sonnet-4-20250514)
- `api_key` - Encrypted API key (SecretStr)
- `base_url` - Custom endpoint URL
- `api_version` - API version string
- `custom_llm_provider` - LiteLLM provider override

**Retry & Timing:**
- `num_retries` - Number of retries (default: 5)
- `retry_multiplier` - Exponential backoff multiplier (default: 8)
- `retry_min_wait` - Min wait time in seconds (default: 8)
- `retry_max_wait` - Max wait time in seconds (default: 64)
- `timeout` - API call timeout (default: None)

**Sampling Parameters:**
- `temperature` - Sampling temperature (default: 0.0)
- `top_p` - Nucleus sampling (default: 1.0)
- `top_k` - Top-k sampling (optional)
- `seed` - Random seed for reproducibility

**Output Control:**
- `max_input_tokens` - Context window limit (optional)
- `max_output_tokens` - Response length limit (optional)
- `max_message_chars` - Observation truncation (default: 30,000)

**Cost Tracking:**
- `input_cost_per_token` - Custom input cost (optional)
- `output_cost_per_token` - Custom output cost (optional)

**AWS Bedrock:**
- `aws_region_name` - AWS region
- `aws_access_key_id` - AWS credentials
- `aws_secret_access_key` - AWS credentials

**Feature Flags:**
- `disable_vision` - Disable vision even if supported
- `disable_stop_word` - Disable stop word injection
- `caching_prompt` - Enable prompt caching
- `native_tool_calling` - Force native/simulated function calling
- `modify_params` - Allow LiteLLM to transform params
- `drop_params` - Drop unsupported params instead of failing

**Logging & Debugging:**
- `log_completions` - Save completion logs to disk
- `log_completions_folder` - Where to save logs

**Advanced:**
- `custom_tokenizer` - Custom tokenizer for token counting
- `reasoning_effort` - Reasoning budget ('low', 'medium', 'high', 'none')
- `safety_settings` - Model-specific safety settings (Gemini, Mistral)
- `completion_kwargs` - Custom kwargs for litellm.completion()
- `for_routing` - Used in multi-model routing
- `correct_num` - LLM draft editor correction attempts

**OpenRouter Settings:**
- `openrouter_site_url` - Site URL for headers
- `openrouter_app_name` - App name for headers

---

## 5. API Calling Patterns

### Synchronous Completion (LLM class)

```python
# Basic usage
llm = LLM(config, service_id='agent')
response = llm.completion(
    messages=[
        {'role': 'system', 'content': 'You are helpful.'},
        {'role': 'user', 'content': 'Hello!'}
    ]
)

# With tools (function calling)
response = llm.completion(
    messages=messages,
    tools=[
        {
            'type': 'function',
            'function': {
                'name': 'execute_bash',
                'description': 'Execute bash command',
                'parameters': {
                    'type': 'object',
                    'properties': {...}
                }
            }
        }
    ]
)

# Response structure (from LiteLLM)
response = {
    'id': 'chatcmpl-...',
    'choices': [{
        'message': {
            'content': 'Response text',
            'tool_calls': [...]  # If function calling
        }
    }],
    'usage': {
        'prompt_tokens': 100,
        'completion_tokens': 50
    }
}
```

### Asynchronous Completion (AsyncLLM class)

```python
# Async non-streaming
llm = AsyncLLM(config, service_id='agent')
response = await llm.async_completion(
    messages=messages
)

# Supports cancellation
config.on_cancel_requested_fn = async_cancel_check_fn
```

### Streaming Completion (StreamingLLM class)

```python
llm = StreamingLLM(config, service_id='agent')
async for chunk in llm.async_streaming_completion(
    messages=messages
):
    content = chunk['choices'][0]['delta'].get('content', '')
    print(content, end='', flush=True)

# Chunk structure
chunk = {
    'choices': [{
        'delta': {
            'content': 'streamed text'  # Partial content
        }
    }]
}
```

### Completion Wrapper Architecture

The `completion` property returns a wrapped function that:

1. **Message Handling**
   - Accepts both Message objects and dicts
   - Converts Message objects to dicts via `format_messages_for_llm()`
   - Sets flags: cache_enabled, vision_enabled, function_calling_enabled

2. **Function Calling Conversion**
   - Detects if native function calling is unavailable
   - If simulated: converts function-calling messages to text format
   - Injects system prompt with tool descriptions
   - Adds in-context learning examples

3. **Parameter Setup**
   - Builds kwargs from config settings
   - Handles model-specific parameters:
     - Gemini: thinking budget, safety settings
     - Claude Opus 4.1: disabled thinking, no temperature+top_p combo
     - Azure: uses `max_tokens` instead of `max_completion_tokens`
     - o-series: removes temperature, top_p, uses reasoning_effort
   - Handles OpenHands provider rewriting

4. **LiteLLM Call**
   - Uses pre-built partial function with all parameters
   - Calls underlying `litellm.completion()`
   - Wraps with retry decorator

5. **Response Processing**
   - Checks for valid choices
   - Converts mocked function calls back to native format if needed
   - Posts metrics and costs
   - Logs completion data (if enabled)
   - Returns ModelResponse

---

## 6. Streaming Response Handling

### Streaming Architecture

```python
# In StreamingLLM.__init__()
self._async_streaming_completion = partial(
    self._call_acompletion,
    model=...,
    stream=True,  # KEY: Enable streaming
    ...
)
```

### Streaming Wrapper

```python
async def async_streaming_completion_wrapper(*args, **kwargs):
    # 1. Message preparation
    # 2. Logging
    # 3. Call acompletion
    resp = await async_streaming_completion_unwrapped(*args, **kwargs)
    
    # 4. Iterate over chunks
    async for chunk in resp:
        # 5. Check for cancellation
        if config.on_cancel_requested_fn and await config.on_cancel_requested_fn():
            raise UserCancelledError(...)
        
        # 6. Extract content from delta (not message)
        message_back = chunk['choices'][0]['delta'].get('content', '')
        
        # 7. Log and post metrics per chunk
        self.log_response(message_back)
        self._post_completion(chunk)
        
        # 8. Yield chunk to caller
        yield chunk
```

### Key Differences: Delta vs Message

| Field | Non-streaming | Streaming |
|-------|---------------|-----------|
| Response field | `choices[0]['message']` | `choices[0]['delta']` |
| Content key | `'content'` | `'content'` |
| Structure | Complete message | Partial increment |

---

## 7. Error Handling & Retry Logic

### Retry Decorator Pattern

```python
@self.retry_decorator(
    num_retries=config.num_retries,
    retry_exceptions=(
        APIConnectionError,
        RateLimitError,
        ServiceUnavailableError,
        litellm.Timeout,
        litellm.InternalServerError,
        LLMNoResponseError,
    ),
    retry_min_wait=config.retry_min_wait,
    retry_max_wait=config.retry_max_wait,
    retry_multiplier=config.retry_multiplier,
    retry_listener=retry_listener,
)
def wrapper(*args, **kwargs):
    # Actual completion call
    ...
```

### Retry Configuration

**Default Values:**
- Retries: 5 attempts
- Total wait time: 8 + 16 + 32 + 64 = 120 seconds
- Formula: `min(retry_min_wait * (multiplier ** (attempt - 1)), retry_max_wait)`

**Special Cases:**
- **LLMNoResponseError**: Increases temperature from 0 to 1.0 on retry
- **Rate limiting**: Respects rate limit reset headers
- **Service unavailable**: Exponential backoff

### Exception Handling

**Caught Exceptions:**
- `APIConnectionError` - Network issues
- `RateLimitError` - Rate limit exceeded (429)
- `ServiceUnavailableError` - Service down (503)
- `litellm.Timeout` - Request timeout
- `litellm.InternalServerError` - Provider error (500)
- `LLMNoResponseError` - No valid response choices

**Propagated Exceptions:**
- All other exceptions after retries exhausted
- Retry info attached: `exception.retry_attempt`, `exception.max_retries`

---

## 8. Token Counting & Usage Tracking

### Token Counting

```python
def get_token_count(self, messages):
    try:
        return int(litellm.token_counter(
            model=self.config.model,
            messages=messages,
            custom_tokenizer=self.tokenizer,
        ))
    except Exception as e:
        logger.error(f'Error getting token count: {e}')
        return 0
```

**Features:**
- Supports custom tokenizers
- Handles Message objects conversion
- Graceful fallback to 0 on error
- Works with both dict and Message formats

### Metrics Tracking System

#### **TokenUsage Class**
Tracks per-call token usage:
```python
class TokenUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    cache_read_tokens: int          # Prompt cache hits
    cache_write_tokens: int         # Prompt cache writes
    context_window: int             # Model's max input tokens
    per_turn_token: int             # prompt + completion
```

#### **Metrics Class**
Aggregates usage across session:
```python
class Metrics:
    _accumulated_cost: float
    _costs: list[Cost]              # Per-call costs
    _response_latencies: list[ResponseLatency]
    _token_usages: list[TokenUsage]
    _accumulated_token_usage: TokenUsage
```

**Key Methods:**
- `add_cost()` - Track API costs
- `add_token_usage()` - Record per-call token usage
- `add_response_latency()` - Track round-trip time
- `merge()` - Combine metrics from multiple sources
- `diff()` - Calculate delta vs baseline
- `get()` - Export as dictionary
- `log()` - Format for logging

#### **Response Latency Tracking**

```python
# In wrapper function
start_time = time.time()
resp = self._completion_unwrapped(*args, **kwargs)
latency = time.time() - start_time
self.metrics.add_response_latency(latency, response_id)
```

Records per-response latency for performance monitoring.

#### **Cost Calculation**

```python
def _completion_cost(self, response):
    # 1. Try to get cost from response headers
    # 2. Use litellm.completion_cost()
    # 3. Fallback with modified model name
    # 4. Handle custom cost per token
    
    cost = litellm_completion_cost(
        completion_response=response,
        custom_cost_per_token=CostPerToken(
            input_cost_per_token=...,
            output_cost_per_token=...
        )
    )
    self.metrics.add_cost(cost)
```

**Supported Sources:**
- Response headers: `llm_provider-x-litellm-response-cost`
- LiteLLM calculation via model name
- Custom cost per token overrides
- Falls back to 0.0 if not supported

---

## 9. Model-Specific Features & Handling

### Vision Support

```python
def vision_is_active(self):
    return not self.config.disable_vision and self._supports_vision()

def _supports_vision(self):
    # 1. Check env override: OPENHANDS_FORCE_VISION
    # 2. Check litellm.supports_vision()
    # 3. Check model_info.supports_vision
    # 4. Handle provider prefixes (openai/, anthropic/)
```

**Models with Vision:**
- GPT-4 Vision
- Claude 3.5 Sonnet/Haiku
- Gemini models
- Others detected via LiteLLM

### Prompt Caching

```python
def is_caching_prompt_active(self):
    return (self.config.caching_prompt and 
            get_features(self.config.model).supports_prompt_cache)
```

**Supported Models:**
- Claude 3.5 Sonnet/Haiku
- Claude 3 Haiku
- Claude 3 Opus
- Claude Sonnet 4.x

**How it Works:**
1. Flag is passed to Message formatting
2. Messages include cache_control breakpoints
3. LiteLLM handles cache headers to provider
4. Metrics track cache hits/writes

### Function Calling Support

```python
def is_function_calling_active(self):
    features = get_features(self.config.model)
    if self.config.native_tool_calling is None:
        return features.supports_function_calling
    return self.config.native_tool_calling
```

**Native Support:**
- Claude 3.5+, Sonnet 4+, Opus 4+
- GPT-4o, GPT-5
- Gemini 2.5+
- Others (Qwen, DeepSeek, Kimi)

**Simulated Support:**
Models without native support get function calling via:
1. System prompt injection with tool descriptions
2. Text-based function call format
3. Response parsing to extract tool calls

### Reasoning Models

```python
# Special handling for reasoning effort
if features.supports_reasoning_effort:
    # Gemini 2.5-pro: uses thinking budget instead
    if 'gemini-2.5-pro' in model:
        kwargs['thinking'] = {'budget_tokens': 128}
    # Claude 4.5: disable reasoning_effort
    elif 'claude-sonnet-4-5' in model:
        kwargs.pop('reasoning_effort', None)
    # Others: pass through
    else:
        kwargs['reasoning_effort'] = self.config.reasoning_effort
```

**Models Supporting Reasoning Effort:**
- o1, o1-2024-12-17
- o3, o3-mini
- o4-mini
- Gemini 2.5 Flash/Pro
- GPT-5
- DeepSeek R1
- Claude 4.5 Sonnet/Haiku

### Provider-Specific Handling

**Azure:**
```python
if self.config.model.startswith('azure'):
    kwargs['max_tokens'] = max_output_tokens  # Not max_completion_tokens
    kwargs.pop('max_completion_tokens')
```

**OpenHands Provider (Custom Proxy):**
```python
if self.config.model.startswith('openhands/'):
    model_name = self.config.model.removeprefix('openhands/')
    self.config.model = f'litellm_proxy/{model_name}'
    self.config.base_url = 'https://llm-proxy.app.all-hands.dev/'
```

**Gemini:**
```python
# Limit format support
if 'gemini' in model.lower():
    # Remove default fields and unsupported formats
    # Only supports 'enum' and 'date-time' for STRING types
    tools = check_tools(tools, llm_config)
```

**Hugging Face:**
```python
if model.startswith('huggingface'):
    # HF doesn't support OpenAI default top_p (1)
    config.top_p = 0.9 if config.top_p == 1 else config.top_p
```

**Anthropic (Claude Opus 4.1):**
```python
if 'claude-opus-4-1' in model.lower():
    # Disable extended thinking
    kwargs['thinking'] = {'type': 'disabled'}
    
    # Cannot accept both temperature and top_p
    if 'temperature' in kwargs and 'top_p' in kwargs:
        kwargs.pop('top_p', None)  # Prefer temperature
```

**AWS Bedrock:**
```python
kwargs['aws_region_name'] = config.aws_region_name
kwargs['aws_access_key_id'] = config.aws_access_key_id.get_secret_value()
kwargs['aws_secret_access_key'] = config.aws_secret_access_key.get_secret_value()
```

---

## 10. Message Formatting

### Message Serialization

```python
def format_messages_for_llm(self, messages):
    for message in messages:
        # Set context flags
        message.cache_enabled = self.is_caching_prompt_active()
        message.vision_enabled = self.vision_is_active()
        message.function_calling_enabled = self.is_function_calling_active()
        
        # Model-specific serialization
        if 'deepseek' in model:
            message.force_string_serializer = True
        if 'kimi-k2-instruct' in model and 'groq' in model:
            message.force_string_serializer = True
    
    # Convert to dicts via Pydantic
    return [msg.model_dump() for msg in messages]
```

### Message Content Types Supported

Via Message class:
- **Text**: Plain string content
- **Images**: Base64 or URL-based (vision-enabled only)
- **Tool Calls**: Function calling format (if enabled)
- **Tool Results**: Execution output

---

## 11. LLM Registry & Multi-LLM Management

### Registry Pattern

```python
class LLMRegistry:
    def __init__(self, config, agent_cls=None, retry_listener=None):
        self.service_to_llm: dict[str, LLM] = {}
        self.active_agent_llm: LLM = self.get_llm('agent', llm_config)

    def get_llm(self, service_id, config):
        # Return existing or create new LLM
        return self.service_to_llm.get(service_id) or self._create_new_llm(...)

    def request_extraneous_completion(self, service_id, config, messages):
        # One-off completions for specific services
        llm = self.get_llm(service_id, config)
        return llm.completion(messages=messages)
```

### Model Routing

```python
class RouterLLM(LLM):
    def __init__(self, agent_config, llm_registry):
        self.primary_llm = llm_registry.get_llm('agent', agent_config)
        self.llms_for_routing = {
            name: llm_registry.get_llm(name, config)
            for name, config in agent_config.model_routing.llms_for_routing.items()
        }

    @property
    def completion(self):
        def router_completion(*args, **kwargs):
            selected_llm_key = self._select_llm(messages)
            selected_llm = self._get_llm_by_key(selected_llm_key)
            return selected_llm.completion(*args, **kwargs)
        return router_completion

    @abstractmethod
    def _select_llm(self, messages):
        # Subclasses implement routing logic
        pass
```

### MultimodalRouter

```python
class MultimodalRouter(RouterLLM):
    def _select_llm(self, messages):
        # Route to primary if:
        # - Messages contain images
        # - Token count exceeds secondary model's limit
        # Otherwise: use secondary (cheaper) model
        
        for message in messages:
            if message.contains_image:
                return 'primary'
        
        if self.max_token_exceeded:
            return 'primary'
        
        secondary_llm = self.available_llms.get('secondary_model')
        if secondary_llm and secondary_llm.get_token_count(messages) > secondary_llm.config.max_input_tokens:
            return 'primary'
        
        return 'secondary_model'
```

---

## 12. Completion Logging

### Log Structure

When `log_completions=True`:

```python
{
    'messages': [...],           # Processed messages sent
    'response': {...},           # ModelResponse from API
    'args': [...],              # Positional args
    'kwargs': {...},            # Keyword args (excluding 'client')
    'timestamp': 1234567890.0,  # Unix timestamp
    'cost': 0.00123,            # Calculated cost
    
    # If function calling was mocked:
    'fncall_messages': [...],   # Original function-calling format
    'fncall_response': {...},   # Response before conversion
}
```

**File Naming:** `{model_name_escaped}-{timestamp}.json`

Example: `claude__sonnet__4-1699564234.123.json`

---

## 13. Integration Points Across Codebase

### Where LLM Completions Are Called

1. **Agents**
   - `codeact_agent/codeact_agent.py` - Main agent loop
   - `browsing_agent/browsing_agent.py` - Web browsing
   - `visualbrowsing_agent/visualbrowsing_agent.py` - Visual browsing

2. **Memory Systems**
   - `memory/conversation_memory.py` - Compress conversations
   - `memory/condenser/impl/llm_*.py` - Various condensing strategies

3. **Resolvers**
   - `resolver/send_pull_request.py` - Generate PR descriptions
   - `resolver/interfaces/issue_definitions.py` - Analyze issues

4. **Runtime**
   - `runtime/utils/edit.py` - LLM-based file editing

5. **Tests**
   - `tests/unit/llm/` - Comprehensive unit tests
   - `tests/unit/agenthub/` - Agent integration tests

---

## 14. Key Design Patterns

### 1. **Partial Function Pattern**
```python
self._completion = partial(
    litellm_completion,
    model=...,
    api_key=...,
    base_url=...,
    **kwargs
)
```
Pre-populates common parameters, overridable per-call.

### 2. **Wrapper Pattern with Decorators**
```python
@self.retry_decorator(...)
def wrapper(*args, **kwargs):
    # Logging, conversion, retry logic
    resp = self._completion_unwrapped(*args, **kwargs)
    # Post-processing, metrics
    return resp

self._completion = wrapper
```

### 3. **Property-Based Access**
```python
@property
def completion(self) -> Callable:
    return self._completion
```
Provides clean API: `llm.completion(messages=...)`

### 4. **Mixin for Concerns**
- `RetryMixin` - Retry logic
- `DebugMixin` - Logging
Separates concerns while maintaining single inheritance.

### 5. **Abstract Base for Routing**
```python
class RouterLLM(LLM):
    @abstractmethod
    def _select_llm(self, messages):
        pass

class MultimodalRouter(RouterLLM):
    def _select_llm(self, messages):
        # Implementation
```

### 6. **Registry Pattern**
Single source of truth for LLM instances per service_id.

### 7. **Feature Detection with Patterns**
Pattern matching for model names instead of hardcoded checks:
```python
model_matches(model, ['claude-3-5-*', 'gpt-4o-*'])
```

---

## 15. Performance Considerations

### Token Counting Optimization
- Uses custom tokenizers when specified
- Falls back gracefully if unsupported
- Reduces token count errors

### Latency Tracking
- Per-response measurement
- Helps identify slow models
- Useful for cost-performance tradeoffs

### Cost Optimization
- Tracks per-model costs
- Supports custom cost overrides
- Helps enforce budgets

### Streaming Benefits
- Lower first-token latency
- Better UX for long responses
- Can cancel mid-stream

### Retry Optimization
- Exponential backoff prevents API abuse
- Respects rate limits
- Special handling for temperature on empty responses

---

## 16. Security Considerations

### Credential Management
- Uses Pydantic `SecretStr` for sensitive data
- Credentials in environment variables
- Never logged in completion logs (kwargs filtered)

### Provider Support
- Isolated provider configs
- Custom SSL options via base_url
- AWS IAM credentials support

### Input Validation
- Pydantic validates all LLMConfig fields
- Message validation via Message class
- Tool schema validation

---

## 17. Testing Infrastructure

### Test Files
- `test_llm.py` - Core LLM functionality
- `test_acompletion.py` - Async/streaming tests
- `test_api_connection_error_retry.py` - Retry logic
- `test_model_features.py` - Feature detection
- `test_litellm_proxy_model_parsing.py` - Proxy handling
- `test_llm_fncall_converter.py` - Function calling conversion

### Mock Patterns
```python
# Mock LiteLLM calls
with patch.object(LLM, '_completion_unwrapped') as mock:
    mock.return_value = {'choices': [...]}
    # Test LLM logic without real API calls

# Test async
@pytest.mark.asyncio
async def test_async_completion():
    with patch.object(AsyncLLM, '_call_acompletion'):
        ...
```

---

## 18. Summary: Key Takeaways

### Strengths
1. **Clean abstraction** over LiteLLM with well-defined layers
2. **Comprehensive metrics** for cost, tokens, latency
3. **Flexible function calling** with fallback for unsupported models
4. **Provider-agnostic** supporting 50+ LLM providers
5. **Robust retry logic** with exponential backoff
6. **Async/streaming** support for better UX
7. **Model-aware** handling of provider-specific quirks
8. **Extensible** via mixins and base classes

### Key Responsibilities
1. **LLM class** - Main wrapper, config management, metrics
2. **LiteLLM** - Raw API calls, provider abstraction
3. **Converters** - Function calling format conversion
4. **Registry** - Multi-LLM instance management
5. **Metrics** - Cost, token, latency tracking
6. **Config** - Centralized settings management

### Critical Flows
1. **Initialization** - Load config, fetch model info, initialize partial function
2. **Completion** - Prepare messages → convert if needed → call litellm → track metrics → return
3. **Streaming** - Same as completion but yields chunks via async generator
4. **Retry** - Decorator intercepts errors, exponential backoff, retry with new params
5. **Metrics** - Post-processing aggregates cost, tokens, latency into Metrics object

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                             │
│           (Agents, Resolvers, Memory Systems)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ messages, tools
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Registry Layer                                │
│              (LLMRegistry, RouterLLM)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ route/select
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LLM Classes Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │     LLM      │  │  AsyncLLM    │  │  StreamingLLM    │      │
│  │  (sync)      │  │  (async)     │  │  (async stream)  │      │
│  └──────────────┘  └──────────────┘  └──────────────────┘      │
│         ▲ inherits/extends from above                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ with retry, logging, metrics
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Mixin Layer (Cross-cutting)                         │
│  ┌──────────────────┐          ┌──────────────────────┐        │
│  │  RetryMixin      │          │   DebugMixin         │        │
│  │  (tenacity)      │          │   (logging)          │        │
│  └──────────────────┘          └──────────────────────┘        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ completion call
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Supporting Systems Layer                            │
│  ┌──────────────────┐  ┌──────────┐  ┌──────────────────┐      │
│  │  Metrics         │  │  Config  │  │  ModelFeatures   │      │
│  │  (cost, tokens)  │  │(LLMConfig)  │  (pattern match)  │      │
│  └──────────────────┘  └──────────┘  └──────────────────┘      │
│  ┌──────────────────┐  ┌──────────────────────────────────┐    │
│  │ FnCall Converter │  │    Message Formatting            │    │
│  │(format convert)  │  │   (vision, cache, tools)         │    │
│  └──────────────────┘  └──────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ litellm_completion, acompletion
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LiteLLM Library                               │
│          (External abstraction over LLM providers)               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ API calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│               LLM Provider APIs                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ OpenAI   │  │ Anthropic│  │ Google   │  │   AWS    │  ...  │
│  │ (GPT-4o) │  │ (Claude) │  │ (Gemini) │  │(Bedrock) │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

