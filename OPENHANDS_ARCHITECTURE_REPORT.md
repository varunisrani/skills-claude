# OpenHands Runtime and Controller System - Comprehensive Analysis

## Executive Summary

OpenHands is a sophisticated multi-agent AI system with a well-architected event-driven architecture. The system consists of:

1. **Agent Controller** - Orchestrates agent execution and decision-making
2. **Runtime Layer** - Provides containerized/sandboxed execution environments  
3. **Event System** - Thread-safe, asynchronous event streaming and distribution
4. **Server API** - FastAPI-based REST endpoints for client communication
5. **State Management** - Comprehensive state tracking for agent sessions

The flow goes: **User Request → Server API → Event Stream → Agent Controller → Agent (LLM) → Action → Runtime Execution → Observation → Event Stream**

---

## 1. System Architecture Overview

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Web UI)                          │
└────────────────────────────┬──────────────────────────────────────┘
                             │ HTTP/WebSocket
┌────────────────────────────▼──────────────────────────────────────┐
│              FastAPI Server (app.py)                               │
│  Routes: /conversations, /events, /message, /config, etc.        │
└────────────────────────────┬──────────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│         Conversation Manager (conversation_manager.py)            │
│  ├─ Creates/manages AgentSession instances                       │
│  ├─ Maintains conversation state                                 │
│  └─ Routes events to correct session                             │
└────────────────────────────┬──────────────────────────────────────┘
                             │
      ┌──────────────────────┼──────────────────────┐
      │                      │                      │
┌─────▼──────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  EventStream   │  │ AgentSession    │  │  Runtime        │
│  ├─ Queue      │  │ ├─ Controller   │  │ ├─ Docker/Local │
│  ├─ Subscribers│  │ ├─ Runtime      │  │ ├─ Bash Exec    │
│  └─ Persistence│  │ └─ EventStream  │  │ ├─ File I/O     │
└────────────────┘  └────────────────┘  │ └─ Plugins      │
                                          └────────────────┘
      │                      │                      │
      └──────────────────────┼──────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│            Agent & LLM Execution (codeact_agent.py)              │
│  ├─ Conversation Memory                                          │
│  ├─ LLM Completion (via LiteLLM)                                │
│  ├─ Tool/Action Parsing                                         │
│  └─ Response-to-Actions Conversion                             │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Request-to-Response Flow (User Input to LLM Call)

### Step-by-Step Execution Flow

```
1. USER REQUEST
   └─> HTTP POST /api/conversations/{conversation_id}/message
       {message: "Create a Python script"}

2. SERVER ROUTE (conversation.py:add_message)
   └─> Validates request
   └─> Calls conversation_manager.send_event_to_conversation(sid, data)

3. CONVERSATION MANAGER (conversation_manager.py)
   └─> Retrieves AgentSession for conversation_id
   └─> Sends MessageAction event to EventStream

4. EVENT STREAM (stream.py:add_event)
   └─> Assigns unique ID to event
   └─> Sets timestamp and source (USER)
   └─> Persists event to file store
   └─> Queues event for subscriber notification
   └─> Event distribution loop:
       ├─> AgentController.on_event(event) [AGENT_CONTROLLER subscriber]
       ├─> Runtime.on_event(event) [RUNTIME subscriber]
       └─> Server routes [SERVER subscriber]

5. AGENT CONTROLLER (agent_controller.py:on_event → _on_event)
   ├─> Adds event to history via state_tracker
   ├─> Determines if should_step(event) based on event type
   │   (USER MessageAction triggers step)
   └─> Calls _step_with_exception_handling() 
       └─> Calls _step()

6. AGENT CONTROLLER STEP (agent_controller.py:_step)
   ├─> Validates agent state == RUNNING
   ├─> Checks control flags (iterations, budget)
   ├─> Detects stuck loops
   └─> Calls agent.step(state)
       │
       ├─> Returns NullAction if replay mode
       └─> Otherwise: agent.step(state) [SEE STEP 7]

7. AGENT EXECUTION (codeact_agent.py:step)
   ├─> Returns pending_actions if any exist
   ├─> Condenses conversation history using Condenser
   │   (Memory optimization: keeps recent + important events)
   ├─> Extracts message history from condensed events
   ├─> Builds LLM parameters:
   │   {
   │     messages: [...],     # Conversation history
   │     tools: [...],        # Available action tools
   │     extra_body: {
   │       metadata: {...}    # Session/state metadata
   │     }
   │   }
   └─> CALLS LLM: response = self.llm.completion(**params)
       │
       ├─> LiteLLM routes to configured model (GPT-4, Claude, etc.)
       ├─> Model generates response with:
       │   ├─ Tool calls (action selections)
       │   ├─ Text reasoning
       │   └─ Structured function arguments
       └─> Returns ModelResponse

8. RESPONSE PARSING (codeact_agent.py:response_to_actions)
   ├─> Parses LLM response for tool calls
   ├─> Converts tool calls to Actions:
   │   ├─ CmdRunAction (bash commands)
   │   ├─ IPythonRunCellAction (python code)
   │   ├─ FileEditAction / FileReadAction (file operations)
   │   ├─ BrowseInteractiveAction (browser control)
   │   └─ MessageAction (agent communication)
   └─> Returns list[Action]

9. ACTION QUEUEING & RETURN
   ├─> Adds parsed actions to pending_actions queue
   └─> Returns first action from queue

10. ACTION EMISSION (agent_controller.py:_step continued)
    ├─> Security analysis (security_analyzer.security_risk)
    ├─> Confirmation mode check (if enabled)
    ├─> Prepares metrics for frontend
    └─> Emits action to event stream:
        event_stream.add_event(action, EventSource.AGENT)

11. ACTION EXECUTION (runtime.py:_handle_action)
    └─> Runtime's on_event callback triggered
    └─> Converts action to observation via runtime.run_action(action)
    │   ├─ bash execution (CmdRunAction)
    │   ├─ file I/O (FileReadAction, etc.)
    │   ├─ browser automation (BrowseInteractiveAction)
    │   └─ ipython execution (IPythonRunCellAction)
    └─> Emits Observation back to event stream

12. OBSERVATION PROCESSING (agent_controller.py:_handle_observation)
    ├─> Agent controller processes observation
    ├─> Updates pending action state
    └─> Triggers next step if needed

13. LOOP CONTINUATION
    ├─> Repeat until agent emits AgentFinishAction
    ├─> Or max iterations/budget reached
    └─> Or user stops agent
```

