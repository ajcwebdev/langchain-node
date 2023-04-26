const { join } = require("path");
const { existsSync } = require("fs");
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
  builder.addJSAsset(join(appDir, "src", "index.mjs"));
  builder.addJSAsset(join(appDir, "node_modules"));
  builder.writeFileSync(
    join(builder.jsDir, "__backends__", "package.json"),
    JSON.stringify({ type: "commonjs" })
  );
  await builder.build();
};
