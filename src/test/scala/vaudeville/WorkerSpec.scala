package vaudeville

import scala.concurrent.duration.*

import org.apache.pekko.actor.testkit.typed.scaladsl.ActorTestKit
import org.scalatest.BeforeAndAfterAll
import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec

import Fixtures.*
import FakeRuntime.finished

class WorkerSpec extends AnyWordSpec with Matchers with BeforeAndAfterAll:
  private val kit = ActorTestKit("worker-spec")
  override def afterAll(): Unit = kit.shutdownTestKit()

  private val quiet = 400.millis

  private def worker(rt: AgentRuntime, cfg: Worker.Config = workerConfig) =
    kit.spawn(Worker(rt, cfg))

  "A worker" should {
    "send exactly one Done when the task finishes" in {
      val probe = kit.createTestProbe[Outcome]()
      val w = worker(FakeRuntime.always(
        Step.emit(RuntimeEvent.ToolStarted("bash")),
        Step.emit(RuntimeEvent.ToolFinished("bash")),
        Step.emit(finished("all good")),
        Step.emit(RuntimeEvent.Completed)
      ))
      w ! Worker.Task(task("t1"), Tier.Mid, probe.ref)
      probe.expectMessage(Outcome.Done("t1", "all good", Some("artifact://1")))
      probe.expectNoMessage(quiet)
    }

    "send one outcome even if the runtime emits more after Finished" in {
      val probe = kit.createTestProbe[Outcome]()
      val w = worker(FakeRuntime.always(
        Step.emit(finished()),
        Step.emit(finished("again")),
        Step.emit(RuntimeEvent.Failed("late")),
        Step.emit(RuntimeEvent.Completed)
      ))
      w ! Worker.Task(task("t1"), Tier.Mid, probe.ref)
      probe.expectMessageType[Outcome.Done].summary shouldBe "ok"
      probe.expectNoMessage(quiet)
    }

    "send TimedOut(think) when the model call never returns" in {
      val probe = kit.createTestProbe[Outcome]()
      val w = worker(FakeRuntime.always(Step.Hang))
      val start = System.nanoTime()
      w ! Worker.Task(task("t1"), Tier.Mid, probe.ref)
      probe.expectMessage(Outcome.TimedOut("t1", "think"))
      (System.nanoTime() - start).nanos should be >= workerConfig.thinkStall
      probe.expectNoMessage(quiet)
    }

    "send TimedOut(tool) when a tool call never returns" in {
      val probe = kit.createTestProbe[Outcome]()
      val w = worker(FakeRuntime.always(Step.emit(RuntimeEvent.ToolStarted("bash")), Step.Hang))
      w ! Worker.Task(task("t1"), Tier.Mid, probe.ref)
      probe.expectMessage(Outcome.TimedOut("t1", "tool"))
      probe.expectNoMessage(quiet)
    }

    "restart the stall timer when a tool ends" in {
      val probe = kit.createTestProbe[Outcome]()
      val cfg   = workerConfig.copy(thinkStall = 300.millis, toolStall = 300.millis)
      // Each step is below the stall time. The total is above it.
      val w = worker(
        FakeRuntime.always(
          Step.Emit(RuntimeEvent.ToolStarted("a"), 200.millis),
          Step.Emit(RuntimeEvent.ToolFinished("a"), 200.millis),
          Step.Emit(finished(), 80.millis)
        ),
        cfg
      )
      w ! Worker.Task(task("t1"), Tier.Mid, probe.ref)
      probe.expectMessageType[Outcome.Done]
    }

    "send Failed when the stream fails" in {
      val probe = kit.createTestProbe[Outcome]()
      val w = worker(FakeRuntime.always(Step.Boom(new RuntimeException("network down"))))
      w ! Worker.Task(task("t1"), Tier.Mid, probe.ref)
      probe.expectMessage(Outcome.Failed("t1", "network down"))
      probe.expectNoMessage(quiet)
    }

    "send Failed when the stream ends without a result" in {
      val probe = kit.createTestProbe[Outcome]()
      val w = worker(FakeRuntime.always(Step.emit(RuntimeEvent.Completed)))
      w ! Worker.Task(task("t1"), Tier.Mid, probe.ref)
      probe.expectMessage(Outcome.Failed("t1", Worker.StreamEndedCause))
      probe.expectNoMessage(quiet)
    }

    "send Failed(budget exhausted) when the runtime reports HTTP 402" in {
      val probe = kit.createTestProbe[Outcome]()
      val w = worker(FakeRuntime.always(Step.emit(RuntimeEvent.BudgetExhausted)))
      w ! Worker.Task(task("t1"), Tier.Mid, probe.ref)
      probe.expectMessage(Outcome.Failed("t1", "budget exhausted"))
      probe.expectNoMessage(quiet)
    }

    "end the task when step usage goes over the token budget" in {
      val probe = kit.createTestProbe[Outcome]()
      val cfg   = workerConfig.copy(tokenBudget = 100L)
      val w = worker(
        FakeRuntime.always(
          Step.emit(RuntimeEvent.StepUsage(Usage(30, 30))),
          Step.emit(RuntimeEvent.StepUsage(Usage(30, 30))),
          Step.emit(finished())
        ),
        cfg
      )
      w ! Worker.Task(task("t1"), Tier.Mid, probe.ref)
      probe.expectMessage(Outcome.Failed("t1", "budget exhausted"))
      probe.expectNoMessage(quiet)
    }

    "refuse new tasks after the budget is spent" in {
      val probe = kit.createTestProbe[Outcome]()
      val cfg   = workerConfig.copy(tokenBudget = 10L)
      val w     = worker(FakeRuntime.always(Step.emit(finished())), cfg) // usage is 15 tokens
      w ! Worker.Task(task("t1"), Tier.Mid, probe.ref)
      probe.expectMessageType[Outcome.Done]
      w ! Worker.Task(task("t2"), Tier.Mid, probe.ref)
      probe.expectMessage(Outcome.Failed("t2", "budget exhausted"))
    }

    "reject a second task while busy and still finish the first one" in {
      val probe = kit.createTestProbe[Outcome]()
      val w = worker(FakeRuntime.always(Step.Emit(finished(), 80.millis)))
      w ! Worker.Task(task("t1"), Tier.Mid, probe.ref)
      w ! Worker.Task(task("t2"), Tier.Mid, probe.ref)
      probe.expectMessage(Outcome.Blocked("t2", "worker busy"))
      probe.expectMessageType[Outcome.Done].id shouldBe "t1"
      probe.expectNoMessage(quiet)
    }

    "run a new task after the last one ends, and ignore events of the old run" in {
      val probe = kit.createTestProbe[Outcome]()
      val rt = FakeRuntime {
        case s if s.id == "t1" =>
          Seq(Step.emit(finished("one")), Step.Emit(RuntimeEvent.Failed("late"), 100.millis))
        case _ => Seq(Step.Emit(finished("two"), 80.millis))
      }
      val w = worker(rt)
      w ! Worker.Task(task("t1"), Tier.Mid, probe.ref)
      probe.expectMessageType[Outcome.Done].summary shouldBe "one"
      w ! Worker.Task(task("t2"), Tier.Mid, probe.ref)
      probe.expectMessageType[Outcome.Done].summary shouldBe "two"
      probe.expectNoMessage(quiet)
    }

    "cancel a running task with one Failed(cancelled)" in {
      val probe = kit.createTestProbe[Outcome]()
      val cfg   = workerConfig.copy(thinkStall = 5.seconds)
      val w     = worker(FakeRuntime.always(Step.Hang), cfg)
      w ! Worker.Task(task("t1"), Tier.Mid, probe.ref)
      w ! Worker.Cancel("t1")
      probe.expectMessage(Outcome.Failed("t1", "cancelled"))
      probe.expectNoMessage(quiet)
    }
  }
