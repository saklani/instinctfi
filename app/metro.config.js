const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Force Metro to resolve the browser build of `jose` instead of the Node build.
// Privy's js-sdk-core imports jose, which tries to use Node's `util` and `zlib`
// in its Node ESM entrypoint. The browser build uses Web Crypto instead.
config.resolver.unstable_conditionNames = [
  "browser",
  "require",
  "react-native",
];

module.exports = config;
