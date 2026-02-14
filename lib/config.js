const context = {
  resetEngine: false,
};

/**
 *  Returns ESLint constructor options when engine needs resetting.
 */
function getOptions(atom, engine) {
  return new Promise((resolve) => {
    const resetEngine = context.resetEngine;
    context.resetEngine = false;

    if (resetEngine || atom.project.rootDirectories.length > 1 || !engine) {
      resolve({});
    } else {
      resolve(undefined);
    }
  });
}

/**
 *  Setup option handling on package activation.
 */
function onActivate(atom, emitter, disposables) {
  disposables.add(
    emitter,
    atom.project.onDidChangePaths(() => {
      context.resetEngine = true;
    }),
  );
}

Object.assign(module.exports, { getOptions, onActivate });
