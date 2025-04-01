const glob = require("glob");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// var entry = {};
// var plugins = [];

// glob.sync("./src/apps/*/index.tsx").forEach((e) => {
//   const name = e.split("/").reverse()[1];
//   entry[name] = e;
//   plugins.push(
//     new HtmlWebpackPlugin({
//       chunks: [name],
//       filename: name + ".html",
//       template: "public/index.html",
//     })
//   );
// });

module.exports = {
  entry: {
    pages: "./src/index.tsx",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    // ensure patternfly imports from alloy are resolved (required for font processing)
    alias: {
      "@patternfly/react-core": path.resolve(
        __dirname,
        "node_modules/@patternfly/react-core"
      ),
    },
  },
  output: {
    filename: "main.bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ["pages"],
      filename: "index.html",
      template: "src/index.html",
    }),
  ],
  devServer: {
    static: path.join(__dirname, "dist"),
    compress: true,
    port: 4000,
  },
};