### Example: Simple Task Execution

```python
# User: "Create a file with 'hello world'"

1. Server receives: MessageAction("Create a file with 'hello world'")
2. Event stream distributes to AgentController
3. AgentController calls agent.step(state)
4. Agent (CodeActAgent):
   - Builds messages: [SystemMessage, ..., UserMessage("Create a file...")]
   - Calls: response = llm.completion(
       messages=messages,
       tools=[CmdRunTool, FileEditTool, PythonTool, ...],
       ...
     )
   - LLM response: Tool call to "bash" with command "echo 'hello world' > file.txt"
   - Parses to: CmdRunAction(command="echo 'hello world' > file.txt")
   - Returns action
5. AgentController emits action to EventStream
6. Runtime receives action:
   - Executes bash command in sandbox
   - Captures exit code and output
   - Creates Observation(content="hello world\n", exit_code=0)
7. EventStream distributes Observation
8. AgentController receives Observation
9. Next iteration: Agent.step() called again with observation in history
10. Agent (with observation context) may finish or take more steps
```

---

## 3. Controller Orchestration: AgentController

### Architecture: AgentController (agent_controller.py)

The AgentController is the central orchestrator that manages agent execution lifecycle and state transitions.

#### Key Attributes

```python
class AgentController:
    id: str                                  # Session ID
    agent: Agent                             # The agent instance
    event_stream: EventStream                # Event distribution
    state: State                             # Execution state
    controller: AgentController | None       # For delegation
    delegate: AgentController | None         # Sub-agent controller
    confirmation_mode: bool                  # Requires user confirmation
    _pending_action: Action | None           # Currently executing action
    _stuck_detector: StuckDetector           # Loop detection
    _replay_manager: ReplayManager           # Event replay
    security_analyzer: SecurityAnalyzer | None  # Security checks
```

#### Main Methods

1. **Initialization**: `__init__(agent, event_stream, ...)`
   - Creates StateTracker for managing State
   - Subscribes to event stream as AGENT_CONTROLLER
   - Adds system message to event stream
   - Initializes stuck detector

2. **Event Handling**: `on_event(event) → _on_event(event)`
   - Adds event to history
   - Routes actions/observations to handlers
   - Determines if should_step(event)
   - Triggers `_step_with_exception_handling()`

3. **Stepping**: `_step()`
   ```python
   async def _step(self):
       # Check if can step
       if state != RUNNING: return
       if pending_action exists: return
       
       # Control limits check
       run_control_flags()  # iterations, budget
       
       # Stuck loop detection
       if _is_stuck(): raise AgentStuckInLoopError
       
       # Get agent's next action
       action = agent.step(state)
       
       # Security analysis
       await _handle_security_analyzer(action)
       
       # Emit action
       event_stream.add_event(action, EventSource.AGENT)
   ```

4. **State Management**: `set_agent_state_to(new_state)`
   - Validates state transitions
   - Calls `_reset()` if STOPPED/ERROR
   - Increases control flags if resuming from error
   - Emits AgentStateChangedObservation
   - Saves state to persistent storage

5. **Delegation**: `start_delegate(action) / end_delegate()`
   - Creates child AgentController for subtask
   - Shares metrics with parent
   - Forwards events to delegate
   - Collects results and resumes parent

#### Agent State Machine

```
    ┌──────────────┐
    │   LOADING    │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────┐
    │ AWAITING_USER_   │
    │    INPUT         │
    └──────┬───────────┘
           │ (user message / automatic)
           ▼
    ┌──────────────────┐
    │    RUNNING       │◄─────────────┐
    └──┬───────────┬───┘              │
       │           │                  │
   (paused)    (high-risk           (resume from pause)
       │        action)              │
       │         │                   │
       ▼         ▼                   │
    ┌──────────────────┐             │
    │    PAUSED        │─────────────┘
    └──────────────────┘
       │
       ▼
    ┌──────────────────┐     ┌──────────────┐
    │ AWAITING_USER_   │────►│ USER_CONFIRMED
    │ CONFIRMATION     │     └──────────────┘
    └──────────────────┘            │
                                    ▼
                              ┌──────────────┐
                              │  RUNNING     │
                              └──────────────┘

Also: ERROR, STOPPED, FINISHED, REJECTED, RATE_LIMITED
```

#### Event Distribution & Subscription

