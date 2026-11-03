package vaudeville

import scala.concurrent.duration.FiniteDuration

import org.apache.pekko.actor.typed.{ActorRef, Behavior, PostStop}
import org.apache.pekko.actor.typed.scaladsl.{ActorContext, Behaviors, TimerScheduler}
import org.apache.pekko.stream.{KillSwitches, Materializer, SystemMaterializer, UniqueKillSwitch}
import org.apache.pekko.stream.scaladsl.Keep
import org.apache.pekko.stream.typed.scaladsl.ActorSink

/** One actor owns one agent.
  *
  * States: idle -> think <-> awaitTool -> idle.
  * The worker, not the model, decides when a turn ends.
  * Each task gets exactly one `Outcome`.
  */
object Worker:

  sealed trait Command

  /** Start a task. A busy worker answers `Blocked(id, "worker busy")`. */
  final case class Task(spec: TaskSpec, tier: Tier, replyTo: ActorRef[Outcome]) extends Command

  /** Stop a running task. The task ends with `Failed(id, "cancelled")`. */
  final case class Cancel(taskId: String) extends Command

  private[vaudeville] sealed trait Internal extends Command
  private final case class FromRuntime(gen: Long, event: RuntimeEvent) extends Internal
  private final case class StreamEnded(gen: Long) extends Internal
  private final case class StreamFailed(gen: Long, cause: Throwable) extends Internal
  private final case class Stalled(gen: Long, phase: Phase) extends Internal

  /** Names used in `Outcome.TimedOut`. */
  enum Phase(val label: String):
    case Think     extends Phase("think")
    case AwaitTool extends Phase("tool")

  final case class Config(
      thinkStall: FiniteDuration,
      toolStall: FiniteDuration,
      /** Tokens this worker may use in its life. */
      tokenBudget: Long
  )

  private object StallTimer

  private final case class Run(
      gen: Long,
      spec: TaskSpec,
      replyTo: ActorRef[Outcome],
      kill: UniqueKillSwitch,
      budget: Long
  )

  val BudgetExhaustedCause = "budget exhausted"
  val StreamEndedCause     = "runtime ended without a result"

  def apply(runtime: AgentRuntime, config: Config): Behavior[Command] =
    Behaviors.setup { ctx =>
      Behaviors.withTimers { timers =>
        new Impl(runtime, config, ctx, timers).idle(gen = 0L, budget = config.tokenBudget)
      }
    }

  private final class Impl(
      runtime: AgentRuntime,
      config: Config,
      ctx: ActorContext[Command],
      timers: TimerScheduler[Command]
  ):
    private given Materializer = SystemMaterializer(ctx.system).materializer

    def idle(gen: Long, budget: Long): Behavior[Command] =
      Behaviors.receiveMessage {
        case t: Task if budget <= 0 =>
          t.replyTo ! Outcome.Failed(t.spec.id, BudgetExhaustedCause)
          Behaviors.same
        case t: Task =>
          start(gen + 1, t, budget)
        case _ =>
          // Cancel with no task, or a late event of an old run.
          Behaviors.same
      }

    private def start(gen: Long, t: Task, budget: Long): Behavior[Command] =
      // The source is built here. It runs on the stream dispatcher.
      val kill = runtime
        .run(t.spec, t.tier)
        .viaMat(KillSwitches.single)(Keep.right)
        .map(FromRuntime(gen, _))
        .to(ActorSink.actorRef[Command](ctx.self, StreamEnded(gen), StreamFailed(gen, _)))
        .run()
      enter(Run(gen, t.spec, t.replyTo, kill, budget), Phase.Think)

    private def enter(run: Run, phase: Phase): Behavior[Command] =
      val after = if phase == Phase.Think then config.thinkStall else config.toolStall
      timers.startSingleTimer(StallTimer, Stalled(run.gen, phase), after)
      active(run, phase)

    private def active(run: Run, phase: Phase): Behavior[Command] =
      Behaviors
        .receiveMessage[Command] {
          case t: Task =>
            t.replyTo ! Outcome.Blocked(t.spec.id, "worker busy")
            Behaviors.same
          case Cancel(taskId) if taskId == run.spec.id =>
            finish(run, Outcome.Failed(run.spec.id, "cancelled"))
          case Cancel(_) =>
            Behaviors.same
          case FromRuntime(g, ev) if g == run.gen =>
            onEvent(run, phase, ev)
          case StreamEnded(g) if g == run.gen =>
            finish(run, Outcome.Failed(run.spec.id, StreamEndedCause))
          case StreamFailed(g, e) if g == run.gen =>
            finish(run, Outcome.Failed(run.spec.id, describe(e)))
          case Stalled(g, p) if g == run.gen =>
            finish(run, Outcome.TimedOut(run.spec.id, p.label))
          case _ =>
            // An event of an old run. Ignore it.
            Behaviors.same
        }
        .receiveSignal { case (_, PostStop) =>
          run.kill.shutdown()
          Behaviors.same
        }

    private def onEvent(run: Run, phase: Phase, ev: RuntimeEvent): Behavior[Command] =
      ev match
        case RuntimeEvent.ToolStarted(_) =>
          enter(run, Phase.AwaitTool)
        case RuntimeEvent.ToolFinished(_) =>
          enter(run, Phase.Think)
        case RuntimeEvent.StepUsage(u) =>
          val left = run.budget - u.total
          if left <= 0 then finish(run, Outcome.Failed(run.spec.id, BudgetExhaustedCause), left)
          else active(run.copy(budget = left), phase)
        case RuntimeEvent.Finished(summary, artifact, u) =>
          finish(run, Outcome.Done(run.spec.id, summary, artifact), run.budget - u.total)
        case RuntimeEvent.Failed(cause) =>
          finish(run, Outcome.Failed(run.spec.id, cause))
        case RuntimeEvent.BudgetExhausted =>
          finish(run, Outcome.Failed(run.spec.id, BudgetExhaustedCause), budget = 0L)
        case RuntimeEvent.Completed =>
          finish(run, Outcome.Failed(run.spec.id, StreamEndedCause))

    /** The only exit from a run. Sends one outcome. */
    private def finish(run: Run, outcome: Outcome): Behavior[Command] =
      finish(run, outcome, run.budget)

    private def finish(run: Run, outcome: Outcome, budget: Long): Behavior[Command] =
      timers.cancel(StallTimer)
      run.kill.shutdown()
      run.replyTo ! outcome
      idle(run.gen, budget)

    private def describe(e: Throwable): String =
      Option(e.getMessage).filter(_.nonEmpty).getOrElse(e.getClass.getSimpleName)
