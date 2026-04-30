module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Do NOT add react-native-reanimated/plugin or react-native-worklets/plugin.
    // SDK 55 / Reanimated v4 handles this internally.
  };
};