```python
# AgentController subscribes to EventStream
event_stream.subscribe(
    subscriber_id=EventStreamSubscriber.AGENT_CONTROLLER,
    callback=self.on_event,
    callback_id=self.id
)

# Events are processed in a separate thread pool
# Each subscriber has its own event loop to avoid blocking
```

---

## 4. Runtime System Architecture

### Runtime Base Class (runtime/base.py)

The Runtime provides an abstraction layer for execution environments.

#### Implementations

```
Runtime (abstract base)
├─ DockerRuntime       # Container-based execution
├─ LocalRuntime        # Local system execution
├─ RemoteRuntime       # Remote server execution
├─ KubernetesRuntime   # Kubernetes-based execution
└─ CLIRuntime          # CLI-only mode
```

#### Core Responsibilities

1. **Action Execution**: `run_action(action) → Observation`
   - Routes to specific action handlers
   - Tracks action source and cause
   - Handles errors gracefully

2. **Shell Execution**: `run(CmdRunAction) → CmdOutputObservation`
   - Executes bash commands in sandbox
   - Captures stdout, stderr, exit code
   - Enforces timeouts

3. **File Operations**:
   - `read(FileReadAction)` → FileReadObservation
   - `write(FileWriteAction)` → FileWriteObservation
   - `edit(FileEditAction)` → FileEditObservation

4. **Environment Setup**:
   - `setup_initial_env()` - Sets env vars, git config
   - `add_env_vars(dict)` - Injects environment variables
   - `clone_or_init_repo(...)` - Git repository setup
   - `maybe_run_setup_script()` - Custom workspace setup

5. **Plugin System**:
   - VSCode server (if not headless)
   - Jupyter notebook support
   - AgentSkills (custom utilities)

#### Event Handling in Runtime

```python
# Runtime subscribes to EventStream
def on_event(self, event: Event):
    if isinstance(event, Action):
        asyncio.create_task(self._handle_action(event))

# Asynchronous action handling
async def _handle_action(self, event: Action):
    # Export git tokens if needed
    await self._export_latest_git_provider_tokens(event)
    
    # Execute action
    if isinstance(event, MCPAction):
        observation = await self.call_tool_mcp(event)
    else:
        observation = self.run_action(event)
    
    # Set cause relationship
    observation._cause = event.id
    
    # Emit observation
    event_stream.add_event(observation, EventSource.AGENT)
```

#### MCP (Model Context Protocol) Integration

Runtime supports MCP servers for tool extensions:
- `get_mcp_config()` - Returns MCP configuration
- `call_tool_mcp(action)` - Calls MCP tool with arguments
- `add_mcp_tools_to_agent(agent, runtime)` - Registers MCP tools

---

## 5. Event System Architecture

### EventStream Design (stream.py)

The EventStream is the central nervous system for the entire OpenHands system.

#### Core Architecture

```python
class EventStream(EventStore):
    # Thread-safe storage
    _subscribers: dict[str, dict[str, Callable]]  # subscriber_id -> {callback_id -> callback}
    _lock: threading.Lock                          # Thread synchronization
    
    # Asynchronous queue processing
    _queue: queue.Queue[Event]                     # Event queue
    _queue_thread: threading.Thread                # Queue processor
    _queue_loop: asyncio.AbstractEventLoop         # Event loop for queue
    
    # Per-subscriber event loops
    _thread_loops: dict[str, dict[str, AbstractEventLoop]]
    _thread_pools: dict[str, dict[str, ThreadPoolExecutor]]
    
    # Persistence
    file_store: FileStore                          # Storage backend
    _write_page_cache: list[dict]                  # Batch writes
    
    # Secrets
    secrets: dict[str, str]                        # For redacting sensitive data
```

#### Subscriber Types

```python
class EventStreamSubscriber(str, Enum):
    AGENT_CONTROLLER = 'agent_controller'  # Controls agent execution
    RUNTIME = 'runtime'                    # Executes actions
    SERVER = 'server'                      # WebSocket broadcasting
    RESOLVER = 'openhands_resolver'        # Custom resolvers
    MEMORY = 'memory'                      # Memory management
    MAIN = 'main'                          # Main thread
    TEST = 'test'                          # Testing
```

#### Event Lifecycle

```
1. Event Created: action = CmdRunAction(command="ls")
2. Add to Stream: event_stream.add_event(action, EventSource.AGENT)
3. Within add_event():
   ├─ Assign ID: event._id = cur_id++
   ├─ Set timestamp: event._timestamp = now()
   ├─ Set source: event._source = EventSource.AGENT
   ├─ Serialize: data = event_to_dict(event)
   ├─ Redact secrets: data = _replace_secrets(data)
   ├─ Persist: file_store.write(filename, json.dumps(data))
   ├─ Cache page: if page full, store cache page
   └─ Queue: _queue.put(event)
4. Queue Processing (async):
   ├─ Loop: event = _queue.get()
   ├─ For each subscriber (sorted by ID):
   │   ├─ Get all callbacks for subscriber
   │   ├─ Submit to thread pool: future = pool.submit(callback, event)
   │   └─ Attach error handler: future.add_done_callback(...)
   └─ Repeat
5. Each Subscriber Processes Event:
   ├─ AGENT_CONTROLLER: on_event(event)
   │   └─ Triggers agent.step() if appropriate
   ├─ RUNTIME: on_event(event)
   │   └─ Executes action, creates observation
   ├─ SERVER: broadcasts to WebSocket clients
   └─ Others: custom processing
```

