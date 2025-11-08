# OpenHands LiteLLM to Claude SDK Conversion: Complete Architecture & Dependency Map

## Executive Summary

This document maps the complete dependency chain and architecture for converting OpenHands from LiteLLM to Claude SDK. It identifies all components, their relationships, data flows, and the order in which conversion should proceed.

---

## 1. DEPENDENCY GRAPH: What Depends on What?

### 1.1 Core LLM Dependencies (Bottom Layer)

```
litellm (external library)
    ├── ModelResponse (type)
    ├── Message/LiteLLMMessage (type)
    ├── ChatCompletionToolParam (type)
    ├── ChatCompletionMessageToolCall (type)
    ├── completion() (function)
    ├── completion_cost() (function)
    ├── token_counter() (function)
    ├── supports_vision() (function)
    ├── get_model_info() (function)
    └── Exceptions (APIConnectionError, RateLimitError, etc.)
```

### 1.2 OpenHands LLM Layer (Abstraction Layer)

```
openhands/llm/
    ├── llm.py [LLM class] - CRITICAL CONVERSION POINT
    │   ├── Wraps litellm.completion()
    │   ├── Handles retries (RetryMixin)
    │   ├── Handles debugging (DebugMixin)
    │   ├── Manages metrics (Metrics)
    │   ├── Handles function calling conversion
    │   ├── Manages token counting
    │   └── Calculates costs
    │
    ├── llm_registry.py [LLMRegistry] - Service locator pattern
    │   ├── Creates and manages LLM instances
    │   ├── Maps service IDs to LLM instances
    │   ├── Handles LLM configuration
    │   └── Notifies subscribers of new LLMs
    │
    ├── fn_call_converter.py - Function calling compatibility layer
    │   ├── convert_fncall_messages_to_non_fncall_messages()
    │   ├── convert_non_fncall_messages_to_fncall_messages()
    │   ├── convert_tool_call_to_string()
    │   └── convert_tools_to_description()
    │
    ├── streaming_llm.py - Streaming support
    ├── async_llm.py - Async support
    ├── metrics.py [Metrics] - Token & cost tracking
    ├── model_features.py - Model capability detection
    ├── retry_mixin.py - Retry logic
    └── debug_mixin.py - Debug logging
```

### 1.3 Message & Configuration Layer

```
openhands/core/
    ├── message.py [Message, TextContent, ImageContent]
    │   ├── Used by: Agent.step(), LLM.completion()
    │   ├── Serializes to dict for LLM consumption
    │   └── Handles vision, caching, tool calls
    │
    └── config/
        ├── llm_config.py [LLMConfig]
        │   ├── 53 configuration parameters
        │   ├── Used by: LLM, LLMRegistry
        │   └── Controls: retries, timeouts, model, api_key, etc.
        │
        ├── agent_config.py [AgentConfig]
        │   ├── Agent-specific configuration
        │   └── References LLMConfig
        │
        └── openhands_config.py [OpenHandsConfig]
            └── Top-level configuration
```

### 1.4 Agent Layer

```
openhands/controller/
    ├── agent.py [Agent - Abstract Base Class]
    │   ├── Properties:
    │   │   ├── llm: LLM (from llm_registry)
    │   │   ├── llm_registry: LLMRegistry
    │   │   ├── config: AgentConfig
    │   │   ├── tools: list[ChatCompletionToolParam]
    │   │   └── mcp_tools: dict[str, ChatCompletionToolParam]
    │   ├── Methods:
    │   │   ├── step(state) -> Action [ABSTRACT]
    │   │   ├── get_system_message() -> SystemMessageAction
    │   │   └── set_mcp_tools(tools)
    │   └── Dependencies: LLMRegistry
    │
    └── agent_controller.py [AgentController]
        ├── Controls agent execution loop
        ├── Manages state transitions
        ├── Handles observations and actions
        ├── Manages delegation to sub-agents
        └── Dependencies: Agent, EventStream, State
```

### 1.5 Concrete Agent Implementations

```
openhands/agenthub/
    ├── codeact_agent/
    │   ├── codeact_agent.py [CodeActAgent(Agent)]
    │   │   ├── step(state) -> Action
    │   │   ├── Calls: self.llm.completion(messages, tools)
    │   │   ├── Uses: ConversationMemory, Condenser
    │   │   └── Processes: ModelResponse -> Actions
    │   │
    │   ├── function_calling.py
    │   │   ├── response_to_actions(ModelResponse) -> list[Action]
    │   │   ├── Converts LLM tool calls to OpenHands Actions
    │   │   └── Handles: CmdRun, IPython, FileEdit, Delegate, etc.
    │   │
    │   └── tools/
    │       ├── bash.py - Bash command tool
    │       ├── ipython.py - IPython tool
    │       ├── browser.py - Browser tool
    │       ├── str_replace_editor.py - File editing tool
    │       ├── finish.py - Finish tool
    │       └── think.py - Think tool
    │
    ├── browsing_agent/
    │   └── browsing_agent.py [BrowsingAgent(Agent)]
    │
    ├── loc_agent/
    │   └── loc_agent.py [LocAgent(CodeActAgent)]
    │
    ├── readonly_agent/
    │   └── readonly_agent.py [ReadOnlyAgent(CodeActAgent)]
    │
    └── dummy_agent/
        └── agent.py [DummyAgent(Agent)]
```

