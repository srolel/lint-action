const { run, log } = require("../utils/action");
const commandExists = require("../utils/command-exists");
const { initLintResult } = require("../utils/lint-result");

const PARSE_REGEX = /^(.+?):([0-9]+):(.+?) (.+)$/gm;

// Mapping of Arcanist lint severities to severities used for GitHub commit annotations
const severityMap = {
	error: "error",
	warning: "warning",
	autofix: "warning",
	advice: "warning",
};

/**
 * https://eslint.org
 */
class ArcLint {
	static get name() {
		return "ArcLint";
	}

	/**
	 * Verifies that all required programs are installed. Throws an error if programs are missing
	 * @param {string} dir - Directory to run the linting program in
	 * @param {string} prefix - Prefix to the lint command
	 */
	static async verifySetup(dir, prefix = "") {
		// Verify that arc is installed
		if (!(await commandExists("arc"))) {
			throw new Error("Arcanist is not installed");
		}
	}

	/**
	 * Runs the linting program and returns the command output
	 * @param {string} dir - Directory to run the linter in
	 * @param {string[]} extensions - File extensions which should be linted
	 * @param {string} args - Additional arguments to pass to the linter
	 * @param {boolean} fix - Whether the linter should attempt to fix code style issues automatically
	 * @param {string} prefix - Prefix to the lint command
	 * @returns {{status: number, stdout: string, stderr: string}} - Output of the lint command
	 */
	static lint(dir, extensions, args = "", fix = false, prefix = "") {
		if (fix) {
			log(`${this.name} does not support auto-fixing`, "warning");
		}

		if (extensions.length > 0) {
			throw new Error(
				`${this.name} error: File extensions are not configurable. They should be configured in .arclint`,
			);
		}

		// --output compiler: outputs messages in a convenient format
		return run(`${prefix} arc lint ${fix ? "--amend-autofixes" : ""} --output compiler ${args}`, {
			dir,
			ignoreErrors: true,
		});
	}

	static getSeverity(outputSeverity) {
		return severityMap[outputSeverity.replace(/[^\w]/g, "").toLowerCase()] || "error";
	}

	/**
	 * Parses the output of the lint command. Determines the success of the lint process and the
	 * severity of the identified code style violations
	 * @param {string} dir - Directory in which the linter has been run
	 * @param {{status: number, stdout: string, stderr: string}} output - Output of the lint command
	 * @returns {{isSuccess: boolean, warning: [], error: []}} - Parsed lint result
	 */
	static parseOutput(dir, output) {
		const lintResult = initLintResult();
		lintResult.isSuccess = output.status === 0;

		const matches = output.stdout.matchAll(PARSE_REGEX);
		for (const match of matches) {
			try {
				const [_, path, line, severity, message] = match;
				const lineNr = parseInt(line, 10);
				lintResult[this.getSeverity(severity)].push({
					path,
					firstLine: lineNr || 1,
					lastLine: lineNr || 1,
					message,
				});
			} catch (e) {
				console.error(`${this.name} could not parse linter message ${match[0]}: ${e.message}`);
			}
		}

		return lintResult;
	}
}

module.exports = ArcLint;
