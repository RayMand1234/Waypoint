// Unistyles' Babel plugin processes every file under `src/` (where all styles
// live). Route files in `app/` only render feature screens and hold no styles.
module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [['react-native-unistyles/plugin', { root: 'src' }]],
  };
};