### 1.6 Which Files Depend on LiteLLM Types?

**CRITICAL FILES USING LITELLM TYPES:**

1. **openhands/llm/llm.py** (PRIMARY)
   - `from litellm import completion, completion_cost, ModelResponse, Message, PromptTokensDetails, Usage`
   - `from litellm.exceptions import *`
   - `from litellm.types.utils import CostPerToken, ModelResponse, Usage`

2. **openhands/core/message.py**
   - `from litellm import ChatCompletionMessageToolCall`

3. **openhands/controller/agent.py**
   - `from litellm import ChatCompletionToolParam`

4. **openhands/agenthub/codeact_agent/function_calling.py**
   - `from litellm import ModelResponse`

5. **openhands/llm/fn_call_converter.py**
   - `from litellm import ChatCompletionToolParam`

6. **openhands/memory/conversation_memory.py**
   - `from litellm import ModelResponse`

7. **openhands/events/tool.py**
   - `from litellm import ModelResponse`

8. **Tools (bash.py, ipython.py, browser.py, etc.)**
   - `from litellm import ChatCompletionToolParam, ChatCompletionToolParamFunctionChunk`

---

## 2. AGENT INHERITANCE HIERARCHY

```
Agent (Abstract Base Class)
│   Location: openhands/controller/agent.py
│   Key Properties:
│   ├── llm: LLM
│   ├── llm_registry: LLMRegistry
│   ├── config: AgentConfig
│   ├── tools: list[ChatCompletionToolParam]
│   └── mcp_tools: dict
│   Key Methods:
│   ├── step(state) -> Action [ABSTRACT]
│   └── get_system_message() -> SystemMessageAction
│
├── CodeActAgent
│   │   Location: openhands/agenthub/codeact_agent/codeact_agent.py
│   │   Additional Properties:
│   │   ├── pending_actions: deque[Action]
│   │   ├── conversation_memory: ConversationMemory
│   │   └── condenser: Condenser
│   │   Methods:
│   │   ├── step(state) -> Action [IMPLEMENTED]
│   │   ├── response_to_actions(ModelResponse) -> list[Action]
│   │   └── _get_messages(events) -> list[Message]
│   │
│   ├── LocAgent
│   │   Location: openhands/agenthub/loc_agent/loc_agent.py
│   │   Extends: CodeActAgent
│   │
│   └── ReadOnlyAgent
│       Location: openhands/agenthub/readonly_agent/readonly_agent.py
│       Extends: CodeActAgent
│
├── BrowsingAgent
│   Location: openhands/agenthub/browsing_agent/browsing_agent.py
│   Extends: Agent
│
├── VisualBrowsingAgent
│   Location: openhands/agenthub/visualbrowsing_agent/visualbrowsing_agent.py
│   Extends: Agent
│
└── DummyAgent
    Location: openhands/agenthub/dummy_agent/agent.py
    Extends: Agent
```

---

## 3. CORE DATA FLOW: Request → Response → Actions

### 3.1 High-Level Flow

```
1. USER INPUT
   └─> EventStream (MessageAction added)

2. AGENT CONTROLLER
   └─> Detects user message
   └─> Calls agent.step(state)

3. AGENT (CodeActAgent.step)
   ├─> Condenser.condensed_history(state) 
   │   └─> Returns condensed event list
   ├─> _get_messages(events, initial_user_message)
   │   ├─> ConversationMemory.process_events()
   │   │   └─> Converts Events → Messages
   │   └─> Returns list[Message]
   └─> self.llm.completion(messages=messages, tools=tools)

4. LLM (openhands/llm/llm.py)
   ├─> Format messages: Message objects → dict format
   ├─> Handle function calling conversion (if needed)
   │   ├─> Check if model supports native function calling
   │   ├─> If NO: convert_fncall_messages_to_non_fncall_messages()
   │   └─> If YES: pass tools directly
   ├─> Call: litellm.completion(**kwargs)
   ├─> Receive: ModelResponse
   ├─> If mock function calling: convert_non_fncall_messages_to_fncall_messages()
   ├─> Calculate metrics (cost, tokens, latency)
   └─> Return: ModelResponse

5. AGENT (response processing)
   └─> response_to_actions(ModelResponse)
       ├─> Extract tool_calls from response.choices[0].message
       ├─> For each tool_call:
       │   ├─> Parse function name and arguments
       │   └─> Create corresponding Action:
       │       ├─> CmdRunAction (for execute_bash)
       │       ├─> IPythonRunCellAction (for ipython)
       │       ├─> FileEditAction (for str_replace_editor)
       │       ├─> AgentFinishAction (for finish)
       │       ├─> BrowseInteractiveAction (for browser)
       │       ├─> AgentDelegateAction (for delegation)
       │       └─> MessageAction (if no tool calls)
       └─> Return: list[Action]

6. AGENT CONTROLLER
   ├─> Receives Action from agent.step()
   ├─> Validates action (security checks if needed)
   ├─> Adds action to EventStream
   └─> If action.runnable:
       └─> Runtime executes action → Observation

7. RUNTIME
   ├─> Executes action in sandbox
   ├─> Creates Observation (result)
   └─> Adds Observation to EventStream

8. AGENT CONTROLLER (observation handling)
   ├─> Receives Observation
   ├─> Adds to state history
   └─> Triggers next agent.step()

LOOP CONTINUES until AgentFinishAction or error
```

