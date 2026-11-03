package vaudeville

import scala.concurrent.duration.FiniteDuration

import org.apache.pekko.actor.typed.{ActorRef, Behavior, PostStop}
import org.apache.pekko.actor.typed.scaladsl.{ActorContext, Behaviors, TimerScheduler}

/** The parent actor. It routes tasks, tracks deadlines and watches workers.
  *
  * Rule: a submitter gets exactly one `Outcome` per accepted task id.
  * Rule: a task goes to an idle worker. If none is idle, it waits in a bounded queue.
  * A full queue gives `Blocked(id, "queue full")`.
  */
object Supervisor:

  sealed trait Command

  final case class Submit(spec: TaskSpec, replyTo: ActorRef[Outcome]) extends Command

  private[vaudeville] sealed trait Internal extends Command
  private final case class WorkerOutcome(outcome: Outcome) extends Internal
  private final case class WorkerDied(workerId: String) extends Internal
  private final case class DeadlineExpired(taskId: String) extends Internal

  final case class Config(
      poolSize: Int,
      maxQueue: Int,
      /** Time from `Submit` to outcome. It includes time in the queue. */
      taskDeadline: FiniteDuration,
      worker: Worker.Config
  ):
    require(poolSize > 0, "poolSize must be positive")
    require(maxQueue >= 0, "maxQueue must not be negative")

  private final case class Pending(spec: TaskSpec, replyTo: ActorRef[Outcome])

  private final case class State(
      workers: Map[String, ActorRef[Worker.Command]],
      running: Map[String, String],   // workerId -> taskId
      pending: Map[String, Pending],  // taskId -> task not answered yet
      queue: Vector[String],          // taskIds that wait for a worker
      workerCount: Int
  ):
    def idleWorker: Option[String] = workers.keys.find(w => !running.contains(w))
    def workerOf(taskId: String): Option[String] =
      running.collectFirst { case (w, t) if t == taskId => w }

  def apply(
      config: Config,
      runtime: AgentRuntime,
      route: TaskSpec => Tier = Routing.route
  ): Behavior[Command] =
    Behaviors.setup { ctx =>
      Behaviors.withTimers { timers =>
        val adapter = ctx.messageAdapter[Outcome](WorkerOutcome(_))
        new Impl(config, runtime, route, ctx, timers, adapter).init()
      }
    }

  private final class Impl(
      config: Config,
      runtime: AgentRuntime,
      route: TaskSpec => Tier,
      ctx: ActorContext[Command],
      timers: TimerScheduler[Command],
      adapter: ActorRef[Outcome]
  ):

    def init(): Behavior[Command] =
      val empty = State(Map.empty, Map.empty, Map.empty, Vector.empty, 0)
      active(0.until(config.poolSize).foldLeft(empty)((s, _) => spawnWorker(s)))

    private def active(state: State): Behavior[Command] =
      Behaviors
        .receiveMessage[Command] {
          case Submit(spec, replyTo)   => active(submit(state, Pending(spec, replyTo)))
          case WorkerOutcome(outcome)  => active(onWorkerOutcome(state, outcome))
          case WorkerDied(workerId)    => active(onWorkerDied(state, workerId))
          case DeadlineExpired(taskId) => active(onDeadline(state, taskId))
        }
        .receiveSignal { case (_, PostStop) =>
          state.pending.values.foreach(p => p.replyTo ! Outcome.Failed(p.spec.id, "supervisor stopped"))
          Behaviors.same
        }

    private def spawnWorker(state: State): State =
      val workerId = s"worker-${state.workerCount}"
      val ref      = ctx.spawn(Worker(runtime, config.worker), workerId)
      ctx.watchWith(ref, WorkerDied(workerId))
      state.copy(workers = state.workers.updated(workerId, ref), workerCount = state.workerCount + 1)

    private def submit(state: State, p: Pending): State =
      val id = p.spec.id
      if state.pending.contains(id) then
        p.replyTo ! Outcome.Failed(id, "duplicate task id")
        state
      else
        state.idleWorker match
          case Some(w) if state.queue.isEmpty =>
            dispatch(accept(state, p), w, id)
          case _ if state.queue.size >= config.maxQueue =>
            p.replyTo ! Outcome.Blocked(id, "queue full")
            state
          case _ =>
            val s = accept(state, p)
            s.copy(queue = s.queue :+ id)

    private def accept(state: State, p: Pending): State =
      timers.startSingleTimer(p.spec.id, DeadlineExpired(p.spec.id), config.taskDeadline)
      state.copy(pending = state.pending.updated(p.spec.id, p))

    private def dispatch(state: State, workerId: String, taskId: String): State =
      val p = state.pending(taskId)
      state.workers(workerId) ! Worker.Task(p.spec, route(p.spec), adapter)
      state.copy(running = state.running.updated(workerId, taskId))

    /** Answer once and forget the task. A later outcome for the same id is dropped. */
    private def resolve(state: State, outcome: Outcome): State =
      state.pending.get(outcome.id) match
        case Some(p) =>
          timers.cancel(outcome.id)
          p.replyTo ! outcome
          state.copy(pending = state.pending - outcome.id)
        case None => state

    private def onWorkerOutcome(state: State, outcome: Outcome): State =
      state.workerOf(outcome.id) match
        case Some(w) =>
          val s = resolve(state, outcome)
          drain(s.copy(running = s.running - w))
        case None =>
          resolve(state, outcome)

    private def onWorkerDied(state: State, workerId: String): State =
      val orphan = state.running.get(workerId)
      val s1 = orphan.fold(state)(t => resolve(state, Outcome.Failed(t, "worker crashed")))
      val s2 = s1.copy(workers = s1.workers - workerId, running = s1.running - workerId)
      drain(spawnWorker(s2))

    private def onDeadline(state: State, taskId: String): State =
      if !state.pending.contains(taskId) then state
      else if state.queue.contains(taskId) then
        val s = resolve(state, Outcome.TimedOut(taskId, "queue"))
        s.copy(queue = s.queue.filterNot(_ == taskId))
      else
        // The worker stays busy until it answers the cancel.
        state.workerOf(taskId).foreach(w => state.workers(w) ! Worker.Cancel(taskId))
        resolve(state, Outcome.TimedOut(taskId, "deadline"))

    private def drain(state: State): State =
      (state.queue.headOption, state.idleWorker) match
        case (Some(taskId), Some(w)) =>
          drain(dispatch(state.copy(queue = state.queue.tail), w, taskId))
        case _ => state
