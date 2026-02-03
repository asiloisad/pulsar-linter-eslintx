/**
 *	config.js: linter-eslint
 *  Watch and handle atoms/linter-eslint's configuration settings.
 *
 *  @module linter-eslint/config
 *
 */ /*
 *  © 2022, slashlib.org.
 *
 *  config.js   is  distributed  WITHOUT  ANY  WARRANTY;  without  even  the
 *  implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 */
"use strict";

/**
 *  Module table
 *  @ignore
 */
const _m = Object.seal(
  Object.freeze({
    lint: require("./lint"),
    util: require("./util"),
  })
);

/**
 *  Stringtable
 *  @ignore
 */
const _STRINGS = Object.seal(
  Object.freeze({
    DOT: ".",
    GETOPTIONS: "getOptions",
    INITCONTEXT: "initContext",
    MISSING_PKGNAME: "Missing packagename",
    ONACTIVATE: "onActivate",
    SHOULDLINT: "should-lint",
  })
);

/**
 *  Config context - stores package-prefixed config paths
 *  @ignore
 */
const _CONTEXT = {
  resetEngine: false,
};

/**
 *  Initialize config context with package name prefix
 */
function initContext(config) {
  if (!config.packagename) {
    throw Error(_STRINGS.MISSING_PKGNAME);
  }
  const prefix = config.packagename + _STRINGS.DOT;
  _CONTEXT.grammarScopes = prefix + "grammarScopes";
  _CONTEXT.extends = prefix + "extends";
  _CONTEXT.useEslintrc = prefix + "useEslintrc";
  _CONTEXT.overrideConfigFile = prefix + "overrideConfigFile";
  _CONTEXT.cwd = prefix + "cwd";
  _CONTEXT.rulePaths = prefix + "rulePaths";
  _CONTEXT.allowInlineConfig = prefix + "allowInlineConfig";
  _CONTEXT.reportUnusedDisableDirectives = prefix + "reportUnusedDisableDirectives";
} /* eslint-disable-next-line no-unused-vars */

/**
 *  Returns ESLint options.
 *  @see [new ESLint( options )](https://eslint.org/docs/developer-guide/nodejs-api#-new-eslintoptions)
 *
 *  @param  {AtomEnvironment} atom      - Atom environment
 *  @param  {string}          filepath  - Path of file to lint
 *  @param  {ESLint}          engine    - ESLint engine
 *
 *  @returns {Promise} resolves with ESLint options if engine needs reset, undefined otherwise
 */
function getOptions(atom, filepath, engine) {
  return new Promise((resolve) => {
    const resetEngine = _CONTEXT.resetEngine;
    _CONTEXT.resetEngine = false;

    if (resetEngine || atom.project.rootDirectories.length > 1 || !engine) {
      const projectpath = _m.util.getProjectPath(filepath, atom.project.rootDirectories);
      const options = {};

      // cwd
      const cwd = atom.config.get(_CONTEXT.cwd);
      if (cwd) {
        options.cwd = cwd;
      }

      // allowInlineConfig
      options.allowInlineConfig = atom.config.get(_CONTEXT.allowInlineConfig) !== false;

      // baseConfig from extends
      const extendsArr = atom.config.get(_CONTEXT.extends) || [];
      if (extendsArr.length > 0) {
        options.baseConfig = { extends: extendsArr };
      }

      // overrideConfigFile
      const overrideConfigFile = atom.config.get(_CONTEXT.overrideConfigFile);
      options.overrideConfigFile = overrideConfigFile
        ? _m.util.buildConfigFilePath(overrideConfigFile, projectpath)
        : null;

      // reportUnusedDisableDirectives
      const reportUnused = atom.config.get(_CONTEXT.reportUnusedDisableDirectives);
      options.reportUnusedDisableDirectives = reportUnused || null;

      // rulePaths
      const rulePaths = atom.config.get(_CONTEXT.rulePaths) || [];
      options.rulePaths = _m.util.buildRulePaths(rulePaths, projectpath ? [projectpath] : []);

      // useEslintrc
      options.useEslintrc = atom.config.get(_CONTEXT.useEslintrc) !== false;

      resolve(options);
    } else {
      resolve(undefined);
    }
  });
} /* eslint-disable-next-line no-unused-vars */

/**
 *  Setup option handling on package activation.
 *
 *  @param  {AtomEnvironment}     atom
 *  @param  {Object}              config
 *  @param  {Emitter}             emitter
 *  @param  {CompositeDisposable} subscriptions
 */
function onActivate(atom, config, emitter, subscriptions) {
  initContext(config);

  const triggerReset = () => {
    _CONTEXT.resetEngine = true;
    emitter.emit(_STRINGS.SHOULDLINT, config.grammarScopes);
  };

  subscriptions.add(
    emitter,
    atom.project.onDidChangePaths(triggerReset),
    atom.config.observe(_CONTEXT.grammarScopes, (grammar) => {
      config.grammarScopes = grammar;
      emitter.emit(_STRINGS.SHOULDLINT, config.grammarScopes);
    }),
    atom.config.onDidChange(_CONTEXT.extends, triggerReset),
    atom.config.onDidChange(_CONTEXT.useEslintrc, triggerReset),
    atom.config.onDidChange(_CONTEXT.overrideConfigFile, triggerReset),
    atom.config.onDidChange(_CONTEXT.cwd, triggerReset),
    atom.config.onDidChange(_CONTEXT.rulePaths, triggerReset),
    atom.config.onDidChange(_CONTEXT.allowInlineConfig, triggerReset),
    atom.config.onDidChange(_CONTEXT.reportUnusedDisableDirectives, triggerReset)
  );
  emitter.on(_STRINGS.SHOULDLINT, _m.lint.triggerReLint);
}

// Module exports:
Object.defineProperty(module.exports, _STRINGS.GETOPTIONS, {
  value: getOptions,
  writable: false,
  enumerable: true,
  configurable: false,
});
Object.defineProperty(module.exports, _STRINGS.INITCONTEXT, {
  value: initContext,
  writable: false,
  enumerable: true,
  configurable: false,
});
Object.defineProperty(module.exports, _STRINGS.ONACTIVATE, {
  value: onActivate,
  writable: false,
  enumerable: true,
  configurable: false,
});