#### Persistence & Caching Strategy

```
File Structure:
conversations/
├─ {sid}/
│   ├─ events/
│   │   ├─ 0.json        # Individual event files
│   │   ├─ 1.json
│   │   ├─ 2.json
│   │   └─ ...
│   ├─ event_cache/
│   │   ├─ 0-25.json     # Cached page of events 0-24
│   │   ├─ 25-50.json    # Cached page of events 25-49
│   │   └─ ...
│   └─ agent_state.pkl   # Pickled agent state (base64-encoded)

Caching Strategy:
├─ Write cache: batches events into pages (default: 25 events)
├─ Read cache: loads full pages instead of individual events
├─ Trade-off: Balances I/O performance vs memory usage
└─ Cache miss: Falls back to individual file reads
```

#### Thread Safety & Async

```python
def add_event(self, event: Event, source: EventSource) -> None:
    # Thread-safe with lock
    with self._lock:
        event._id = self.cur_id  # Atomic ID assignment
        self.cur_id += 1
        
        current_write_page = self._write_page_cache
        # ... prepare data ...
        current_write_page.append(data)
        
        # Create new page cache to allow other threads
        if len(current_write_page) == self.cache_size:
            self._write_page_cache = []  # New empty page
    
    # Persist outside lock (I/O doesn't block other threads)
    self.file_store.write(filename, event_json)
    self._store_cache_page(current_write_page)
    
    # Queue for async processing
    self._queue.put(event)  # Non-blocking

async def _process_queue(self) -> None:
    # Runs in separate event loop (background thread)
    while not self._stop_flag.is_set():
        try:
            event = self._queue.get(timeout=0.1)
        except queue.Empty:
            continue
        
        # Each subscriber gets own thread pool
        # Prevents one subscriber from blocking others
        for subscriber_id in sorted(self._subscribers.keys()):
            for callback_id, callback in self._subscribers[subscriber_id].items():
                pool = self._thread_pools[subscriber_id][callback_id]
                future = pool.submit(callback, event)
                future.add_done_callback(...)
```

---

## 6. Server Architecture & API Endpoints

### FastAPI Application Structure (server/app.py)

```python
app = FastAPI(
    title='OpenHands',
    lifespan=combine_lifespans(
        _lifespan,           # Conversation manager lifecycle
        mcp_app.lifespan,    # MCP server lifecycle
        app_lifespan_        # Custom lifespan (if configured)
    )
)

# Routers (each has /api prefix)
├─ conversation_api_router       # /api/conversations
├─ manage_conversation_api_router # /api/manage/conversations
├─ files_api_router              # /api/files
├─ feedback_api_router           # /api/feedback
├─ git_api_router                # /api/git
├─ security_api_router           # /api/security
├─ settings_router               # /api/settings
├─ secrets_router                # /api/secrets
├─ trajectory_router             # /api/trajectory
├─ v1_router                      # /api/v1/* (if enabled)
└─ health endpoints              # /health
```

### Key Endpoints (conversation.py)

#### Event Management

```
GET /api/conversations/{conversation_id}/events
  - Search events with filtering and pagination
  - Parameters: start_id, end_id, reverse, filter, limit
  - Returns: {events: [...], has_more: bool}

POST /api/conversations/{conversation_id}/events
  - Add raw event to conversation
  - Body: event data
  - Returns: {success: true}
```

#### User Communication

```
POST /api/conversations/{conversation_id}/message
  - Add user message and trigger agent execution
  - Body: {message: "..."}
  - Returns: {success: true}
  - Triggers: agent.step() → LLM completion
```

#### Configuration & Status

```
GET /api/conversations/{conversation_id}/config
  - Get runtime configuration
  - Returns: {runtime_id: str, session_id: str}

GET /api/conversations/{conversation_id}/vscode-url
  - Get VSCode server URL (if available)
  - Returns: {vscode_url: str}

GET /api/conversations/{conversation_id}/web-hosts
  - Get web server mappings for agent
  - Returns: {hosts: {name: port, ...}}
```

### Server Conversation Object

```python
class ServerConversation:
    sid: str                    # Session ID
    runtime: Runtime            # Execution environment
    agent_session: AgentSession # Session management
    event_stream: EventStream   # Event distribution
```

---

## 7. How User Requests Flow to LLM Calls

### Complete Request Flow Example

