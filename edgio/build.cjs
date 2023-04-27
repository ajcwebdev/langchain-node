const { join } = require("path");
const { existsSync } = require("fs");
const { nodeFileTrace } = require("@vercel/nft");
const { DeploymentBuilder } = require("@edgio/core/deploy");

const appDir = process.cwd();

module.exports = async () => {
  const builder = new DeploymentBuilder();
  builder.clearPreviousBuildOutput();
  if (existsSync(join(appDir, ".env"))) {
    builder.addJSAsset(join(appDir, ".env"));
  }
  if (existsSync(join(appDir, ".env.production"))) {
    builder.addJSAsset(join(appDir, ".env.production"));
  }
  const { fileList } = await nodeFileTrace([join(appDir, "src", "index.mjs")]);
  fileList.forEach((i) => builder.addJSAsset(join(appDir, i)));
  builder.writeFileSync(
    join(builder.jsDir, "__backends__", "package.json"),
    JSON.stringify({ type: "commonjs" })
  );
  await builder.build();
};
