# Phase 5: OpenHands LLM Module Architecture Analysis & Implementation Plan

**Date:** 2025-11-08
**Phase:** 5 (LLM Module Strategy & Implementation)
**Duration:** 2-3 weeks
**Effort:** Medium-High
**Priority:** CRITICAL BLOCKER

---

## EXECUTIVE SUMMARY

The OpenHands LLM module is a 1,500+ LOC abstraction layer around LiteLLM that provides:
- Multi-provider LLM support (OpenAI, Anthropic, Google, etc.)
- Cost tracking and token management
- Retry logic with exponential backoff
- Function calling conversion for models without native support
- Streaming and async support
- Model feature detection (vision, reasoning, prompt caching)

**Key Finding:** The module is deeply integrated across the codebase (35+ files) but SDK agents are designed to bypass it entirely through ClaudeSDKAdapter.

**Three Architecture Options Exist** with different trade-offs:
- **Option A:** Keep LLM module as abstraction, add SDK backend
- **Option B:** Replace entirely with Claude SDK
- **Option C:** Split paths during migration (RECOMMENDED)

---

## SECTION 1: LLM MODULE STRUCTURE ANALYSIS

### 1.1 File-by-File Breakdown

#### Core Files (Required for LLM functionality)

**llm.py (841 lines)**
- Main LLM class inheriting from RetryMixin, DebugMixin
- Initialization: Reads config, sets up LiteLLM completion function
- Key methods:
  - `__init__()`: Configures model, temperature, parameters
  - `completion`: Property returning wrapped litellm_completion
  - `init_model_info()`: Fetches model metadata
  - `vision_is_active()`: Checks vision support
  - `is_function_calling_active()`: Checks native tool support
  - `is_caching_prompt_active()`: Checks prompt caching support
  - `get_token_count()`: Uses litellm tokenizer
  - `_completion_cost()`: Calculates cost using litellm
  - `format_messages_for_llm()`: Converts Message objects to dicts

**Key Dependencies:**
```python
import litellm
from litellm import completion as litellm_completion
from litellm import completion_cost as litellm_completion_cost
from litellm.exceptions import (APIConnectionError, RateLimitError, ServiceUnavailableError)
```

**LiteLLM Integration Points:**
1. Wraps `litellm.completion()` with retry logic
2. Uses `litellm.token_counter()` for token counting
3. Uses `litellm.get_model_info()` for model metadata
4. Uses `litellm.supports_vision()` for vision detection
5. Exception handling: APIConnectionError, RateLimitError, ServiceUnavailableError

---

**async_llm.py (133 lines)**
- Extends LLM for async support
- Wraps `litellm.acompletion()` function
- Method: `async_completion` property
- Uses same retry decorator as LLM class

**streaming_llm.py (117 lines)**
- Extends AsyncLLM for streaming
- Wraps `litellm.acompletion()` with `stream=True`
- Method: `async_streaming_completion` property
- Yields chunks as they arrive

---

**llm_registry.py (147 lines)**
- Registry pattern for LLM instances
- Key class: `LLMRegistry`
- Methods:
  - `get_llm()`: Get or create LLM instance
  - `get_llm_from_agent_config()`: Create LLM from agent config
  - `request_extraneous_completion()`: One-off completion
  - `get_router()`: Get RouterLLM instance
  - `subscribe()`: Notify on LLM creation

**Used By:**
- Agent base class (injected in __init__)
- AgentController
- All legacy agents
- Memory/condenser components

---

**Mixin Files (Cross-cutting Concerns)**

**retry_mixin.py (101 lines)**
- RetryMixin class providing retry logic
- `retry_decorator()`: Creates tenacity-based retry decorator
- Exceptions: APIConnectionError, RateLimitError, ServiceUnavailableError, Timeout
- Default: 3 retries with exponential backoff
- Special handling: Temperature adjustment for LLMNoResponseError

**debug_mixin.py (74 lines)**
- DebugMixin class for logging
- `log_prompt()`: Logs input messages
- `log_response()`: Logs LLM response
- Formats messages and extracts tool calls
- Separates prompt/response logging channels

---

**Support Files**

**fn_call_converter.py (976 lines)**
- Converts function calling ↔ non-function calling messages
- For models without native tool support
- Key functions:
  - `convert_fncall_messages_to_non_fncall_messages()`: Add prompts for tool calling
  - `convert_non_fncall_messages_to_fncall_messages()`: Parse tool calls from text
  - `convert_from_multiple_tool_calls_to_single_tool_call_messages()`: Normalize format
- Used by: llm.py completion wrapper
- Formats: XML-style function calls with parameters

