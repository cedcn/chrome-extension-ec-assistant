const path = require('path')
const webpack = require('webpack')
const autoprefixer = require('autoprefixer')
const { getLocalIdent } = require('css-loader/dist/utils')

const host = 'localhost'
const port = 3333

const baseDevConfig = () => ({
  devtool: 'eval-cheap-module-source-map',
  mode: 'development',
  entry: {
    background: path.join(__dirname, '../chrome/extension/background'),
    inject: path.join(__dirname, '../chrome/extension/inject'),
    app: path.join(__dirname, '../chrome/extension/app'),
    popup: path.join(__dirname, '../chrome/extension/popup'),
  },
  devMiddleware: {
    publicPath: `http://${host}:${port}/js`,
    stats: {
      colors: true,
    },
    noInfo: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  hotMiddleware: {
    path: '/js/__webpack_hmr',
  },
  output: {
    path: path.join(__dirname, '../dev/js'),
    filename: '[name].bundle.js',
    chunkFilename: '[id].chunk.js',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.IgnorePlugin(/[^/]+\/[\S]+.prod$/),
    new webpack.DefinePlugin({
      __HOST__: `'${host}'`,
      __PORT__: port,
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
    }),
  ],
  resolve: {
    extensions: ['*', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.less|\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]--[hash:base64:5]',
                getLocalIdent: (context, localIdentName, localName, options) => {
                  if (context.resourcePath.includes('react-table.css')) {
                    return localName
                  }

                  return getLocalIdent(context, localIdentName, localName, options)
                },
              },
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [autoprefixer],
            },
          },
        ],
      },
    ],
  },
})


const appConfig = baseDevConfig()

module.exports = appConfig
