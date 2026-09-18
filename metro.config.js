const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure transformer is present for Metro compatibility in EAS cloud environment
if (!config.transformer) {
  config.transformer = {};
}

config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    toplevel: false,
  },
  output: {
    ascii_only: true,
    quote_style: 3,
    wrap_iife: true,
  },
  sourceMap: false,
  toplevel: false,
  compress: {
    reduce_funcs: false,
  },
};

module.exports = config;
