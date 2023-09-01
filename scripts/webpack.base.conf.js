const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const webpack = require('webpack')
module.exports = {
  mode: 'development',
  devtool: false,
  context: path.join(__dirname, '../packages/jsx-explorer'),
  entry: './src/app.ts',
  output: {
    path: __dirname + "/",
    filename: "assets/bundle.js",
    publicPath: './',
  },
  devServer: {
    contentBase: __dirname + "/",
    inline: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          transpileOnly: true,
          compilerOptions: { downlevelIteration: true },
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader', 'css-loader',
        ],
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      }
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new HtmlWebpackPlugin({
      template: 'index.html',
      filename: 'index.html',
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.jsx', '.tsx'],
    fallback: {
      "fs": false, 
      "buffer": require.resolve("buffer")
    },
  }

};
