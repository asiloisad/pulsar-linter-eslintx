const exec = require("./exec");

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
  const projectRoot = atom.project.relativizePath(filepath)[0];

  // Skip files not in a project
  if (!projectRoot) {
    return Promise.resolve([]);
  }

  // Get engine to check if path is ignored
  const engineInfo = exec.getEngine(projectRoot);
  if (!engineInfo) {
    // No ESLint available - silent
    return Promise.resolve([]);
  }

  // Check if path is ignored using ESLint's isPathIgnored
  return engineInfo.engine.isPathIgnored(filepath).then((ignored) => {
    if (ignored) {
      return [];
    }

    const fileText = texteditor.getText();
    return exec.exec(filepath, fileText, projectRoot).then((report) => {
      return exec.handle(texteditor, report);
    });
  }).catch(() => {
    // If isPathIgnored fails, just proceed with linting
    const fileText = texteditor.getText();
    return exec.exec(filepath, fileText, projectRoot).then((report) => {
      return exec.handle(texteditor, report);
    });
  });
}

module.exports = { lint };
