module.exports = {
  root: true,
  extends: "eslint:recommended",
  env: {
    es2020: true,
    node: true,
  },
  globals: {
    atom: "readonly",
  },
  parserOptions: {
    sourceType: "commonjs",
  },
};