### 3.2 Detailed Message Flow

```
Events (State.history)
    ↓
Condenser (filter/summarize events)
    ↓
Condensed Events (list[Event])
    ↓
ConversationMemory.process_events()
    ↓
Messages (list[Message])
    ├─> Message.role: 'system' | 'user' | 'assistant' | 'tool'
    ├─> Message.content: list[TextContent | ImageContent]
    ├─> Message.tool_calls: list[ChatCompletionMessageToolCall] | None
    └─> Message.tool_call_id: str | None (for tool role)
    ↓
Message.model_dump() (serialization)
    ↓
dict format for LLM
    ├─> String serialization (old API, no vision/tools)
    └─> List serialization (new API, with vision/tools/caching)
    ↓
LLM.completion(messages)
    ├─> If mock function calling:
    │   ├─> convert_fncall_messages_to_non_fncall_messages()
    │   │   ├─> System: Add tool descriptions
    │   │   ├─> User: Add in-context examples (first message only)
    │   │   ├─> Assistant: Convert tool_calls to XML format
    │   │   └─> Tool: Convert to user message with result
    │   ├─> litellm.completion(**kwargs)
    │   ├─> Receive ModelResponse
    │   └─> convert_non_fncall_messages_to_fncall_messages()
    │       └─> Parse XML back to tool_calls
    │
    └─> If native function calling:
        ├─> litellm.completion(messages, tools, **kwargs)
        └─> Receive ModelResponse with tool_calls
    ↓
ModelResponse
    ├─> choices[0].message.content: str
    ├─> choices[0].message.tool_calls: list[ToolCall]
    └─> usage: Usage (token counts)
    ↓
response_to_actions(ModelResponse)
    ├─> Extract tool_calls
    ├─> For each tool_call:
    │   ├─> Parse: tool_call.function.name
    │   ├─> Parse: json.loads(tool_call.function.arguments)
    │   └─> Create Action with tool_call_metadata
    └─> Return: list[Action]
    ↓
Action (added to EventStream)
    ├─> Has tool_call_metadata: ToolCallMetadata
    │   ├─> tool_call_id
    │   ├─> function_name
    │   ├─> model_response (full ModelResponse)
    │   └─> total_calls_in_response
    └─> Executed by Runtime
    ↓
Observation (result of action)
    ├─> Linked to Action via cause_id
    ├─> Has tool_call_metadata (same as Action)
    └─> Added to EventStream
    ↓
NEXT ITERATION: Observation becomes part of State.history
```

---

## 4. TOOL EXECUTION FLOW

### 4.1 Tool Definition Phase (Agent Initialization)

```
Agent.__init__(config, llm_registry)
    ↓
Agent._get_tools()
    ├─> Creates list of ChatCompletionToolParam
    ├─> Each tool defined in tools/ directory:
    │   ├─> bash.py: create_cmd_run_tool()
    │   │   └─> Returns ChatCompletionToolParam dict
    │   ├─> ipython.py: IPythonTool (constant dict)
    │   ├─> str_replace_editor.py: create_str_replace_editor_tool()
    │   ├─> finish.py: FinishTool
    │   ├─> think.py: ThinkTool
    │   ├─> browser.py: BrowserTool
    │   └─> task_tracker.py: create_task_tracker_tool()
    │
    └─> Sets self.tools = list[ChatCompletionToolParam]
        Example tool structure:
        {
            'type': 'function',
            'function': {
                'name': 'execute_bash',
                'description': '...',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'command': {
                            'type': 'string',
                            'description': '...'
                        },
                        'is_input': {...},
                        'timeout': {...},
                        'security_risk': {...}
                    },
                    'required': ['command']
                }
            }
        }
```

### 4.2 Tool Sending Phase (LLM Call)

```
Agent.step(state)
    ↓
params = {
    'messages': messages,
    'tools': check_tools(self.tools, self.llm.config),
    'extra_body': {...}
}
    ↓
self.llm.completion(**params)
    ├─> If native function calling:
    │   ├─> Pass tools directly to litellm.completion()
    │   └─> LLM receives tools in native format
    │
    └─> If mock function calling:
        ├─> convert_fncall_messages_to_non_fncall_messages(messages, tools)
        │   ├─> Converts tools to text description
        │   ├─> Adds to system message
        │   └─> Adds in-context examples
        ├─> Remove 'tools' from kwargs
        └─> LLM sees tools as text in messages
```

### 4.3 Tool Calling Phase (LLM Response)

```
LLM returns ModelResponse
    ├─> If native function calling:
    │   └─> response.choices[0].message.tool_calls = [
    │           {
    │               'id': 'toolu_01',
    │               'type': 'function',
    │               'function': {
    │                   'name': 'execute_bash',
    │                   'arguments': '{"command": "ls -la"}'
    │               }
    │           }
    │       ]
    │
    └─> If mock function calling:
        ├─> response.choices[0].message.content = "...<function=execute_bash>..."
        ├─> convert_non_fncall_messages_to_fncall_messages()
        │   ├─> Parse XML format: <function=name><parameter=x>...</parameter></function>
        │   ├─> Extract function name and parameters
        │   └─> Create tool_call dict
        └─> Modifies response.choices[0].message.tool_calls
```

