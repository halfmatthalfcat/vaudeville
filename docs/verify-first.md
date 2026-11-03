# Verify-first findings

Date: 2026-11-03. Checked from a sandbox. Status per item is marked
**verified**, **partly verified** or **not verified**.

## 1. sttp-ai versions (verified)

Source: Maven Central (`repo.maven.apache.org`), group `com.softwaremill.sttp.ai`.

| Artifact | Latest | Note |
|---|---|---|
| `core_3` | 0.12.0 | Holds the agent loop and interceptors |
| `claude_3` | 0.12.0 | `ClaudeAgent`, `ClaudeAgentBackend` |
| `openai_3` | 0.12.0 | `OpenAIAgent`, `OpenAIAgentBackend`. Use for OpenRouter |
| `pekko_3` | 0.12.0 | Streaming adapters only (see below) |
| `agent-testkit_3` | 0.12.0 | `ScriptedAgent`, `ScriptedAgentBackend`, `ScriptedModel`, `AgentMatchers` |

- The old numbers (0.3.10, 0.5.6) are old releases. `agent-testkit` starts at 0.7.0. Pin **0.12.0** for all.
- There is **no** `agent` artifact. The agent code is in `core`.
- Found in `core` 0.12.0: `Agent`, `AgentBuilder`, `AgentConfig`, `AgentTool(s)`, `AgentInterceptor`,
  `interceptor.BudgetInterceptor`, `interceptor.LoggingInterceptor`, `Cost`, `ModelPrice`, `PriceTable`.
- The `pekko` module has `ClaudePekkoStreaming`, `OpenAIPekkoStreaming` (package object) and
  `GeminiPekkoStreaming`. It gives Pekko Streams for chat streaming. It is **not** an agent-loop integration.
  M1 must wrap the agent loop in a `Source` itself.
- `SttpAiSmokeSpec` checks that the main classes load.
- Not checked yet: exact `BudgetInterceptor` API and the per-iteration model choice hook. Read the sources jar at the start of M1.

## 2. OpenCode events (verified with a real server)

Setup: `opencode-ai` 1.19.5 from npm, `@opencode-ai/sdk` 1.19.5 for types.
No real provider key was available (and `openrouter.ai` is blocked here). So the **real OpenCode server**
ran against a **local mock** OpenAI-compatible provider (tool call, then final text; and a second mock that returns HTTP 402).
The event shapes are real. Model output is fake.

Fixtures (raw SSE, paths scrubbed):
- `src/test/resources/opencode/tool-then-text.sse`
- `src/test/resources/opencode/error-402.sse`

### Turn end
- `session.status` with `status.type = "idle"`, then `session.idle` (`properties.sessionID`). This is the end signal.
- Status values: `busy`, `idle`, `retry{attempt,message,next}`.
- `session.status busy` appears again between steps (before and after a tool). It is **not** a turn end.
- `session.idle` can fire **twice** for one prompt (seen in the 402 run). Runtime must dedupe by turn.
- Filter events by `sessionID`. `/event` is one stream for the whole server.

### Mapping to `RuntimeEvent`

| OpenCode event | RuntimeEvent |
|---|---|
| `message.part.updated`, `part.type="tool"`, `state.status="pending"/"running"` (first time per `callID`) | `ToolStarted(part.tool)` |
| same part, `state.status="completed"` or `"error"` | `ToolFinished(part.tool)` |
| `message.part.updated`, `part.type="step-finish"` (`tokens.input/output/reasoning/cache`, `cost`) | `StepUsage` |
| `session.error` with `error.name="APIError"`, `data.statusCode=402` | `BudgetExhausted` |
| other `session.error` | `Failed(error.data.message)` |
| `session.idle` with no earlier error | `Finished(text of last assistant message, usage)` |
| `session.idle` after an error | `Completed` (already failed) |

Tool part states seen: `pending`, `running` (several updates), `completed`. `error` exists in the types.
`message.updated` for the assistant message has `tokens`, `cost`, `finish`, `error`.

