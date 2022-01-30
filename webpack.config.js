const path = require('path');
const { node } = require('webpack');
const webpack = require('webpack');

module.exports = {
  // externals: {
  //   "fs": "commonjs fs",
  //   "crypto": require('crypto')
  // },
  mode: 'development',
  entry: './dist_browser/app/browser_main.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'public'),
  },
  resolve: {
    fallback: {
      "fs": false,
      "buffer": require.resolve("buffer/"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "zlib"  : require.resolve("browserify-zlib"),
      "http": require.resolve("stream-http"),
      "path": require.resolve("path-browserify"),
      "assert": require.resolve("assert/"),
      "util": require.resolve("util/"),
      "fingerprint": require.resolve("key-fingerprint"),
    }
  },
  plugins: [
    // fix "process is not defined" error:
    // (do "npm install process" before running the build)
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    })
  ],
};