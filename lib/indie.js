let ESLint;
function getESLint() {
  if (!ESLint) {
    ESLint = require("eslint").ESLint;
  }
  return ESLint;
}

/**
 * Project-wide ESLint linter using the indie linter API.
 * Scans all project files from disk via ESLint's lintFiles() and reports
 * results through the linter-bundle IndieDelegate.
 */
class ProjectLinter {
  constructor() {
    this.indieDelegate = null;
    this.engine = null;
    this.scanning = false;
  }

  /**
   * Store the IndieDelegate obtained from linter-bundle.
   * @param {IndieDelegate} delegate
   */
  register(delegate) {
    this.indieDelegate = delegate;
  }

  /**
   * Run the project-wide ESLint scan.
   * Scans all files; linter-bundle handles dedup with file-scoped linter via joinWith.
   */
  async runScan() {
    if (!this.indieDelegate) return;
    if (this.scanning) return;

    this.scanning = true;

    const projectPaths = atom.project.getPaths();
    if (!projectPaths.length) {
      this.scanning = false;
      return;
    }

    const allMessages = [];

    try {
      this.engine = new (getESLint())({
        errorOnUnmatchedPattern: false,
      });

      for (const projectPath of projectPaths) {
        let results;
        try {
          results = await this.engine.lintFiles(projectPath);
        } catch (error) {
          const msg = String(error.message || error);
          if (
            msg.includes("No ESLint configuration found") ||
            msg.includes("no-config-found")
          ) {
            continue;
          }
          console.error("[linter-eslint-8] Project scan error:", error);
          continue;
        }

        for (const result of results) {
          if (!result.messages || !result.messages.length) continue;

          for (const m of result.messages) {
            allMessages.push(this.convertMessage(result.filePath, m));
          }
        }
      }

      this.indieDelegate.setAllMessages(allMessages, {
        showProjectView: true,
      });
    } catch (error) {
      console.error("[linter-eslint-8] Project scan failed:", error);
    } finally {
      this.scanning = false;
    }
  }

  /**
   * Convert an ESLint LintMessage to linter message format.
   * Maps 1-based ESLint coordinates to 0-based position arrays.
   * @param {string} filePath
   * @param {Object} msg - ESLint LintMessage
   * @returns {Object} Linter message
   */
  convertMessage(filePath, msg) {
    const {
      column = 1,
      endColumn,
      endLine,
      line,
      message,
      ruleId,
      severity,
    } = msg;

    const startRow = Math.max(0, (line || 1) - 1);
    const startCol = Math.max(0, (column || 1) - 1);

    let endRow, endCol;
    if (typeof endLine === "number" && typeof endColumn === "number") {
      endRow = Math.max(0, endLine - 1);
      endCol = Math.max(0, endColumn - 1);
    } else {
      endRow = startRow;
      endCol = startCol;
    }

    return {
      severity: severity === 1 ? "warning" : "error",
      excerpt: `${ruleId || "fatal"}: ${message}`,
      location: {
        file: filePath,
        position: [
          [startRow, startCol],
          [endRow, endCol],
        ],
      },
    };
  }

  /**
   * Reset the ESLint engine so it is re-created on next scan.
   */
  resetEngine() {
    this.engine = null;
  }

  /**
   * Dispose all resources.
   */
  dispose() {
    this.engine = null;
    this.indieDelegate = null;
  }
}

module.exports = new ProjectLinter();
