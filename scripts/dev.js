const { createWebpackServer } = require('./tasks')
const tasks = require('./tasks')
const devConfig = require('../webpack/dev.config')

console.log('[Copy assets]')
console.log('-'.repeat(80))
tasks.copyAssets('dev')

console.log('[Webpack Dev]')
console.log('-'.repeat(80))
console.log("If you're developing Inject page,")
console.log('please allow `https://localhost:3333` connections in Google Chrome,')
console.log(
  // eslint-disable-next-line comma-dangle
  'and load unpacked extensions with `./dev` folder. (see https://developer.chrome.com/extensions/getstarted#unpacked)\n'
)

createWebpackServer(devConfig)