**model_features.py (143 lines)**
- Feature detection for models
- ModelFeatures dataclass: supports_function_calling, supports_reasoning_effort, supports_prompt_cache, supports_stop_words
- Pattern matching for model names
- Patterns include: Claude (all variants), GPT-4/GPT-5, Gemini, o1/o3, Deepseek, etc.

**metrics.py (278 lines)**
- Cost and usage tracking
- Classes: Cost, ResponseLatency, TokenUsage, Metrics
- Tracks: accumulated_cost, token_usage, response_latencies, cache_stats
- Methods: add_cost(), add_response_latency(), add_token_usage(), diff(), merge()

**llm_utils.py (45 lines)**
- Utility: `check_tools()` - Validates and modifies tools for Gemini compatibility
- Removes default fields and unsupported formats from tool definitions

**tool_names.py (9 lines)**
- Constants: EXECUTE_BASH_TOOL_NAME, STR_REPLACE_EDITOR_TOOL_NAME, etc.

**bedrock.py (33 lines)**
- AWS Bedrock model listing
- `list_foundation_models()`: List available Bedrock models
- `remove_error_modelId()`: Filter invalid models

---

### 1.2 Router System

**router/base.py (165 lines)**
- RouterLLM base class for multi-LLM routing
- Inherits from LLM
- Methods:
  - `_select_llm()`: Abstract method for routing logic
  - `completion`: Property that routes to selected LLM
  - `__getattr__()`: Delegates to current LLM

**router/rule_based/impl.py**
- MultimodalRouter: Routes based on message content
- Selects fast model for text, slow model for multimodal

---

### 1.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    LLM Module Architecture              │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐
│   Config Layer   │
│  LLMConfig (✓)   │ ← From openhands.core.config
└────────┬─────────┘
         │
┌────────▼─────────────────────────────────────────┐
│           LLMRegistry                            │
│  - Creates/manages LLM instances                 │
│  - Handles subscriptions                         │
│  - Returns RouterLLM when routing enabled        │
└────────┬────────────────────────────────────────┘
         │
         ├─────────────────┬──────────────────┬──────────┐
         │                 │                  │          │
         ▼                 ▼                  ▼          ▼
     ┌────────┐      ┌──────────┐      ┌─────────┐  ┌──────┐
     │  LLM   │      │AsyncLLM  │      │Streaming│  │Router│
     │        │      │          │      │  LLM    │  │ LLM  │
     └────────┘      └──────────┘      └─────────┘  └──────┘
         │                │                 │
         └────────────────┴─────────────────┘
                      │
         ┌────────────┴─────────────┬───────────┐
         │                          │           │
         ▼                          ▼           ▼
    ┌─────────────┐        ┌──────────┐   ┌────────────┐
    │ RetryMixin  │        │DebugMixin│   │Mixins      │
    │ - Retry     │        │ - Logging│   │ + Init     │
    │ - Exponential│       │ - Parsing│   │ - Features │
    │   backoff   │        │ - Format │   │ - Metrics  │
    └─────────────┘        └──────────┘   └────────────┘
         │                      │
         └──────────────────────┴───────────────────┐
                                                    │
         ┌──────────────────────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────────────────┐
    │         LiteLLM Wrapper Layer                │
    │  - litellm.completion()                      │
    │  - litellm.acompletion() (async)             │
    │  - litellm.token_counter()                   │
    │  - litellm.get_model_info()                  │
    │  - litellm.supports_vision()                 │
    │  - litellm.supports_function_calling()       │
    └──────────────────────────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────────────────┐
    │         Conversion/Utilities Layer           │
    │  - fn_call_converter.py                      │
    │  - model_features.py                         │
    │  - metrics.py                                │
    │  - llm_utils.py                              │
    └──────────────────────────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────────────────┐
    │      External LLM Providers                  │
    │  - OpenAI (gpt-4, gpt-5)                     │
    │  - Anthropic (claude-*)                      │
    │  - Google (gemini-*)                         │
    │  - Others (bedrock, openrouter, etc.)        │
    └──────────────────────────────────────────────┘
```

---

## SECTION 2: DEPENDENCY ANALYSIS

### 2.1 Reverse Dependency Map

**Files importing from llm module:**

```
openhands/llm/ (10 files)
├── llm.py (841 LOC)
├── async_llm.py (133 LOC) → imports LLM, LLM_RETRY_EXCEPTIONS
├── streaming_llm.py (117 LOC) → imports AsyncLLM
├── llm_registry.py (147 LOC) → imports LLM
├── retry_mixin.py (101 LOC)
├── debug_mixin.py (74 LOC)
├── metrics.py (278 LOC)
├── model_features.py (143 LOC)
├── fn_call_converter.py (976 LOC)
├── llm_utils.py (45 LOC)
└── router/ (base.py, impl.py) → import LLM

