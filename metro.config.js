const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Ensure transformer is present for Metro compatibility in EAS cloud environment
if (!config.transformer) {
  config.transformer = {};
}

module.exports = withNativeWind(config, { input: "./src/global.css" });
