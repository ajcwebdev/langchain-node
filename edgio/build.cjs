const { join } = require('path')
const { existsSync } = require('fs')
const { nodeFileTrace } = require('@vercel/nft')
const { DeploymentBuilder } = require('@edgio/core/deploy')

const appDir = process.cwd()

module.exports = async () => {
  const builder = new DeploymentBuilder()
  builder.clearPreviousBuildOutput()
  const env = ['.env.production', '.env'].map((i) => join(appDir, i)).find(existsSync)
  if (env) {
    builder.addJSAsset(env)
  }
  const { fileList } = await nodeFileTrace([join(appDir, 'src', 'index.mjs')])
  fileList.forEach((i) => builder.addJSAsset(join(appDir, i)))
  builder.writeFileSync(join(builder.jsDir, '__backends__', 'package.json'), JSON.stringify({ type: 'commonjs' }))
  await builder.build()
}
