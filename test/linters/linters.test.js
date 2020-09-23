const { join } = require("path");

const { copy } = require("fs-extra");

const { normalizeDates, testProjectsDir, tmpDir } = require("../test-utils");
const arclintParams = require("./params/arclint");
const blackParams = require("./params/black");
const eslintParams = require("./params/eslint");
const eslintTypescriptParams = require("./params/eslint-typescript");
const flake8Params = require("./params/flake8");
const gofmtParams = require("./params/gofmt");
const golintParams = require("./params/golint");
const mypyParams = require("./params/mypy");
const phpCodeSnifferParams = require("./params/php-codesniffer");
const prettierParams = require("./params/prettier");
const ruboCopParams = require("./params/rubocop");
const stylelintParams = require("./params/stylelint");
const swiftFormatLockwood = require("./params/swift-format-lockwood");
const swiftFormatOfficial = require("./params/swift-format-official");
const swiftlintParams = require("./params/swiftlint");
const xoParams = require("./params/xo");

const linterParams = [
	// blackParams,
	// eslintParams,
	// eslintTypescriptParams,
	// flake8Params,
	// gofmtParams,
	// golintParams,
	// mypyParams,
	// prettierParams,
	// ruboCopParams,
	// stylelintParams,
	// xoParams,
	arclintParams,
];
// if (process.platform === "linux") {
// 	linterParams.push(swiftFormatOfficial);
// }
// if (process.platform === "darwin") {
// 	linterParams.push(swiftFormatLockwood, swiftlintParams);
// }

// Copy linter test projects into temporary directory
beforeAll(async () => {
	jest.setTimeout(60000);
	await copy(testProjectsDir, tmpDir);
});

// Test all linters
describe.each(linterParams)(
	"%s",
	(projectName, linter, commandPrefix, extensions, getLintParams, getFixParams) => {
		const projectTmpDir = join(tmpDir, projectName);

		beforeAll(async () => {
			await expect(linter.verifySetup(projectTmpDir, commandPrefix)).resolves.toEqual(undefined);
		});

		// Test lint and auto-fix modes
		describe.each([
			["lint", false],
			["auto-fix", true],
		])("%s", (lintMode, autoFix) => {
			const expected = autoFix ? getFixParams(projectTmpDir) : getLintParams(projectTmpDir);

			// Test `lint` function
			test(`${linter.name} returns expected ${lintMode} output`, () => {
				const cmdOutput = linter.lint(projectTmpDir, extensions, "", autoFix, commandPrefix);

				// Exit code
				expect(cmdOutput.status).toEqual(expected.cmdOutput.status);

				// stdout
				const stdout = normalizeDates(cmdOutput.stdout);
				if ("stdoutParts" in expected.cmdOutput) {
					expected.cmdOutput.stdoutParts.forEach((stdoutPart) =>
						expect(stdout).toEqual(expect.stringContaining(stdoutPart)),
					);
				} else if ("stdout" in expected.cmdOutput) {
					expect(stdout).toEqual(expected.cmdOutput.stdout);
				}

				// stderr
				const stderr = normalizeDates(cmdOutput.stderr);
				if ("stderrParts" in expected.cmdOutput) {
					expected.cmdOutput.stderrParts.forEach((stderrParts) =>
						expect(stderr).toEqual(expect.stringContaining(stderrParts)),
					);
				} else if ("stderr" in expected.cmdOutput) {
					expect(stderr).toEqual(expected.cmdOutput.stderr);
				}
			});

			// Test `parseOutput` function
			test(`${linter.name} parses ${lintMode} output correctly`, () => {
				const lintResult = linter.parseOutput(projectTmpDir, expected.cmdOutput);
				expect(lintResult).toEqual(expected.lintResult);
			});
		});
	},
);
