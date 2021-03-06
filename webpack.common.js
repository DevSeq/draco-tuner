const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const package = require(path.resolve(__dirname, "./package.json"));
const webpack = require("webpack");

module.exports = {
  entry: "./src/index.tsx",
  context: __dirname,
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".json"]
  },
  node: {
    fs: "empty"
  },
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      {
        test: /\.tsx?$/,
        use: [
          {
            // babel settings in in .babelrc file
            loader: "babel-loader"
          },
          {
            loader: "ts-loader"
          }
        ]
      },
      {
        test: /\.worker\.js$/,
        use: { loader: "worker-loader" }
      },
      // local css loading
      {
        test: /\.css$/,
        exclude: [/\.global.css$/, /node_modules/],
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader",
            options: {
              importLoader: 1,
              modules: true,
              localIdentName: "[name]__[local]"
            }
          }
        ]
      },
      // global css loading
      {
        test: /\global.css$/,
        use: ["style-loader", "css-loader"]
      },
      // external css loading
      {
        test: /\.css$/,
        include: [path.resolve(__dirname, "node_modules")],
        use: ["style-loader", "css-loader"]
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/],
        loader: require.resolve("url-loader"),
        options: {
          limit: 10000,
          name: "static/media/[name].[hash:8].[ext]"
        }
      }
    ]
  },

  plugins: [
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "./index.html",
      favicon: "src/favicon.ico"
    }),
    new MonacoWebpackPlugin({
      languages: ["json", "javascript", "typescript"]
    }),
    new CopyWebpackPlugin([
      {
        from: "./node_modules/wasm-clingo/clingo.wasm",
        to: "static/clingo.wasm"
      }
    ]),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(package.version)
    })
  ]
};
