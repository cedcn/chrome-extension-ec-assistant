const shell = require('shelljs')
const express = require('express')
const https = require('https')
const fs = require('fs')

const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const _ = require('lodash')

exports.createWebpackServer = (webpackConfig) => {
  const app = express()

  function useConfig(config) {
    const omittedKeys = ['devMiddleware', 'hotMiddleware']
    const properWebpackConfig = _.omit(config, omittedKeys)
    const compiler = webpack(properWebpackConfig)
    app.use(express.static('js'))
    app.use(webpackDevMiddleware(compiler, config.devMiddleware))
    app.use(webpackHotMiddleware(compiler, config.hotMiddleware))
  }

  if (Array.isArray(webpackConfig)) {
    webpackConfig.forEach(useConfig)
  } else {
    useConfig(webpackConfig)
  }

  https
    .createServer(
      {
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.cert'),
      },
      app
    )
    .listen(3333, () => console.log('App listening on port 3333!'))
  return app
}

exports.copyAssets = (type) => {
  const env = type === 'build' ? 'prod' : type
  shell.rm('-rf', type)
  shell.mkdir(type)
  shell.cp(`chrome/manifest.${env}.json`, `${type}/manifest.json`)
  shell.cp('-R', 'chrome/assets/*', type)
  shell.exec(`pug -O "{ env: '${env}' }" -o ${type} chrome/views/`)
}
