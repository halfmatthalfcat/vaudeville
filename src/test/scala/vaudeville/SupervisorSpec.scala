package vaudeville

import scala.concurrent.duration.*

import org.apache.pekko.actor.testkit.typed.scaladsl.{ActorTestKit, TestProbe}
import org.apache.pekko.actor.typed.ActorRef
import org.scalatest.BeforeAndAfterAll
import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec

import Fixtures.*
import FakeRuntime.finished

class SupervisorSpec extends AnyWordSpec with Matchers with BeforeAndAfterAll:
  private val kit = ActorTestKit("supervisor-spec")
  override def afterAll(): Unit = kit.shutdownTestKit()

  private val quiet = 400.millis

  private def sup(rt: AgentRuntime, cfg: Supervisor.Config = supervisorConfig()) =
    kit.spawn(Supervisor(cfg, rt))

  private def submit(s: ActorRef[Supervisor.Command], t: TaskSpec, p: TestProbe[Outcome]): Unit =
    s ! Supervisor.Submit(t, p.ref)

  "A supervisor" should {
    "give the parent exactly one Done when the child finishes" in {
      val p = kit.createTestProbe[Outcome]()
      val s = sup(FakeRuntime.always(Step.emit(finished("fine")), Step.emit(RuntimeEvent.Completed)))
      submit(s, task("t1"), p)
      p.expectMessage(Outcome.Done("t1", "fine", Some("artifact://1")))
      p.expectNoMessage(quiet)
    }

    "give TimedOut(think) when the model call never returns" in {
      val p = kit.createTestProbe[Outcome]()
      val s = sup(FakeRuntime.always(Step.Hang))
      submit(s, task("t1"), p)
      p.expectMessage(Outcome.TimedOut("t1", "think"))
      p.expectNoMessage(quiet)
    }

    "give TimedOut(tool) when a tool call never returns" in {
      val p = kit.createTestProbe[Outcome]()
      val s = sup(FakeRuntime.always(Step.emit(RuntimeEvent.ToolStarted("bash")), Step.Hang))
      submit(s, task("t1"), p)
      p.expectMessage(Outcome.TimedOut("t1", "tool"))
      p.expectNoMessage(quiet)
    }

    "give Failed when the child actor crashes, and replace the worker" in {
      val p = kit.createTestProbe[Outcome]()
      val rt = new AgentRuntime:
        def run(spec: TaskSpec, tier: Tier) =
          if spec.id == "bad" then FakeRuntime.crashing.run(spec, tier)
          else FakeRuntime.always(Step.emit(finished())).run(spec, tier)
      val s = sup(rt)
      submit(s, task("bad"), p)
      p.expectMessage(Outcome.Failed("bad", "worker crashed"))
      submit(s, task("good"), p)
      p.expectMessageType[Outcome.Done].id shouldBe "good"
      p.expectNoMessage(quiet)
    }

    "give Failed(budget exhausted) when the key returns 402" in {
      val p = kit.createTestProbe[Outcome]()
      val s = sup(FakeRuntime.always(Step.emit(RuntimeEvent.BudgetExhausted)))
      submit(s, task("t1"), p)
      p.expectMessage(Outcome.Failed("t1", "budget exhausted"))
      p.expectNoMessage(quiet)
    }

    "route each task to a tier" in {
      val p  = kit.createTestProbe[Outcome]()
      val rt = FakeRuntime.always(Step.emit(finished()))
      val s  = sup(rt, supervisorConfig(poolSize = 1, maxQueue = 5))
      submit(s, task("a", Kind.Explore), p)
      submit(s, task("b", Kind.Plan), p)
      submit(s, task("c", Kind.Implement, files = 9), p)
      submit(s, task("d", Kind.Implement, files = 1), p)
      p.receiveMessages(4)
      rt.calls.map((t, tier) => t.id -> tier).toMap shouldBe
        Map("a" -> Tier.Cheap, "b" -> Tier.Strong, "c" -> Tier.Strong, "d" -> Tier.Mid)
    }

    "queue a task when all workers are busy, and run it later" in {
      val p = kit.createTestProbe[Outcome]()
      val s = sup(FakeRuntime.always(Step.Emit(finished(), 80.millis)))
      submit(s, task("t1"), p)
      submit(s, task("t2"), p)
      p.expectMessageType[Outcome.Done].id shouldBe "t1"
      p.expectMessageType[Outcome.Done].id shouldBe "t2"
      p.expectNoMessage(quiet)
    }

    "reject a task with Blocked when the queue is full" in {
      val p = kit.createTestProbe[Outcome]()
      val s = sup(FakeRuntime.always(Step.Emit(finished(), 80.millis)), supervisorConfig(maxQueue = 1))
      submit(s, task("t1"), p)
      submit(s, task("t2"), p)
      submit(s, task("t3"), p)
      p.expectMessage(Outcome.Blocked("t3", "queue full"))
      p.expectMessageType[Outcome.Done].id shouldBe "t1"
      p.expectMessageType[Outcome.Done].id shouldBe "t2"
      p.expectNoMessage(quiet)
    }

    "reject a duplicate task id" in {
      val p = kit.createTestProbe[Outcome]()
      val s = sup(FakeRuntime.always(Step.Emit(finished(), 80.millis)))
      submit(s, task("t1"), p)
      submit(s, task("t1"), p)
      p.expectMessage(Outcome.Failed("t1", "duplicate task id"))
      p.expectMessageType[Outcome.Done].id shouldBe "t1"
      p.expectNoMessage(quiet)
    }

    "give TimedOut(deadline) at the deadline, cancel the worker and reuse it" in {
      val p   = kit.createTestProbe[Outcome]()
      val cfg = supervisorConfig(
        deadline = 200.millis,
        worker = workerConfig.copy(thinkStall = 10.seconds, toolStall = 10.seconds)
      )
      val rt = FakeRuntime(spec => if spec.id == "slow" then Seq(Step.Hang) else Seq(Step.emit(finished())))
      val s  = sup(rt, cfg)
      submit(s, task("slow"), p)
      p.expectMessage(Outcome.TimedOut("slow", "deadline"))
      submit(s, task("next"), p)
      p.expectMessageType[Outcome.Done].id shouldBe "next"
      p.expectNoMessage(quiet)
    }

    "give TimedOut(queue) when a queued task waits too long" in {
      val p   = kit.createTestProbe[Outcome]()
      val cfg = supervisorConfig(deadline = 200.millis, worker = workerConfig.copy(thinkStall = 10.seconds))
      val s   = sup(FakeRuntime.always(Step.Hang), cfg)
      submit(s, task("t1"), p)
      submit(s, task("t2"), p)
      val got = Set(p.expectMessageType[Outcome], p.expectMessageType[Outcome])
      got shouldBe Set(Outcome.TimedOut("t1", "deadline"), Outcome.TimedOut("t2", "queue"))
      p.expectNoMessage(quiet)
    }

    "answer each of many tasks exactly once on a pool" in {
      val p   = kit.createTestProbe[Outcome]()
      val cfg = supervisorConfig(poolSize = 4, maxQueue = 100)
      val s   = sup(FakeRuntime.always(Step.Emit(finished(), 5.millis)), cfg)
      val ids = (1 to 60).map(i => s"t$i")
      ids.foreach(i => submit(s, task(i), p))
      val got = p.receiveMessages(60, 10.seconds)
      got.map(_.id).toSet shouldBe ids.toSet
      p.expectNoMessage(quiet)
    }
  }