```
Client Request:
│
├─ POST /api/conversations/{conversation_id}/message
│  └─ Body: {message: "Create a Python script that prints hello"}
│
▼
Server Route (conversation.py:add_message)
│
├─ Parse request
├─ Get conversation via dependency
└─ Call conversation_manager.send_event_to_conversation(sid, data)
│
▼
Conversation Manager (standalone_conversation_manager.py)
│
├─ Get AgentSession for sid
├─ Create MessageAction from data
├─ Add to event stream: event_stream.add_event(MessageAction(...), USER)
│
▼
EventStream (stream.py:add_event)
│
├─ Assign unique ID to event
├─ Timestamp it
├─ Save to persistent storage
├─ Queue for async distribution: _queue.put(event)
│
▼
Queue Processing Loop (background thread)
│
├─ Get event from queue
├─ Distribute to subscribers in order:
│   ├─ AGENT_CONTROLLER
│   ├─ RUNTIME  
│   └─ SERVER (websocket)
│
▼
Agent Controller (agent_controller.py:on_event)
│
├─ Add event to state history
├─ Route: isinstance(event, MessageAction) && source==USER
├─ should_step() = True
└─ Call asyncio.create_task(_step_with_exception_handling())
│
▼
Agent Controller Step (agent_controller.py:_step)
│
├─ Check: agent state == RUNNING
├─ Check: no pending action
├─ Check: control flags (iterations, budget)
├─ Check: not stuck in loop
│
└─ Call: action = self.agent.step(self.state)
│         └─> agent.step(State) [next step]
│
▼
Agent Step (codeact_agent.py:step)
│
├─ Check for pending actions (none yet)
├─ Get latest user message
├─ Condense conversation history
│   └─ Keep recent events + important summaries
├─ Build messages list from history
├─ Prepare LLM parameters:
│   {
│     messages: [
│       {role: "system", content: "You are..."},
│       {role: "user", content: "Create a Python script..."},
│       {role: "assistant", content: "I'll help..."},
│       ...
│     ],
│     tools: [
│       {name: "bash", description: "...", ...},
│       {name: "python", description: "...", ...},
│       ...
│     ],
│     model: "gpt-4",
│     temperature: 0.7,
│     ...
│   }
│
└─> LLM CALL: response = self.llm.completion(**params)
│   └─ Via LiteLLM (routing layer)
│   └─ Routes to configured LLM provider
│   └─ OpenAI, Anthropic, Local, etc.
│
▼
LLM Response Processing (agent.response_to_actions)
│
├─ Parse tool calls from response
├─ Example response:
│   {
│     "type": "function_call",
│     "function": {
│       "name": "bash",
│       "arguments": {
│         "command": "cat > hello.py << 'EOF'\nprint('hello')\nEOF"
│       }
│     }
│   }
├─ Convert to Action: CmdRunAction(command="cat > hello.py...")
└─ Add to pending_actions queue
│
▼
Return Action (agent_controller.py:_step continued)
│
├─ Emit action to event stream
│  event_stream.add_event(action, EventSource.AGENT)
│
▼
Runtime Execution (runtime.py:on_event → _handle_action)
│
├─ Receive action from event stream
├─ Execute in sandbox:
│   ├─ For CmdRunAction: run bash command
│   ├─ Capture stdout/stderr/exit_code
│   └─ Create Observation
│
└─ Emit observation: event_stream.add_event(obs, AGENT)
│
▼
Agent Controller Observation Handling
│
├─ Receive observation
├─ Clear pending action
├─ Trigger next step (if state == RUNNING)
│
▼
Loop Back to Agent Step
│
├─ Next iteration uses observation in history
├─ LLM sees result: "stdout: hello"
├─ LLM decides: finish or take more steps
└─ Continue until AgentFinishAction
```

### Detailed LLM Parameters Building

```python
# In CodeActAgent.step():

# 1. Prepare message history
messages = [
    {
        "role": "system",
        "content": """You are CodeAct, an AI assistant...
[system prompt with tools descriptions]"""
    },
    {
        "role": "user", 
        "content": "[original user request from start of conversation]"
    },
    {
        "role": "assistant",
        "content": "[agent's reasoning/previous response]"
    },
    {
        "role": "user",
        "content": "[observation from last action execution]"
    },
    # ... more action-observation pairs ...
    {
        "role": "user",
        "content": "[latest user message or observation]"
    }
]

# 2. Prepare tools
tools = [
    {
        "type": "function",
        "function": {
            "name": "bash",
            "description": "Execute bash command...",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string"}
                },
                "required": ["command"]
            }
        }
    },
    # ... more tools ...
]

# 3. Add metadata
extra_body = {
    "metadata": {
        "agent_name": "CodeActAgent",
        "model_name": "gpt-4",
        "session_id": "conv_123",
        "iteration": 5,
        "budget_used": 0.42,
        "user_id": "user_456"
    }
}

# 4. Call LLM
response = self.llm.completion(
    messages=messages,
    tools=tools,
    model="gpt-4-turbo",
    temperature=0.7,
    max_tokens=4096,
    extra_body=extra_body
)
```

---

## 8. Agent Execution & Action Cycle

### Agent Interface (controller/agent.py)

```python
class Agent(ABC):
    def __init__(self, config: AgentConfig, llm_registry: LLMRegistry):
        self.llm = llm_registry.get_llm_from_agent_config('agent', config)
        self.tools = []  # Available tools
        self.mcp_tools = {}  # MCP tools
    
    def get_system_message(self) -> SystemMessageAction:
        """Generate system message with tools"""
        return SystemMessageAction(content=..., tools=self.tools)
    
    @abstractmethod
    def step(self, state: State) -> Action:
        """Execute one agent step, return next action"""
        pass
    
    def reset(self):
        """Reset agent for new task"""
        self._complete = False
```

### CodeActAgent Implementation

```python
class CodeActAgent(Agent):
    def __init__(self, config, llm_registry):
        super().__init__(config, llm_registry)
        self.tools = self._get_tools()  # Initialize available tools
        self.conversation_memory = ConversationMemory(...)
        self.condenser = Condenser.from_config(...)
        self.llm = llm_registry.get_router(config)  # Get router for multi-model
    
    def step(self, state: State) -> Action:
        # 1. Handle pending actions
        if self.pending_actions:
            return self.pending_actions.popleft()
        
        # 2. Check for exit
        if latest_message.content == '/exit':
            return AgentFinishAction()
        
        # 3. Condense history for context window
        condensed_history = self.condenser.condensed_history(state)
        
        # 4. Build messages for LLM
        messages = self._get_messages(condensed_history, initial_message)
        
        # 5. Call LLM
        response = self.llm.completion(
            messages=messages,
            tools=check_tools(self.tools, self.llm.config),
            extra_body={'metadata': state.to_llm_metadata(...)}
        )
        
        # 6. Parse response to actions
        actions = self.response_to_actions(response)
        
        # 7. Queue actions
        for action in actions:
            self.pending_actions.append(action)
        
        # 8. Return first action
        return self.pending_actions.popleft()
```

