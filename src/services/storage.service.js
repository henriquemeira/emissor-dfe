const { config } = require('../config/env');

function getDriver() {
  if (config.storage.driver === 'blob') {
    return require('./drivers/blob.driver');
  }
  return require('./drivers/fs.driver');
}

const driver = getDriver();

module.exports = {
  ensureDataDirectory: (...args) => driver.ensureDataDirectory(...args),
  accountExists: (...args) => driver.accountExists(...args),
  saveAccount: (...args) => driver.saveAccount(...args),
  loadAccount: (...args) => driver.loadAccount(...args),
  deleteAccount: (...args) => driver.deleteAccount(...args),
  listApiKeys: (...args) => driver.listApiKeys(...args),
  checkWritePermissions: (...args) => driver.checkWritePermissions(...args),
};
