module.exports = async (port) => {
  process.env.PORT = port.toString();
  await import("../src/index.mjs");
};
