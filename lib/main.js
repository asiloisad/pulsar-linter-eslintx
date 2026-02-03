const { Emitter, CompositeDisposable } = require("atom");
const lint = require("./lint");
const exec = require("./exec");
const config = require("./config");

const PACKAGE_NAME = "linter-eslint-8";

const state = {
  grammarScopes: [],
  packagename: PACKAGE_NAME,
};

let disposables;

function activate() {
  const emitter = new Emitter();

  disposables = new CompositeDisposable();
  disposables.add(emitter);

  disposables.add(
    atom.commands.add("atom-workspace", {
      "linter-eslint-8:reload": () => {
        exec.resetEngine();
        lint.triggerReLint(state.grammarScopes);
      },
    })
  );

  config.onActivate(atom, state, emitter, disposables);
}

function deactivate() {
  disposables.dispose();
}

function provideLinter() {
  return {
    get grammarScopes() {
      return state.grammarScopes;
    },
    scope: "file",
    name: "ESLint-8",
    lintsOnChange: true,
    lint: lint.lint,
  };
}

module.exports = { activate, deactivate, provideLinter };
