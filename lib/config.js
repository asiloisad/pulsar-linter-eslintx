const lint = require("./lint");

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
function onActivate(atom, config, emitter, disposables) {
  if (!config.packagename) {
    throw Error("Missing packagename");
  }
  const grammarKey = config.packagename + ".grammarScopes";

  disposables.add(
    emitter,
    atom.project.onDidChangePaths(() => {
      context.resetEngine = true;
      emitter.emit("should-lint", config.grammarScopes);
    }),
    atom.config.observe(grammarKey, (grammar) => {
      config.grammarScopes = grammar;
      emitter.emit("should-lint", config.grammarScopes);
    })
  );
  emitter.on("should-lint", lint.triggerReLint);
}

Object.assign(module.exports, { getOptions, onActivate });
