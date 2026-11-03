package vaudeville

import java.util.concurrent.ConcurrentLinkedQueue

import scala.concurrent.duration.*
import scala.jdk.CollectionConverters.*

import org.apache.pekko.NotUsed
import org.apache.pekko.stream.scaladsl.Source

/** One step of a scripted run. */
enum Step:
  case Emit(event: RuntimeEvent, after: FiniteDuration = Duration.Zero)
  /** The stream never emits and never ends. */
  case Hang
  case Boom(cause: Throwable)

object Step:
  def emit(e: RuntimeEvent): Step = Emit(e)

/** A runtime that plays a script per task. It records each call. */
final class FakeRuntime(script: TaskSpec => Seq[Step]) extends AgentRuntime:
  private val seen = new ConcurrentLinkedQueue[(TaskSpec, Tier)]()

  def calls: List[(TaskSpec, Tier)] = seen.asScala.toList

  def run(spec: TaskSpec, tier: Tier): Source[RuntimeEvent, NotUsed] =
    seen.add((spec, tier))
    Source(script(spec).toList).flatMapConcat {
      case Step.Emit(e, d) =>
        val one = Source.single[RuntimeEvent](e)
        if d == Duration.Zero then one else one.initialDelay(d)
      case Step.Hang       => Source.never[RuntimeEvent]
      case Step.Boom(e)    => Source.failed[RuntimeEvent](e)
    }

object FakeRuntime:
  val usage: Usage = Usage(10, 5)

  def finished(summary: String = "ok"): RuntimeEvent =
    RuntimeEvent.Finished(summary, Some("artifact://1"), usage)

  def always(steps: Step*): FakeRuntime = FakeRuntime(_ => steps)

  /** A runtime that breaks the "must not throw" rule. It crashes the worker. */
  def crashing: AgentRuntime = new AgentRuntime:
    def run(spec: TaskSpec, tier: Tier): Source[RuntimeEvent, NotUsed] =
      throw new IllegalStateException("boom")
