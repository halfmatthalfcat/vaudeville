package vaudeville

object Routing:
  /** Pure and deterministic. */
  def route(t: TaskSpec): Tier = t.kind match
    case Kind.Explore | Kind.Summarize => Tier.Cheap
    case Kind.Plan | Kind.Review       => Tier.Strong
    case _ if t.filesTouched > 5       => Tier.Strong
    case _                             => Tier.Mid
