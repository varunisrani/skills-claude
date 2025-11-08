# OpenHands to Claude Agent SDK Conversion Plan

**Document Version:** 1.0
**Date:** 2025-11-08
**Status:** Planning Phase

---

## Executive Summary

This document provides a comprehensive plan for converting the OpenHands codebase from LiteLLM to Claude Agent SDK. The conversion involves:

- **6 agent implementations** in the agenthub
- **8 primary files** with direct LiteLLM dependencies
- **50+ tool definitions** across all agents
- **Complete LLM abstraction layer** replacement
- **Agent architecture** modernization to Claude SDK patterns

The conversion will enable:
✅ Native Claude API integration with first-class support
✅ Simplified architecture (remove provider abstraction overhead)
✅ Better tool/function calling with Claude's native format
✅ Improved streaming and async patterns
✅ Built-in prompt caching and cost optimization
✅ Reduced dependency complexity

---

## Table of Contents

1. [Current Architecture Analysis](#current-architecture-analysis)
2. [LiteLLM Integration Points](#litellm-integration-points)
3. [Conversion Strategy](#conversion-strategy)
4. [Component Mapping](#component-mapping)
5. [Implementation Phases](#implementation-phases)
6. [Agent-Specific Conversion](#agent-specific-conversion)
7. [Tool Conversion Strategy](#tool-conversion-strategy)
8. [Testing Strategy](#testing-strategy)
9. [Risk Assessment](#risk-assessment)
10. [Success Criteria](#success-criteria)

---

## Current Architecture Analysis

### Agent Hierarchy

```
Agent (Abstract Base Class)
├── CodeActAgent          # Main general-purpose agent
│   ├── LocAgent          # Lines-of-Code analyzer (extends CodeAct)
│   └── ReadOnlyAgent     # Safe exploration (extends CodeAct)
├── BrowsingAgent         # Web browsing (text)
├── VisualBrowsingAgent   # Web browsing (vision)
└── DummyAgent            # Testing agent (no LLM)
```

### Core Data Flow

```
┌─────────────┐
│ User Input  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  EventStream    │  (WebSocket/messages)
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  AgentController     │  Orchestrates agent lifecycle
└──────────┬───────────┘
           │
           ▼
┌─────────────────────┐
│  Agent.step()       │  Core agent logic
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│  LLM.completion()           │  ⚠️ LiteLLM wrapper - PRIMARY CONVERSION TARGET
│  - Retry logic              │
│  - Cost tracking            │
│  - Token counting           │
│  - Function calling         │
└──────────┬──────────────────┘
           │
           ▼
┌──────────────────────────┐
│  litellm.completion()    │  ⚠️ External dependency - TO BE REPLACED
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────┐
│  ModelResponse       │  ⚠️ LiteLLM type - TO BE REPLACED
└──────────┬───────────┘
           │
           ▼
┌────────────────────────┐
│  response_to_actions() │  Parse tool calls from response
└──────────┬─────────────┘
           │
           ▼
┌──────────────────┐
│  Actions         │  CmdRunAction, AgentFinishAction, etc.
└──────────┬───────┘
           │
           ▼
┌──────────────────┐
│  Runtime         │  Executes actions in sandbox
└──────────┬───────┘
           │
           ▼
┌──────────────────┐
│  Observations    │  Results of actions
└──────────┬───────┘
           │
           └──────────┐ (Loop back to Agent.step())
                      │
                      ▼
                 Update State
```

### Tool Execution Flow

```
1. DEFINITION PHASE
   Agent._get_tools() → Creates list[ChatCompletionToolParam]
   ⚠️ Uses LiteLLM type - NEEDS CONVERSION

2. SENDING PHASE
   tools passed to LLM.completion(messages, tools=tools)
   - Native mode: Tools sent as-is to provider
   - Mock mode: Tools converted to XML in system prompt

3. CALLING PHASE
   LLM returns ModelResponse with tool_calls
   ⚠️ Uses LiteLLM type - NEEDS CONVERSION

4. CONVERSION PHASE
   response_to_actions() → Maps tool calls to OpenHands Actions
   - Parses: tool_call.function.name, tool_call.function.arguments
   - Creates: CmdRunAction, IPythonRunCellAction, BrowseURLAction, etc.

5. EXECUTION PHASE
   Runtime.run_action() → Executes in sandbox
   Returns: Observation objects

6. FEEDBACK PHASE
   Observations → Messages (role='tool')
   Loop back to step 2
```

---

## LiteLLM Integration Points

### Primary Files with Direct LiteLLM Dependencies

| File | Lines | LiteLLM Dependencies | Priority |
|------|-------|---------------------|----------|
| `openhands/llm/llm.py` | 842 | 13 imports, core wrapper | 🔴 CRITICAL |
| `openhands/llm/async_llm.py` | 120 | acompletion | 🔴 CRITICAL |
| `openhands/llm/debug_mixin.py` | 85 | ModelResponse, tool calls | 🟡 HIGH |
| `openhands/llm/fn_call_converter.py` | 280 | ChatCompletionToolParam | 🟡 HIGH |
| `openhands/core/message.py` | 150 | ChatCompletionMessageToolCall | 🟡 HIGH |
| `openhands/controller/agent_controller.py` | 650 | Exception types | 🟢 MEDIUM |
| `openhands/memory/condenser/impl/llm_attention_condenser.py` | 120 | supports_response_schema | 🟢 MEDIUM |
| All agent tool files (45+) | ~2000 | ChatCompletionToolParam | 🟡 HIGH |

### LiteLLM Functions Used

| Function | Current Usage | Claude SDK Replacement |
|----------|--------------|------------------------|
| `litellm.completion()` | Primary completion API | `agent.run()` or `client.messages.create()` |
| `litellm.acompletion()` | Async completion | `client.messages.create()` (async) |
| `litellm.token_counter()` | Token counting | `anthropic.count_tokens()` |
| `litellm_completion_cost()` | Cost calculation | Manual calculation with Claude pricing |
| `litellm.get_model_info()` | Model metadata | Anthropic model info API |
| `litellm.supports_vision()` | Vision check | Model name check (claude-3-*) |
| `litellm.create_pretrained_tokenizer()` | Custom tokenizer | Anthropic tokenizer |
| `litellm.supports_response_schema()` | Schema support check | Not needed (native with tools) |

### LiteLLM Types Used

| Type | Occurrences | Claude SDK Replacement |
|------|------------|------------------------|
| `ModelResponse` | 85+ | `Message` (from Anthropic SDK) |
| `ChatCompletionToolParam` | 45+ | Tool definition dicts or SDK types |
| `ChatCompletionMessageToolCall` | 25+ | `ToolUseBlock` |
| `ChatCompletionToolParamFunctionChunk` | 45+ | Inline dict or SDK helper |
| `LiteLLMMessage` | 20+ | Dict or SDK Message type |
| `Usage` | 15+ | `Message.usage` |
| `PromptTokensDetails` | 10+ | Usage breakdown in response |

---

## Conversion Strategy

### Core Principles

1. **Incremental Migration**: Replace components one at a time, maintaining functionality
2. **Compatibility Layer**: Create adapters during transition period
3. **Test-Driven**: Maintain existing test coverage throughout
4. **Configuration Preservation**: Keep existing LLMConfig structure initially
5. **Agent Isolation**: Convert agents independently

### Approach Options

#### Option A: Full Replacement (Recommended)
- Replace LiteLLM with Claude Agent SDK throughout
- **Pros**: Clean architecture, native Claude integration, optimal performance
- **Cons**: More extensive changes, single provider focus
- **Timeline**: 3-4 weeks

#### Option B: Adapter Pattern
- Create adapter layer wrapping Claude SDK in LiteLLM-like interface
- **Pros**: Minimal changes to existing code, gradual migration
- **Cons**: Complexity overhead, doesn't leverage Claude SDK fully
- **Timeline**: 1-2 weeks

#### Option C: Dual Support
- Support both LiteLLM and Claude SDK simultaneously
- **Pros**: Flexibility, gradual migration, fallback option
- **Cons**: Maintenance burden, code complexity
- **Timeline**: 4-5 weeks

**Recommended: Option A** - OpenHands is already Claude-focused based on default config

---

## Component Mapping

### LLM Wrapper Layer

**Current: `openhands/llm/llm.py`**
```python
class LLM(RetryMixin, DebugMixin):
    def completion(self, messages, tools=None, **kwargs) -> ModelResponse:
        response = litellm_completion(
            model=self.config.model,
            messages=messages,
            tools=tools,
            **kwargs
        )
        return response
```

**Target: Claude Agent SDK Integration**
```python
from anthropic import Anthropic, Message as ClaudeMessage
from anthropic.types import ToolParam, MessageParam

class LLM(RetryMixin, DebugMixin):
    def __init__(self, config: LLMConfig):
        self.client = Anthropic(api_key=config.api_key)
        # For Agent SDK
        self.agent_sdk_config = {
            'model': config.model,
            'tools': [],  # Set by agent
            'system_prompt': '',  # Set by agent
        }

    def completion(
        self,
        messages: list[MessageParam],
        tools: list[ToolParam] = None,
        **kwargs
    ) -> ClaudeMessage:
        # Extract system message (Claude requires separate param)
        system_messages = [m for m in messages if m['role'] == 'system']
        user_messages = [m for m in messages if m['role'] != 'system']

        response = self.client.messages.create(
            model=self.config.model,
            max_tokens=self.config.max_output_tokens or 4096,
            temperature=self.config.temperature,
            system=system_messages[0]['content'] if system_messages else None,
            messages=user_messages,
            tools=tools or [],
            **kwargs
        )
        return response
```

### Tool Definitions

**Current: LiteLLM Format**
```python
from litellm import ChatCompletionToolParam, ChatCompletionToolParamFunctionChunk

BashTool = ChatCompletionToolParam(
    type='function',
    function=ChatCompletionToolParamFunctionChunk(
        name='bash',
        description='Execute bash command',
        parameters={
            'type': 'object',
            'properties': {
                'command': {'type': 'string', 'description': 'The bash command'}
            },
            'required': ['command']
        }
    )
)
```

**Target: Claude SDK Format**
```python
from anthropic.types import ToolParam

BashTool = ToolParam(
    name='bash',
    description='Execute bash command',
    input_schema={
        'type': 'object',
        'properties': {
            'command': {'type': 'string', 'description': 'The bash command'}
        },
        'required': ['command']
    }
)

# Or simplified dict format:
BashTool = {
    'name': 'bash',
    'description': 'Execute bash command',
    'input_schema': {
        'type': 'object',
        'properties': {
            'command': {'type': 'string', 'description': 'The bash command'}
        },
        'required': ['command']
    }
}
```

### Response Parsing

**Current: LiteLLM ModelResponse**
```python
from litellm.types.utils import ModelResponse

def response_to_actions(response: ModelResponse) -> list[Action]:
    choice = response.choices[0]
    message = choice.message

    if hasattr(message, 'tool_calls') and message.tool_calls:
        for tool_call in message.tool_calls:
            function_name = tool_call.function.name
            arguments = json.loads(tool_call.function.arguments)
            # Create Action...
```

**Target: Claude SDK Message**
```python
from anthropic.types import Message, ToolUseBlock, TextBlock

def response_to_actions(response: Message) -> list[Action]:
    actions = []

    for block in response.content:
        if isinstance(block, ToolUseBlock):
            function_name = block.name
            arguments = block.input  # Already a dict, no JSON parsing needed

            if function_name == 'bash':
                actions.append(CmdRunAction(command=arguments['command']))
            elif function_name == 'finish':
                actions.append(AgentFinishAction(
                    outputs=arguments.get('outputs'),
                    thought=arguments.get('thought')
                ))
            # ... etc

        elif isinstance(block, TextBlock):
            # Handle text response (thinking, etc.)
            pass

    return actions
```

### Message Format

**Current: OpenHands Message → LiteLLM dict**
```python
from openhands.core.message import Message, TextContent

messages = [
    Message(role='system', content=[TextContent(text='...')]),
    Message(role='user', content=[TextContent(text='...')]),
]

# Converted to dict for LiteLLM
llm_messages = [msg.model_dump() for msg in messages]
```

**Target: OpenHands Message → Claude MessageParam**
```python
from anthropic.types import MessageParam

# Extract system message separately (Claude requirement)
system_message = None
user_messages = []

for msg in messages:
    if msg.role == 'system':
        # Claude wants system as separate param
        system_message = msg.content[0].text
    else:
        user_messages.append({
            'role': msg.role,
            'content': msg.content[0].text  # or handle multimodal
        })

# Pass to Claude
response = client.messages.create(
    system=system_message,
    messages=user_messages,
    ...
)
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Set up Claude SDK integration infrastructure

**Tasks:**
- [ ] Install Claude SDK and Agent SDK dependencies
- [ ] Create new `openhands/llm/claude_llm.py` wrapper
- [ ] Implement basic `completion()` method with Claude SDK
- [ ] Create message format converters (OpenHands Message ↔ Claude MessageParam)
- [ ] Implement retry logic compatible with Claude SDK
- [ ] Set up configuration for Claude API key and model
- [ ] Create unit tests for LLM wrapper

**Deliverables:**
- Working `ClaudeLLM` class with feature parity to current `LLM`
- Test suite covering basic completions
- Documentation on configuration changes

**Success Criteria:**
- ✅ Can make basic Claude API calls
- ✅ Message conversion works correctly
- ✅ Retry logic handles errors properly
- ✅ Tests pass with 100% coverage

---

### Phase 2: Tool Integration (Week 2)
**Goal:** Convert tool definitions and tool calling flow

**Tasks:**
- [ ] Audit all tool definitions (45+ files)
- [ ] Create tool conversion utility (LiteLLM → Claude format)
- [ ] Update `openhands/agenthub/codeact_agent/tools/` (11 tools)
  - [ ] bash.py
  - [ ] ipython.py
  - [ ] browser.py
  - [ ] finish.py
  - [ ] think.py
  - [ ] str_replace_editor.py
  - [ ] task_tracker.py
  - [ ] condensation_request.py
  - [ ] prompt.py
  - [ ] security_utils.py
  - [ ] llm_based_edit.py
- [ ] Update `openhands/agenthub/readonly_agent/tools/` (3 tools)
- [ ] Update `openhands/agenthub/loc_agent/tools/` (3 tools)
- [ ] Update function calling modules:
  - [ ] `openhands/agenthub/codeact_agent/function_calling.py`
  - [ ] `openhands/agenthub/readonly_agent/function_calling.py`
  - [ ] `openhands/agenthub/loc_agent/function_calling.py`
- [ ] Remove or simplify `openhands/llm/fn_call_converter.py` (may not be needed)
- [ ] Update response_to_actions() for Claude's ToolUseBlock format

**Deliverables:**
- All tools in Claude SDK format
- Updated function calling parsers
- Tool execution tests passing

**Success Criteria:**
- ✅ All tools properly formatted for Claude API
- ✅ Tool calls parsed correctly from Claude responses
- ✅ Tool execution flow works end-to-end
- ✅ Existing tool tests pass

---

### Phase 3: Agent Conversion (Week 3)
**Goal:** Convert all agent implementations to use Claude SDK

**Agents to Convert:**
1. **CodeActAgent** (Primary agent - highest priority)
   - Update `openhands/agenthub/codeact_agent/codeact_agent.py:219`
   - Test with all 11 tools
   - Verify memory condensation still works
   - Test multi-agent delegation

2. **ReadOnlyAgent** (Extends CodeActAgent)
   - Update `openhands/agenthub/readonly_agent/readonly_agent.py`
   - Test with grep/glob/view tools

3. **LocAgent** (Extends CodeActAgent)
   - Update `openhands/agenthub/loc_agent/loc_agent.py`
   - Test with repo analysis tools

4. **BrowsingAgent**
   - Update `openhands/agenthub/browsing_agent/browsing_agent.py:219`
   - Test with BrowserGym integration

5. **VisualBrowsingAgent** (Requires vision support)
   - Update `openhands/agenthub/visualbrowsing_agent/visualbrowsing_agent.py:304`
   - Implement multimodal message support for screenshots
   - Test set-of-marks (SOM) screenshots with Claude vision models

6. **DummyAgent** (No changes - no LLM calls)

**Tasks:**
- [ ] Update `Agent` base class (`openhands/controller/agent.py`)
  - [ ] Modify `get_system_message()` for Claude format
  - [ ] Update tool registration to use Claude SDK types
- [ ] Convert each agent's `step()` method
- [ ] Update prompt templates if needed (Jinja2 templates should work as-is)
- [ ] Handle vision/multimodal messages for VisualBrowsingAgent
- [ ] Update agent registry and initialization

**Deliverables:**
- All 6 agents working with Claude SDK
- Agent-specific tests passing
- Integration tests passing

**Success Criteria:**
- ✅ All agents can complete basic tasks
- ✅ Tool calling works in all agents
- ✅ Vision support works in VisualBrowsingAgent
- ✅ Agent tests pass

---

### Phase 4: Memory & Advanced Features (Week 3-4)
**Goal:** Convert memory condensers and advanced features

**Tasks:**
- [ ] Update memory condensers:
  - [ ] `openhands/memory/condenser/impl/llm_summarizing_condenser.py:142`
  - [ ] `openhands/memory/condenser/impl/llm_attention_condenser.py:67`
  - [ ] `openhands/memory/condenser/impl/structured_summary_condenser.py:255`
- [ ] Update resolver/PR features:
  - [ ] `openhands/resolver/send_pull_request.py:477`
  - [ ] `openhands/resolver/interfaces/issue_definitions.py` (2 locations)
- [ ] Update runtime utilities:
  - [ ] `openhands/runtime/utils/edit.py:102`
  - [ ] `openhands/runtime/utils/edit.py:429`
- [ ] Update streaming support (`openhands/llm/streaming_llm.py`)
- [ ] Update async support (`openhands/llm/async_llm.py`)
- [ ] Implement prompt caching (Claude native feature)
- [ ] Update metrics and cost tracking

**Deliverables:**
- Memory condensation working
- Streaming and async working
- Cost tracking accurate
- All advanced features functional

**Success Criteria:**
- ✅ Memory condensation reduces context correctly
- ✅ Streaming responses work
- ✅ Async completions work
- ✅ Prompt caching enabled and tracked
- ✅ Cost tracking accurate for Claude pricing

---

### Phase 5: Testing & Cleanup (Week 4)
**Goal:** Comprehensive testing and code cleanup

**Tasks:**
- [ ] Run full test suite (50+ test files)
- [ ] Update test fixtures for Claude SDK
- [ ] Integration testing with AgentController
- [ ] End-to-end testing with each agent type
- [ ] Performance testing and optimization
- [ ] Error handling testing (all exception types)
- [ ] Remove LiteLLM dependencies from requirements
- [ ] Update documentation
- [ ] Code cleanup and refactoring

**Deliverables:**
- All tests passing
- Documentation updated
- LiteLLM removed from dependencies
- Performance benchmarks

**Success Criteria:**
- ✅ 100% test pass rate
- ✅ Performance equal or better than LiteLLM
- ✅ No LiteLLM imports remain
- ✅ Documentation complete

---

## Agent-Specific Conversion

### CodeActAgent Conversion Details

**Current Implementation** (`openhands/agenthub/codeact_agent/codeact_agent.py:190-250`):
```python
def step(self, state: State) -> Action:
    # Get messages from state
    messages = self._get_messages(state)

    # Get tools
    tools = self._get_tools()

    # Call LLM
    response = self.llm.completion(
        messages=messages,
        tools=tools,
        stop=['</execute_ipython>'],
        extra_body={'metadata': state.to_llm_metadata()}
    )

    # Convert response to actions
    return response_to_actions(response, self.llm)
```

**Converted Implementation**:
```python
def step(self, state: State) -> Action:
    # Get messages from state
    messages = self._get_messages(state)

    # Extract system message (Claude requires separate param)
    system_message = None
    user_messages = []
    for msg in messages:
        if msg.role == 'system':
            system_message = msg.content[0].text
        else:
            user_messages.append({
                'role': msg.role,
                'content': self._format_content(msg.content)
            })

    # Get tools in Claude format
    tools = self._get_tools()  # Already converted in Phase 2

    # Call Claude
    response = self.llm.completion(
        system=system_message,
        messages=user_messages,
        tools=tools,
        stop_sequences=['</execute_ipython>'],
        metadata={'state_id': state.id}
    )

    # Convert Claude response to actions
    return response_to_actions(response, self.llm)
```

**Key Changes:**
1. **System message handling**: Extract and pass separately
2. **Stop sequences**: `stop` → `stop_sequences`
3. **Metadata**: `extra_body` → direct `metadata` param
4. **Response format**: Handle `ToolUseBlock` instead of `tool_calls`

---

### VisualBrowsingAgent Conversion (Multimodal)

**Current Implementation**:
```python
# Multimodal message with screenshot
messages.append(
    Message(
        role='user',
        content=[
            ImageContent(image_urls=[f'data:image/png;base64,{screenshot}']),
            TextContent(text='What do you see?')
        ]
    )
)
```

**Converted Implementation**:
```python
# Claude SDK multimodal format
from anthropic.types import ImageBlockParam, TextBlockParam

messages.append({
    'role': 'user',
    'content': [
        {
            'type': 'image',
            'source': {
                'type': 'base64',
                'media_type': 'image/png',
                'data': screenshot  # base64 string without data:image prefix
            }
        },
        {
            'type': 'text',
            'text': 'What do you see?'
        }
    ]
})
```

**Vision Model Requirements:**
- Must use Claude 3 models (claude-3-opus, claude-3-sonnet, claude-3-haiku, claude-3-5-sonnet)
- Image size limits: Max 5MB per image, recommended 1568px max dimension
- Supported formats: PNG, JPEG, GIF, WebP

---

## Tool Conversion Strategy

### Tool Definition Migration Pattern

**Step 1: Create Conversion Utility**
```python
# openhands/llm/tool_converter.py

from litellm import ChatCompletionToolParam
from anthropic.types import ToolParam

def convert_litellm_tool_to_claude(litellm_tool: ChatCompletionToolParam) -> ToolParam:
    """Convert LiteLLM tool format to Claude SDK format."""
    function = litellm_tool['function']

    return {
        'name': function['name'],
        'description': function['description'],
        'input_schema': function['parameters']  # JSON Schema - compatible!
    }
```

**Step 2: Bulk Tool Update Script**
```bash
# Script to update all tool files
find openhands/agenthub -name "*.py" -path "*/tools/*" -exec sed -i \
  's/from litellm import ChatCompletionToolParam, ChatCompletionToolParamFunctionChunk/from anthropic.types import ToolParam/g' {} \;
```

**Step 3: Manual Tool Updates**

Each tool file needs manual updates. Example for `bash.py`:

**Before**:
```python
from litellm import ChatCompletionToolParam, ChatCompletionToolParamFunctionChunk

BashTool = ChatCompletionToolParam(
    type='function',
    function=ChatCompletionToolParamFunctionChunk(
        name='bash',
        description='Execute a bash command...',
        parameters={
            'type': 'object',
            'properties': {
                'command': {
                    'type': 'string',
                    'description': 'The bash command to execute'
                },
                'thought': {
                    'type': 'string',
                    'description': 'Your thought process'
                }
            },
            'required': ['command']
        }
    )
)
```

**After**:
```python
from anthropic.types import ToolParam

BashTool: ToolParam = {
    'name': 'bash',
    'description': 'Execute a bash command...',
    'input_schema': {
        'type': 'object',
        'properties': {
            'command': {
                'type': 'string',
                'description': 'The bash command to execute'
            },
            'thought': {
                'type': 'string',
                'description': 'Your thought process'
            }
        },
        'required': ['command']
    }
}
```

**Step 4: Verify JSON Schema Compatibility**

Good news: Both LiteLLM and Claude use JSON Schema for parameter definitions!
The `parameters` object can be copied directly to `input_schema` with no changes.

---

### All Tools to Convert

#### CodeActAgent Tools (11 total)
1. ✅ `bash.py` - Simple schema
2. ✅ `ipython.py` - Simple schema
3. ✅ `browser.py` - Multiple browser actions (may need schema updates)
4. ✅ `finish.py` - Simple schema
5. ✅ `think.py` - Simple schema
6. ✅ `str_replace_editor.py` - Complex schema with file paths
7. ✅ `task_tracker.py` - Complex schema with task operations
8. ✅ `condensation_request.py` - Memory condensation trigger
9. ✅ `prompt.py` - User prompt interaction
10. ✅ `security_utils.py` - Security risk assessment
11. ⚠️ `llm_based_edit.py` - DEPRECATED, consider removing

#### ReadOnlyAgent Tools (3 total)
1. ✅ `grep.py` - Code search
2. ✅ `glob.py` - File pattern matching
3. ✅ `view.py` - File viewing

#### LocAgent Tools (3 total)
1. ✅ `explore_structure.py` - Tree structure exploration
2. ✅ `search_content.py` - Code snippet search
3. (Tool 3 is in `openhands/agent_skills` - not in tools/)

#### BrowsingAgent Tools
- Uses BrowserGym's action set (external library)
- May need adapter for Claude SDK

---

## Testing Strategy

### Test Coverage Requirements

**Unit Tests:**
- [ ] LLM wrapper (`test_llm.py`)
  - Basic completion calls
  - Retry logic
  - Error handling
  - Cost tracking
  - Token counting

- [ ] Tool definitions (`test_tools.py`)
  - Schema validation
  - All tools properly formatted

- [ ] Response parsing (`test_function_calling.py`)
  - Tool use blocks parsed correctly
  - Text blocks handled
  - Multiple tool calls in one response

- [ ] Message conversion (`test_message.py`)
  - System message extraction
  - Multimodal messages
  - Tool result messages

**Integration Tests:**
- [ ] Agent tests (`test_agents.py`)
  - Each agent can complete basic tasks
  - Tool execution works end-to-end
  - State management correct

- [ ] Memory tests (`test_memory.py`)
  - Condensation works
  - Context window management

- [ ] Controller tests (`test_agent_controller.py`)
  - Full request/response cycle
  - Error handling
  - State transitions

**End-to-End Tests:**
- [ ] SWE-bench evaluation tasks
- [ ] WebArena browsing tasks
- [ ] Real-world issue resolution
- [ ] Multi-step coding tasks

### Test Data Updates

**Mock Responses:**
Update all mock LiteLLM responses to Claude SDK format:

**Before**:
```python
mock_response = ModelResponse(
    choices=[
        Choice(
            message=Message(
                role='assistant',
                content=None,
                tool_calls=[
                    ToolCall(
                        id='call_123',
                        type='function',
                        function=Function(
                            name='bash',
                            arguments='{"command": "ls"}'
                        )
                    )
                ]
            )
        )
    ]
)
```

**After**:
```python
from anthropic.types import Message, ToolUseBlock

mock_response = Message(
    id='msg_123',
    type='message',
    role='assistant',
    content=[
        ToolUseBlock(
            id='toolu_123',
            type='tool_use',
            name='bash',
            input={'command': 'ls'}  # Already a dict!
        )
    ],
    model='claude-3-5-sonnet-20241022',
    usage={'input_tokens': 100, 'output_tokens': 50}
)
```

---

## Risk Assessment

### High Risk Areas

#### 1. **Breaking Changes in Function Calling Format** 🔴
- **Risk**: Tool call parsing fails, agents can't execute actions
- **Mitigation**:
  - Extensive unit tests for response parsing
  - Side-by-side comparison tests (LiteLLM vs Claude SDK)
  - Gradual rollout with feature flags

#### 2. **Message Format Incompatibilities** 🔴
- **Risk**: System messages, multimodal content not handled correctly
- **Mitigation**:
  - Comprehensive message conversion tests
  - Validation layer for message format
  - Clear error messages for format issues

#### 3. **Performance Degradation** 🟡
- **Risk**: Claude SDK slower than LiteLLM, retry logic inefficient
- **Mitigation**:
  - Benchmark current performance first
  - Optimize retry logic and async patterns
  - Use streaming where appropriate

#### 4. **Vision Model Integration** 🟡
- **Risk**: VisualBrowsingAgent screenshots not working
- **Mitigation**:
  - Test with sample screenshots early
  - Validate image encoding/format
  - Fallback to text-only mode if needed

#### 5. **Cost Tracking Accuracy** 🟡
- **Risk**: Cost calculations wrong, metrics incorrect
- **Mitigation**:
  - Manual verification of cost calculations
  - Cross-reference with Anthropic billing
  - Detailed logging of token usage

#### 6. **Streaming and Async Edge Cases** 🟡
- **Risk**: Streaming broken, async deadlocks
- **Mitigation**:
  - Stress testing with concurrent requests
  - Timeout handling
  - Resource cleanup validation

### Medium Risk Areas

#### 7. **Error Handling Gaps** 🟢
- **Risk**: New exception types not handled
- **Mitigation**:
  - Map all LiteLLM exceptions to Claude SDK equivalents
  - Add catch-all for unknown errors
  - Comprehensive error logging

#### 8. **Configuration Migration** 🟢
- **Risk**: Existing configs break, users can't upgrade
- **Mitigation**:
  - Provide migration script
  - Support legacy config temporarily
  - Clear documentation

#### 9. **Test Suite Maintenance** 🟢
- **Risk**: Tests fail, hard to debug
- **Mitigation**:
  - Update tests incrementally with code
  - Keep detailed changelog
  - Use CI/CD to catch regressions early

---

## Success Criteria

### Functional Requirements
- ✅ All 6 agents work with Claude SDK
- ✅ All 17+ tools execute correctly
- ✅ Function calling works end-to-end
- ✅ Vision support works (VisualBrowsingAgent)
- ✅ Streaming responses work
- ✅ Async completions work
- ✅ Memory condensation works
- ✅ Cost tracking accurate
- ✅ Token counting accurate
- ✅ Error handling robust

### Performance Requirements
- ✅ Response time ≤ current LiteLLM implementation
- ✅ Token usage optimized (prompt caching enabled)
- ✅ Cost per task ≤ current (or better with caching)
- ✅ Concurrent requests handled efficiently

### Quality Requirements
- ✅ Test coverage ≥ 90%
- ✅ All existing tests pass
- ✅ No LiteLLM dependencies remain
- ✅ Code follows OpenHands style guidelines
- ✅ Documentation complete and accurate

### Acceptance Criteria
- ✅ Can complete full SWE-bench task successfully
- ✅ Can complete full WebArena browsing task
- ✅ Can handle multi-step coding tasks
- ✅ Error recovery works as expected
- ✅ Cost tracking matches Anthropic billing

---

## Dependencies and Requirements

### New Dependencies

**Add to `pyproject.toml`:**
```toml
[project]
dependencies = [
    # Remove: "litellm>=1.74.3,<1.78.0"
    # Add:
    "anthropic>=0.39.0",  # Claude SDK
    "anthropic-sdk-tools>=0.3.0",  # Agent SDK (if using)
]
```

### Configuration Changes

**Update `openhands/core/config/llm_config.py`:**
```python
class LLMConfig(BaseModel):
    # Keep existing fields
    model: str = 'claude-3-5-sonnet-20241022'
    api_key: SecretStr | None
    base_url: str | None  # For custom endpoints

    # Remove LiteLLM-specific
    # custom_llm_provider: str | None  # NOT NEEDED
    # drop_params: bool  # NOT NEEDED
    # modify_params: bool  # NOT NEEDED

    # Update for Claude
    timeout: int = 60  # Claude SDK timeout
    max_retries: int = 5  # Built into Claude SDK

    # Add Claude-specific
    default_headers: dict[str, str] | None = None  # Custom headers
    max_tokens: int = 4096  # Claude requires explicit max_tokens
```

---

## Migration Checklist

### Pre-Migration
- [ ] Audit current LiteLLM usage (COMPLETE)
- [ ] Document all integration points (COMPLETE)
- [ ] Set up Claude API access and test
- [ ] Create feature branch for conversion
- [ ] Establish baseline performance metrics
- [ ] Back up current working implementation

### Phase 1: Foundation
- [ ] Install Anthropic SDK
- [ ] Create `ClaudeLLM` wrapper class
- [ ] Implement basic completion method
- [ ] Add retry logic
- [ ] Add error handling
- [ ] Add cost tracking
- [ ] Unit test LLM wrapper
- [ ] Integration test with simple agent

### Phase 2: Tools
- [ ] Create tool conversion utility
- [ ] Convert CodeActAgent tools (11)
- [ ] Convert ReadOnlyAgent tools (3)
- [ ] Convert LocAgent tools (3)
- [ ] Update function_calling modules (3)
- [ ] Test tool execution end-to-end
- [ ] Verify schema compatibility

### Phase 3: Agents
- [ ] Update Agent base class
- [ ] Convert CodeActAgent
- [ ] Convert ReadOnlyAgent
- [ ] Convert LocAgent
- [ ] Convert BrowsingAgent
- [ ] Convert VisualBrowsingAgent (with vision)
- [ ] Test each agent independently
- [ ] Integration test all agents

### Phase 4: Advanced Features
- [ ] Update memory condensers (3)
- [ ] Update resolver/PR features (3)
- [ ] Update runtime utilities (2)
- [ ] Implement streaming
- [ ] Implement async
- [ ] Enable prompt caching
- [ ] Update metrics tracking
- [ ] Test advanced features

### Phase 5: Finalization
- [ ] Run full test suite
- [ ] Update all test fixtures
- [ ] End-to-end testing
- [ ] Performance benchmarking
- [ ] Remove LiteLLM from dependencies
- [ ] Update documentation
- [ ] Code cleanup
- [ ] Final review and merge

---

## Rollback Plan

In case of critical issues during migration:

### Rollback Steps
1. **Revert to feature branch parent commit**
2. **Restore LiteLLM dependencies** in pyproject.toml
3. **Run test suite** to verify functionality
4. **Document issues** encountered for future attempt

### Rollback Triggers
- Test pass rate drops below 80%
- Critical functionality broken (agents can't complete tasks)
- Performance degradation > 50%
- Cost increase > 20%
- Unrecoverable errors in production

---

## Next Steps

### Immediate Actions (This Week)
1. **Set up development environment**
   - Install Claude SDK
   - Get API key
   - Create test account

2. **Create proof of concept**
   - Simple Claude SDK completion
   - Basic tool calling
   - Response parsing

3. **Start Phase 1**
   - Create `ClaudeLLM` wrapper
   - Implement basic completion
   - Add unit tests

### Short-term (Weeks 2-3)
1. **Complete tool conversion**
2. **Convert CodeActAgent** (most important)
3. **Integration testing**

### Long-term (Week 4+)
1. **Convert all remaining agents**
2. **Advanced feature implementation**
3. **Full testing and deployment**

---

## Additional Resources

### Documentation
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [Claude SDK Python Docs](https://github.com/anthropics/anthropic-sdk-python)
- [Claude Agent SDK](https://github.com/anthropics/anthropic-sdk-python/tree/main/src/anthropic/agent)
- [Tool Use Guide](https://docs.anthropic.com/claude/docs/tool-use)
- [Vision Guide](https://docs.anthropic.com/claude/docs/vision)
- [Prompt Caching](https://docs.anthropic.com/claude/docs/prompt-caching)

### OpenHands Resources
- [OpenHands Architecture](https://github.com/All-Hands-AI/OpenHands/blob/main/openhands/agenthub/README.md)
- [Agent Development Guide](https://docs.all-hands.dev/modules/usage/agents)
- [LLM Configuration](https://docs.all-hands.dev/modules/usage/llms)

---

## Conclusion

This conversion plan provides a comprehensive roadmap for migrating OpenHands from LiteLLM to Claude Agent SDK. The phased approach minimizes risk while ensuring all functionality is preserved and improved.

**Key Takeaways:**
- The abstraction is already well-designed, making conversion straightforward
- Most work is in the LLM wrapper layer and tool definitions
- Agents can be converted incrementally
- Testing is critical at every phase
- Claude SDK provides native features (caching, vision) that will improve performance

**Estimated Timeline:** 3-4 weeks with dedicated development effort

**Expected Benefits:**
- Simplified architecture
- Better Claude integration
- Improved performance with prompt caching
- Native vision support
- Reduced dependencies
- Better debugging and error messages

---

**Document Status:** Ready for implementation
**Last Updated:** 2025-11-08
**Next Review:** After Phase 1 completion