### 4.4 Tool to Action Conversion

```
response_to_actions(ModelResponse)
    ↓
For each tool_call in response.choices[0].message.tool_calls:
    ├─> Extract: tool_call.function.name
    ├─> Parse: arguments = json.loads(tool_call.function.arguments)
    │
    ├─> Match tool name to Action class:
    │   ├─> 'execute_bash' → CmdRunAction
    │   │   └─> CmdRunAction(command=arguments['command'], ...)
    │   │
    │   ├─> 'ipython' → IPythonRunCellAction
    │   │   └─> IPythonRunCellAction(code=arguments['code'])
    │   │
    │   ├─> 'str_replace_editor' → FileEditAction or FileReadAction
    │   │   ├─> If arguments['command'] == 'view':
    │   │   │   └─> FileReadAction(path=...)
    │   │   └─> Else:
    │   │       └─> FileEditAction(path=, command=, ...)
    │   │
    │   ├─> 'finish' → AgentFinishAction
    │   │   └─> AgentFinishAction(final_thought=...)
    │   │
    │   ├─> 'browser' → BrowseInteractiveAction
    │   │   └─> BrowseInteractiveAction(browser_actions=...)
    │   │
    │   ├─> 'delegate_to_browsing_agent' → AgentDelegateAction
    │   │   └─> AgentDelegateAction(agent='BrowsingAgent', ...)
    │   │
    │   ├─> MCP tool name → MCPAction
    │   │   └─> MCPAction(name=..., arguments=...)
    │   │
    │   └─> Unknown tool → FunctionCallNotExistsError
    │
    ├─> Add metadata to action:
    │   └─> action.tool_call_metadata = ToolCallMetadata(
    │           tool_call_id=tool_call.id,
    │           function_name=tool_call.function.name,
    │           model_response=response,
    │           total_calls_in_response=len(tool_calls)
    │       )
    │
    └─> Return: list[Action]
```

### 4.5 Action Execution Phase

```
AgentController receives Action
    ├─> Adds Action to EventStream
    ├─> If action.runnable:
    │   ├─> Security check (if confirmation_mode)
    │   ├─> Runtime.run(action)
    │   │   ├─> CmdRunAction → Executes bash in sandbox
    │   │   ├─> IPythonRunCellAction → Executes Python in Jupyter
    │   │   ├─> FileEditAction → Edits file in sandbox
    │   │   ├─> BrowseInteractiveAction → Controls browser
    │   │   └─> MCPAction → Calls MCP server
    │   │
    │   └─> Runtime creates Observation
    │       ├─> CmdObservation (stdout, stderr, exit_code)
    │       ├─> IPythonObservation (output)
    │       ├─> FileEditObservation (result)
    │       ├─> BrowserObservation (browser state)
    │       └─> MCPObservation (tool result)
    │
    └─> Observation.tool_call_metadata = action.tool_call_metadata
        └─> Links Observation back to original tool call
```

### 4.6 Observation to Message Conversion (Next Iteration)

```
Next agent.step(state)
    ↓
ConversationMemory.process_events(events)
    ├─> Finds Action with tool_call_metadata
    ├─> Finds matching Observation
    │   └─> Observation.cause == Action.id
    │
    ├─> Creates tool message:
    │   └─> Message(
    │           role='tool',
    │           content=[TextContent(text=observation.content)],
    │           tool_call_id=action.tool_call_metadata.tool_call_id,
    │           name=action.tool_call_metadata.function_name
    │       )
    │
    └─> Appends to messages list
        └─> LLM sees tool execution result in next call
```

---

## 5. CONFIGURATION DEPENDENCIES

### 5.1 Configuration Hierarchy

```
OpenHandsConfig (Top-level)
    ├── default_agent: str
    ├── agent_configs: dict[str, AgentConfig]
    ├── llm: LLMConfig (default)
    ├── llm_configs: dict[str, LLMConfig] (custom LLMs)
    └── get_llm_config_from_agent(agent_name) -> LLMConfig

AgentConfig (Per-agent)
    ├── llm: LLMConfig | None
    ├── memory_max_threads: int
    ├── llm_config: str | None (reference to custom LLM)
    ├── model_routing: ModelRoutingConfig
    ├── condenser: CondenserConfig
    ├── enable_cmd: bool
    ├── enable_jupyter: bool
    ├── enable_browsing: bool
    ├── enable_editor: bool
    ├── enable_llm_editor: bool
    ├── enable_finish: bool
    ├── enable_think: bool
    └── cli_mode: bool

LLMConfig (53 parameters!)
    ├── model: str = 'claude-sonnet-4-20250514'
    ├── api_key: SecretStr | None
    ├── base_url: str | None
    ├── api_version: str | None
    ├── temperature: float = 0.0
    ├── top_p: float = 1.0
    ├── top_k: float | None
    ├── max_input_tokens: int | None
    ├── max_output_tokens: int | None
    ├── max_message_chars: int = 30_000
    ├── timeout: int | None
    ├── num_retries: int = 5
    ├── retry_multiplier: float = 8
    ├── retry_min_wait: int = 8
    ├── retry_max_wait: int = 64
    ├── custom_llm_provider: str | None
    ├── aws_access_key_id: SecretStr | None
    ├── aws_secret_access_key: SecretStr | None
    ├── aws_region_name: str | None
    ├── drop_params: bool = True
    ├── modify_params: bool = True
    ├── disable_vision: bool | None
    ├── disable_stop_word: bool | None
    ├── caching_prompt: bool = True
    ├── log_completions: bool
    ├── log_completions_folder: str
    ├── custom_tokenizer: str | None
    ├── native_tool_calling: bool | None
    ├── reasoning_effort: str | None
    ├── seed: int | None
    ├── safety_settings: list[dict] | None
    ├── for_routing: bool
    ├── input_cost_per_token: float | None
    ├── output_cost_per_token: float | None
    └── completion_kwargs: dict | None
```

