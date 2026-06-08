function logError(moduleName, description, context) {
  console.error(`[${moduleName}][error] ${description} | context: ${JSON.stringify(context || {})}`);
}

function logWarn(moduleName, description, context) {
  console.warn(`[${moduleName}][warn] ${description} | context: ${JSON.stringify(context || {})}`);
}

module.exports = {
  logError,
  logWarn
};

