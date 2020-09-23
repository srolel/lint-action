const Arclint = require("../../../src/linters/arclint");

const testName = "arclint";
const linter = Arclint;
const extensions = [];
const args = "**/*.*";

// Linting without auto-fixing
function getLintParams(dir) {
	return {
		// Expected output of the linting function
		cmdOutput: {
			status: 2,
			stdout: `src/Foo.scala:0:Error (scalastyle) File must end with newline
src/Foo.scala:1:Error (scalastyle) Header does not match expected text
src/Foo.scala:1:Error (scalastyle) Redundant braces after class definition
src/Foo.scala:2:Warning (scalastyle) No double blank lines
src/bar.js:1:Warning (prefer-const) 'str' is never reassigned. Use 'const' instead.\r
See documentation at https://www.eslint.org/docs/rules/prefer-const
src/bar.js:5:Warning (no-warning-comments) Unexpected 'todo' comment.\r
See documentation at https://www.eslint.org/docs/rules/no-warning-comments`,
		},
		// Expected output of the parsing function
		lintResult: {
			isSuccess: false,
			warning: [
				{
					path: "src/Foo.scala",
					firstLine: 2,
					lastLine: 2,
					message: "(scalastyle) No double blank lines",
				},
				{
					path: "src/bar.js",
					firstLine: 1,
					lastLine: 1,
					message: "(prefer-const) 'str' is never reassigned. Use 'const' instead.",
				},
				{
					path: "src/bar.js",
					firstLine: 5,
					lastLine: 5,
					message: "(no-warning-comments) Unexpected 'todo' comment.",
				},
			],
			error: [
				{
					path: "src/Foo.scala",
					firstLine: 1,
					lastLine: 1,
					message: "(scalastyle) File must end with newline",
				},
				{
					path: "src/Foo.scala",
					firstLine: 1,
					lastLine: 1,
					message: "(scalastyle) Header does not match expected text",
				},
				{
					path: "src/Foo.scala",
					firstLine: 1,
					lastLine: 1,
					message: "(scalastyle) Redundant braces after class definition",
				},
			],
		},
	};
}

const getFixParams = getLintParams; // Does not support auto-fixing -> option has no effect

module.exports = [testName, linter, "", extensions, getLintParams, getFixParams, args];
