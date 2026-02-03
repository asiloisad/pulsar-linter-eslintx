/**
 *	exec.js: linter-eslint
 *
 *  @module linter-eslint/exec
 *
 */ /*
 *  © 2022, slashlib.org.
 *
 *  exec.js  is distributed WITHOUT ANY WARRANTY; without even the implied
 *  warranty of  MERCHANTABILITY  or  FITNESS  FOR A  PARTICULAR  PURPOSE.
 *
 */
"use strict";

/**
 *  Module table
 *  @ignore
 */
const _m = Object.seal(
  Object.freeze({
    atom: require("atom"),
    eslint: require("eslint"),
    config: require("./config"),
  })
);

/**
 *  Stringtable
 *  @ignore
 */
const _STRINGS = Object.seal(
  Object.freeze({
    ERROR: "error",
    EXEC: "exec",
    FATAL: "fatal",
    HANDLE: "handle",
    WARNING: "warning",
  })
);

/**
 *  Class Range
 *  @ignore
 */
const Range = _m.atom.Range;

/**
 *  Class Eslint
 *  @ignore
 */
const ESLint = _m.eslint.ESLint;


/**
 *  Generate a range for a lint message position.
 *  @param  {TextEditor}  textEditor
 *  @param  {number}      line    - 0-indexed line number
 *  @param  {number}      column  - 0-indexed column number (optional)
 *  @return {Array}       Range as [[lineStart, colStart], [lineEnd, colEnd]]
 */
function generateRange(textEditor, line, column) {
  const buffer = textEditor.getBuffer();
  const lineMax = buffer.getLineCount() - 1;
  const lineNumber = Math.max(0, Math.min(line, lineMax));
  const lineText = buffer.lineForRow(lineNumber) || "";
  const colEnd = lineText.length;
  let colStart = typeof column === "number" && column > -1 ? column : 0;

  if (colStart > colEnd) {
    colStart = colEnd;
  }

  return [[lineNumber, colStart], [lineNumber, colEnd]];
}

/**
 *  @type {ESLint}
 */
let engine = undefined;

/**
 *  Initialize a linter run on a single file.
 *
 *  @see    [ESLint.lintText](https://eslint.org/docs/developer-guide/nodejs-api#-eslintlinttextcode-options)
 *
 *  @param  {string}  filepath  - file path that is passed to eslint.linttext as part of the options parameter.
 *  @param  {string}  filetext  - Code provided by 'filePath'
 *
 *  @return {Promise} which resolves with eslinter results, or is rejected with an error.
 */
function exec(filepath, filetext) {
  return _m.config
    .getOptions(atom, filepath, engine)
    .then((options) => {
      if (options) {
        engine = new ESLint(options);
      }
      return engine;
    })
    .then((engine) => {
      return engine.lintText(filetext, { filePath: filepath }).then((result) => {
        return { results: result };
      });
    })
    .catch((error) => {
      console.log("*** error ***", error);
      // Rather than displaying a big error, treat the error as a normal lint error so it shows
      // in the footer rather than a pop-up toast error message.
      return Promise.resolve({
        results: [
          { messages: [{ line: 1, message: error, ruleId: NaN, severity: 2 }] },
        ],
      });
    });
}

/**
 *  Handle the report returned by a linter-run on some file.
 */
function handle(texteditor, report) {
  if (!report || !report.results || !report.results.length) {
    return [];
  }

  return report.results[0].messages.map(
    ({ column = 1, line, message, ruleId, severity, fix }) => {
      const fileBuffer = texteditor.getBuffer();
      const lineLength = texteditor.getBuffer().lineLengthForRow(line - 1);
      const colStart = column - 1 > lineLength ? lineLength + 1 : column;
      const position = generateRange(texteditor, line - 1, colStart - 1);
      const file = texteditor.getPath();

      return {
        severity: severity === 1 ? _STRINGS.WARNING : _STRINGS.ERROR,
        excerpt: `${ruleId || _STRINGS.FATAL}: ${message}`,
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

// Module exports:
Object.defineProperty(module.exports, _STRINGS.EXEC, {
  value: exec,
  writable: false,
  enumerable: true,
  configurable: false,
});
Object.defineProperty(module.exports, _STRINGS.HANDLE, {
  value: handle,
  writable: false,
  enumerable: true,
  configurable: false,
});