### 5.2 Configuration Flow

```
1. INITIALIZATION
   OpenHandsConfig
       ↓
   get_llm_config_from_agent(agent_name)
       ↓
   LLMRegistry.__init__(config, agent_cls)
       ├─> Creates default LLM: self.active_agent_llm
       └─> Stores config: self.agent_to_llm_config

2. AGENT CREATION
   Agent.__init__(config, llm_registry)
       ↓
   llm_registry.get_llm_from_agent_config('agent', config)
       ├─> Creates or retrieves LLM instance
       └─> Returns: LLM instance
       ↓
   self.llm = llm
   self.llm_registry = llm_registry

3. LLM INSTANCE CREATION
   LLMRegistry._create_new_llm(service_id, config)
       ↓
   LLM.__init__(config, service_id, metrics, retry_listener)
       ├─> self.config = config
       ├─> self.metrics = Metrics()
       ├─> self.init_model_info()
       │   ├─> Queries litellm.get_model_info()
       │   ├─> Sets max_output_tokens
       │   ├─> Sets function_calling_active
       │   └─> Detects vision support
       ├─> Creates partial function:
       │   └─> self._completion = partial(
       │           litellm_completion,
       │           model=config.model,
       │           api_key=config.api_key,
       │           base_url=config.base_url,
       │           temperature=config.temperature,
       │           max_completion_tokens=config.max_output_tokens,
       │           ...
       │       )
       └─> Wraps with retry decorator

4. CONFIGURATION USAGE
   Agent.step()
       ├─> Uses: self.llm.config.max_message_chars
       │   └─> For truncating long observations
       ├─> Uses: self.llm.vision_is_active()
       │   └─> Based on config.disable_vision
       ├─> Uses: self.llm.is_caching_prompt_active()
       │   └─> Based on config.caching_prompt
       └─> Uses: self.llm.is_function_calling_active()
           └─> Based on config.native_tool_calling + model features
```

### 5.3 Configuration Dependencies by Layer

```
LLMConfig → LLM
    ├─> model → litellm.completion(model=...)
    ├─> api_key → litellm.completion(api_key=...)
    ├─> base_url → litellm.completion(base_url=...)
    ├─> temperature → litellm.completion(temperature=...)
    ├─> max_output_tokens → litellm.completion(max_completion_tokens=...)
    ├─> timeout → litellm.completion(timeout=...)
    ├─> num_retries → RetryMixin decorator
    ├─> retry_min_wait → RetryMixin decorator
    ├─> retry_max_wait → RetryMixin decorator
    ├─> retry_multiplier → RetryMixin decorator
    ├─> native_tool_calling → Function calling conversion logic
    ├─> disable_vision → Message serialization
    ├─> caching_prompt → Message serialization
    ├─> custom_tokenizer → Token counting
    └─> drop_params → litellm.completion(drop_params=...)

AgentConfig → Agent
    ├─> llm_config → LLMRegistry.get_llm()
    ├─> enable_cmd → _get_tools() includes bash tool
    ├─> enable_jupyter → _get_tools() includes IPython tool
    ├─> enable_browsing → _get_tools() includes browser tool
    ├─> enable_editor → _get_tools() includes str_replace_editor
    ├─> enable_llm_editor → _get_tools() includes LLM-based editor
    ├─> enable_finish → _get_tools() includes finish tool
    ├─> enable_think → _get_tools() includes think tool
    └─> condenser → Condenser configuration
```

---

## 6. MESSAGE FORMAT TRANSFORMATIONS

### 6.1 Event → Message Transformation

```
Event (from State.history)
    ├─> MessageAction(content="user input", source=USER)
    │   └─> Message(role='user', content=[TextContent(text="user input")])
    │
    ├─> SystemMessageAction(content="system prompt", tools=[...])
    │   └─> Message(role='system', content=[TextContent(text="system prompt")])
    │
    ├─> MessageAction(content="assistant response", source=AGENT)
    │   └─> Message(role='assistant', content=[TextContent(text="assistant response")])
    │
    ├─> Action with tool_call_metadata (e.g., CmdRunAction)
    │   └─> Message(
    │           role='assistant',
    │           content=[TextContent(text=action.thought)],
    │           tool_calls=[
    │               ChatCompletionMessageToolCall(
    │                   id=action.tool_call_metadata.tool_call_id,
    │                   type='function',
    │                   function=Function(
    │                       name=action.tool_call_metadata.function_name,
    │                       arguments=json.dumps({...})
    │                   )
    │               )
    │           ]
    │       )
    │
    └─> Observation (result of Action)
        └─> Message(
                role='tool',
                content=[TextContent(text=observation.content)],
                tool_call_id=observation.tool_call_metadata.tool_call_id,
                name=observation.tool_call_metadata.function_name
            )
```

