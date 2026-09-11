const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure transformer is present for Metro compatibility in EAS cloud environment
if (!config.transformer) {
  config.transformer = {};
}

module.exports = config;
