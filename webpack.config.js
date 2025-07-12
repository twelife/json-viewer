const path = require("path");
const fs = require('fs-extra');
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const BuildPaths = require("./lib/build-paths");
const BuildExtension = require("./lib/build-extension-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const manifest = fs.readJSONSync(path.join(BuildPaths.SRC_ROOT, 'manifest.json'));
const version = manifest.version;

const entries = {
  viewer: ["./extension/src/viewer.js"],
  "viewer-alert": ["./extension/styles/viewer-alert.scss"],
  options: ["./extension/src/options.js"],
  backend: ["./extension/src/backend.js"],
  omnibox: ["./extension/src/omnibox.js"],
  "omnibox-page": ["./extension/src/omnibox-page.js"]
};

function findThemes(darkness) {
  return fs.readdirSync(path.join('extension', 'themes', darkness)).
    filter(function(filename) {
      return /\.js$/.test(filename);
    }).
    map(function(theme) {
      return theme.replace(/\.js$/, '');
    });
}

function includeThemes(darkness, list) {
  list.forEach(function(filename) {
    entries[filename] = ["./extension/themes/" + darkness + "/" + filename + ".js"];
  });
}

const lightThemes = findThemes('light');
const darkThemes = findThemes('dark');
const themes = {light: lightThemes, dark: darkThemes};

includeThemes('light', lightThemes);
includeThemes('dark', darkThemes);

const config = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: 'cheap-module-source-map',
  context: __dirname,
  entry: entries,
  output: {
    path: path.join(__dirname, "build/json_viewer/assets"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.css', '.scss'],
    modules: [
      path.resolve(__dirname, './extension'),
      'node_modules'
    ]
  },
  externals: {
    "chrome-framework": "chrome"
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({ filename: "[name].css" }),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        VERSION: JSON.stringify(version),
        THEMES: JSON.stringify(themes)
      }
    }),
    new BuildExtension({ themes: themes })
  ],
  performance: {
    hints: false
  }
};

if (config.mode === 'production') {
  config.optimization = {
    minimize: true
  };
}

module.exports = config;