package vaudeville

import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec

import Fixtures.task

class RoutingSpec extends AnyWordSpec with Matchers:
  "route" should {
    "send explore and summarize to Cheap" in {
      Routing.route(task("a", Kind.Explore, files = 99)) shouldBe Tier.Cheap
      Routing.route(task("a", Kind.Summarize)) shouldBe Tier.Cheap
    }
    "send plan and review to Strong" in {
      Routing.route(task("a", Kind.Plan)) shouldBe Tier.Strong
      Routing.route(task("a", Kind.Review, files = 0)) shouldBe Tier.Strong
    }
    "send work on more than 5 files to Strong" in {
      Routing.route(task("a", Kind.Implement, files = 6)) shouldBe Tier.Strong
      Routing.route(task("a", Kind.Test, files = 6)) shouldBe Tier.Strong
    }
    "send other work to Mid" in {
      Routing.route(task("a", Kind.Implement, files = 5)) shouldBe Tier.Mid
    }
  }
