# Phase 6 SDK Integration: OpenHands AgentController Analysis & Design

## Executive Summary

This document provides a comprehensive analysis of the OpenHands AgentController infrastructure and designs Phase 6 SDK integration. The analysis covers:
- Current AgentController architecture and lifecycle
- Dependency mapping and integration points
- Three integration options with pros/cons
- Recommended approach (Option 2 with enhancements)
- Detailed 4-phase implementation plan
- Risk mitigation and testing strategies

**Key Finding:** SDK agents are ALREADY partially integrated via ClaudeSDKAdapter and AgentFactory. Phase 6 should enhance and stabilize this integration rather than create new infrastructure.

---

## 1. AgentController Architecture

### 1.1 Overview

The AgentController is a 1361-line orchestrator that manages the complete lifecycle of an AI agent executing tasks. It operates on an **event-driven state machine model** with support for multi-agent delegation.

```
┌─────────────────────────────────────────────────────────────┐
│                    AgentController                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐ │
│  │  Agent      │    │ EventStream  │    │   State        │ │
│  │ (abstract)  │    │ (pub/sub)    │    │ (persistence)  │ │
│  └────────────┬┘    └──────┬───────┘    └────────┬───────┘ │
│               │             │                      │         │
│               └─────────────┼──────────────────────┘         │
│                             │                                 │
│               ┌─────────────▼──────────────────┐            │
│               │   Main Control Loop (_step)    │            │
│               │  - Agent.step(state)           │            │
│               │  - Error handling              │            │
│               │  - State transitions           │            │
│               └────────────────────────────────┘            │
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │StuckDetector │  │StateTracker   │  │ Delegate Mgmt   │  │
│  │(loop detect) │  │(persistence)  │  │ (delegation)    │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Main Control Loop (_step method, lines 852-1008)

**Purpose:** Execute a single iteration of agent reasoning and action.

**Flow:**
```python
async def _step():
    1. Check agent state (must be RUNNING)
    2. Check for pending actions (must be none)
    3. Check stuck detector (detect loops)
    4. Run control flags (check iteration/budget limits)
    5. Call agent.step(state) → Action
    6. Handle LLM errors (context window, malformed, etc.)
    7. Analyze action security (if in confirmation mode)
    8. Store pending action (if runnable)
    9. Publish action to event stream
```

**Key Decision Points:**
- Line 854: State must be RUNNING (else return early)
- Line 862: Can't step if action pending (waiting for observation)
- Line 880: Stuck detection triggers error state
- Line 887: Control flags may throw exceptions
- Line 901: `agent.step(state)` is the CRITICAL call
- Line 950: Runnable actions may require security confirmation

### 1.3 Agent Lifecycle

#### Initialization (lines 116-203)
```python
__init__():
    - Store agent instance (abstract Agent type)
    - Create StateTracker (for persistence)
    - Create StuckDetector (for loop detection)
    - Subscribe to EventStream (if not delegate)
    - Set initial state (fresh or restored)
    - Add system message (from agent.get_system_message())
```

#### Stepping (triggered by events)
```python
on_event(event):
    - Check if delegate active (forward to delegate if so)
    - Call _on_event() which may trigger _step()
    - Step triggered if: user message, observation, delegation
```

#### State Transitions (lines 662-714)
```python
set_agent_state_to(new_state):
    - Log state change
    - Call _reset() if entering STOPPED/ERROR (clears pending action)
    - Maybe increase control limits (on ERROR → RUNNING)
    - Emit AgentStateChangedObservation
    - Save state to persistence
```

#### Completion/Error
```python
Finish: agent emits AgentFinishAction → FINISHED state
Error: exception → _react_to_exception() → ERROR state
User Stop: user action → STOPPED state
```

### 1.4 Event Handling Architecture

**Event Types That Trigger Stepping:**
- `MessageAction` from USER source (line 413)
- `Observation` types (except NullObservation, AgentStateChangedObservation) (lines 428-440)
- `AgentDelegateAction` (line 421)
- `CondensationAction` / `CondensationRequestAction` (lines 423-426)

**Event Handling Methods:**
```
on_event() [line 443]
  ├─ Check delegate routing
  └─ Call _on_event() for parent handling
    ├─ _handle_action() [line 504]
    │  ├─ ChangeAgentStateAction
    │  ├─ MessageAction
    │  ├─ AgentDelegateAction (start_delegate)
    │  ├─ AgentFinishAction (mark outputs, FINISHED)
    │  ├─ AgentRejectAction (mark outputs, REJECTED)
    │  └─ LoopRecoveryAction
    ├─ _handle_observation() [line 531]
    │  └─ Clear pending action if observation matches
    └─ Determine should_step() and call _step() if needed
```

### 1.5 Delegation System (Multi-Agent)

**Key Concept:** Parent agent delegates to child agent, creates hierarchy of controllers.

**Delegate Creation (lines 724-783):**
```python
start_delegate(AgentDelegateAction):
    1. Get agent class from registry: Agent.get_cls(action.agent)
    2. Create new agent instance with same metrics
    3. Create new State with delegate_level+1
    4. Create new AgentController with is_delegate=True
       - Does NOT subscribe to event stream
       - Shares event stream and metrics with parent
    5. Post user task as MessageAction
    6. Set delegate to RUNNING state