### Action Types Available

```python
# Code execution
├─ CmdRunAction(command: str)           # Bash command
├─ IPythonRunCellAction(code: str)      # Python code
└─ BrowseInteractiveAction(...)         # Browser interaction

# File operations
├─ FileReadAction(path: str)            # Read file
├─ FileEditAction(path, instructions)   # Edit file
└─ FileWriteAction(path, content)       # Write file

# Agent control
├─ MessageAction(content)               # Communicate
├─ AgentFinishAction(outputs)           # Complete task
├─ AgentDelegateAction(agent, task)     # Delegate to other agent
├─ AgentRejectAction(outputs)           # Reject task
└─ ChangeAgentStateAction(state)        # Change state

# Thinking & memory
├─ AgentThinkAction(thought)            # Internal reasoning
├─ RecallAction(query)                  # Retrieve from memory
└─ CondensationRequestAction()          # Request history summarization

# Special
├─ NullAction()                         # No-op
├─ MCPAction(name, arguments)           # Call MCP tool
└─ BrowseURLAction(url)                 # Browse web
```

---

## 9. State Management & History

### State Object (controller/state/state.py)

```python
@dataclass
class State:
    session_id: str                              # Session identifier
    user_id: str | None                          # User identifier
    
    # Iteration tracking
    iteration_flag: IterationControlFlag         # Current/max iterations
    
    # Delegation tracking  
    delegate_level: int                          # Delegation depth (0=root)
    start_id: int                                # First event ID in session
    end_id: int                                  # Last event ID in session
    
    # Agent state
    agent_state: AgentState                      # Current state
    confirmation_mode: bool                      # Requires user confirmation
    
    # Metrics
    metrics: Metrics                             # Global metrics
    parent_metrics_snapshot: Metrics | None      # Parent's metrics before delegation
    conversation_stats: ConversationStats | None # Cost tracking
    
    # History & memory
    history: list[Event]                         # All events in session
    
    # Task data
    inputs: dict                                 # Task inputs
    outputs: dict                                # Task outputs
    last_error: str                              # Last error message
    
    # Budget & control
    budget_flag: BudgetControlFlag | None        # Spending limits
    
    @property
    def get_last_user_message(self) -> MessageAction | None:
        """Get most recent user message"""
        for event in reversed(self.history):
            if isinstance(event, MessageAction) and event.source == EventSource.USER:
                return event
        return None
    
    @property
    def get_local_step(self) -> int:
        """Get step count for current agent"""
        return len([e for e in self.history if isinstance(e, MessageAction) or isinstance(e, Observation)])
    
    def get_local_metrics(self) -> Metrics:
        """Get metrics for current agent only (excluding parent)"""
        # Compute: current - parent_snapshot
        ...
```

### History Persistence

```
State is saved to disk when:
1. Agent state changes (set_agent_state_to)
2. Session closes (controller.close)
3. Periodic checkpoints (if configured)

Restoration:
1. Session loads: State.restore_from_session(sid)
2. Resume state determined: RESUMABLE_STATES include:
   ├─ RUNNING
   ├─ PAUSED
   ├─ AWAITING_USER_INPUT
   └─ FINISHED
3. Resume state becomes new state on load
4. History loaded from event stream
```

---

## 10. Security & Confirmation System

### Security Analysis (agent_controller.py)

```python
async def _handle_security_analyzer(self, action: Action) -> None:
    """Analyze action for security risks"""
    
    if self.security_analyzer:
        # Use configured security analyzer
        action.security_risk = await self.security_analyzer.security_risk(action)
    else:
        # Default: conservative (mark as UNKNOWN → requires confirmation)
        action.security_risk = ActionSecurityRisk.UNKNOWN

# Risk levels
class ActionSecurityRisk(int, Enum):
    LOW = 0         # Safe, no confirmation needed
    MEDIUM = 1      # Potentially risky
    HIGH = 2        # Very risky, needs confirmation
    UNKNOWN = -1    # Can't determine, needs confirmation (safe default)
```

### Confirmation Mode Workflow

```python
if action.runnable and confirmation_mode:
    # 1. Analyze security risk
    await _handle_security_analyzer(action)
    
    # 2. Check if confirmation needed
    if action.security_risk == ActionSecurityRisk.HIGH:
        # Mark as awaiting confirmation
        action.confirmation_state = ActionConfirmationStatus.AWAITING_CONFIRMATION
        
        # 3. Set agent state to wait for user
        await set_agent_state_to(AgentState.AWAITING_USER_CONFIRMATION)
        
        # 4. Emit action for UI to display
        event_stream.add_event(action, EventSource.AGENT)
        
        # 5. Wait for user decision:
        # User sends ChangeAgentStateAction(USER_CONFIRMED) or (USER_REJECTED)
        # → Callback _handle_observation detects confirmation
        # → Updates action.confirmation_state
        # → Sets agent_state back to RUNNING
        # → Re-emits action to actually execute it

# Actions requiring confirmation (in non-CLI mode):
├─ CmdRunAction        # Shell commands
├─ IPythonRunCellAction # Python code
├─ BrowseInteractiveAction # Web automation
├─ FileEditAction      # File modifications
└─ FileReadAction      # File reads (if risk=HIGH)
```

