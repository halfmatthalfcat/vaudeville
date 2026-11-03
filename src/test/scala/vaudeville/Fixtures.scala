package vaudeville

import scala.concurrent.duration.*

object Fixtures:
  def task(id: String, kind: Kind = Kind.Implement, files: Int = 1): TaskSpec =
    TaskSpec(id, kind, s"prompt for $id", files)

  val workerConfig: Worker.Config =
    Worker.Config(thinkStall = 150.millis, toolStall = 150.millis, tokenBudget = 10_000L)

  def supervisorConfig(
      poolSize: Int = 1,
      maxQueue: Int = 2,
      deadline: FiniteDuration = 5.seconds,
      worker: Worker.Config = workerConfig
  ): Supervisor.Config = Supervisor.Config(poolSize, maxQueue, deadline, worker)
