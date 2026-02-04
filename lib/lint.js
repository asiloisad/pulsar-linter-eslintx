const fs = require("fs");
const path = require("path");
const exec = require("./exec");

let IgnorePattern;
function getIgnorePattern() {
  if (!IgnorePattern) {
    IgnorePattern = require("@eslint/eslintrc").Legacy.IgnorePattern;
  }
  return IgnorePattern;
}

/**
 *  Find a file by searching upward from a directory.
 *  @param  {string}  directory - Starting directory path
 *  @param  {string}  name      - File name to find
 *  @return {string|null}       - Full path if found, null otherwise
 */
function findFile(directory, name) {
  let dir = path.dirname(directory);
  while (dir) {
    const filePath = path.join(dir, name);
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return filePath;
    } catch (_) {
      // File not found, continue upward
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 *  Check if filepath is ignored by .eslintignore.
 */
function isIgnored(ignorefile, filepath) {
  const patterns = fs
    .readFileSync(ignorefile, "utf8")
    .replace(/^\ufeff/u, "")
    .split(/\r?\n/gu)
    .filter((line) => line.trim() !== "" && !line.startsWith("#"));
  const IP = getIgnorePattern();
  const ignorepattern = new IP(patterns, path.dirname(ignorefile));
  const ignoredPaths = IP.createIgnore([ignorepattern]);
  return ignoredPaths(filepath);
}

/**
 *  Linter interface function.
 *  @param  {TextEditor} texteditor
 *  @return {Promise<Array<Message>>|null}
 */
function lint(texteditor) {
  // Restrict linting to visible workspace editors to avoid
  // linting with wrong project .eslintrc when switching projects.
  if (!atom.workspace.getTextEditors().includes(texteditor)) {
    return null;
  }

  const filepath = texteditor.getPath();
  const ignoreFile = findFile(filepath, ".eslintignore");
  if (ignoreFile && isIgnored(ignoreFile, filepath)) {
    return Promise.resolve([]);
  }

  const fileText = texteditor.getText();
  return exec.exec(filepath, fileText).then((report) => {
    return exec.handle(texteditor, report);
  });
}

Object.assign(module.exports, { lint });
