package vaudeville

import org.apache.pekko.NotUsed
import org.apache.pekko.stream.scaladsl.Source

/** What a task is for. Routing reads this. */
enum Kind:
  case Explore, Summarize, Plan, Review, Implement, Test

final case class TaskSpec(id: String, kind: Kind, prompt: String, filesTouched: Int = 0)

final case class Usage(inputTokens: Long, outputTokens: Long):
  def total: Long = inputTokens + outputTokens

object Usage:
  val zero: Usage = Usage(0L, 0L)

enum Tier:
  case Cheap, Mid, Strong

/** The one result a parent gets for each task. */
enum Outcome:
  case Done(id: String, summary: String, artifact: Option[String])
  case Blocked(id: String, reason: String)
  case Failed(id: String, cause: String)
  case TimedOut(id: String, state: String)

  /** The task id. Each case has it as its first field. */
  def id: String

/** Events a runtime reports for one task. */
enum RuntimeEvent:
  case ToolStarted(name: String)
  case ToolFinished(name: String)
  /** Token use for one step. The worker takes it off its budget. */
  case StepUsage(usage: Usage)
  case Finished(summary: String, artifact: Option[String], usage: Usage)
  case Failed(cause: String)
  /** The provider refused the call because credit is gone (HTTP 402). */
  case BudgetExhausted
  /** End of stream. */
  case Completed

/** A runtime must not throw from `run`. It reports errors as events. */
trait AgentRuntime:
  def run(spec: TaskSpec, tier: Tier): Source[RuntimeEvent, NotUsed]