AGENTS (6 total)
├── codeact_agent.py (LEGACY) → imports LLMRegistry, LLM
├── codeact_agent_sdk.py (SDK) → imports LLMRegistry only
├── browsing_agent.py (LEGACY) → imports LLMRegistry, LLM
├── browsing_agent_sdk.py (SDK) → imports LLMRegistry only
├── readonly_agent.py (LEGACY) → imports LLMRegistry
├── readonly_agent_sdk.py (SDK) → imports LLMRegistry only
├── loc_agent.py (LEGACY) → imports LLMRegistry
├── visualbrowsing_agent.py (LEGACY) → imports LLMRegistry
└── dummy_agent/agent.py (LEGACY) → imports LLMRegistry

MEMORY/CONDENSER (10 files)
├── llm_summarizing_condenser.py → imports LLM
├── llm_attention_condenser.py → imports LLM
├── amortized_forgetting_condenser.py → imports LLM
├── structured_summary_condenser.py → imports LLM
└── others → imports LLMRegistry

INFRASTRUCTURE (5 files)
├── agent_factory.py → imports LLMRegistry
├── agent_controller.py → imports LLMRegistry
├── runtime/base.py → imports LLMRegistry
├── server/session/agent_session.py → imports LLMRegistry
└── controller/agent.py (base class) → imports LLMRegistry

