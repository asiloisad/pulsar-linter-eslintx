const { Emitter, CompositeDisposable } = require("atom");
const lint = require("./lint");
const exec = require("./exec");
const config = require("./config");
const indie = require("./indie");

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
        indie.resetEngine();
      },
      "linter-eslint-8:lint-project": () => {
        indie.runScan();
      },
    })
  );

  // Clear indie messages when a file is opened (deduplication)
  disposables.add(
    atom.workspace.observeTextEditors((editor) => {
      const filePath = editor.getPath();
      if (filePath) {
        indie.clearFileMessages(filePath);
      }
    })
  );

  // Reset indie engine when project paths change
  disposables.add(
    atom.project.onDidChangePaths(() => {
      indie.resetEngine();
      indie.clearAllMessages();
    })
  );

  config.onActivate(atom, state, emitter, disposables);
}

function deactivate() {
  indie.dispose();
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

function consumeIndie(registerIndie) {
  const delegate = registerIndie({ name: "ESLint-8 project" });
  disposables.add(delegate);
  indie.register(delegate);
}

module.exports = { activate, deactivate, provideLinter, consumeIndie };
