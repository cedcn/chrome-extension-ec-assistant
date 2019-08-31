const path = require('path')
const webpack = require('webpack')
const autoprefixer = require('autoprefixer')
const { getLocalIdent } = require('css-loader/dist/utils')

module.exports = {
  entry: {
    background: path.join(__dirname, '../chrome/extension/background'),
    inject: path.join(__dirname, '../chrome/extension/inject'),
    app: path.join(__dirname, '../chrome/extension/app'),
    popup: path.join(__dirname, '../chrome/extension/popup'),
  },
  mode: 'production',
  output: {
    path: path.join(__dirname, '../build/js'),
    filename: '[name].bundle.js',
    chunkFilename: '[id].chunk.js',
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.IgnorePlugin(/[^/]+\/[\S]+.dev$/),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
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
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[path][name]__[local]--[hash:base64:5]',
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
}