OTHER (10+ files)
├── utils/llm.py → imports LLM
├── utils/conversation_summary.py → imports LLM
├── resolver/* → imports LLM
├── runtime/impl/* → imports LLMRegistry
└── server/* → imports LLMRegistry

TOTAL: ~50 files depend on llm module
```

### 2.2 Import Dependency Graph

**Critical Path:**
```
LLMRegistry (entry point)
    ├── creates LLM instances
    ├── creates RouterLLM instances
    └── manages lifecycle

LLM (core class)
    ├── uses RetryMixin (retry logic)
    ├── uses DebugMixin (logging)
    ├── imports fn_call_converter (function calling)
    ├── imports model_features (feature detection)
    ├── wraps litellm.completion() (actual LLM calls)
    └── uses metrics (cost tracking)

AsyncLLM (extends LLM)
    ├── wraps litellm.acompletion()
    └── used by memory/condenser components

StreamingLLM (extends AsyncLLM)
    └── used for streaming responses

RouterLLM (extends LLM)
    ├── manages multiple LLM instances
    └── selects based on routing logic
```

### 2.3 Integration Points with LiteLLM

| Component | Integration | Usage |
|-----------|-----------|-------|
| **litellm.completion()** | Main completion API | Wrapped with retry logic |
| **litellm.acompletion()** | Async completion API | Used by AsyncLLM, StreamingLLM |
| **litellm.token_counter()** | Token counting | get_token_count() method |
| **litellm.get_model_info()** | Model metadata | init_model_info() |
| **litellm.supports_vision()** | Vision detection | vision_is_active() |
| **litellm.exceptions** | Error handling | Retry on specific exceptions |
| **ChatCompletionToolParam** | Type definitions | Tool definitions |
| **ModelResponse** | Response object | Type for completion response |

### 2.4 Exception Handling

```python
LLM_RETRY_EXCEPTIONS = (
    APIConnectionError,        # Network issues
    RateLimitError,            # 429 Too Many Requests
    ServiceUnavailableError,   # 503 Service Unavailable
    litellm.Timeout,           # Timeout
    litellm.InternalServerError,  # 5xx errors
    LLMNoResponseError,        # Custom: Empty response
)
```

**Special Handling for LLMNoResponseError:**
- Retry with temperature=1.0 (was 0.0)
- Log warning
- Re-raise if max retries exceeded

---

## SECTION 3: SDK AGENT INTEGRATION STATUS

### 3.1 How SDK Agents Work

**Current Architecture:**
```
SDK Agent (e.g., CodeActAgentSDK)
    │
    ├── Extends: Agent base class (for compatibility)
    │
    └── Uses: ClaudeSDKAdapter
            │
            ├── Wraps: ClaudeSDKClient
            │
            ├── Converts: State → Prompt
            │
            ├── Manages: Messages/Observations
            │
            └── Maps: SDK Tools → OpenHands Actions
```

**Key Design:**
- SDK agents BYPASS the LLM module entirely
- They use ClaudeSDKAdapter (bridge layer)
- ClaudeSDKAdapter uses claude_agent_sdk.ClaudeSDKClient directly
- **No LiteLLM dependency** in SDK path

**SDK Agent Examples:**

1. **CodeActAgentSDK**
   - Uses: ClaudeSDKAdapter
   - Tools: Read, Grep, Glob, Bash, Write, Edit, Jupyter
   - MCP Servers: Jupyter, Browser
   - ~288 LOC (vs 300 LOC legacy)

2. **BrowsingAgentSDK**
   - Uses: ClaudeSDKAdapter
   - Tools: Browser MCP tools only
   - MCP Servers: Browser
   - ~272 LOC (vs 229 LOC legacy)

3. **ReadOnlyAgentSDK**
   - Uses: ClaudeSDKAdapter
   - Tools: Read, Grep, Glob only
   - ~291 LOC (vs 88 LOC legacy)

### 3.2 Legacy Agents (Still Using LLM)

These still use the LLM module:

1. **CodeActAgent (Legacy)** - 300 LOC
   - Uses: self.llm.completion()
   - Tools: All via function calling
   - Fallback to non-function-calling messages

2. **BrowsingAgent (Legacy)** - 229 LOC
   - Uses: self.llm.completion()
   - Tools: Browser tools

3. **ReadOnlyAgent (Legacy)** - 88 LOC
   - Uses: self.llm.completion()
   - Tools: Read-only tools

4. **LocAgent (Legacy)** - 45 LOC
   - Uses: self.llm.completion()
   - No SDK version yet

5. **VisualBrowsingAgent (Legacy)** - 414 LOC
   - Uses: self.llm.completion()
   - Vision-specific features

### 3.3 Dual-Path Architecture Currently In Use

```python
# Agent selection happens in agent_factory.py
if agent_type == 'codeact':
    if use_sdk:
        return CodeActAgentSDK(config, llm_registry)  # No LLM used
    else:
        return CodeActAgent(config, llm_registry)      # Uses LLM
```

**Status:** Already supports both paths!

---

## SECTION 4: LITELLM USAGE ANALYSIS

### 4.1 What LiteLLM Provides

**Unified API Across Providers:**
```python
# Same code, different models:
response = litellm.completion(
    model="openai/gpt-4",
    messages=[...],
)

response = litellm.completion(
    model="anthropic/claude-sonnet-4-5-20250929",
    messages=[...],
)

response = litellm.completion(
    model="google/gemini-2.5-pro",
    messages=[...],
)
```

**Features Supported:**
- Completion API (non-streaming, streaming, async)
- Function calling (native and mocked)
- Vision (image uploads)
- Prompt caching (for supported models)
- Token counting
- Cost calculation
- Routing/fallbacks

### 4.2 LiteLLM Features Currently Used

| Feature | Usage | File |
|---------|-------|------|
| **completion()** | Main LLM API | llm.py |
| **acompletion()** | Async API | async_llm.py, streaming_llm.py |
| **token_counter()** | Count tokens | llm.py.get_token_count() |
| **get_model_info()** | Model metadata | llm.py.init_model_info() |
| **supports_vision()** | Vision support | llm.py.vision_is_active() |
| **create_pretrained_tokenizer()** | Custom tokenizer | llm.py |
| **Exception classes** | Error handling | llm.py, retry_mixin.py |
| **ChatCompletionToolParam** | Tool type | fn_call_converter.py |
| **ModelResponse** | Response type | Multiple files |

### 4.3 Function Calling Conversion

**LiteLLM provides:**
- Native function calling support for models that support it
- Automatic conversion for models that don't

**OpenHands additionally provides:**
- Custom XML-based format (fn_call_converter.py)
- Prompt injection for non-function-calling models
- Conversion back to function calling format

**Models handled:**
- **Native support:** Claude 3+, GPT-4o, Gemini 2.0+
- **Mocked support:** Older Claude, GPT-3.5, Llama, etc.
- **Format:** XML tags `<function=...>` with parameters

### 4.4 Configuration Parameters

**LLMConfig (from openhands.core.config):**
```python
model: str                      # Model name
api_key: SecretStr             # API key
base_url: str | None           # Custom endpoint
api_version: str | None        # API version (for Azure)
temperature: float             # Temperature (0.0-2.0)
top_p: float                   # Top-p sampling
top_k: int | None              # Top-k sampling
max_output_tokens: int | None  # Max completion tokens
num_retries: int               # Number of retries
timeout: float                 # Request timeout
disable_vision: bool           # Disable vision
native_tool_calling: bool | None  # Force tool calling mode
caching_prompt: bool           # Enable prompt caching
custom_tokenizer: str | None   # Custom tokenizer
completion_kwargs: dict        # Additional kwargs
```

---

## SECTION 5: ARCHITECTURE OPTIONS EVALUATION

### 5.1 Option A: Keep as Abstraction, Add SDK Backend

**Implementation:**
```python
class LLM(RetryMixin, DebugMixin):
    def __init__(self, config: LLMConfig, ...):
        self.config = config
        if config.use_claude_sdk:
            self._setup_sdk_backend()
        else:
            self._setup_litellm_backend()
    
    def _setup_sdk_backend(self):
        # Initialize Claude SDK client
        self.claude_client = ClaudeSDKClient(...)
    
    def _setup_litellm_backend(self):
        # Setup litellm completion wrapper
        self._completion = partial(litellm_completion, ...)
    
    @property
    def completion(self):
        if self.config.use_claude_sdk:
            return self._sdk_completion_wrapper
        else:
            return self._completion
```

**Pros:**
- ✅ Minimal changes to existing code
- ✅ Backward compatible
- ✅ Multi-provider support maintained
- ✅ Both paths coexist
- ✅ Easy feature flags
- ✅ Can migrate gradually per agent

**Cons:**
- ❌ Code complexity doubles (dual code paths)
- ❌ Testing burden increases
- ❌ SDK features don't map 1:1 to LiteLLM
- ❌ Function calling conversion not needed for SDK
- ❌ Metrics tracking needs duplication
- ❌ Technical debt from mixed paradigms

**Effort Estimate:** 3-4 weeks
- Core LLM class changes: 1 week
- SDK backend implementation: 1 week
- Testing & validation: 1-2 weeks
- Documentation: 3-5 days

**Risk Level:** MEDIUM
- Need to test both paths thoroughly
- Performance regression possible
- Breaking changes unlikely if well-tested

---

### 5.2 Option B: Replace Entirely with Claude SDK

**Implementation:**
```python
# Deprecate llm.py completely
# Remove LiteLLM dependency entirely
# Force all code to use SDK path only

from claude_agent_sdk import ClaudeSDKClient

class SDKLLMAdapter:
    # Minimal wrapper to maintain interface
    def __init__(self, config):
        self.client = ClaudeSDKClient(...)
    
    @property
    def completion(self):
        return self.client.complete
```

**Pros:**
- ✅ Simplest long-term
- ✅ Remove ~1,500 LOC of wrapping code
- ✅ Eliminate function calling conversion complexity
- ✅ Cleaner codebase
- ✅ Better performance (no conversion overhead)
- ✅ Single code path for testing

**Cons:**
- ❌ Breaking changes for users
- ❌ Loss of multi-provider support
- ❌ Large migration effort (~50 files)
- ❌ Deprecation path needed
- ❌ Cost tracking/metrics need re-impl
- ❌ Existing deployments break
- ❌ OpenRouter, Azure, Bedrock no longer supported

**Effort Estimate:** 4-6 weeks
- Rewrite affected 50 files: 2-3 weeks
- Implement metrics/cost tracking: 1 week
- Testing & validation: 1 week
- Deprecation guide: 3-5 days

**Risk Level:** HIGH
- Major breaking changes
- User disruption
- Potential for regressions
- Reverting difficult

---

### 5.3 Option C: Split Paths During Migration (RECOMMENDED)

**Implementation:**

**Phase 1: Support Both Paths (Parallel)**
```python
# New configuration option
agent_use_sdk: bool = True  # Default to SDK for new agents

# In agent factory:
if agent_use_sdk:
    return CodeActAgentSDK(config, llm_registry)
else:
    return CodeActAgent(config, llm_registry)

# LLM module stays, SDK path doesn't use it
# No changes to LLM module initially
```

**Phase 2: Migrate Legacy Agents (1-2 at a time)**
```python
# Create SDK version of each legacy agent
# Update agent factory to prefer SDK version
# Keep legacy version as fallback
# Users can still opt-in to legacy if needed
```

**Phase 3: Deprecate Legacy Path (Weeks 4-6)**
```python
# Remove legacy agents one by one
# Update documentation
# Provide migration guide
# Keep LLM module for non-agent use cases
```

**Phase 4: Optional LLM Cleanup (If needed)**
```python
# If LLM module becomes unused:
# Remove it or refactor as simple interface
# Otherwise keep it for non-agent components
```

**Pros:**
- ✅ Zero breaking changes
- ✅ Gradual migration path
- ✅ Easy rollback if issues arise
- ✅ Users can migrate at their own pace
- ✅ Both systems proven to work
- ✅ Parallel testing possible
- ✅ Features can be migrated selectively
- ✅ ClaudeSDKAdapter already exists

**Cons:**
- ⚠️ Maintain two paths temporarily (3-4 months)
- ⚠️ Some code duplication
- ⚠️ Documentation complexity
- ⚠️ Testing both paths needed

**Effort Estimate:** 2-3 weeks (minimal upfront)
- Phase 1 (framework): 2-3 days
- Phase 2 (per-agent): 2-3 days per agent × 3 agents = 1 week
- Phase 3 (cleanup): 3-5 days
- Total: 2-3 weeks active work, spread over 2 months

**Risk Level:** LOW
- Reversible at any step
- No breaking changes
- Proven with 3 agents already
- Clear rollback path

---

### 5.4 Comparison Matrix

| Factor | Option A | Option B | Option C |
|--------|----------|----------|----------|
| **Breaking Changes** | None | Major | None |
| **User Disruption** | Minimal | High | None |
| **Code Complexity** | High | Low | Medium |
| **Multi-provider Support** | ✅ | ❌ | ✅ (legacy) |
| **Migration Speed** | Fast | Slow | Medium |
| **Testing Effort** | High | High | Medium |
| **Long-term Maintenance** | High | Low | Low |
| **Rollback Difficulty** | Medium | Very Hard | Easy |
| **Timeline** | 3-4 weeks | 4-6 weeks | 2-3 weeks |
| **Risk Level** | Medium | High | Low |

---

## SECTION 6: RECOMMENDATION: OPTION C

### Rationale

**Why Option C is Best:**

1. **Low Risk:** No breaking changes, users unaffected
2. **Clear Path:** Three SDK agents already exist and work
3. **Proven:** ClaudeSDKAdapter bridge layer already implemented
4. **Flexible:** Can migrate at own pace or cancel if needed
5. **Reversible:** Can rollback individual agents if issues arise
6. **Multi-provider:** Keep LLM module for Azure, OpenRouter, Bedrock users
7. **Team Alignment:** Matches existing conversion philosophy

**Why Not A or B:**

- **Option A:** Adds permanent code complexity without clear benefit
- **Option B:** Too risky, breaks existing users, hard to rollback

---

## SECTION 7: IMPLEMENTATION PLAN

### Phase 1: Framework Setup (Weeks 1-2)

**Week 1: Foundational Changes**

1. **Update LLMRegistry to support SDK path** (2 days)
   - Add config flag: `agent_use_sdk: bool`
   - Document in AgentConfig
   - Update agent_factory.py to check flag

2. **Enhance ClaudeSDKAdapter** (2 days)
   - Add proper error handling
   - Implement all conversion methods
   - Add logging/debugging
   - Verify all message types handled

3. **Documentation & Plan** (1 day)
   - Create migration guide
   - Document both paths
   - Create decision tree for users

**Week 2: Remaining Legacy Agents**

4. **Create VisualBrowsingAgentSDK** (3 days)
   - Port vision-specific features
   - Integrate Browser MCP
   - Add vision handling
   - Tests

5. **Create LocAgentSDK** (1 day)
   - Minimal features
   - Reuse patterns from other agents

6. **Create DummyAgentSDK** (0.5 days)
   - Minimal agent
   - For testing framework

7. **Testing Framework** (1.5 days)
   - Update test suite for both paths
   - Add feature flags for testing
   - Ensure coverage parity

### Phase 2: Migration & Validation (Weeks 3+)

**Week 3: Rollout**

8. **Update agent_factory.py** (2 days)
   - Default to SDK agents for new configs
   - Keep legacy option available
   - Add deprecation warnings

9. **Comprehensive Testing** (3 days)
   - Unit tests for both paths
   - Integration tests
   - Performance comparison
   - Benchmark against baseline

10. **User Communication** (1 day)
    - Release notes
    - Migration guide
    - FAQ
    - Support channels

**Weeks 4+: Deprecation & Cleanup**

11. **Monitor & Support** (ongoing)
    - Track issues
    - Performance metrics
    - User feedback

12. **Legacy Deprecation** (after 4-8 weeks)
    - Add deprecation warnings
    - Plan removal date
    - Create upgrade guide

---

## SECTION 8: DETAILED IMPLEMENTATION STEPS

### Step 1: Update Configuration (1 day)

**File: openhands/core/config/agent_config.py**

```python
@dataclass
class AgentConfig:
    # ... existing fields ...
    
    # NEW: SDK Agent Flag
    use_sdk: bool = True  # Default to SDK for new agents
    
    @classmethod
    def legacy_agent(cls, **kwargs):
        """Helper to create legacy agent config."""
        kwargs['use_sdk'] = False
        return cls(**kwargs)
```

### Step 2: Remaining SDK Agents (3-5 days)

**Create three new files:**
1. openhands/agenthub/visualbrowsing_agent/visualbrowsing_agent_sdk.py
2. openhands/agenthub/loc_agent/loc_agent_sdk.py
3. openhands/agenthub/dummy_agent/agent_sdk.py

**Each follows same pattern as existing SDK agents:**
- Extend Agent base class
- Use ClaudeSDKAdapter
- Define agent-specific tools
- Add MCP servers as needed

### Step 3: Update Agent Factory (1 day)

**File: openhands/agenthub/agent_factory.py**

```python
def create_agent(config: AgentConfig, llm_registry: LLMRegistry) -> Agent:
    """Create agent instance (SDK or legacy based on config)."""
    
    # Map agent type to SDK and legacy classes
    AGENT_CLASSES = {
        'codeact': {
            'sdk': CodeActAgentSDK,
            'legacy': CodeActAgent,
        },
        'browsing': {
            'sdk': BrowsingAgentSDK,
            'legacy': BrowsingAgent,
        },
        # ... etc
    }
    
    agent_type = config.agent_type
    if agent_type not in AGENT_CLASSES:
        raise ValueError(f"Unknown agent type: {agent_type}")
    
    # Select based on config
    if config.use_sdk:
        AgentClass = AGENT_CLASSES[agent_type]['sdk']
    else:
        AgentClass = AGENT_CLASSES[agent_type]['legacy']
    
    return AgentClass(config, llm_registry)
```

### Step 4: Testing Suite (2 days)

**File: tests/unit/agenthub/test_agent_paths.py**

```python
@pytest.mark.parametrize('use_sdk', [True, False])
def test_agent_creation(use_sdk):
    """Test both SDK and legacy paths."""
    config = create_test_config(use_sdk=use_sdk)
    agent = create_agent(config, create_mock_registry())
    
    if use_sdk:
        assert isinstance(agent, CodeActAgentSDK)
    else:
        assert isinstance(agent, CodeActAgent)

@pytest.mark.parametrize('use_sdk', [True, False])
def test_agent_step(use_sdk):
    """Test agent step in both modes."""
    # Execute same test scenario
    # Compare outputs
    # Validate behavior matches
```

### Step 5: Update Documentation (2 days)

**Files to update/create:**
- docs/AGENT_MIGRATION_GUIDE.md
- docs/SDK_AGENT_USAGE.md
- UPGRADE_GUIDE.md (for next phase)
- Agent implementation docs

### Step 6: Deprecation Warnings (1 day)

**In legacy agent classes:**

```python
class CodeActAgent(Agent):
    def __init__(self, config: AgentConfig, llm_registry: LLMRegistry):
        if not config.use_sdk:  # Legacy path
            warnings.warn(
                "CodeActAgent (legacy) is deprecated. "
                "Please use CodeActAgentSDK instead. "
                "Legacy support will be removed in v2.0.0 (Q2 2025). "
                "See: docs/AGENT_MIGRATION_GUIDE.md",
                DeprecationWarning,
                stacklevel=2,
            )
        super().__init__(config, llm_registry)
```

---

## SECTION 9: ROLLOUT TIMELINE

### Immediate (Week 1-2): Framework
- [ ] Update LLMRegistry and agent factory
- [ ] Create remaining SDK agents
- [ ] Enhanced testing framework
- [ ] Documentation

### Short-term (Week 3): Validation  
- [ ] Comprehensive testing
- [ ] Performance benchmarking
- [ ] User communication
- [ ] Deprecation warnings added

### Medium-term (Weeks 4-6): Monitoring
- [ ] Track issues
- [ ] Gather feedback
- [ ] Patch if needed
- [ ] Plan next phase

### Long-term (Weeks 7-12): Legacy Removal
- [ ] Remove legacy agents (one by one)
- [ ] Clean up LLM module (if unused)
- [ ] Migration guide
- [ ] v2.0.0 release

---

## SECTION 10: RISK ANALYSIS

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| SDK agent bugs | Medium | High | Comprehensive testing, gradual rollout |
| Performance regression | Medium | Medium | Benchmarking, metrics tracking |
| Tool compatibility | Low | Medium | MCP server testing |
| Adapter conversion errors | Low | Medium | Unit test all conversions |
| Async/await issues | Low | Medium | Async testing suite |

### Mitigation Strategies

1. **Testing:** Comprehensive test matrix covering both paths
2. **Monitoring:** Metrics to detect regressions
3. **Rollback:** Easy to disable SDK path via config
4. **Communication:** Clear docs and deprecation path
5. **Staging:** Test in staging environment first

---

## SECTION 11: SUCCESS CRITERIA

✅ **Technical Success:**
- All 6 agents have working SDK versions
- Both SDK and legacy paths pass identical tests
- Performance parity (within 10%)
- Zero regressions in functionality

✅ **Operational Success:**
- 80%+ of users migrated to SDK path (6 months)
- <5% regression issues
- Clear migration path documented
- Community support available

✅ **Code Quality:**
- Test coverage >85% for both paths
- Documentation complete
- No new technical debt
- Clean separation of concerns

---

## SECTION 12: NEXT ACTIONS

### This Week
1. [ ] Review and approve this analysis
2. [ ] Make final decision on Option C
3. [ ] Create implementation backlog
4. [ ] Schedule team alignment

### Next Week  
1. [ ] Begin Phase 1 (Framework setup)
2. [ ] Create remaining SDK agents
3. [ ] Update testing framework
4. [ ] Start documentation

### Next 2 Weeks
1. [ ] Complete SDK agent implementations
2. [ ] Comprehensive testing
3. [ ] Internal validation
4. [ ] Prepare for rollout

---

## APPENDIX A: LiteLLM Integration Details

### A.1 Provider Support

OpenHands currently supports (via LiteLLM):
- **Anthropic:** Claude (all variants)
- **OpenAI:** GPT-4, GPT-5, O1, O3
- **Google:** Gemini
- **Meta:** Llama (via OpenRouter, together.ai)
- **AWS:** Bedrock
- **Azure:** OpenAI endpoints
- **Local:** Ollama, vLLM
- **Others:** OpenRouter, Together, Replicate

### A.2 Function Calling Support

| Provider | Native Support | Conversion | Notes |
|----------|-------|-----------|-------|
| Claude 3+ | ✅ | ✅ | Full support |
| GPT-4o | ✅ | ✅ | Full support |
| Gemini 2+ | ✅ | ✅ | Limited format support |
| Llama | ❌ | ✅ | Via XML conversion |
| Older models | ❌ | ✅ | Via XML conversion |

### A.3 Streaming Support

- **Sync streaming:** Not implemented in LLM.py
- **Async streaming:** Implemented in StreamingLLM
- **Benefits:** Lower latency, better UX for long responses

### A.4 Cost Calculation

Uses litellm.completion_cost() which knows pricing for:
- GPT-4, GPT-4o, GPT-5 (OpenAI)
- Claude 2, Claude 3 family (Anthropic)
- Gemini models (Google)
- And 200+ other models

Custom pricing available via:
```python
config.input_cost_per_token = 0.001
config.output_cost_per_token = 0.002
```

---

## APPENDIX B: Known Issues & Limitations

### B.1 Function Calling

**Issue:** Function calling format not standardized
- OpenAI uses `tool_calls` array
- Anthropic uses `tool_use` blocks
- Custom models need XML format

**Solution:** fn_call_converter.py handles conversion
**Status:** Working but complex

### B.2 Vision Support

**Issue:** Vision support varies widely
- Some models native, some via litellm
- Image encoding differs
- Error handling unclear

**Solution:** Model feature detection + format detection
**Status:** Implemented with workarounds

### B.3 Prompt Caching

**Issue:** Only Anthropic supports it
- Different format than OpenAI
- Special cache markers needed
- Complex cache invalidation

**Solution:** Cache applied per-provider
**Status:** Working for Anthropic

---

## APPENDIX C: File Reference

### Core LLM Module
```
/home/user/skills-claude/OpenHands/openhands/llm/
├── llm.py (841 lines) - Main LLM class
├── async_llm.py (133 lines) - Async support  
├── streaming_llm.py (117 lines) - Streaming
├── llm_registry.py (147 lines) - Registry
├── retry_mixin.py (101 lines) - Retry logic
├── debug_mixin.py (74 lines) - Logging
├── fn_call_converter.py (976 lines) - Function calling
├── model_features.py (143 lines) - Feature detection
├── metrics.py (278 lines) - Cost tracking
├── llm_utils.py (45 lines) - Utilities
├── tool_names.py (9 lines) - Constants
├── bedrock.py (33 lines) - AWS integration
└── router/
    ├── base.py (165 lines) - Router base
    └── rule_based/impl.py - Router impl
```

### SDK Components
```
openhands/agenthub/
├── claude_sdk_adapter.py (444 LOC) - Bridge layer
├── codeact_agent/codeact_agent_sdk.py (288 LOC)
├── browsing_agent/browsing_agent_sdk.py (272 LOC)
├── readonly_agent/readonly_agent_sdk.py (291 LOC)
└── [To Create:]
    ├── visualbrowsing_agent/visualbrowsing_agent_sdk.py
    ├── loc_agent/loc_agent_sdk.py
    └── dummy_agent/agent_sdk.py

openhands/mcp_servers/
├── jupyter_mcp.py - Jupyter integration
└── browser_mcp.py - Browser automation
```

### Legacy Agents (to keep in both paths)
```
openhands/agenthub/
├── codeact_agent/codeact_agent.py (300 LOC) 
├── browsing_agent/browsing_agent.py (229 LOC)
├── readonly_agent/readonly_agent.py (88 LOC)
├── loc_agent/loc_agent.py (45 LOC)
├── visualbrowsing_agent/visualbrowsing_agent.py (414 LOC)
└── dummy_agent/agent.py (190 LOC)
```

---

**End of Phase 5 Analysis**

**Next Steps:** 
1. Stakeholder review of this analysis
2. Final decision on Option C
3. Implementation begins Week 1

**Questions or Feedback:** 
Contact development team with questions about specific sections.
