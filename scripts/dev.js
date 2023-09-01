const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackConfig = require('./webpack.base.conf');

const compiler = webpack(webpackConfig);

const devServerOptions = { 
  open: true,
  hot: true, 
};

compiler.options.output.publicPath = "/";

const server = new WebpackDevServer(compiler, devServerOptions);
server.options.port = 8085;
server.options.host = "127.0.0.1";
 
server.start();
