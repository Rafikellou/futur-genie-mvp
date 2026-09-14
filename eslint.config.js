// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // eslint-config-expo (SDK 57) newly enables this rule, which flags the
      // codebase's standard "fetch on mount / on dependency change" effects
      // (AuthProvider's session->profile fetch, every screen's load() effect,
      // etc.) — a pattern React's own docs treat as a valid effect use case,
      // not the derived-state anti-pattern this rule targets. Revisit only if
      // a specific effect turns out to cause a real cascading-render problem.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