### 6.2 Message Serialization (for LLM)

```
Message → dict

CASE 1: Simple string serialization (no vision, no tools, no caching)
    Message(role='user', content=[TextContent(text="hello")])
    →
    {
        'role': 'user',
        'content': 'hello'
    }

CASE 2: List serialization (vision/tools/caching enabled)
    Message(
        role='user',
        content=[
            TextContent(text="Look at this image"),
            ImageContent(image_urls=["data:image/png;base64,..."])
        ],
        vision_enabled=True
    )
    →
    {
        'role': 'user',
        'content': [
            {'type': 'text', 'text': 'Look at this image'},
            {'type': 'image_url', 'image_url': {'url': 'data:image/png;base64,...'}}
        ]
    }

CASE 3: Tool call message
    Message(
        role='assistant',
        content=[TextContent(text="Let me check that")],
        tool_calls=[
            ChatCompletionMessageToolCall(
                id='toolu_01',
                type='function',
                function=Function(name='execute_bash', arguments='{"command":"ls"}')
            )
        ]
    )
    →
    {
        'role': 'assistant',
        'content': [{'type': 'text', 'text': 'Let me check that'}],
        'tool_calls': [
            {
                'id': 'toolu_01',
                'type': 'function',
                'function': {
                    'name': 'execute_bash',
                    'arguments': '{"command":"ls"}'
                }
            }
        ]
    }

CASE 4: Tool result message
    Message(
        role='tool',
        content=[TextContent(text="file1.txt\nfile2.txt")],
        tool_call_id='toolu_01',
        name='execute_bash'
    )
    →
    {
        'role': 'tool',
        'content': [{'type': 'text', 'text': 'file1.txt\nfile2.txt'}],
        'tool_call_id': 'toolu_01',
        'name': 'execute_bash'
    }

CASE 5: Prompt caching (Anthropic)
    Message(
        role='user',
        content=[
            TextContent(text="part 1"),
            TextContent(text="part 2", cache_prompt=True)
        ],
        cache_enabled=True
    )
    →
    {
        'role': 'user',
        'content': [
            {'type': 'text', 'text': 'part 1'},
            {'type': 'text', 'text': 'part 2', 'cache_control': {'type': 'ephemeral'}}
        ]
    }
```

### 6.3 Function Calling Message Transformation (Mock Mode)

```
BEFORE conversion (function calling format):
messages = [
    {'role': 'system', 'content': 'You are a helpful assistant'},
    {'role': 'user', 'content': 'List files'},
    {
        'role': 'assistant',
        'content': 'Let me list the files',
        'tool_calls': [{
            'id': 'toolu_01',
            'type': 'function',
            'function': {'name': 'execute_bash', 'arguments': '{"command":"ls"}'}
        }]
    },
    {
        'role': 'tool',
        'content': 'file1.txt\nfile2.txt',
        'tool_call_id': 'toolu_01',
        'name': 'execute_bash'
    }
]
tools = [{
    'type': 'function',
    'function': {
        'name': 'execute_bash',
        'description': 'Execute bash command',
        'parameters': {
            'type': 'object',
            'properties': {'command': {'type': 'string'}},
            'required': ['command']
        }
    }
}]

AFTER convert_fncall_messages_to_non_fncall_messages(messages, tools):
[
    {
        'role': 'system',
        'content': 'You are a helpful assistant\n\nYou have access to the following functions:\n\n---- BEGIN FUNCTION #1: execute_bash ----\nDescription: Execute bash command\nParameters:\n  (1) command (string, required): ...\n---- END FUNCTION #1 ----\n\n...'
    },
    {
        'role': 'user',
        'content': 'Here\'s a running example...\n\nList files\n\n--------------------- END OF EXAMPLE ---------------------\n...'
    },
    {
        'role': 'assistant',
        'content': 'Let me list the files\n\n<function=execute_bash>\n<parameter=command>ls</parameter>\n</function>'
    },
    {
        'role': 'user',
        'content': 'EXECUTION RESULT of [execute_bash]:\nfile1.txt\nfile2.txt'
    }
]

AFTER LLM response (mock mode):
response.choices[0].message.content = 'Let me create a file\n\n<function=execute_bash>\n<parameter=command>touch newfile.txt</parameter>\n</function>'

AFTER convert_non_fncall_messages_to_fncall_messages(...):
response.choices[0].message = {
    'role': 'assistant',
    'content': 'Let me create a file',
    'tool_calls': [{
        'id': 'toolu_02',
        'type': 'function',
        'function': {
            'name': 'execute_bash',
            'arguments': '{"command":"touch newfile.txt"}'
        }
    }]
}
```

---

## 7. CRITICAL INTEGRATION POINTS

