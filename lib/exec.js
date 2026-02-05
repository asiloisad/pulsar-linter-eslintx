const { Range } = require("atom");
const { resolveEslint, resetCache, log, getBundledEslint } = require("./resolve");

// Engine cache per project: Map<projectRoot, { engine, source }>
const engines = new Map();

// Projects with no ESLint config (tried both v8 and v9) - skip linting entirely
const noConfigProjects = new Set();

/**
 *  Generate a range for a lint message position.
 *  Uses endLine/endColumn from ESLint when available for precise highlighting.
 *  Falls back to highlighting to end of line if not provided.
 */
function generateRange(textEditor, line, column, endLine, endColumn) {
  const buffer = textEditor.getBuffer();
  const lineMax = buffer.getLineCount() - 1;
  const lineNumber = Math.max(0, Math.min(line, lineMax));
  const lineText = buffer.lineForRow(lineNumber) || "";
  let colStart = typeof column === "number" && column > -1 ? column : 0;

  if (colStart > lineText.length) {
    colStart = lineText.length;
  }

  if (typeof endLine === "number" && typeof endColumn === "number") {
    const endLineNumber = Math.max(0, Math.min(endLine, lineMax));
    return [[lineNumber, colStart], [endLineNumber, endColumn]];
  }

  return [[lineNumber, colStart], [lineNumber, lineText.length]];
}

/**
 * Get or create ESLint engine for a project
 * @returns {{ engine: ESLint, source: string } | null}
 */
function getEngine(projectRoot) {
  if (engines.has(projectRoot)) {
    return engines.get(projectRoot);
  }

  const resolved = resolveEslint(projectRoot);
  if (!resolved) return null;

  const engine = new resolved.ESLint({ cwd: projectRoot });
  const result = { engine, source: resolved.source };
  engines.set(projectRoot, result);
  return result;
}

/**
 * Try alternate bundled ESLint version
 */
function tryAlternateVersion(projectRoot, currentSource) {
  const altVersion = currentSource === "bundled-v8" ? "v9" : "v8";
  const resolved = getBundledEslint(altVersion);
  if (!resolved) return null;

  log(`Trying alternate bundled ESLint: ${resolved.source}`);
  const engine = new resolved.ESLint({ cwd: projectRoot });
  const result = { engine, source: resolved.source };
  engines.set(projectRoot, result);
  return result;
}

function resetEngine() {
  engines.clear();
  noConfigProjects.clear();
  resetCache();
}

/**
 * Check if error is "no config found"
 */
function isNoConfigError(error) {
  const msg = String(error.message || error);
  return (
    msg.includes("No ESLint configuration found") ||
    msg.includes("no-config-found") ||
    msg.includes("Could not find config file")
  );
}

/**
 *  Lint a single file using ESLint.
 *  @param {string} filepath - Path to the file being linted
 *  @param {string} filetext - Content of the file
 *  @param {string} projectRoot - Project root path for ESLint resolution
 */
function exec(filepath, filetext, projectRoot) {
  return new Promise((resolve) => {
    // Skip projects known to have no config
    if (noConfigProjects.has(projectRoot)) {
      resolve({ results: [{ messages: [] }] });
      return;
    }

    const engineInfo = getEngine(projectRoot);

    if (!engineInfo) {
      // No ESLint available - silent
      resolve({ results: [{ messages: [] }] });
      return;
    }

    engineInfo.engine
      .lintText(filetext, { filePath: filepath })
      .then((results) => resolve({ results }))
      .catch((error) => {
        if (isNoConfigError(error)) {
          // If using bundled ESLint, try the other version
          if (engineInfo.source.startsWith("bundled-")) {
            const altInfo = tryAlternateVersion(projectRoot, engineInfo.source);
            if (altInfo) {
              altInfo.engine
                .lintText(filetext, { filePath: filepath })
                .then((results) => resolve({ results }))
                .catch((altError) => {
                  if (isNoConfigError(altError)) {
                    noConfigProjects.add(projectRoot);
                    log("No ESLint config found (tried both v8 and v9), skipping project");
                  } else {
                    log("ESLint error:", String(altError.message || altError));
                  }
                  resolve({ results: [{ messages: [] }] });
                });
              return;
            }
          }
          noConfigProjects.add(projectRoot);
          log("No ESLint config found, skipping project");
          resolve({ results: [{ messages: [] }] });
        } else {
          log("ESLint error:", String(error.message || error));
          resolve({
            results: [
              { messages: [{ line: 1, column: 1, message: String(error.message || error), ruleId: "error", severity: 2 }] },
            ],
          });
        }
      });
  });
}

/**
 *  Handle the report returned by a linter run.
 */
function handle(texteditor, report) {
  if (!report || !report.results || !report.results.length) {
    return [];
  }

  return report.results[0].messages.map(
    ({ column = 1, endColumn, endLine, line, message, ruleId, severity, fix }) => {
      const fileBuffer = texteditor.getBuffer();
      const lineLength = fileBuffer.lineLengthForRow(line - 1);
      const colStart = column - 1 > lineLength ? lineLength + 1 : column;
      const position = generateRange(
        texteditor,
        line - 1,
        colStart - 1,
        endLine != null ? endLine - 1 : undefined,
        endColumn != null ? endColumn - 1 : undefined
      );
      const file = texteditor.getPath();

      return {
        severity: severity === 1 ? "warning" : "error",
        excerpt: `${ruleId || "fatal"}: ${message}`,
        solutions: fix
          ? [
              {
                position: new Range(
                  fileBuffer.positionForCharacterIndex(fix.range[0]),
                  fileBuffer.positionForCharacterIndex(fix.range[1])
                ),
                replaceWith: fix.text,
              },
            ]
          : null,
        location: { file, position },
      };
    }
  );
}

module.exports = { exec, handle, resetEngine, getEngine };
