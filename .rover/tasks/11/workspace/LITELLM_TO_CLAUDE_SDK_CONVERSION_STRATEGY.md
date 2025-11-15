# OpenHands: LiteLLM to Claude Agent SDK Conversion Strategy

## Executive Summary

This document provides a comprehensive strategy for converting OpenHands from using LiteLLM (multi-provider LLM abstraction) to using the pure Claude Agent SDK. This analysis is based on deep exploration of the OpenHands codebase conducted by multiple specialized agents.

**Key Challenge**: OpenHands supports 50+ LLM providers through LiteLLM. Claude Agent SDK only supports Anthropic's Claude models. This conversion will:
- **Remove multi-provider support** (unless kept as fallback)
- **Simplify architecture** for Claude-specific deployments
- **Leverage Claude SDK's native features** (built-in tools, MCP, streaming)
- **Require significant refactoring** of the LLM abstraction layer

---

## Table of Contents

1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Claude Agent SDK Capabilities](#claude-agent-sdk-capabilities)
3. [Mapping LiteLLM to Claude SDK](#mapping-litellm-to-claude-sdk)
4. [Conversion Strategy](#conversion-strategy)
5. [Implementation Phases](#implementation-phases)
6. [Code Examples](#code-examples)
7. [Migration Challenges](#migration-challenges)
8. [Testing Strategy](#testing-strategy)
9. [Rollout Plan](#rollout-plan)

---

## Current Architecture Analysis

### OpenHands LLM Integration (via LiteLLM)

Based on the deep analysis of `OpenHands/openhands/llm/`, here's the current architecture:

#### **File Structure**
```
openhands/llm/
├── __init__.py              # Exports LLM, AsyncLLM classes
├── llm.py                   # Core LLM class (842 lines) - sync wrapper
├── async_llm.py             # AsyncLLM class (134 lines) - async support
├── streaming_llm.py         # StreamingLLM class (117 lines) - streaming async
├── metrics.py               # Metrics tracking (cost, tokens, latency)
├── retry.py                 # Exponential backoff retry logic
├── conversation_memory.py   # Event history → LLM messages conversion
├── debug_mixin.py           # Logging/debugging utilities
├── function_calling.py      # Function calling abstraction
└── prompt_caching.py        # Prompt caching support
```

#### **Three Core LLM Classes**

1. **LLM (Synchronous)**
   - Wraps `litellm.completion()` with retry logic
   - Handles function calling (native + simulated fallback)
   - Tracks metrics (cost, tokens, latency)
   - 6 retryable exceptions with exponential backoff (8→16→32→64s)
   - Provider-specific handling (Azure, Gemini, Bedrock, etc.)

2. **AsyncLLM**
   - Async version using `litellm.acompletion()`
   - Cancellation support
   - Used in async contexts

3. **StreamingLLM**
   - Async streaming via `litellm.acompletion(stream=True)`
   - Per-chunk processing
   - Real-time response handling

#### **LLM Usage Pattern in Agents**

From the agent analysis, here's how CodeActAgent uses the LLM:

```python
# In CodeActAgent.step()
response = self.llm.completion(
    messages=[
        SystemMessage("You are CodeAct..."),
        UserMessage("original task"),
        # ... action-observation pairs from history
        latest_message
    ],
    tools=[
        {"type": "function", "function": {"name": "bash", ...}},
        {"type": "function", "function": {"name": "python", ...}},
        # ... more tools
    ],
    model="gpt-4",
    extra_body={'metadata': {...}}
)

# Parse response
tool_calls = response.choices[0].message.tool_calls
actions = [parse_tool_call(tc) for tc in tool_calls]
```

#### **Current MCP Integration**

From the MCP analysis:

- **FastMCP** used as MCP client (`openhands/mcp/client.py`)
- MCP tools added to agent's tool list dynamically
- Three server types: SSE, SHTTP, Stdio
- Tools exposed to LLM via `ChatCompletionToolParam` format
- Execution via `MCPClient.call_tool()`

#### **Event-Driven Architecture**

From the runtime/controller analysis:

- **EventStream**: Thread-safe event distribution backbone
- **AgentController**: Orchestrates agent execution
- **Flow**: User Input → EventStream → AgentController → Agent.step() → LLM.completion() → Actions → Runtime → Observations → EventStream
- **State Machine**: LOADING → AWAITING_USER_INPUT → RUNNING → PAUSED/ERROR/FINISHED

---

## Claude Agent SDK Capabilities

### What Claude SDK Provides

Based on the SDK reference documentation:

#### **1. Two Interaction Modes**

##### **`query()` Function** (Stateless)
- Creates new session each time
- Best for one-off tasks
- No conversation continuity

##### **`ClaudeSDKClient` Class** (Stateful)
- Maintains conversation across multiple exchanges
- Supports interrupts, hooks, custom tools
- Equivalent to OpenHands' conversational model
- **This is what OpenHands needs**

#### **2. Built-in Tool Support**

```python
from claude_agent_sdk import tool

@tool("bash", "Execute bash command", {"command": str})
async def bash_tool(args):
    return {"content": [{"type": "text", "text": output}]}
```

#### **3. MCP Server Integration**

```python
from claude_agent_sdk import create_sdk_mcp_server, tool

@tool("add", "Add numbers", {"a": float, "b": float})
async def add(args):
    return {"content": [{"type": "text", "text": str(args['a'] + args['b'])}]}

server = create_sdk_mcp_server("calculator", tools=[add])

options = ClaudeAgentOptions(
    mcp_servers={"calc": server},
    allowed_tools=["mcp__calc__add"]
)
```

#### **4. Streaming Support**

```python
async def message_stream():
    yield {"type": "text", "text": "Part 1"}
    yield {"type": "text", "text": "Part 2"}

async with ClaudeSDKClient() as client:
    await client.query(message_stream())
    async for message in client.receive_response():
        print(message)
```

#### **5. Permission Control**

```python
async def can_use_tool_handler(tool_name, input_data, context):
    if tool_name == "Write" and "/system/" in input_data.get("file_path", ""):
        return {
            "behavior": "deny",
            "message": "System directory write not allowed",
            "interrupt": True
        }
    return {"behavior": "allow", "updatedInput": input_data}

options = ClaudeAgentOptions(can_use_tool=can_use_tool_handler)
```

#### **6. Hooks**

```python
options = ClaudeAgentOptions(
    hooks={
        "before_tool": [lambda context: print(f"About to call {context['tool_name']}")],
        "after_tool": [lambda context: print(f"Tool result: {context['result']}")]
    }
)
```

#### **7. Message Types**

- `AssistantMessage` - Claude's responses
- `TextBlock` - Text content
- `ToolUseBlock` - Tool calls
- `ResultMessage` - End of turn marker

---

## Mapping LiteLLM to Claude SDK

### Feature Comparison Matrix

| Feature | LiteLLM (Current) | Claude Agent SDK | Conversion Effort |
|---------|-------------------|------------------|-------------------|
| **Multi-provider support** | ✅ 50+ providers | ❌ Claude only | 🔴 HIGH - Need fallback or Claude-only mode |
| **Function calling** | ✅ Native + simulated | ✅ Native tools | 🟢 LOW - Direct mapping |
| **Streaming** | ✅ Via acompletion(stream=True) | ✅ Via receive_messages() | 🟡 MEDIUM - Different API |
| **Async support** | ✅ acompletion() | ✅ ClaudeSDKClient | 🟢 LOW - Both async |
| **Retry logic** | ✅ Custom exponential backoff | ❌ Not built-in | 🟡 MEDIUM - Keep custom logic |
| **Metrics tracking** | ✅ Cost/tokens/latency | ❌ Not built-in | 🟡 MEDIUM - Keep custom tracking |
| **Conversation memory** | ✅ Custom (ConversationMemory) | ✅ Built-in session state | 🟢 LOW - SDK handles it |
| **MCP integration** | ✅ Via FastMCP client | ✅ Via create_sdk_mcp_server() | 🟡 MEDIUM - API change |
| **Tool permissions** | ✅ Custom (SecurityAnalyzer) | ✅ can_use_tool hook | 🟢 LOW - Direct mapping |
| **Prompt caching** | ✅ LiteLLM support | ✅ SDK supports | 🟢 LOW - Same concept |
| **Model selection** | ✅ Any model | ❌ Claude models only | 🔴 HIGH - Architecture decision |

### API Mapping Table

| LiteLLM API | Claude SDK API | Notes |
|-------------|----------------|-------|
| `litellm.completion(messages, tools, model)` | `client.query(prompt)` + `receive_response()` | Different paradigm |
| `litellm.acompletion()` | `ClaudeSDKClient.query()` | Async equivalent |
| `litellm.acompletion(stream=True)` | `client.receive_messages()` | Streaming |
| Tool format: `ChatCompletionToolParam` | `@tool` decorator + `create_sdk_mcp_server()` | SDK uses decorators |
| Response: `response.choices[0].message.tool_calls` | `ToolUseBlock` in `AssistantMessage` | Different structure |
| Retry: Custom logic | N/A | Keep custom implementation |
| Metrics: Custom tracking | N/A | Keep custom implementation |

---

## Conversion Strategy

### Approach: Hybrid Architecture

**Recommendation**: Implement a **dual-mode system** that supports both LiteLLM (multi-provider) and Claude SDK (Claude-optimized).

#### **Why Hybrid?**

1. **Preserve multi-provider support** - Users can still use GPT-4, Gemini, etc.
2. **Enable Claude optimization** - Users on Claude get better integration
3. **Gradual migration** - Can be rolled out incrementally
4. **Fallback safety** - If SDK has issues, fall back to LiteLLM

#### **Architecture**

```
openhands/llm/
├── __init__.py                    # Export unified interface
├── base.py                        # Abstract LLM base class
├── litellm_provider.py            # LiteLLM implementation (current)
├── claude_sdk_provider.py         # NEW: Claude SDK implementation
├── factory.py                     # NEW: Provider factory
├── metrics.py                     # Shared metrics (both providers)
├── retry.py                       # Shared retry logic
└── conversation_memory.py         # Shared memory conversion
```

#### **Provider Selection Logic**

```python
# openhands/llm/factory.py
def create_llm(config: LLMConfig) -> BaseLLM:
    model = config.model.lower()

    # Claude models → Use Claude SDK if enabled
    if ("claude" in model or "anthropic" in model) and config.use_claude_sdk:
        return ClaudeSDKProvider(config)

    # All others → Use LiteLLM
    return LiteLLMProvider(config)
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Create abstractions and infrastructure

1. **Create `BaseLLM` abstract class**
   ```python
   class BaseLLM(ABC):
       @abstractmethod
       async def completion(self, messages, tools, **kwargs):
           pass

       @abstractmethod
       async def streaming_completion(self, messages, tools, **kwargs):
           pass
   ```

2. **Refactor existing LiteLLM code into `LiteLLMProvider`**
   - Move `openhands/llm/llm.py` → `LiteLLMProvider`
   - Keep all existing logic unchanged
   - Ensure backward compatibility

3. **Add configuration option**
   ```python
   # config.toml
   [llm]
   use_claude_sdk = false  # Enable Claude SDK for Claude models
   ```

### Phase 2: Claude SDK Provider (Week 3-4)

**Goal**: Implement Claude SDK integration

1. **Create `ClaudeSDKProvider` class**
   ```python
   class ClaudeSDKProvider(BaseLLM):
       def __init__(self, config: LLMConfig):
           self.client = ClaudeSDKClient(
               options=ClaudeAgentOptions(
                   model=config.model,
                   system_prompt=config.custom_llm_provider,
                   cwd=config.workspace_base,
                   max_turns=config.max_iterations
               )
           )

       async def completion(self, messages, tools, **kwargs):
           # Convert messages to prompt
           prompt = self._convert_messages_to_prompt(messages)

           # Register tools
           self._register_tools(tools)

           # Query Claude
           await self.client.query(prompt)

           # Collect response
           response = await self._collect_response()

           return response
   ```

2. **Implement message conversion**
   - Convert OpenHands message format → Claude SDK format
   - Handle system prompts, user messages, assistant messages
   - Preserve conversation history

3. **Implement tool conversion**
   - Convert `ChatCompletionToolParam` → `@tool` decorated functions
   - Register tools with Claude SDK
   - Handle tool responses

4. **Add MCP integration**
   - Convert existing MCP servers to SDK format
   - Use `create_sdk_mcp_server()`
   - Test tool calling

### Phase 3: Response Parsing (Week 5)

**Goal**: Parse Claude SDK responses into OpenHands format

1. **Response converter**
   ```python
   def _parse_sdk_response(self, messages: list[Message]) -> LLMResponse:
       tool_calls = []
       text_content = ""

       for message in messages:
           if isinstance(message, AssistantMessage):
               for block in message.content:
                   if isinstance(block, TextBlock):
                       text_content += block.text
                   elif isinstance(block, ToolUseBlock):
                       tool_calls.append({
                           "id": block.id,
                           "type": "function",
                           "function": {
                               "name": block.name,
                               "arguments": json.dumps(block.input)
                           }
                       })

       # Return in LiteLLM-compatible format
       return LLMResponse(
           choices=[{
               "message": {
                   "role": "assistant",
                   "content": text_content,
                   "tool_calls": tool_calls
               }
           }]
       )
   ```

2. **Streaming support**
   - Use `client.receive_messages()` for streaming
   - Yield chunks in OpenHands format
   - Handle partial tool calls

### Phase 4: Integration & Testing (Week 6-7)

**Goal**: Integrate with existing agent system

1. **Update agent initialization**
   ```python
   # In CodeActAgent
   def __init__(self, llm: BaseLLM):
       # Works with both LiteLLMProvider and ClaudeSDKProvider
       self.llm = llm
   ```

2. **Test with all agent types**
   - CodeActAgent
   - BrowsingAgent
   - VisualBrowsingAgent
   - ReadOnlyAgent
   - LocAgent

3. **Test MCP integration**
   - Verify MCP tools work with Claude SDK
   - Test stdio, SSE, SHTTP transports
   - Verify tool calling from agents

4. **Test event system integration**
   - Ensure EventStream works correctly
   - Verify state transitions
   - Test delegation and multi-agent flows

### Phase 5: Performance & Optimization (Week 8)

**Goal**: Optimize and add advanced features

1. **Implement retry logic for Claude SDK**
   - Wrap SDK calls with exponential backoff
   - Handle SDK-specific errors
   - Preserve existing retry behavior

2. **Add metrics tracking**
   - Track token usage from SDK responses
   - Calculate costs based on Claude pricing
   - Log latency and throughput

3. **Implement hooks**
   - Use Claude SDK's hook system
   - Integrate with OpenHands security analyzer
   - Add custom pre/post tool hooks

4. **Optimize conversation memory**
   - Leverage SDK's built-in session state
   - Reduce redundant message conversion
   - Test memory efficiency

### Phase 6: Documentation & Rollout (Week 9-10)

**Goal**: Document and deploy

1. **Documentation**
   - Update developer docs with SDK usage
   - Add configuration guide
   - Write migration guide for users

2. **Gradual rollout**
   - Beta flag for Claude SDK mode
   - A/B testing with subset of users
   - Monitor error rates and performance

3. **Default to SDK for Claude models**
   - Once stable, make SDK default for Claude
   - Keep LiteLLM as fallback option
   - Provide opt-out mechanism

---

## Code Examples

### Example 1: Provider Factory

```python
# openhands/llm/factory.py
from openhands.llm.base import BaseLLM
from openhands.llm.litellm_provider import LiteLLMProvider
from openhands.llm.claude_sdk_provider import ClaudeSDKProvider
from openhands.core.config import LLMConfig

def create_llm(config: LLMConfig) -> BaseLLM:
    """
    Factory function to create the appropriate LLM provider.

    Args:
        config: LLM configuration

    Returns:
        BaseLLM instance (either LiteLLM or Claude SDK)
    """
    model = config.model.lower()

    # Determine if this is a Claude model
    is_claude = any(x in model for x in ["claude", "anthropic"])

    # Use Claude SDK if:
    # 1. It's a Claude model
    # 2. SDK mode is enabled in config
    # 3. SDK is available
    if is_claude and config.use_claude_sdk:
        try:
            return ClaudeSDKProvider(config)
        except ImportError:
            logger.warning(
                "Claude SDK not available, falling back to LiteLLM"
            )
            return LiteLLMProvider(config)

    # Default to LiteLLM for all other cases
    return LiteLLMProvider(config)
```

### Example 2: Claude SDK Provider Implementation

```python
# openhands/llm/claude_sdk_provider.py
import asyncio
import json
from typing import Any, AsyncIterator
from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    tool,
    create_sdk_mcp_server,
    AssistantMessage,
    TextBlock,
    ToolUseBlock,
    ResultMessage
)
from openhands.llm.base import BaseLLM
from openhands.llm.metrics import Metrics
from openhands.core.config import LLMConfig

class ClaudeSDKProvider(BaseLLM):
    """
    LLM provider using Claude Agent SDK for optimal Claude integration.
    """

    def __init__(self, config: LLMConfig):
        self.config = config
        self.metrics = Metrics()
        self._client = None
        self._tools = {}  # tool_name → decorated function

    async def _ensure_client(self):
        """Lazily create and connect client."""
        if self._client is None:
            options = ClaudeAgentOptions(
                model=self.config.model,
                system_prompt=self._build_system_prompt(),
                cwd=self.config.workspace_base,
                max_turns=self.config.max_iterations,
                allowed_tools=list(self._tools.keys()),
                permission_mode=self._get_permission_mode(),
                can_use_tool=self._permission_handler
            )

            self._client = ClaudeSDKClient(options=options)
            await self._client.connect()

    def _build_system_prompt(self) -> str:
        """Build system prompt from config."""
        if self.config.custom_llm_provider:
            return self.config.custom_llm_provider
        return "You are a helpful AI assistant."

    def _get_permission_mode(self) -> str:
        """Map OpenHands permission mode to SDK mode."""
        mode_map = {
            "confirm": "ask",
            "reject": "deny",
            "accept": "acceptEdits"
        }
        return mode_map.get(
            self.config.security_analyzer,
            "acceptEdits"
        )

    async def _permission_handler(
        self,
        tool_name: str,
        input_data: dict,
        context: dict
    ):
        """
        Permission handler for tool usage.
        Integrates with OpenHands SecurityAnalyzer.
        """
        # Check if tool is allowed
        if tool_name not in self._tools:
            return {
                "behavior": "deny",
                "message": f"Tool {tool_name} not allowed"
            }

        # TODO: Integrate with SecurityAnalyzer for risk assessment
        # For now, allow all registered tools
        return {
            "behavior": "allow",
            "updatedInput": input_data
        }

    def register_tool(self, tool_spec: dict):
        """
        Register a tool from OpenHands format.

        Args:
            tool_spec: Tool specification in ChatCompletionToolParam format
        """
        name = tool_spec["function"]["name"]
        description = tool_spec["function"]["description"]
        parameters = tool_spec["function"]["parameters"]

        # Convert JSON schema to simple type mapping
        input_schema = self._convert_schema(parameters)

        # Create tool handler
        async def handler(args: dict) -> dict:
            # This will be called by Claude SDK
            # We need to route it back to OpenHands tool execution
            result = await self._execute_openhands_tool(name, args)
            return {
                "content": [{
                    "type": "text",
                    "text": json.dumps(result)
                }]
            }

        # Decorate with @tool
        decorated = tool(name, description, input_schema)(handler)
        self._tools[name] = decorated

    def _convert_schema(self, json_schema: dict) -> dict:
        """Convert JSON schema to SDK input schema format."""
        properties = json_schema.get("properties", {})
        schema = {}

        for prop_name, prop_def in properties.items():
            prop_type = prop_def.get("type", "string")
            type_map = {
                "string": str,
                "integer": int,
                "number": float,
                "boolean": bool,
                "object": dict,
                "array": list
            }
            schema[prop_name] = type_map.get(prop_type, str)

        return schema

    async def _execute_openhands_tool(
        self,
        tool_name: str,
        args: dict
    ) -> Any:
        """
        Execute OpenHands tool and return result.
        This bridges Claude SDK tool calls to OpenHands action execution.
        """
        # TODO: Route to OpenHands runtime for actual execution
        # For now, placeholder
        return {"status": "executed", "tool": tool_name, "args": args}

    async def completion(
        self,
        messages: list,
        tools: list[dict] = None,
        **kwargs
    ) -> dict:
        """
        Main completion method compatible with OpenHands LLM interface.

        Args:
            messages: List of message dicts (role, content)
            tools: List of tool specifications
            **kwargs: Additional arguments

        Returns:
            Response in LiteLLM-compatible format
        """
        await self._ensure_client()

        # Register tools if provided
        if tools:
            for tool_spec in tools:
                self.register_tool(tool_spec)

        # Convert messages to prompt
        prompt = self._convert_messages_to_prompt(messages)

        # Start timer for metrics
        import time
        start_time = time.time()

        # Query Claude
        await self._client.query(prompt)

        # Collect response
        response_messages = []
        async for message in self._client.receive_response():
            response_messages.append(message)

            # Stop at ResultMessage
            if isinstance(message, ResultMessage):
                break

        # Record metrics
        latency = time.time() - start_time
        self.metrics.add_latency(latency)

        # Parse into LiteLLM format
        return self._parse_sdk_response(response_messages)

    def _convert_messages_to_prompt(self, messages: list) -> str:
        """
        Convert OpenHands message list to Claude SDK prompt.

        Note: System messages are handled separately via ClaudeAgentOptions.
        """
        prompt_parts = []

        for msg in messages:
            role = msg.get("role")
            content = msg.get("content", "")

            if role == "system":
                # System messages already in options, skip
                continue
            elif role == "user":
                prompt_parts.append(content)
            elif role == "assistant":
                # Assistant messages are part of conversation history
                # SDK maintains this automatically
                continue
            elif role == "tool":
                # Tool results
                prompt_parts.append(f"Tool result: {content}")

        return "\n\n".join(prompt_parts)

    def _parse_sdk_response(self, messages: list) -> dict:
        """
        Parse Claude SDK messages into LiteLLM-compatible response format.
        """
        tool_calls = []
        text_content = ""

        for message in messages:
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        text_content += block.text
                    elif isinstance(block, ToolUseBlock):
                        tool_calls.append({
                            "id": block.id,
                            "type": "function",
                            "function": {
                                "name": block.name,
                                "arguments": json.dumps(block.input)
                            }
                        })

        # Build response in LiteLLM format
        response = {
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": text_content or None,
                    "tool_calls": tool_calls if tool_calls else None
                },
                "finish_reason": "tool_calls" if tool_calls else "stop"
            }],
            "usage": {
                # TODO: Extract from SDK response
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            },
            "model": self.config.model
        }

        return response

    async def streaming_completion(
        self,
        messages: list,
        tools: list[dict] = None,
        **kwargs
    ) -> AsyncIterator[dict]:
        """
        Streaming completion method.
        """
        await self._ensure_client()

        # Register tools
        if tools:
            for tool_spec in tools:
                self.register_tool(tool_spec)

        # Convert and query
        prompt = self._convert_messages_to_prompt(messages)
        await self._client.query(prompt)

        # Stream responses
        async for message in self._client.receive_messages():
            if isinstance(message, AssistantMessage):
                # Yield chunks in LiteLLM streaming format
                for block in message.content:
                    if isinstance(block, TextBlock):
                        yield {
                            "choices": [{
                                "delta": {
                                    "role": "assistant",
                                    "content": block.text
                                }
                            }]
                        }
                    elif isinstance(block, ToolUseBlock):
                        yield {
                            "choices": [{
                                "delta": {
                                    "tool_calls": [{
                                        "id": block.id,
                                        "type": "function",
                                        "function": {
                                            "name": block.name,
                                            "arguments": json.dumps(block.input)
                                        }
                                    }]
                                }
                            }]
                        }

            if isinstance(message, ResultMessage):
                # End of stream
                break

    async def disconnect(self):
        """Disconnect client."""
        if self._client:
            await self._client.disconnect()
            self._client = None
```

### Example 3: MCP Integration

```python
# openhands/llm/claude_sdk_provider.py (continued)

class ClaudeSDKProvider(BaseLLM):
    # ... previous code ...

    def register_mcp_servers(self, mcp_configs: dict):
        """
        Register MCP servers with Claude SDK.

        Args:
            mcp_configs: Dict of server_name → MCPConfig
        """
        sdk_servers = {}

        for server_name, config in mcp_configs.items():
            # Convert OpenHands MCP config to SDK format
            sdk_server = self._convert_mcp_config(server_name, config)
            if sdk_server:
                sdk_servers[server_name] = sdk_server

        # Update client options
        if self._client:
            # Reconnect with new MCP servers
            asyncio.create_task(self._reconnect_with_mcp(sdk_servers))

    async def _reconnect_with_mcp(self, mcp_servers: dict):
        """Reconnect client with MCP servers."""
        await self.disconnect()

        options = ClaudeAgentOptions(
            model=self.config.model,
            mcp_servers=mcp_servers,
            # ... other options
        )

        self._client = ClaudeSDKClient(options=options)
        await self._client.connect()

    def _convert_mcp_config(
        self,
        server_name: str,
        config: "MCPConfig"
    ):
        """
        Convert OpenHands MCP config to Claude SDK format.
        """
        if config.type == "stdio":
            return {
                "type": "stdio",
                "command": config.command,
                "args": config.args,
                "env": config.env
            }
        elif config.type == "sse":
            return {
                "type": "sse",
                "url": config.url,
                "headers": config.headers
            }
        elif config.type == "shttp":
            return {
                "type": "shttp",
                "url": config.url,
                "timeout": config.timeout
            }

        return None
```

### Example 4: Agent Integration

```python
# openhands/agenthub/codeact_agent/codeact_agent.py

from openhands.llm.factory import create_llm
from openhands.core.config import LLMConfig

class CodeActAgent(Agent):
    def __init__(self, llm_config: LLMConfig):
        # Factory creates appropriate provider
        self.llm = create_llm(llm_config)

        # Rest of initialization unchanged
        # Works with both LiteLLMProvider and ClaudeSDKProvider
        super().__init__()

    async def step(self, state: State) -> Action:
        # Build messages from state
        messages = self._build_messages(state)

        # Get tools
        tools = self._get_available_tools()

        # Call LLM (works with both providers!)
        response = await self.llm.completion(
            messages=messages,
            tools=tools
        )

        # Parse response (same format from both providers)
        actions = self._parse_response(response)

        return actions
```

---

## Migration Challenges

### Challenge 1: Multi-Provider Support Loss

**Problem**: Claude SDK only supports Claude models. OpenHands currently supports 50+ providers.

**Solutions**:
1. **Hybrid approach** (recommended) - Keep LiteLLM for non-Claude models
2. **Claude-only fork** - Create specialized Claude-optimized version
3. **Provider abstraction** - Deep abstraction layer (complex)

**Recommendation**: Hybrid with automatic provider selection based on model name.

### Challenge 2: Tool Execution Bridging

**Problem**: Claude SDK expects tool handlers to be async functions. OpenHands tools are executed through the Runtime system via EventStream.

**Solutions**:
1. **Async bridge functions** - Create async wrappers that route to Runtime
2. **Callback pattern** - Tool handlers trigger callbacks to Runtime
3. **Queue-based execution** - Tools add to execution queue, await results

**Recommendation**: Async bridge with proper error handling and timeout support.

### Challenge 3: Conversation State Management

**Problem**: OpenHands maintains conversation history in EventStream. Claude SDK has its own session state.

**Solutions**:
1. **SDK as source of truth** - Let SDK manage conversation
2. **EventStream as source of truth** - Sync SDK state from EventStream
3. **Dual state** - Maintain both, sync periodically

**Recommendation**: EventStream remains authoritative, SDK client recreated per turn with full history.

### Challenge 4: Streaming and Interrupts

**Problem**: OpenHands has complex streaming with interrupts. SDK interrupts work differently.

**Solutions**:
1. **Use SDK's interrupt mechanism** - Adapt OpenHands to SDK patterns
2. **Custom interrupt layer** - Wrap SDK with custom interrupt handling
3. **Disable streaming for SDK** - Use non-streaming mode (simpler)

**Recommendation**: Use SDK interrupts, map to OpenHands interrupt events.

### Challenge 5: Metrics and Cost Tracking

**Problem**: SDK doesn't provide detailed metrics. OpenHands tracks costs, tokens, latency.

**Solutions**:
1. **Parse from responses** - Extract token usage from SDK responses
2. **External tracking** - Wrap SDK calls with timing/counting
3. **API polling** - Query Anthropic API for usage stats

**Recommendation**: Hybrid - parse responses + external timing, with periodic API reconciliation.

### Challenge 6: Error Handling and Retry

**Problem**: SDK has basic error handling. OpenHands has sophisticated exponential backoff for 6 error types.

**Solutions**:
1. **Wrap SDK calls** - Add retry logic around SDK methods
2. **Use SDK hooks** - Implement retry in error hooks
3. **Hybrid** - SDK handles connection errors, custom logic for API errors

**Recommendation**: Wrap SDK calls with existing retry decorator, catch SDK exceptions.

---

## Testing Strategy

### Unit Tests

```python
# tests/unit/test_claude_sdk_provider.py

import pytest
from openhands.llm.claude_sdk_provider import ClaudeSDKProvider
from openhands.core.config import LLMConfig

@pytest.mark.asyncio
async def test_claude_sdk_completion():
    config = LLMConfig(
        model="claude-sonnet-4-5",
        use_claude_sdk=True
    )
    provider = ClaudeSDKProvider(config)

    messages = [
        {"role": "user", "content": "Hello"}
    ]

    response = await provider.completion(messages)

    assert response["choices"][0]["message"]["role"] == "assistant"
    assert len(response["choices"][0]["message"]["content"]) > 0

@pytest.mark.asyncio
async def test_tool_registration():
    config = LLMConfig(model="claude-sonnet-4-5", use_claude_sdk=True)
    provider = ClaudeSDKProvider(config)

    tool_spec = {
        "type": "function",
        "function": {
            "name": "test_tool",
            "description": "Test tool",
            "parameters": {
                "type": "object",
                "properties": {
                    "arg": {"type": "string"}
                }
            }
        }
    }

    provider.register_tool(tool_spec)
    assert "test_tool" in provider._tools

@pytest.mark.asyncio
async def test_streaming():
    config = LLMConfig(model="claude-sonnet-4-5", use_claude_sdk=True)
    provider = ClaudeSDKProvider(config)

    messages = [{"role": "user", "content": "Count to 3"}]

    chunks = []
    async for chunk in provider.streaming_completion(messages):
        chunks.append(chunk)

    assert len(chunks) > 0
```

### Integration Tests

```python
# tests/integration/test_agent_with_sdk.py

import pytest
from openhands.agenthub.codeact_agent import CodeActAgent
from openhands.core.config import LLMConfig

@pytest.mark.asyncio
async def test_codeact_with_claude_sdk():
    config = LLMConfig(
        model="claude-sonnet-4-5",
        use_claude_sdk=True
    )
    agent = CodeActAgent(config)

    # Create initial state
    state = create_test_state("Write hello world to file.txt")

    # Agent step
    action = await agent.step(state)

    # Verify action is valid
    assert action is not None
    assert isinstance(action, (CmdRunAction, FileWriteAction))

@pytest.mark.asyncio
async def test_mcp_integration():
    config = LLMConfig(
        model="claude-sonnet-4-5",
        use_claude_sdk=True
    )

    # Set up MCP server
    mcp_config = {
        "test_server": {
            "type": "stdio",
            "command": "python",
            "args": ["-m", "test_mcp_server"]
        }
    }

    agent = CodeActAgent(config)
    agent.llm.register_mcp_servers(mcp_config)

    # Use MCP tool
    state = create_test_state("Use test_server to greet user")
    action = await agent.step(state)

    # Verify MCP tool was called
    assert "mcp__test_server" in str(action)
```

### End-to-End Tests

```python
# tests/e2e/test_full_workflow.py

@pytest.mark.asyncio
async def test_full_task_completion():
    """
    Test complete task: clone repo, analyze, make changes, commit
    """
    config = LLMConfig(
        model="claude-sonnet-4-5",
        use_claude_sdk=True,
        max_iterations=20
    )

    controller = AgentController(
        agent_cls=CodeActAgent,
        llm_config=config
    )

    task = "Clone https://github.com/test/repo, find all TODOs, create a summary file"

    # Run task
    await controller.start(task)

    while controller.state.status == "running":
        await asyncio.sleep(1)

    # Verify completion
    assert controller.state.status == "finished"
    assert os.path.exists("todo_summary.md")
```

### Performance Tests

```python
# tests/performance/test_sdk_performance.py

import time
import pytest

@pytest.mark.asyncio
async def test_latency_comparison():
    """Compare LiteLLM vs SDK latency"""

    # Test LiteLLM
    litellm_config = LLMConfig(model="claude-sonnet-4-5", use_claude_sdk=False)
    litellm_provider = create_llm(litellm_config)

    start = time.time()
    await litellm_provider.completion([{"role": "user", "content": "Hi"}])
    litellm_time = time.time() - start

    # Test SDK
    sdk_config = LLMConfig(model="claude-sonnet-4-5", use_claude_sdk=True)
    sdk_provider = create_llm(sdk_config)

    start = time.time()
    await sdk_provider.completion([{"role": "user", "content": "Hi"}])
    sdk_time = time.time() - start

    print(f"LiteLLM: {litellm_time:.2f}s, SDK: {sdk_time:.2f}s")

    # SDK should be comparable or faster
    assert sdk_time < litellm_time * 1.5  # Allow 50% margin

@pytest.mark.asyncio
async def test_token_efficiency():
    """Verify token usage is tracked correctly"""

    config = LLMConfig(model="claude-sonnet-4-5", use_claude_sdk=True)
    provider = create_llm(config)

    response = await provider.completion([
        {"role": "user", "content": "Write a function to add two numbers"}
    ])

    # Verify token counts
    usage = response["usage"]
    assert usage["prompt_tokens"] > 0
    assert usage["completion_tokens"] > 0
    assert usage["total_tokens"] == usage["prompt_tokens"] + usage["completion_tokens"]
```

---

## Rollout Plan

### Stage 1: Alpha (Internal Testing)
**Duration**: 2 weeks
**Audience**: Development team

1. Deploy SDK provider to dev environment
2. Enable for internal testing accounts only
3. Monitor error rates, latency, correctness
4. Fix critical bugs
5. Gather feedback from developers

**Success Criteria**:
- Zero critical bugs
- Latency within 20% of LiteLLM
- 100% feature parity for basic operations

### Stage 2: Beta (Limited Release)
**Duration**: 4 weeks
**Audience**: 5% of users on Claude models

1. Enable `use_claude_sdk` flag in config
2. Default to `false`, allow opt-in
3. Add telemetry to compare SDK vs LiteLLM
4. Monitor user feedback
5. A/B test performance metrics

**Success Criteria**:
- <1% error rate
- Positive user feedback
- Feature parity confirmed
- Performance metrics acceptable

### Stage 3: General Availability
**Duration**: Ongoing
**Audience**: All users

1. Make SDK default for Claude models
2. Keep LiteLLM as fallback option
3. Add configuration to switch providers
4. Monitor adoption and satisfaction

**Success Criteria**:
- Majority of Claude users on SDK
- Maintained or improved user satisfaction
- No increase in error rates

### Stage 4: Optimization
**Duration**: Ongoing
**Audience**: All users

1. Add SDK-specific optimizations
2. Leverage advanced SDK features (hooks, custom tools)
3. Improve error handling and retry logic
4. Optimize token usage and costs

**Success Criteria**:
- Measurable cost reduction
- Improved latency
- Better tool calling accuracy

---

## Conclusion

Converting OpenHands from LiteLLM to Claude Agent SDK is a significant architectural change that offers:

**Benefits**:
- Better Claude integration and performance
- Native tool calling without simulation
- Built-in conversation management
- MCP server integration
- Potential for SDK-specific optimizations

**Risks**:
- Loss of multi-provider support (mitigated by hybrid approach)
- Implementation complexity
- Potential for subtle behavioral changes
- Testing burden

**Recommendation**:
Implement a **hybrid architecture** that:
1. Keeps LiteLLM for non-Claude models
2. Uses Claude SDK for Claude models when enabled
3. Provides seamless provider switching via configuration
4. Maintains backward compatibility

This approach provides the best of both worlds - optimal Claude performance while preserving OpenHands' multi-provider flexibility.

**Estimated Timeline**: 10 weeks from design to production rollout

**Resources Required**:
- 2 senior backend engineers
- 1 QA engineer
- 1 DevOps engineer for rollout

**Next Steps**:
1. Review this strategy with team
2. Get approval for hybrid architecture approach
3. Begin Phase 1 (Foundation) implementation
4. Set up telemetry and monitoring
5. Execute phased rollout plan
