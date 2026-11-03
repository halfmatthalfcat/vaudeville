ThisBuild / scalaVersion := "3.9.0"
ThisBuild / organization := "vaudeville"
ThisBuild / version      := "0.1.0-SNAPSHOT"

val pekkoVersion     = "1.7.1"
val sttpAiVersion    = "0.12.0"
val scalaTestVersion = "3.2.19"

lazy val root = (project in file("."))
  .settings(
    name := "vaudeville",
    scalacOptions ++= Seq(
      "-deprecation",
      "-feature",
      "-unchecked",
      "-Wunused:all",
      "-Wvalue-discard",
      "-Werror"
    ),
    libraryDependencies ++= Seq(
      "org.apache.pekko"           %% "pekko-actor-typed"         % pekkoVersion,
      "org.apache.pekko"           %% "pekko-stream-typed"        % pekkoVersion,
      "com.softwaremill.sttp.ai"   %% "core"                      % sttpAiVersion,
      "org.apache.pekko"           %% "pekko-actor-testkit-typed" % pekkoVersion     % Test,
      "org.scalatest"              %% "scalatest"                 % scalaTestVersion % Test
    ),
    Test / fork := false,
    Test / parallelExecution := false
  )
