const cloud = require('wx-server-sdk');
const { clearEntries, createEntry, deleteEntry, listEntries, refineEntry, updateEntry, updateCheckin } = require('./entry_service');
const { buildMonthlyReport } = require('./report_service');
const { logError } = require('./logger');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

function ok(data) {
  return { ok: true, data };
}

function fail(error) {
  logError('storage_box_api', 'request failed', { message: error.message });
  return { ok: false, message: error.message || '服务暂不可用' };
}

function getOpenid() {
  return cloud.getWXContext().OPENID;
}

exports.main = async (event) => {
  const db = cloud.database();
  const openid = getOpenid();
  const payload = event.payload || {};

  try {
    if (event.action === 'list_entries') {
      return ok({ entries: await listEntries(db, openid) });
    }
    if (event.action === 'create_entry') {
      return ok(await createEntry(db, openid, payload.rawText, payload.persona));
    }
    if (event.action === 'delete_entry') {
      return ok(await deleteEntry(db, openid, payload.entryId));
    }
    if (event.action === 'refine_entry') {
      return ok(await refineEntry(db, openid, payload.entryId));
    }
    if (event.action === 'update_checkin') {
      return ok(await updateCheckin(db, openid, payload.entryId));
    }
    if (event.action === 'update_entry') {
      return ok(await updateEntry(db, openid, payload.entryId, payload.fields));
    }
    if (event.action === 'clear_entries') {
      return ok(await clearEntries(db, openid));
    }
    if (event.action === 'get_monthly_report') {
      const entries = await listEntries(db, openid);
      return ok(await buildMonthlyReport(entries, payload.persona || '温柔'));
    }
    throw new Error('未知操作');
  } catch (error) {
    return fail(error);
  }
};