### 7.1 LLM Wrapper (openhands/llm/llm.py)

**Purpose:** Primary abstraction layer over LiteLLM

**Key Responsibilities:**
- Wrap `litellm.completion()` with retry logic
- Handle function calling conversion for non-native models
- Calculate costs using `litellm.completion_cost()`
- Track metrics (tokens, costs, latency)
- Format messages for LLM consumption
- Handle model-specific quirks (Azure, Anthropic, etc.)

**Integration Points:**
- **Inputs:**
  - `LLMConfig`: All configuration parameters
  - `list[Message]` or `list[dict]`: Conversation history
  - `tools: list[ChatCompletionToolParam]`: Available tools
- **Outputs:**
  - `ModelResponse`: LiteLLM response object
- **Dependencies:**
  - `litellm.completion()` - MUST REPLACE
  - `litellm.completion_cost()` - MUST REPLACE
  - `litellm.token_counter()` - MUST REPLACE
  - `litellm.get_model_info()` - MUST REPLACE
  - `litellm.supports_vision()` - MUST REPLACE

**Conversion Strategy:**
1. Replace `litellm.completion()` with Claude SDK `anthropic.messages.create()`
2. Replace cost calculation with Claude SDK pricing info
3. Replace token counting with Claude SDK tokenizer
4. Keep retry logic (compatible with any exception)
5. Adapt function calling conversion for Claude format

### 7.2 Function Calling Converter (openhands/llm/fn_call_converter.py)

**Purpose:** Convert between native and non-native function calling

**Key Responsibilities:**
- Convert tools to text descriptions
- Add in-context learning examples
- Parse XML function call format
- Validate function calls against tool schemas

**Integration Points:**
- **Inputs:**
  - `messages: list[dict]`: Conversation
  - `tools: list[ChatCompletionToolParam]`: Tool definitions
- **Outputs:**
  - Modified messages with function call information

**Conversion Strategy:**
- Claude SDK natively supports function calling
- **May be able to remove entirely** or simplify significantly
- Keep validation logic

### 7.3 Message Serialization (openhands/core/message.py)

**Purpose:** Serialize OpenHands Message objects to LLM-compatible format

**Key Responsibilities:**
- Handle text and image content
- Support prompt caching (Anthropic)
- Support vision
- Support tool calls and tool results
- Handle model-specific quirks

**Integration Points:**
- **Inputs:**
  - `Message` objects from ConversationMemory
- **Outputs:**
  - `dict` format for LLM API

**Conversion Strategy:**
1. Update serialization format to Claude SDK format
2. Tool calls: Already compatible (uses standard format)
3. Prompt caching: Keep Anthropic-specific logic
4. Vision: Update to Claude SDK image format

### 7.4 Response to Actions Converter (openhands/agenthub/codeact_agent/function_calling.py)

**Purpose:** Convert LLM response to OpenHands Actions

**Key Responsibilities:**
- Parse `ModelResponse.choices[0].message.tool_calls`
- Map tool names to Action classes
- Validate arguments
- Add metadata to actions

**Integration Points:**
- **Inputs:**
  - `ModelResponse` from LLM
- **Outputs:**
  - `list[Action]`

**Conversion Strategy:**
1. Update to handle Claude SDK response format
2. Keep tool name → Action mapping logic
3. Update tool_call structure if Claude SDK differs

### 7.5 LLM Registry (openhands/llm/llm_registry.py)

**Purpose:** Manage LLM instances (service locator pattern)

**Key Responsibilities:**
- Create and cache LLM instances
- Map service IDs to LLM instances
- Handle configuration
- Notify subscribers

**Integration Points:**
- **Inputs:**
  - `OpenHandsConfig`
  - `AgentConfig`
  - `LLMConfig`
- **Outputs:**
  - `LLM` instances

**Conversion Strategy:**
- No changes needed (works with any LLM instance)
- Just update LLM class initialization

### 7.6 Tool Definitions (openhands/agenthub/codeact_agent/tools/*)

**Purpose:** Define available tools for agents

**Key Responsibilities:**
- Define tool schemas in `ChatCompletionToolParam` format
- Provide tool descriptions and parameters

**Integration Points:**
- **Outputs:**
  - `ChatCompletionToolParam` dicts

**Conversion Strategy:**
1. Check if Claude SDK uses same tool format
2. If different, create adapter
3. Likely minimal changes (standard OpenAI format)

### 7.7 Metrics (openhands/llm/metrics.py)

**Purpose:** Track token usage and costs

**Key Responsibilities:**
- Track token counts (prompt, completion, cache read/write)
- Calculate costs
- Track latency

**Integration Points:**
- **Inputs:**
  - Token counts from LLM response
  - Cost from `litellm.completion_cost()`
- **Outputs:**
  - Aggregated metrics

**Conversion Strategy:**
1. Update to parse Claude SDK usage format
2. Update cost calculation for Claude pricing
3. Keep aggregation logic

---

## 8. CONVERSION ORDER & PRIORITIES

### Phase 1: Core LLM Wrapper (CRITICAL PATH)
1. **openhands/llm/llm.py**
   - Replace `litellm.completion()` with Claude SDK
   - Replace token counting
   - Replace cost calculation
   - Keep retry logic
   - Keep function calling conversion (initially)

