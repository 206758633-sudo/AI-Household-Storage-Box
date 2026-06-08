const { ENV_CONFIG } = require('../config/env');
const localApi = require('./local-api');

const CLOUD_TIMEOUT_MS = 2500;

function isCloudConfigured() {
  return ENV_CONFIG.cloudEnvId && ENV_CONFIG.cloudEnvId !== 'YOUR_CLOUD_ENV_ID';
}

function runWithTimeout(promise) {
  let timerId = null;
  const timeoutPromise = new Promise((resolve, reject) => {
    timerId = setTimeout(() => reject(new Error('cloud timeout')), CLOUD_TIMEOUT_MS);
  });

  promise.catch(() => {});
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timerId));
}

function callStorageFunction(action, payload = {}) {
  if (!isCloudConfigured()) {
    return Promise.reject(new Error('cloud env not configured'));
  }

  return runWithTimeout(wx.cloud.callFunction({
    name: ENV_CONFIG.storageFunctionName,
    data: {
      action,
      payload
    }
  })).then((response) => {
    const result = response.result || {};
    if (!result.ok) {
      throw new Error(result.message || '云函数调用失败');
    }
    return result.data;
  });
}

function listEntries() {
  return callStorageFunction('list_entries').catch(() => localApi.listEntries());
}

function createEntry(rawText, persona) {
  return callStorageFunction('create_entry', { rawText, persona }).catch(() => localApi.createEntry(rawText, persona));
}

function deleteEntry(entryId) {
  return callStorageFunction('delete_entry', { entryId }).catch(() => localApi.deleteEntry(entryId));
}

function refineEntry(entryId) {
  return callStorageFunction('refine_entry', { entryId }).catch(() => localApi.refineEntry(entryId));
}

function updateCheckin(entryId) {
  return callStorageFunction('update_checkin', { entryId }).catch(() => localApi.updateCheckin(entryId));
}

function getMonthlyReport(persona) {
  return callStorageFunction('get_monthly_report', { persona }).catch(() => localApi.getMonthlyReport(persona));
}

function clearEntries() {
  return callStorageFunction('clear_entries').catch(() => localApi.clearEntries());
}

module.exports = {
  clearEntries,
  createEntry,
  deleteEntry,
  getMonthlyReport,
  listEntries,
  refineEntry,
  updateCheckin
};