---

## 11. Multi-Agent & Delegation System

### Delegation Architecture

```python
# In AgentDelegateAction, parent controller starts delegate:

async def start_delegate(self, action: AgentDelegateAction):
    # 1. Get delegate agent class
    delegate_agent_cls = Agent.get_cls(action.agent)
    
    # 2. Create delegate agent with shared metrics
    delegate_agent = delegate_agent_cls(
        config=agent_config,
        llm_registry=self.agent.llm_registry  # Shared LLM registry
    )
    
    # 3. Create delegate state (snapshot)
    state = State(
        session_id=self.id + '-delegate',
        metrics=self.state.metrics,         # Shared metrics!
        parent_metrics_snapshot=self.state_tracker.get_metrics_snapshot(),
        parent_iteration=self.state.iteration_flag.current_value,
        delegate_level=self.state.delegate_level + 1,
        start_id=self.event_stream.get_latest_event_id() + 1  # Starts after parent
    )
    
    # 4. Create delegate controller (is_delegate=True → doesn't subscribe)
    self.delegate = AgentController(
        agent=delegate_agent,
        event_stream=self.event_stream,     # Shared event stream!
        initial_state=state,
        is_delegate=True,                   # Important: prevents double subscription
        ...
    )
    
    # 5. Set delegate running
    await self.delegate.set_agent_state_to(AgentState.RUNNING)

# Event handling during delegation:
def on_event(self, event: Event) -> None:
    if self.delegate is not None:
        # Forward all events to delegate
        asyncio.run_until_complete(self.delegate._on_event(event))
        return
    
    # Process events as normal
    asyncio.run_until_complete(self._on_event(event))

# When delegate finishes:
def end_delegate(self):
    # 1. Collect delegate outputs
    delegate_outputs = self.delegate.state.outputs
    
    # 2. Create observation
    obs = AgentDelegateObservation(
        outputs=delegate_outputs,
        content=f"Delegated agent finished with..."
    )
    
    # 3. Emit observation
    self.event_stream.add_event(obs, EventSource.AGENT)
    
    # 4. Clear delegate
    self.delegate = None
    
    # 5. Parent resumes processing
```

### Metrics Sharing

```
Global metrics are shared (accumulated):
parent_metrics += delegate_metrics

Local metrics are calculated as difference:
delegate_local = delegate_metrics - parent_snapshot

Iteration limits are also shared:
self.state.iteration_flag is the SAME object in parent and delegate
When delegate increments, parent sees the increment
```

---

## 12. Key Design Patterns

### 1. Event-Driven Architecture

- **Decoupling**: Components interact through events, not direct calls
- **Asynchronous**: Event processing doesn't block requesters
- **Persistence**: All events persisted for replay/debugging
- **Broadcasting**: One event → multiple subscribers

### 2. State Machine Pattern

- **Explicit States**: Clear state transitions
- **Guarded Transitions**: Validation before state changes
- **Side Effects**: State changes trigger callbacks

### 3. Subscription Pattern

- **Subscribers**: Multiple independent listeners on EventStream
- **Thread Isolation**: Each subscriber has own event loop
- **Error Handling**: Errors in one subscriber don't affect others

### 4. Template Method Pattern

- **Agent.step()**: Abstract method, implementations define execution
- **Runtime.run_action()**: Routes to specific handlers

### 5. Factory Pattern

- **Agent.get_cls()**: Registry-based agent creation
- **Runtime.get_runtime_cls()**: Runtime selection

### 6. Delegation Pattern

- **Multi-agent**: Parent creates delegate controllers
- **Shared State**: Delegates see accumulated metrics
- **Event Stream Sharing**: Single stream for multi-agent choreography

### 7. Memory Management Pattern

- **Condenser**: Summarizes old events to fit context window
- **Paging**: Batches events for efficient storage/retrieval
- **Lazy Loading**: Events loaded on demand

---

## 13. Error Handling & Recovery

### Error Detection & Recovery

```python
# In AgentController._step:

try:
    action = self.agent.step(self.state)
except LLMMalformedActionError as e:
    # LLM response couldn't be parsed
    event_stream.add_event(ErrorObservation(str(e)), AGENT)
    return
except ContextWindowExceededError as e:
    # Token limit exceeded
    if self.agent.config.enable_history_truncation:
        # Request condensation
        event_stream.add_event(CondensationRequestAction(), AGENT)
    else:
        # Escalate to controller error
        raise LLMContextWindowExceedError()
except RateLimitError as e:
    # LLM rate limited
    if retries_exhausted:
        await self.set_agent_state_to(AgentState.ERROR)
    else:
        await self.set_agent_state_to(AgentState.RATE_LIMITED)
        # Auto-retry mechanism handles this
except Exception as e:
    await self._react_to_exception(e)

# In _react_to_exception:
async def _react_to_exception(self, e: Exception):
    # Map exception to RuntimeStatus
    if isinstance(e, AuthenticationError):
        status = RuntimeStatus.ERROR_LLM_AUTHENTICATION
    elif isinstance(e, ServiceUnavailableError):
        status = RuntimeStatus.ERROR_LLM_SERVICE_UNAVAILABLE
    elif isinstance(e, ContextWindowExceededError):
        status = RuntimeStatus.ERROR_CONTEXT_WINDOW_EXCEEDED
    # ... more mappings ...
    
    # Set state to ERROR
    self.state.last_error = str(e)
    await self.set_agent_state_to(AgentState.ERROR)
    
    # Notify via callback
    if self.status_callback:
        self.status_callback('error', status, error_message)
```