### Phase 2: Type Definitions
2. **openhands/core/message.py**
   - Update `ChatCompletionMessageToolCall` import
   - Test serialization with Claude SDK

3. **openhands/controller/agent.py**
   - Update `ChatCompletionToolParam` import

4. **Tool definitions**
   - Verify tool format compatibility
   - Update if needed

### Phase 3: Response Handling
5. **openhands/agenthub/codeact_agent/function_calling.py**
   - Update `ModelResponse` handling
   - Verify tool call parsing

6. **openhands/events/tool.py**
   - Update `ModelResponse` import

### Phase 4: Function Calling (OPTIMIZATION)
7. **openhands/llm/fn_call_converter.py**
   - Test if still needed with Claude SDK
   - Simplify or remove if Claude native function calling works well

### Phase 5: Configuration & Features
8. **openhands/llm/model_features.py**
   - Update Claude model feature detection

9. **openhands/core/config/llm_config.py**
   - Add Claude-specific config if needed
   - Remove LiteLLM-specific config

### Phase 6: Cleanup
10. **Remove LiteLLM dependency**
    - Update requirements.txt
    - Remove unused imports
    - Test all agents

---

## 9. CLAUDE SDK INTEGRATION CHECKLIST

### 9.1 What Needs to Change?

**MUST CHANGE:**
- [ ] LLM.completion() wrapper
- [ ] Token counting logic
- [ ] Cost calculation
- [ ] ModelResponse parsing
- [ ] Import statements for types

**SHOULD REVIEW:**
- [ ] Function calling format compatibility
- [ ] Tool definition format
- [ ] Message serialization for vision
- [ ] Prompt caching implementation
- [ ] Model feature detection

**CAN KEEP AS-IS:**
- [ ] Retry logic (RetryMixin)
- [ ] Debug logging (DebugMixin)
- [ ] Metrics aggregation
- [ ] LLMRegistry
- [ ] AgentController
- [ ] Event system
- [ ] Configuration hierarchy
- [ ] Agent classes

### 9.2 Key Questions for Claude SDK

1. **Function Calling:**
   - Does Claude SDK use the same tool format as OpenAI?
   - How are tool calls structured in the response?
   - Is there a difference between Claude API and SDK?

2. **Message Format:**
   - Does Claude SDK accept the same message format?
   - How does it handle vision (images)?
   - How does it handle prompt caching?

3. **Token Counting:**
   - Does Claude SDK provide token counting?
   - What about cache read/write tokens?

4. **Cost Calculation:**
   - Does Claude SDK provide cost information?
   - How to calculate costs for custom deployments?

5. **Streaming:**
   - How does streaming work in Claude SDK?
   - Is it compatible with async patterns?

---

## 10. SUMMARY: CRITICAL DEPENDENCIES FOR CONVERSION

### Files That MUST Be Modified (in order):

1. **openhands/llm/llm.py** ⭐ HIGHEST PRIORITY
   - Core wrapper around LiteLLM
   - 842 lines of integration logic
   - Touches: completion, cost, tokens, retries, function calling

2. **openhands/core/message.py** ⭐ HIGH PRIORITY
   - Imports `ChatCompletionMessageToolCall`
   - Message serialization to LLM format

3. **openhands/controller/agent.py** ⭐ HIGH PRIORITY
   - Imports `ChatCompletionToolParam`
   - Base class for all agents

4. **openhands/agenthub/codeact_agent/function_calling.py** ⭐ HIGH PRIORITY
   - Imports `ModelResponse`
   - Converts responses to actions

5. **openhands/llm/fn_call_converter.py**
   - Function calling compatibility layer
   - May be simplified or removed

6. **Tool definition files** (bash.py, ipython.py, etc.)
   - Import `ChatCompletionToolParam`
   - Verify format compatibility

7. **openhands/llm/metrics.py**
   - Update for Claude SDK usage format

8. **openhands/llm/model_features.py**
   - Update Claude model detection

### Components That Can Stay the Same:

- AgentController (works with any Agent)
- EventStream (works with any Events)
- State management (works with any state)
- Retry logic (works with any exceptions)
- Configuration hierarchy (just config values)
- All agent subclasses (use base Agent interface)

### Key Insight:

**The abstraction is already good!** The main work is:
1. Replace the LLM wrapper (llm.py)
2. Update type imports
3. Verify format compatibility
4. Test thoroughly

The agent logic, state management, and event system are all decoupled from LiteLLM and should work with minimal changes.

---

## APPENDIX: Import Dependency Graph

```
External: litellm
    ↓
openhands/llm/llm.py [LLM]
    ↓
openhands/llm/llm_registry.py [LLMRegistry]
    ↓
openhands/controller/agent.py [Agent]
    ↓
openhands/agenthub/codeact_agent/codeact_agent.py [CodeActAgent]
    ↓
openhands/controller/agent_controller.py [AgentController]
    ↓
Application Entry Points

Parallel paths:
- openhands/core/message.py [Message] → LLM
- openhands/agenthub/*/function_calling.py → Agent.step()
- openhands/agenthub/*/tools/*.py → Agent._get_tools()
```

This is the complete architecture and dependency map for the conversion.
