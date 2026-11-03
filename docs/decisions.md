# Decisions that change the protocol

Short records. Newest at the bottom.

## D1. Turn end belongs to the Worker
The Worker, not the model, decides when a task ends. Every exit path sends one `Outcome`:
`Done`, `Blocked`, `Failed`, `TimedOut`. A `finish` helper is the only exit from a run.
Late events of an old run are dropped. Each run has a generation number.

## D2. Extra `RuntimeEvent` cases
Added to the starting-point enum:
- `ToolFinished(name)`: needed to leave `awaitTool`.
- `StepUsage(usage)`: the Worker takes tokens off its budget on each step.
- `BudgetExhausted`: a runtime reports HTTP 402 as this event. The Worker maps it to
  `Failed(id, "budget exhausted")`. No string matching between layers.
- `Finished` has `artifact: Option[String]`. The parent gets summary plus reference.

## D3. Stall names
`TimedOut(id, "think")` and `TimedOut(id, "tool")` come from the Worker stall timer.
`TimedOut(id, "deadline")` and `TimedOut(id, "queue")` come from the Supervisor.

## D4. Busy rule
A Worker that is busy answers a new `Task` with `Blocked(id, "worker busy")`.
It never queues. The Supervisor owns the queue: bounded (`maxQueue`).
A full queue gives `Blocked(id, "queue full")`. A repeated id gives `Failed(id, "duplicate task id")`.

## D5. Crash
A runtime must not throw from `run`. A throw crashes the Worker (default stop).
The Supervisor death-watches (`watchWith`), answers `Failed(id, "worker crashed")`
and starts a new Worker.

## D6. Deadline
The Supervisor deadline counts from `Submit`. On expiry it answers `TimedOut` once,
then sends `Worker.Cancel`. The late `Failed("cancelled")` of the Worker is dropped.

## D7. Token budget
Budget is per Worker life, in actor state. When it is spent, new tasks get
`Failed(id, "budget exhausted")`.