```

**Delegate Event Flow:**
```
Parent on_event():
    if delegate active and delegate not terminal:
        forward event to delegate._on_event() (don't process parent)
    else if delegate terminal:
        call end_delegate() to collect results
```

**Delegate Completion (lines 785-850):**
```python
end_delegate():
    1. Update parent's iteration with delegate's final iteration
    2. Close delegate controller
    3. Collect delegate outputs
    4. Create AgentDelegateObservation with results
    5. Publish observation to event stream
    6. Unset delegate (parent resumes control)
```

### 1.6 State Management (StateTracker + State)

**StateTracker (268 lines) - Responsibilities:**
- Manage state persistence (save/restore to FileStore)
- Track agent history (filter/maintain event list)
- Sync metrics with LLM module
- Manage control flags (iteration/budget)
- Handle delegate event filtering

**State Object (312 lines) - Contains:**
```python
session_id: str                    # Session identifier
agent_state: AgentState            # LOADING, RUNNING, PAUSED, etc.
history: list[Event]               # Filtered event history
iteration_flag: IterationControlFlag  # Track iterations, enforce max
budget_flag: BudgetControlFlag     # Track spend, enforce budget
delegate_level: int                # 0=root, 1+=child level
start_id/end_id: int               # Event stream ID range
metrics: Metrics                   # LLM usage/cost tracking
parent_metrics_snapshot: Metrics   # For delegate local metrics
outputs: dict                      # Final task outputs
last_error: str                    # Error message if failed
confirmation_mode: bool            # Require user confirmation for actions
```

**State Lifecycle:**
1. Created fresh or restored from FileStore
2. History loaded from EventStream on init
3. Mutated during agent execution
4. Saved to FileStore on state changes
5. Restored on session resume

### 1.7 Stuck Detection (StuckDetector, 481 lines)

**Purpose:** Detect when agent repeats same action-observation cycles.

**Detection Scenarios (lines 38-260):**
1. **Same Action + Observation:** Agent executes identical action, gets identical observation
2. **Action Chain Repetition:** Same 2-3 action-observation pairs repeated
3. **Syntax Errors:** Python syntax error in consecutive IPython cells
4. **Syntax Error Chain:** Multiple syntax errors in a row

**Output:**
```python
StuckAnalysis:
    loop_type: str            # "action_observation", "syntax_error", etc.
    loop_repeat_times: int    # How many times repeated
    loop_start_idx: int       # Where loop started in filtered history
```

**Integration:**
- Called in `_step()` before agent.step() (line 880)
- If stuck detected → raise AgentStuckInLoopError
- Controller catches → _react_to_exception() → ERROR state
- CLI can then offer recovery options (restart before loop, restart with last message)

### 1.8 Error Handling (_react_to_exception, lines 312-366)

**LLM Error Types Handled:**
- AuthenticationError → AGENT_ERROR_LLM_AUTHENTICATION
- ServiceUnavailableError, APIConnectionError → ERROR_LLM_SERVICE_UNAVAILABLE
- InternalServerError → ERROR_LLM_INTERNAL_SERVER_ERROR
- BadRequestError (budget) → ERROR_LLM_OUT_OF_CREDITS
- ContentPolicyViolationError → ERROR_LLM_CONTENT_POLICY_VIOLATION
- RateLimitError → RATE_LIMITED state (with retry logic)
- Generic exceptions → ERROR state

**Action Errors Handled:**
- LLMMalformedActionError (lines 906-917)
- LLMNoActionError
- LLMResponseError
- FunctionCallValidationError
- FunctionCallNotExistsError
- ContextWindowExceededError → RequestCondensation if enabled

---

## 2. Dependency Analysis

### 2.1 AgentController Dependencies (Dependency Tree)

```
AgentController
├── agent: Agent (abstract base class)
│   ├── agent.step(state) → Action          [CRITICAL]
│   ├── agent.reset()
│   ├── agent.get_system_message()
│   ├── agent.config: AgentConfig
│   ├── agent.llm: LLM                      [For legacy agents only]
│   └── agent.llm_registry: LLMRegistry
│
├── state_tracker: StateTracker
│   ├── state: State
│   │   ├── history: list[Event]
│   │   ├── iteration_flag: IterationControlFlag
│   │   ├── budget_flag: BudgetControlFlag
│   │   ├── metrics: Metrics
│   │   └── conversation_stats: ConversationStats
│   ├── agent_history_filter: EventFilter
│   ├── file_store: FileStore
│   └── event_stream: EventStream
│
├── event_stream: EventStream
│   ├── add_event(event, source)
│   ├── subscribe(subscriber, callback, sid)
│   ├── unsubscribe(subscriber, sid)
│   └── search_events()
│
├── stuck_detector: StuckDetector
│   └── is_stuck(headless_mode) → bool
│
├── security_analyzer: SecurityAnalyzer (optional)
│   └── security_risk(action) → ActionSecurityRisk
│
└── conversation_stats: ConversationStats
    └── get_combined_metrics() → Metrics
```

### 2.2 Agent Interface Requirements

```python
class Agent(ABC):
    # Required abstract method
    def step(self, state: State) -> Action
        # Must return an Action for the controller to publish
        # Raises: LLMMalformedActionError, LLMNoActionError, etc.
    
    # Optional methods
    def reset() -> None          # Clear completion status
    def get_system_message() -> SystemMessageAction  # Initial prompt
    
    # Required attributes
    config: AgentConfig          # Agent configuration
    llm: LLM (legacy only)       # LLM module
    llm_registry: LLMRegistry    # For lazy loading
    name: str                    # Class name
    tools: list                  # Available tools
```

### 2.3 SDK Agent Interface (Current Implementation)

**CodeActAgentSDK (inherits Agent):**
```python
class CodeActAgentSDK(Agent):
    adapter: ClaudeSDKAdapter
    adapter_config: ClaudeSDKAdapterConfig
    
    def step(self, state: State) -> Action:
        # Delegates to adapter instead of self.llm
        action = run_async(self.adapter.execute_step(state))
        return action
    
    def get_system_message() -> SystemMessageAction:
        # Returns prompt for Claude SDK initialization
```

**ClaudeSDKAdapter (Bridge Layer):**
```python
class ClaudeSDKAdapter:
    claude_client: ClaudeSDKClient
    
    async execute_step(state: State) -> Action:
        # Convert State to Claude SDK format
        # Run Claude SDK agent loop
        # Convert SDK response back to OpenHands Action
        # Handle tool calls and observations
```

### 2.4 What SDK Agents DON'T Use

- `agent.llm` - SDK handles LLM directly
- `agent.llm_registry.get_llm_from_agent_config()` - Not needed
- LiteLLM completion calls - Replaced by Claude SDK
- Temperature, top_p, other LLM parameters - Claude SDK manages
- Tool function registration via LiteLLM - Claude SDK handles tools

### 2.5 What SDK Agents DO Use

- `State` object (same as legacy agents)
- `AgentConfig` (configuration)
- `tools` attribute (tool list)
- `get_system_message()` (initial prompt)
- Event stream (implicit via controller)
- StateTracker/persistence (via controller)
- All control/safety features (via controller)

---

## 3. SDK Agent Integration Points

### 3.1 Current Integration Status

**Already Integrated:**
1. ✅ SDK agents inherit from Agent base class
2. ✅ AgentFactory supports both legacy and SDK agents
3. ✅ ClaudeSDKAdapter bridges SDK to OpenHands
4. ✅ SDK agents can be created via `Agent.register()`
5. ✅ State/Action/Observation system works with SDK agents

**Partially Integrated:**
1. ⚠️ OrchestratorAdapter exists but is minimal
2. ⚠️ SDK agents have different initialization requirements (MCP servers)
3. ⚠️ No unified error handling for SDK vs legacy
4. ⚠️ Async/sync bridge (run_async) is basic

**Not Yet Integrated:**
1. ❌ Phase 6 unified TaskOrchestrator interface
2. ❌ Unified agent health monitoring
3. ❌ Shared tool execution layer
4. ❌ Unified metrics/cost tracking
5. ❌ Unified delegation for mixed agent types

### 3.2 Where SDK Agents Interact with AgentController

**1. Agent.step() Call (Line 901)**
```python
# In _step():
action = self.agent.step(self.state)  # SDK agent.step() delegates to adapter

# SDK agent implementation:
def step(self, state: State) -> Action:
    action = run_async(self.adapter.execute_step(state))
    return action  # Returns Action, controller doesn't know it's SDK
```

**Key Insight:** AgentController is **agent-agnostic**. It doesn't know or care if step() uses LiteLLM or Claude SDK, as long as it returns an Action.

**2. System Message Initialization (Line 261-268)**
```python
# In _add_system_message():
system_message = self.agent.get_system_message()
self.event_stream.add_event(system_message, EventSource.AGENT)

# SDK agent implementation:
def get_system_message(self) -> SystemMessageAction:
    # Returns system prompt + tools
```

**3. Tool Registration (In agent.__init__)**
```python
# SDK agents may set up tools differently:
self.tools = []  # Agent base class attribute
```

**4. Reset (Line 660)**
```python
# In _reset():
self.agent.reset()

# SDK agents override:
def reset(self) -> None:
    super().reset()
    self.adapter.reset()  # Reset adapter state if needed
```

**5. Configuration (Line 159)**
```python
self.agent = agent  # Already instantiated
# Agent.__init__() already ran with config + llm_registry
```

### 3.3 Where AgentController Would Need Enhancements for Phase 6

**1. Agent Type Detection (line ~160)**
```python
# Add: Detect if SDK or legacy agent
is_sdk_agent = isinstance(self.agent, SDKAgent) or hasattr(agent, 'adapter')
self.agent_type = 'sdk' if is_sdk_agent else 'legacy'
```

**2. Async/Await Handling (line ~901)**
```python
# Current: agent.step() returns Action
# SDK agents internally use run_async(), which is blocking

# Future: Make _step() truly async:
# async def _step():
#     action = await self.agent.step(self.state)
```

**3. Unified Error Handling**
```python
# Current: Catches LiteLLM exceptions only
# Needed: Also catch Claude SDK exceptions
# Map both to same error types
```

**4. Tool Execution Layer (Optional)**
```python
# Current: Tools executed in runtime (CmdRunAction, etc.)
# Potential: Unified tool registration
# Allow both SDK and legacy agents to use same tools
```

---

## 4. Recommended Approach: Option Analysis

### Option 1: Modify AgentController Directly (NOT RECOMMENDED)

**Approach:** Add SDK detection and branching logic to AgentController.

**Pseudocode:**
```python
async def _step(self):
    if isinstance(self.agent, SDKAgent):
        # SDK-specific code path
        action = await self.agent.adapter.step()
    else:
        # Legacy code path
        action = self.agent.step(self.state)
```

**Pros:**
- Single code path for both agent types
- No additional adapter needed
- Slightly better performance

**Cons:**
- Violates Open/Closed Principle
- AgentController becomes SDK-aware (bad dependency direction)
- Harder to add new agent types
- Risk of spaghetti code
- Difficult to test isolation
- **Blocks future agent types** (open-ended design fail)

**Recommendation:** ❌ REJECT - Creates tight coupling

---

### Option 2: Enhance OrchestratorAdapter (RECOMMENDED)

**Approach:** Implement complete TaskOrchestrator wrapper that:
1. Internally uses AgentController for legacy agents
2. Internally uses direct SDK for SDK agents
3. Presents unified interface to callers
4. Replaces AgentSession eventually

**Pseudocode:**
```python
class TaskOrchestrator:
    async def step(self) -> bool:
        if self.agent_type == 'sdk':
            # Direct Claude SDK execution
            action = await self.sdk_client.step()
        else:
            # Use AgentController
            await self.controller._step()
```

**Pros:**
- ✅ Maintains AgentController unchanged
- ✅ SDK agents bypass AgentController (better separation)
- ✅ Unified external interface
- ✅ Clean migration path
- ✅ Future-proof for new agent types
- ✅ Backward compatible

**Cons:**
- Requires OrchestratorAdapter completion
- Two control loops (controller + orchestrator)
- Slightly more code
- Learning curve for developers

**Recommendation:** ✅ ACCEPT - Recommended approach

---

### Option 3: Create New SDKController Class (NOT RECOMMENDED)

**Approach:** Create SDKController parallel to AgentController.

**Pseudocode:**
```python
class SDKController:
    agent: SDKAgent
    
    async def step(self):
        # SDK-specific control loop
        action = await self.agent.adapter.execute_step()
```

**Pros:**
- Clean separation of concerns
- Dedicated SDK implementation

**Cons:**
- Code duplication (event handling, state management)
- Maintenance nightmare
- Violates DRY principle
- Non-standard control flow
- Harder for users to understand

**Recommendation:** ❌ REJECT - Creates duplicate infrastructure

---

### Recommended Approach Summary

**Use Option 2: Enhanced OrchestratorAdapter**

**Vision:**
```
┌─────────────────────────────────────────┐
│         API/User Layer                  │
│     (Session, WebSocket, CLI)           │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│    TaskOrchestrator/OrchestratorAdapter │
│  (unified control plane - Phase 6)      │
└────┬──────────────────────────────┬────┘
     │                              │
     ▼                              ▼
┌──────────────────────┐    ┌──────────────────────┐
│  AgentController     │    │  Direct SDK Client   │
│  (legacy agents)     │    │  (SDK agents)        │
└──────────────────────┘    └──────────────────────┘
     │                              │
     ▼                              ▼
┌──────────────────────┐    ┌──────────────────────┐
│  CodeActAgent        │    │  CodeActAgentSDK     │
│  BrowsingAgent       │    │  BrowsingAgentSDK    │
│  etc (legacy)        │    │  etc (SDK)           │
└──────────────────────┘    └──────────────────────┘
     │                              │
     ▼                              ▼
┌──────────────────────┐    ┌──────────────────────┐
│  LiteLLM             │    │  Claude SDK Client   │
│  (model requests)    │    │  (model requests)    │
└──────────────────────┘    └──────────────────────┘
```

---

## 5. Detailed Implementation Plan

### Phase 6A: Foundation (Week 1-2)

#### 5.1.1 Enhance OrchestratorAdapter (Priority: HIGH)

**File:** `/openhands/controller/orchestrator_adapter.py`

**Current State:** 367 lines, minimal wrapper

**Changes Needed:**

```python
# 1. Extend OrchestratorAdapter class

class OrchestratorAdapter:
    def __init__(self, ...):
        # Current: Initialize TaskOrchestrator
        # Add: Detect and store agent type
        self.agent_type = detect_agent_type(agent)
        self.is_sdk_agent = agent_type in ['code_sdk', 'browsing_sdk', ...]
        
        if self.is_sdk_agent:
            self.sdk_executor = SDKExecutor(...)  # New
        else:
            self.controller = AgentController(...)  # Keep existing
    
    # 2. Unified step method
    async def step(self) -> Action:
        if self.is_sdk_agent:
            return await self.sdk_executor.step()
        else:
            return await self.controller._step()
    
    # 3. Unified event stream integration
    def publish_event(self, event: Event, source: EventSource):
        self.event_stream.add_event(event, source)
    
    # 4. Unified state management
    def get_state(self) -> State:
        if self.is_sdk_agent:
            return self.sdk_executor.get_state()
        else:
            return self.controller.get_state()
    
    # 5. Unified completion detection
    async def is_complete(self) -> bool:
        state = self.get_state()
        return state.agent_state in (AgentState.FINISHED, 
                                      AgentState.ERROR,
                                      AgentState.STOPPED)
```

**Tests to Add:**
- `test_sdk_agent_initialization()`
- `test_legacy_agent_initialization()`
- `test_agent_type_detection()`
- `test_step_returns_same_type()`

#### 5.1.2 Create SDKExecutor Helper Class (Priority: HIGH)

**File:** `/openhands/controller/sdk_executor.py` (NEW)

**Purpose:** Encapsulate SDK-specific control flow

```python
class SDKExecutor:
    def __init__(self, agent: SDKAgent, event_stream: EventStream, state: State):
        self.agent = agent
        self.event_stream = event_stream
        self.state = state
        self.adapter = agent.adapter
        self.stuck_detector = StuckDetector(state)
        self.control_flags = (state.iteration_flag, state.budget_flag)
    
    async def step(self) -> Action:
        # Copy relevant logic from AgentController._step()
        # - Check agent state (RUNNING)
        # - Check stuck detection
        # - Check control flags
        # - Call self.adapter.execute_step(state)
        # - Handle SDK-specific errors
        # - Return Action
    
    async def handle_error(self, e: Exception):
        # Handle SDK-specific exceptions
        # Map to OpenHands error types
        # Update state
    
    def get_state(self) -> State:
        return self.state
```

#### 5.1.3 Unified Agent Type Detection (Priority: MEDIUM)

**File:** `/openhands/agenthub/agent_detector.py` (NEW)

```python
def detect_agent_type(agent: Agent) -> str:
    """Detect if agent is SDK or legacy type."""
    if isinstance(agent, SDKAgent):
        return "sdk"
    if hasattr(agent, 'adapter') and isinstance(agent.adapter, ClaudeSDKAdapter):
        return "sdk"
    return "legacy"

# Or extend Agent base class:
class Agent(ABC):
    AGENT_TYPE = "legacy"  # Override in SDK agents
    
# class CodeActAgentSDK(Agent):
#     AGENT_TYPE = "sdk"
```

---

### Phase 6B: Unified Interface (Week 2-3)

#### 5.2.1 Unified Error Handling (Priority: HIGH)

**File:** `/openhands/controller/error_handler.py` (NEW)

**Purpose:** Map both LiteLLM and Claude SDK errors to OpenHands exceptions

```python
class UnifiedErrorHandler:
    @staticmethod
    async def handle_step_error(e: Exception, state: State, agent_type: str):
        """Handle errors from both SDK and legacy agents."""
        
        # Categorize error
        error_category = UnifiedErrorHandler._categorize_error(e, agent_type)
        
        # Map to OpenHands state
        if error_category == "authentication":
            await set_agent_state_to(AgentState.ERROR)
            raise AuthenticationError(...)
        elif error_category == "rate_limit":
            await set_agent_state_to(AgentState.RATE_LIMITED)
        elif error_category == "context_window":
            if enable_condensation:
                return RequestCondensation()
            else:
                raise LLMContextWindowExceedError()
        # ... more cases
    
    @staticmethod
    def _categorize_error(e: Exception, agent_type: str) -> str:
        """Categorize error regardless of source."""
        if agent_type == "sdk":
            if isinstance(e, claude_sdk.RateLimitError):
                return "rate_limit"
            elif isinstance(e, claude_sdk.AuthenticationError):
                return "authentication"
            # ... etc
        else:  # legacy
            if isinstance(e, litellm.RateLimitError):
                return "rate_limit"
            # ... etc
```

#### 5.2.2 Extend State for SDK Agents (Priority: MEDIUM)

**File:** `/openhands/controller/state/state.py`

**Current:** State is generic (works for both)

**Changes Needed:**
```python
@dataclass
class State:
    # Add SDK-specific fields:
    agent_type: str = "legacy"  # "legacy" or "sdk"
    
    # For SDK agents, track Claude SDK-specific info:
    sdk_metadata: dict = field(default_factory=dict)
    # E.g., {"turn_count": 5, "message_count": 12, "model": "claude-sonnet"}
```

#### 5.2.3 Extend StateTracker for SDK (Priority: MEDIUM)

**File:** `/openhands/controller/state/state_tracker.py`

**Changes:**
```python
class StateTracker:
    def __init__(self, agent_type: str = "legacy"):
        self.agent_type = agent_type
        if agent_type == "sdk":
            # SDK-specific tracking
            self.sdk_metrics_tracker = SDKMetricsTracker()
    
    def sync_sdk_metrics(self, sdk_state: dict):
        """Sync Claude SDK metrics to State."""
        if self.agent_type == "sdk":
            self.state.metrics.update_from_sdk(sdk_state)
```

---

### Phase 6C: Agent Session Integration (Week 3-4)

#### 5.3.1 Update AgentSession.start() (Priority: HIGH)

**File:** `/openhands/server/session/agent_session.py`

**Current:** Creates AgentController directly

**Changes Needed:**
```python
async def start(self, ...):
    # Current: self.controller = AgentController(agent=agent, ...)
    
    # New: Detect agent type and create appropriate executor
    agent_type = detect_agent_type(agent)
    
    if agent_type == "sdk":
        # Use TaskOrchestrator/OrchestratorAdapter
        self.orchestrator = OrchestratorAdapter(
            config=config,
            event_stream=self.event_stream,
            agent=agent,
            ...
        )
        self.controller = None  # Not used for SDK
        self.executor = self.orchestrator
    else:
        # Use AgentController (legacy)
        self.controller = AgentController(agent=agent, ...)
        self.executor = self.controller
```

#### 5.3.2 Unify Main Loop in agent_session.py (Priority: HIGH)

**Current:** Different loops for controller vs orchestrator

**Changes Needed:**
```python
# Replace controller-specific code with executor-agnostic code:

# Instead of:
# while not self.controller.state.agent_state in terminal_states:
#     self.controller.step()

# Use:
# while not self.executor.get_state().agent_state in terminal_states:
#     await self.executor.step()
```

#### 5.3.3 Unified Metrics Collection (Priority: MEDIUM)

**File:** `/openhands/server/services/conversation_stats.py`

**Extend to collect metrics from both sources:**
```python
class ConversationStats:
    def get_combined_metrics(self) -> Metrics:
        """Get metrics from legacy LLM, SDK client, or both."""
        metrics = Metrics()
        
        if self.has_legacy_llm:
            metrics.add(self.legacy_metrics)
        
        if self.has_sdk_client:
            metrics.add(self.sdk_metrics)
        
        return metrics
```

---

### Phase 6D: Testing & Stabilization (Week 4-5)

#### 5.4.1 Integration Tests (Priority: HIGH)

**File:** `/tests/integration/test_sdk_integration.py` (NEW)

```python
async def test_sdk_agent_full_lifecycle():
    """Test SDK agent with AgentSession."""
    agent = CodeActAgentSDK(config, llm_registry)
    session = AgentSession(sid, file_store, llm_registry, stats)
    
    await session.start(
        runtime_name="docker",
        config=config,
        agent=agent,
        max_iterations=10
    )
    
    # Verify controller or orchestrator created
    assert session.executor is not None
    
    # Publish user message
    session.event_stream.add_event(
        MessageAction("write hello.txt with content 'hello'"),
        EventSource.USER
    )
    
    # Run until completion
    while session.executor.get_state().agent_state not in terminal_states:
        await asyncio.sleep(0.5)
    
    # Verify state
    state = session.executor.get_state()
    assert state.agent_state in (AgentState.FINISHED, AgentState.ERROR)
    assert len(state.history) > 0

async def test_legacy_agent_full_lifecycle():
    """Test legacy agent still works."""
    # Same test with CodeActAgent (not SDK)
    ...

async def test_mixed_delegation():
    """Test parent legacy agent delegating to SDK child."""
    # Parent: CodeActAgent (legacy)
    # Child: CodeActAgentSDK (SDK)
    ...

async def test_sdk_error_handling():
    """Test SDK error handling."""
    # Trigger context window error
    # Verify OrchestratorAdapter handles correctly
    # Verify state updates correctly
    ...

async def test_state_persistence_sdk():
    """Test SDK agent state can be saved and restored."""
    # Create SDK session
    # Save state
    # Restore state
    # Verify history intact
    ...
```

#### 5.4.2 Unit Tests for New Classes (Priority: HIGH)

```python
# tests/unit/controller/test_orchestrator_adapter.py
def test_orchestrator_adapter_sdk_initialization():
    """OrchestratorAdapter correctly initializes SDK agent."""
    ...

def test_orchestrator_adapter_legacy_initialization():
    """OrchestratorAdapter correctly initializes legacy agent."""
    ...

def test_sdk_executor_step():
    """SDKExecutor executes step correctly."""
    ...

def test_unified_error_handler_maps_litellm_to_openhands():
    """UnifiedErrorHandler maps LiteLLM errors correctly."""
    ...

def test_unified_error_handler_maps_sdk_to_openhands():
    """UnifiedErrorHandler maps SDK errors correctly."""
    ...
```

#### 5.4.3 End-to-End Tests (Priority: MEDIUM)

```python
# tests/e2e/test_sdk_agents.py
async def test_codeact_sdk_agent_write_file():
    """SDK CodeActAgent can write files."""
    ...

async def test_codeact_sdk_agent_run_command():
    """SDK CodeActAgent can run commands."""
    ...

async def test_browsing_sdk_agent_navigate():
    """SDK BrowsingAgent can navigate web."""
    ...

async def test_readonly_sdk_agent_restrictions():
    """SDK ReadOnlyAgent enforces restrictions."""
    ...
```

---

## 6. Backward Compatibility Strategy

### 6.1 Compatibility Matrix

```
Legacy Agent + AgentController = ✅ WORKS (current)
SDK Agent + AgentController = ⚠️ WORKS (basic, no optimization)
Legacy Agent + OrchestratorAdapter = ✅ WORKS (fallback to controller)
SDK Agent + OrchestratorAdapter = ✅ WORKS (optimized)
```

### 6.2 Migration Path

**Phase 1 (Week 1-2):** Enhancement Phase
- Add OrchestratorAdapter enhancements
- SDK agents work through controller (no optimization)
- Minimal changes to AgentSession

**Phase 2 (Week 2-3):** Integration Phase
- AgentSession creates OrchestratorAdapter for SDK agents
- AgentSession creates AgentController for legacy agents
- Unified interface in AgentSession

**Phase 3 (Week 4-5):** Migration Phase
- Environment flag: `OPENHANDS_USE_SDK_AGENTS=true/false`
- Default: auto-detect based on model
- Users can opt-in to SDK without changing code

**Phase 4 (Future):** Deprecation Phase (Not Phase 6)
- Mark AgentController as "may be deprecated"
- Encourage migration to SDK agents
- Keep AgentController for stability

### 6.3 Configuration Changes

**NEW: AgentSession Configuration**

```python
class AgentSessionConfig:
    prefer_sdk_agents: bool = False  # Opt-in to SDK optimization
    use_orchestrator: bool = False   # Use OrchestratorAdapter
    fallback_to_legacy: bool = True  # Fallback if SDK fails
    timeout_seconds: int = 300
```

### 6.4 Deprecation Timeline

**Now (Phase 6):**
- SDK agents fully supported
- OrchestratorAdapter working
- Environment variables for control

**3 Months:**
- Make SDK default for Claude models
- Announce legacy agent deprecation timeline

**6 Months:**
- Consider removing legacy agent path if stable

### 6.5 Breaking Changes

**NONE planned for Phase 6**

- Agent interface unchanged
- State interface unchanged
- Event stream unchanged
- AgentController unchanged
- All changes are additive or internal

---

## 7. Testing Plan

### 7.1 Test Coverage Requirements

**Scope:**
- OrchestratorAdapter (new) - 100% coverage
- SDKExecutor (new) - 100% coverage  
- UnifiedErrorHandler (new) - 95% coverage
- Integration with AgentSession - 90% coverage
- SDK agents through controller - 80% coverage

### 7.2 Test Pyramid

```
                    E2E Tests (5-10)
                   /              \
                 /  Integration    \
               /    Tests (20)      \
             /                      \
           / Unit Tests (50+)        \
         / ___________________________\

Unit Tests (Fastest, Isolated):
- OrchestratorAdapter unit tests
- SDKExecutor unit tests
- UnifiedErrorHandler unit tests
- State/StateTracker changes
- Agent detection logic

Integration Tests (Medium Speed, Real Objects):
- OrchestratorAdapter + SDK Agent
- OrchestratorAdapter + Legacy Agent
- SDKExecutor + Event Stream
- Metrics tracking (SDK + Legacy)
- Error handling integration

E2E Tests (Slowest, Full System):
- SDK agent full lifecycle
- Legacy agent full lifecycle
- Mixed delegation scenarios
- State persistence
- Real runtime interaction
```

### 7.3 Test Cases by Component

**OrchestratorAdapter (15 tests)**
```
1. SDK agent initialization
2. Legacy agent initialization
3. Agent type detection
4. Step execution (SDK)
5. Step execution (Legacy)
6. Event publishing
7. State retrieval
8. Metrics aggregation
9. Completion detection
10. Error propagation
11. Context manager (__aenter__/__aexit__)
12. Fallback to legacy on SDK error
13. Timeout handling
14. Concurrent step calls (should be blocked)
15. Resource cleanup
```

**SDKExecutor (12 tests)**
```
1. Step execution
2. Stuck detection integration
3. Control flags integration
4. Action validation
5. Security analysis (if applicable)
6. Pending action management
7. Error handling (rate limit)
8. Error handling (context window)
9. Error handling (generic exception)
10. State updates
11. Event emission
12. Reset on error
```

**UnifiedErrorHandler (10 tests)**
```
1. Categorize LiteLLM authentication error
2. Categorize LiteLLM rate limit error
3. Categorize LiteLLM context window error
4. Categorize Claude SDK authentication error
5. Categorize Claude SDK rate limit error
6. Categorize Claude SDK context window error
7. Map to OpenHands state (ERROR)
8. Map to OpenHands state (RATE_LIMITED)
9. Map to OpenHands state (RequestCondensation)
10. Unknown error handling
```

**AgentSession Integration (8 tests)**
```
1. Start with SDK agent
2. Start with legacy agent
3. Event publishing (SDK agent)
4. Event publishing (legacy agent)
5. State persistence (SDK agent)
6. State persistence (legacy agent)
7. Metrics collection (SDK agent)
8. Metrics collection (legacy agent)
```

**SDK Agent Lifecycle (5 E2E tests)**
```
1. CodeActAgentSDK writes file
2. CodeActAgentSDK runs command
3. BrowsingAgentSDK navigates website
4. ReadOnlyAgentSDK enforces restrictions
5. Agent handles user interruption
```

### 7.4 Test Coverage Checklist

```python
# Functional Coverage
[ ] SDK agent step execution
[ ] Legacy agent step execution
[ ] Error handling (both types)
[ ] State persistence
[ ] Event stream integration
[ ] Metrics aggregation
[ ] Delegation with mixed types
[ ] Confirmation mode with SDK agents
[ ] Stuck detection with SDK agents
[ ] Control flags with SDK agents

# Non-Functional Coverage
[ ] Performance (SDK vs Legacy)
[ ] Memory usage
[ ] Error recovery
[ ] Graceful shutdown
[ ] Concurrent usage
[ ] Configuration validation

# Edge Cases
[ ] Missing adapter
[ ] Null agent
[ ] Empty state history
[ ] Rapid successive steps
[ ] Very large actions
[ ] Very large observations
[ ] Network timeout during step
[ ] Malformed SDK response
```

---

## 8. Risk Analysis

### 8.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Async/Await Mismatch** | Medium | High | Use run_async wrapper carefully, add integration tests |
| **State Corruption** | Low | Critical | Snapshot state before step, validate after |
| **SDK Breaking Changes** | Low | High | Pin Claude SDK version, maintain changelog |
| **Performance Regression** | Medium | Medium | Benchmark both paths, profile hot spots |
| **Memory Leaks in SDK** | Low | High | Monitor memory in tests, implement cleanup |
| **Deadlocks** | Low | Critical | Comprehensive locking tests, timeout handling |

### 8.2 Integration Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **AgentSession Compatibility** | Medium | High | Extensive integration tests, stage rollout |
| **EventStream Side Effects** | Medium | Medium | Use event filtering, monitor event counts |
| **Metrics Inconsistency** | Medium | Medium | Validate metrics in tests, human review |
| **Delegation with Mixed Types** | Low | High | Create specific test for this, document limitations |
| **Tool Execution Differences** | Medium | Medium | Compare tool results between paths |

### 8.3 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Production Failure** | Low | Critical | Canary testing in prod, feature flags |
| **Monitoring Gaps** | Medium | Medium | Instrument new code, add dashboards |
| **Documentation Lag** | High | Medium | Write docs during implementation, keep updated |
| **Customer Migration** | Medium | Medium | Provide clear upgrade guide, support period |

### 8.4 Code Quality Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Code Duplication** | Medium | Medium | Extract common patterns, refactor aggressively |
| **Type Safety** | Medium | Medium | Use type hints throughout, run mypy |
| **Testing Gaps** | Medium | High | Aim for 90%+ coverage, code review required |
| **Maintainability** | Medium | Medium | Clear design docs, code comments, good names |

### 8.5 Mitigation Strategies

**1. Comprehensive Testing**
- Integration tests before rollout
- Canary testing in production
- Monitoring and alerting

**2. Feature Flags**
```python
config.use_sdk_agents = False  # Default off
config.enable_orchestrator = False  # Default off
# Gradual rollout: 0% → 10% → 50% → 100%
```

**3. Fallback Mechanisms**
```python
try:
    executor = OrchestratorAdapter(...)
except Exception:
    executor = AgentController(...)  # Fallback
    logger.warning("Falling back to AgentController")
```

**4. Monitoring & Observability**
```python
# Add metrics
metrics.sdk_agent_count += 1
metrics.legacy_agent_count += 1
metrics.sdk_error_rate = sdk_errors / sdk_attempts
metrics.orchestrator_latency = measure_time(orchestrator.step())
```

**5. Documentation**
- Migration guide for developers
- Architecture decision records (ADRs)
- Troubleshooting guide
- Performance tuning guide

---

## 9. Files That Need Changes

### Summary Table

| File | Type | Changes | Risk |
|------|------|---------|------|
| `orchestrator_adapter.py` | Enhance | 300+ lines | Medium |
| `sdk_executor.py` | NEW | 300 lines | Medium |
| `agent_detector.py` | NEW | 50 lines | Low |
| `error_handler.py` | NEW | 150 lines | Medium |
| `state/state.py` | Extend | 20 lines | Low |
| `state/state_tracker.py` | Extend | 30 lines | Low |
| `agent_session.py` | Update | 50 lines | Medium |
| `core/loop.py` | Update | 30 lines | Low |
| Tests | NEW | 500+ lines | Low |

### Detailed File-by-File Changes

**1. `/openhands/controller/orchestrator_adapter.py`**
```
Status: ENHANCE
Changes:
  - Add SDKAgent detection logic
  - Create dual code paths (SDK vs Legacy)
  - Implement unified step() method
  - Add error handling adapter
  - Add metrics aggregation
  - Handle async/await properly
Size: 367 → 700 lines (+333)
Complexity: Medium
```

**2. `/openhands/controller/sdk_executor.py` (NEW)**
```
Status: CREATE
Purpose: SDK-specific control flow
Classes: SDKExecutor
Methods: step(), handle_error(), get_state()
Size: ~300 lines
Complexity: Medium
```

**3. `/openhands/agenthub/agent_detector.py` (NEW)**
```
Status: CREATE
Purpose: Detect agent type (SDK vs Legacy)
Functions: detect_agent_type()
Size: ~50 lines
Complexity: Low
```

**4. `/openhands/controller/error_handler.py` (NEW)**
```
Status: CREATE
Purpose: Unified error handling
Classes: UnifiedErrorHandler
Methods: handle_step_error(), _categorize_error()
Size: ~150 lines
Complexity: Medium
```

**5. `/openhands/controller/state/state.py`**
```
Status: EXTEND
Changes:
  - Add agent_type field (str)
  - Add sdk_metadata field (dict)
  - Update __init__ defaults
  - Update type hints
Lines Changed: ~20
Complexity: Low
```

**6. `/openhands/controller/state/state_tracker.py`**
```
Status: EXTEND
Changes:
  - Store agent_type in __init__
  - Add sync_sdk_metrics() method
  - Add SDK-specific tracking (optional)
Lines Changed: ~30
Complexity: Low
```

**7. `/openhands/server/session/agent_session.py`**
```
Status: UPDATE
Changes:
  - Import OrchestratorAdapter
  - Add agent type detection in start()
  - Route to OrchestratorAdapter for SDK
  - Keep AgentController for legacy
  - Unify event loop (both use same interface)
Lines Changed: ~50
Complexity: Medium
```

**8. `/openhands/core/loop.py`**
```
Status: UPDATE
Changes:
  - Update run_agent_until_done() to work with OrchestratorAdapter
  - Support both controller and orchestrator
  - Unified state checking
Lines Changed: ~30
Complexity: Low
```

**9. `/tests/integration/test_sdk_integration.py` (NEW)**
```
Status: CREATE
Classes: (none, just test functions)
Tests: ~15-20 integration tests
Size: ~400 lines
Complexity: Medium
```

**10. `/tests/unit/controller/test_orchestrator_adapter.py` (NEW)**
```
Status: CREATE
Tests: ~15 unit tests
Size: ~300 lines
Complexity: Medium
```

---

## 10. Implementation Timeline

### Week 1-2: Foundation
- [x] Analyze current architecture ← YOU ARE HERE
- [ ] Enhance OrchestratorAdapter
- [ ] Create SDKExecutor
- [ ] Unit tests for new classes
- **Deliverable:** Working SDK-Agent + OrchestratorAdapter

### Week 2-3: Integration
- [ ] Extend State/StateTracker
- [ ] Create UnifiedErrorHandler
- [ ] Update AgentSession
- [ ] Integration tests
- **Deliverable:** SDK agents work through OrchestratorAdapter

### Week 3-4: Stabilization
- [ ] E2E tests
- [ ] Performance testing
- [ ] Edge case handling
- [ ] Documentation
- **Deliverable:** Phase 6 ready for staging

### Week 4-5: Polish
- [ ] Code review & refactoring
- [ ] Final integration tests
- [ ] Monitoring/alerting setup
- [ ] Release preparation
- **Deliverable:** Phase 6 ready for production

---

## 11. Success Criteria

### Phase 6 Is Complete When:

**Functional:**
- ✅ SDK agents work with OrchestratorAdapter
- ✅ Legacy agents work with AgentController (unchanged)
- ✅ Mixed delegation works (legacy → SDK, SDK → legacy)
- ✅ Error handling unified for both types
- ✅ Metrics tracking works for both types
- ✅ State persistence works for both types

**Quality:**
- ✅ 90%+ test coverage on new code
- ✅ Integration tests pass
- ✅ E2E tests pass
- ✅ No performance regression
- ✅ No memory leaks in tests

**Documentation:**
- ✅ Architecture design documented
- ✅ Migration guide written
- ✅ API changes documented
- ✅ Troubleshooting guide written

**Operational:**
- ✅ Monitoring/metrics in place
- ✅ Feature flags working
- ✅ Fallback mechanisms tested
- ✅ Production rollout plan ready

---

## 12. Appendix: Code Templates

### Template 1: OrchestratorAdapter.step()

```python
async def step(self) -> Action:
    """Execute one agent step (SDK or legacy)."""
    try:
        state = self.get_state()
        
        # Sanity checks
        if state.agent_state != AgentState.RUNNING:
            return NullAction()
        
        if self.is_sdk_agent:
            # SDK path
            return await self.sdk_executor.step()
        else:
            # Legacy path (blocking)
            return await asyncio.to_thread(self.controller._step)
    
    except Exception as e:
        await self.error_handler.handle_step_error(e, self.agent_type)
        return NullAction()
```

### Template 2: Unified Error Handling

```python
async def handle_step_error(self, e: Exception, agent_type: str):
    """Handle errors from SDK or legacy agents."""
    error_cat = self._categorize_error(e, agent_type)
    
    if error_cat == "rate_limit":
        self.state.agent_state = AgentState.RATE_LIMITED
    elif error_cat == "context_window":
        if self.config.enable_condensation:
            self.event_stream.add_event(
                CondensationRequestAction(),
                EventSource.AGENT
            )
        else:
            self.state.agent_state = AgentState.ERROR
            self.state.last_error = "Context window exceeded"
    elif error_cat == "authentication":
        self.state.agent_state = AgentState.ERROR
        self.state.last_error = "Authentication failed"
    else:
        self.state.agent_state = AgentState.ERROR
        self.state.last_error = str(e)
```

### Template 3: Agent Type Detection

```python
def detect_agent_type(agent: Agent) -> str:
    """Detect if agent is SDK or legacy."""
    # Check if it's explicitly an SDK agent
    if hasattr(agent, '__class__'):
        class_name = agent.__class__.__name__
        if 'SDK' in class_name or 'SDK' in str(type(agent).__module__):
            return 'sdk'
    
    # Check for adapter attribute
    if hasattr(agent, 'adapter') and hasattr(agent.adapter, 'claude_client'):
        return 'sdk'
    
    # Check for LLM attribute (legacy indicator)
    if hasattr(agent, 'llm'):
        return 'legacy'
    
    # Default
    return 'legacy'
```

---

## 13. References

### Key Source Files Analyzed

1. `/openhands/controller/agent_controller.py` (1361 lines)
   - Main control loop, lifecycle, event handling, delegation

2. `/openhands/controller/state/state_tracker.py` (268 lines)
   - State persistence and history management

3. `/openhands/controller/orchestrator_adapter.py` (367 lines)
   - Existing SDK bridge (needs enhancement)

4. `/openhands/agenthub/agent_factory.py` (390 lines)
   - Agent creation and type selection

5. `/openhands/agenthub/codeact_agent/codeact_agent_sdk.py` (150+ lines)
   - Example SDK agent implementation

6. `/openhands/server/session/agent_session.py` (150+ lines)
   - API layer that creates controllers

### Important Concepts

- **Event-Driven Architecture:** State changes trigger events, events trigger steps
- **Agent Abstraction:** Agents are pluggable (SDK, legacy, future types)
- **State Persistence:** State survives session shutdown/restart
- **Delegation:** Agents can delegate to other agents (hierarchy)
- **Control Flags:** Iteration and budget limits enforced per-controller
- **Stuck Detection:** Loop detection prevents infinite repetition

---

## Conclusion

Phase 6 SDK Integration is achievable through **enhancing the OrchestratorAdapter** to provide a unified control plane for both SDK and legacy agents. This approach:

1. ✅ Maintains backward compatibility (no breaking changes)
2. ✅ Enables SDK agents without modifying AgentController
3. ✅ Provides clear migration path for users
4. ✅ Sets foundation for future agent types
5. ✅ Reduces technical debt vs. branching in AgentController

**Estimated Effort:** 5-6 weeks
**Risk Level:** Medium (mitigable with comprehensive testing)
**Value:** High (unifies agent landscape, enables new capabilities)

