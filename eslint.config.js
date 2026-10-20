export default [
  {
    ignores: ["node_modules/**", "dist/**"],
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        fetch: "readonly",
        structuredClone: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
    },
  },
];
