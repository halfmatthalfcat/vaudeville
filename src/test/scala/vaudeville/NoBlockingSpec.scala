package vaudeville

import java.nio.file.{Files, Path, Paths}

import scala.concurrent.duration.*
import scala.jdk.CollectionConverters.*

import com.typesafe.config.ConfigFactory
import org.apache.pekko.actor.testkit.typed.scaladsl.ActorTestKit
import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec

import Fixtures.*
import FakeRuntime.finished

/** Two checks that no code blocks the actor dispatcher. */
class NoBlockingSpec extends AnyWordSpec with Matchers:

  "main sources" should {
    "not use blocking calls" in {
      val banned = List(
        "Await\\.", "Thread\\.sleep", "\\.join\\(\\)", "blocking\\s*\\{",
        "StdIn", "\\.unsafeRun", "\\.get\\(\\d+,\\s*TimeUnit", "\\.wait\\("
      ).map(_.r)
      val root = Paths.get("src/main/scala")
      val files: List[Path] =
        Files.walk(root).iterator().asScala.filter(_.toString.endsWith(".scala")).toList
      files should not be empty
      val hits = for
        f    <- files
        line <- Files.readAllLines(f).asScala.toList
        if !line.trim.startsWith("//") && banned.exists(_.findFirstIn(line).isDefined)
      yield s"$f: $line"
      hits shouldBe empty
    }
  }

  "the actor system" should {
    "finish all tasks when the dispatcher has one thread" in {
      // One thread runs actors and streams. A blocking call would stall it.
      val conf = ConfigFactory.parseString(
        """pekko.actor.default-dispatcher.fork-join-executor {
          |  parallelism-min = 1
          |  parallelism-max = 1
          |  parallelism-factor = 1
          |}""".stripMargin
      ).withFallback(ConfigFactory.load())
      val kit = ActorTestKit("single-thread", conf)
      try
        val p   = kit.createTestProbe[Outcome]()
        val cfg = supervisorConfig(poolSize = 8, maxQueue = 100)
        val s   = kit.spawn(Supervisor(cfg, FakeRuntime.always(
          Step.emit(RuntimeEvent.ToolStarted("t")),
          Step.Emit(RuntimeEvent.ToolFinished("t"), 5.millis),
          Step.Emit(finished(), 5.millis)
        )))
        (1 to 40).foreach(i => s ! Supervisor.Submit(task(s"t$i"), p.ref))
        p.receiveMessages(40, 10.seconds).map(_.id).toSet should have size 40
      finally kit.shutdownTestKit()
    }
  }
