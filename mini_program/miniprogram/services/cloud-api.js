const { ENV_CONFIG } = require('../config/env');

function callStorageFunction(action, payload = {}) {
  return wx.cloud.callFunction({
    name: ENV_CONFIG.storageFunctionName,
    data: {
      action,
      payload
    }
  }).then((response) => {
    const result = response.result || {};
    if (!result.ok) {
      throw new Error(result.message || '云函数调用失败');
    }
    return result.data;
  });
}

function listEntries() {
  return callStorageFunction('list_entries');
}

function createEntry(rawText, persona) {
  return callStorageFunction('create_entry', { rawText, persona });
}

function deleteEntry(entryId) {
  return callStorageFunction('delete_entry', { entryId });
}

function updateCheckin(entryId) {
  return callStorageFunction('update_checkin', { entryId });
}

function getMonthlyReport(persona) {
  return callStorageFunction('get_monthly_report', { persona });
}

function clearEntries() {
  return callStorageFunction('clear_entries');
}

module.exports = {
  clearEntries,
  createEntry,
  deleteEntry,
  getMonthlyReport,
  listEntries,
  updateCheckin
};