### Other notes
- `session.error` comes **before** `session.idle`. On 402: `error.data = {message, statusCode: 402, isRetryable: false, responseBody}`.
- The server sends events that are not in the 1.19.5 v1 type file: `message.part.delta`, `plugin.added`,
  `catalog.updated`, `reference.updated`, `integration.updated`. Parse with an open union and ignore unknown `type`.
- Each SSE line is `data: {json}` with an `id` field (`evt_...`).
- Endpoints (from the SDK): `POST /session`, `POST /session/{id}/prompt_async` (returns 204), `POST /session/{id}/message`,
  `POST /session/{id}/abort`, `GET /session/status`, `GET /event`, `GET /config`.
- No JVM SDK. Plan: hand-write a small sttp client for these 5 endpoints plus an SSE parser. Test it on the fixtures.
- Not verified: behaviour with a real provider, permission prompts (`permission.updated`) when a tool is not allowed,
  and abort flow. Set permissions to `allow` for the agent in config, or the turn will wait for approval.

## 3. OpenRouter key management (partly verified)

`openrouter.ai` is not reachable from this sandbox (policy block). The facts below come from web search
summaries of the official docs. **Re-check them before M3.**

- Keys can be created and changed through an API. This needs a **management key** (made in the dashboard).
  Management keys cannot call models.
- `POST https://openrouter.ai/api/v1/keys` takes: `name`, `limit` (USD cap), `limit_reset`
  (`daily`/`weekly`/`monthly`/null, resets at midnight UTC), optional `expires_at`, `include_byok_in_limit`.
- The plaintext key is returned **once**, in the create response. The response also has a `hash` and `limit_remaining`.
  Update and delete use the `hash`.
- So per-worker keys can be made in code. The manager must store the key in memory or in a secret store only.
- HTTP 402 on an exhausted limit: assumed from the brief and OpenRouter docs. **Not tested** against the real API.
- To allow openrouter.ai: add it to the network allowlist of this environment.

## 4. OpenCode per-agent config (verified, types + real server)

- `agent.<name>.model` is a string `"<providerID>/<modelID>"`. For OpenRouter: `openrouter/anthropic/claude-sonnet-4`
  style (provider id, then the OpenRouter model id). The format was confirmed with a custom provider (`mock/mock-1`).
  The `openrouter` built-in provider name was **not** run (no access).
- Agent keys: `model`, `temperature`, `top_p`, `prompt`, `tools`, `description`, `mode`
  (`subagent`/`primary`/`all`), `maxSteps`, `permission{edit,bash,webfetch,doom_loop,external_directory}`.
- Inline config: environment variable `OPENCODE_CONFIG_CONTENT` (JSON string) at start of `opencode serve`.
  This is what the SDK does. Verified: the server returned this config on `GET /config`.
- Custom provider works inline: `provider.<id> = {npm: "@ai-sdk/openai-compatible", options: {baseURL, apiKey}, models: {...}}`.
  OpenCode installs the npm adapter at run time, so the first start needs npm access.
- Credentials are per server (set in `provider.*.options.apiKey` or env). One server per worker/budget scope stays right.
- A prompt can pick agent and model: `POST /session/{id}/prompt_async` with `{agent, model:{providerID, modelID}, parts:[...]}`
  (verified in the 402 run).
- Start: `opencode serve --hostname=127.0.0.1 --port=N`. It prints `opencode server listening on http://...`
  on stdout. Use port 0 or a free port per worker and parse that line. Set `OPENCODE_SERVER_PASSWORD` for safety.
- Not measured: memory/process cost per server (do this in M2).

## 5. Scala version (verified)

`sttp-ai` 0.12.0 is compiled with Scala **3.9.0** (TASTy 28.9). A 3.3.x compiler cannot read it
("TASTy signature has wrong version"). The build uses Scala 3.9.0. Pekko 1.7.1 is built with 3.3.7 and stays readable.
