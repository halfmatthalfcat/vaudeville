package vaudeville

import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec

/** The pinned sttp-ai version must have the classes we plan to use in M1. */
class SttpAiSmokeSpec extends AnyWordSpec with Matchers:
  "sttp-ai core" should {
    "have the agent loop and BudgetInterceptor" in {
      List(
        "sttp.ai.core.agent.Agent",
        "sttp.ai.core.agent.AgentInterceptor",
        "sttp.ai.core.agent.interceptor.BudgetInterceptor"
      ).foreach(n => Class.forName(n) should not be null)
    }
  }