### Stuck Loop Detection

```python
# StuckDetector analyzes event patterns
class StuckDetector:
    def is_stuck(self, headless_mode: bool) -> bool:
        """Detect if agent is stuck in a loop"""
        # Analyzes last N iterations for repeated patterns
        # Detects:
        # 1. Identical actions repeated
        # 2. Cycling between same states
        # 3. No progress toward goal
        # Returns: bool

# When stuck detected:
if self._is_stuck():
    raise AgentStuckInLoopError('Agent got stuck in a loop')
    # → _react_to_exception() handles it
    # → Emits LoopDetectionObservation in CLI mode
    # → Offers recovery options:
    #   1. Restart from before loop
    #   2. Restart with last user message
    #   3. Stop agent completely
```

---

## 14. Performance & Optimization

### Memory Optimization (Condenser)

```python
# Condenser automatically summarizes old events

class Condenser:
    def condensed_history(self, state: State) -> View | Condensation:
        """
        Returns either:
        1. View: list of events to use for LLM
           (recent events + summaries of older events)
        2. Condensation: action that summarizes events
           (agent processes this, then reruns step())
        """
        if should_condense:
            # Trigger condensation
            return Condensation(action=CondensationAction(...))
        else:
            # Return optimized view
            return View(events=[...condensed history...])

# Condensation strategy:
├─ Keep recent N events (default: 10)
├─ Summarize older event groups into summaries
├─ Preserve critical information:
│  ├─ Original user task
│  ├─ Important decisions
│  └─ File/code changes
└─ Result: Fits within LLM context window
```

### Token Budget Tracking

```python
# Metrics track token usage
class Metrics:
    accumulated_cost: float            # Total USD spent
    accumulated_token_usage: TokenUsage
    token_usages: list[TokenUsage]     # Per-call breakdown
    max_budget_per_task: float | None  # Spend limit

# Budget enforcement
if metrics.accumulated_cost > max_budget_per_task:
    raise BadRequestError('ExceededBudget')
    # → Triggers ERROR state
```

### Event Stream Caching

```
Trade-off: Individual files (slow) vs. cached pages (memory)

Individual event files: 
├─ Advantage: Granular control, minimal memory
└─ Disadvantage: Many I/O operations

Cached pages (default: 25 events):
├─ Advantage: Batch I/O, faster reads
└─ Disadvantage: Some memory overhead

Hybrid approach:
├─ Write cache: batches writes
├─ Read cache: loads pages on demand
└─ Result: ~1000x faster for large conversations
```

---

## Summary: Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  FastAPI Server      │
        │  /message endpoint   │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ Conversation Manager         │
        │ Routes to AgentSession       │
        └──────────┬────────────────────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
      ▼            ▼            ▼
  ┌────────┐ ┌──────────┐ ┌─────────┐
  │  Event │ │  Agent   │ │ Runtime │
  │ Stream │ │Controller│ │         │
  └────┬───┘ └─────┬────┘ └────┬────┘
       │           │           │
       ├─ Queues  │           │
       │  events  │           │
       │          │           │
       └──┬───────┴───────────┘
          │
          ▼
  ┌─────────────────────────┐
  │ Agent.step(state)       │
  │ ├─ Get conversation     │
  │ ├─ Build messages       │
  │ ├─ Call LLM             │
  │ ├─ Parse response       │
  │ └─ Return action        │
  └────────┬────────────────┘
           │
           ▼
  ┌─────────────────────────┐
  │ Action emitted          │
  │ (CmdRunAction, etc.)    │
  └────────┬────────────────┘
           │
           ▼
  ┌─────────────────────────┐
  │ Runtime executes        │
  │ (bash, python, etc.)    │
  └────────┬────────────────┘
           │
           ▼
  ┌─────────────────────────┐
  │ Observation emitted     │
  │ (stdout, exit_code)     │
  └────────┬────────────────┘
           │
           ▼
  ┌─────────────────────────┐
  │ Agent sees observation  │
  │ in next step()          │
  └────────┬────────────────┘
           │
           └──► [Loop back to Agent.step()]
```

---

## Key Takeaways

1. **Event-Driven Core**: Everything flows through EventStream for decoupling and persistence
2. **Agent Controller Orchestration**: Central coordinator managing state, stepping, and supervision
3. **Hierarchical Execution**: Runtime abstracts execution, Agent orchestrates logic, Controller supervises
4. **Asynchronous Distribution**: Events processed in background threads with per-subscriber event loops
5. **Persistent History**: All events saved to disk for replay, debugging, and state recovery
6. **Multi-Agent Support**: Delegation creates child controllers sharing metrics and event stream
7. **Safety First**: Security analysis, confirmation modes, and error recovery built-in
8. **Memory Efficient**: Condenser summarizes old events to fit LLM context windows
9. **Observable**: Every action and observation traced, persisted, and timestamped
10. **Flexible**: Runtime and Agent implementations are pluggable via registry pattern
