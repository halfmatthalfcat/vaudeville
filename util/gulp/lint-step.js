/**
 * Contains all the project gulp linting tasks
 */

const path =        require("path");
const tslint =      require("tslint");
const gulpTsLint =  require("gulp-tslint");

/**
 * Setup the lint task and subtasks using our gulp instance
 */
module.exports = (gulp, rootDir) => {

  gulp.task("lint", [
    "ts-lint"
  ]);

  gulp.task("ts-lint", () => {

    return gulp.src(path.join(rootDir, "/src/**/*.ts"))
      .pipe(gulpTsLint({
        configuration: path.join(rootDir, "/tslint.json"),
        formatter: "prose",
        tslint: tslint,
        program: tslint.Linter.createProgram(
          path.join(rootDir, "/tsconfig.json")
        )
      }))
      .pipe(gulpTsLint.report({
        emitError: true,
        summarizeFailureOutput: true
      }));

  });

};
