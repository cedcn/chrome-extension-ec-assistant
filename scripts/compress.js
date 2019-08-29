const fs = require('fs')
const ChromeExtension = require('crx')

/* eslint import/no-unresolved: 0 */
const argv = require('minimist')(process.argv.slice(2))
const path = require('path')
const { name } = require('../build/manifest.json')

const keyPath = argv.key || 'key.pem'
const existsKey = fs.existsSync(keyPath)
const crx = new ChromeExtension({
  appId: argv['app-id'],
  codebase: 'http://localhost:8000/myExtension.crx',
  privateKey: existsKey ? fs.readFileSync(keyPath) : null,
})

crx
  .load(path.resolve(__dirname, '../build'))
  .then((crx2) => crx2.pack())
  .then((crxBuffer) => {
    fs.writeFileSync(`${name}.zip`, crxBuffer)
    const updateXML = crx.generateUpdateXML()
    fs.writeFileSync('update.xml', updateXML)
    fs.writeFileSync(`${name}.crx`, crxBuffer)
  })
  .catch((err) => {
    console.error(err)
  })
