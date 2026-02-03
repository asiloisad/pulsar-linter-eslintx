const { Emitter, CompositeDisposable } = require("atom");
const config = require("./config");
const lint = require("./lint");
const exec = require("./exec");

const PACKAGE_NAME = "linter-eslint-8";

const state = {
  grammarScopes: [],
  packagename: PACKAGE_NAME,
};

let subscriptions;

function activate() {
  const emitter = new Emitter();

  subscriptions = new CompositeDisposable();
  subscriptions.add(emitter);

  subscriptions.add(
    atom.commands.add("atom-workspace", {
      "linter-eslint-8:reload": () => {
        exec.resetEngine();
        lint.triggerReLint(state.grammarScopes);
      },
      "linter-eslint-8:open-config": () => {
        config.openConfig();
      },
    })
  );

  config.onActivate(atom, state, emitter, subscriptions);
}

function deactivate() {
  subscriptions.dispose();
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
