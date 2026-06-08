const { EMPTY_ENTRIES } = require('../core/constants');
const { buildLocalReportText, buildReportSummary } = require('../core/report-rules');

const STORAGE_KEY = 'ai_storage_box_entries_v1';
const LOCAL_TIMEOUT_REPLY = '已用本地测试模式收纳。';

function cloneEntries(entries) {
  return JSON.parse(JSON.stringify(entries || EMPTY_ENTRIES));
}

function readEntries() {
  return cloneEntries(wx.getStorageSync(STORAGE_KEY) || EMPTY_ENTRIES);
}

function writeEntries(entries) {
  wx.setStorageSync(STORAGE_KEY, cloneEntries(entries));
  return cloneEntries(entries);
}

function getNumbers(text) {
  return (text.match(/\d+(?:\.\d+)?/g) || []).map(Number);
}

function getAmount(text) {
  const numbers = getNumbers(text);
  return numbers.length ? Math.max(...numbers) : null;
}

function getLedgerCategory(text) {
  if (/奶茶|咖啡|饭|餐|外卖|零食|茶/.test(text)) return '餐饮';
  if (/打车|地铁|公交|车费|高铁|机票/.test(text)) return '交通';
  if (/电影|游戏|门票|演唱会/.test(text)) return '娱乐';
  if (/买|衣服|鞋|超市|淘宝|京东/.test(text)) return '购物';
  return '其他';
}

function parseDateText(text) {
  const matchedDate = text.match(/(?:(\d{4})\s*年)?\s*(\d{1,2})\s*月\s*(\d{1,2})/);
  if (!matchedDate) return null;
  return { year: matchedDate[1] ? Number(matchedDate[1]) : null, month: Number(matchedDate[2]), day: Number(matchedDate[3]) };
}

function buildNoteTags(text) {
  const tags = [];
  if (/工作|项目|会议|上线|加班/.test(text)) tags.push('工作');
  if (/累|烦|焦虑|崩溃/.test(text)) tags.push('情绪');
  if (!tags.length) tags.push('待分类');
  return tags;
}

function routeTextLocally(rawText) {
  const text = String(rawText || '').trim();
  const amount = getAmount(text);
  const dateParts = parseDateText(text);

  if (/每月|每年|包月|包年|会员|订阅|续费|icloud|网盘|vip/i.test(text)) {
    return { type: 'subscription', fields: { name: text.replace(/\d+元?|每月|每年|会员|订阅|续费/g, '') || '某订阅', cycle: /年/.test(text) ? '年' : '月', price: amount || 0, billDate: { day: new Date().getDate(), month: new Date().getMonth() + 1 }, cat: '生活' }, label: '订阅' };
  }
  if (amount !== null && amount >= 300 && /手机|电脑|平板|iphone|ipad|mac|相机|耳机|手表/i.test(text)) {
    return { type: 'asset', fields: { name: text.replace(/\d+(\.\d+)?元?|买了?|入手/g, '') || '新物品', price: amount, buyDate: null, needDate: true, cat: '电子产品', status: '使用中' }, label: '资产' };
  }
  if (dateParts) {
    return { type: 'countdown', fields: { title: text.replace(/(\d{4})?\s*年?\s*\d{1,2}\s*月\s*\d{1,2}日?/, '') || '某个日子', date: dateParts, recurring: true, person: /生日|爸|妈|孩子/.test(text), sub: /生日/.test(text) ? '生日' : '纪念日' }, label: '倒数日' };
  }
  if (amount !== null && /(买|花|付|充|打车|地铁|奶茶|咖啡|饭|餐|电影|衣服|鞋|超市|外卖|车费|元|块|¥)/.test(text)) {
    return { type: 'ledger', fields: { title: text.replace(/\d+(\.\d+)?元?/g, '') || '消费', amount, cat: getLedgerCategory(text), date: new Date().toISOString() }, label: '记账' };
  }
  if (/打卡|坚持|喝水|跑步|健身|读书|早起|散步|游泳|背单词/.test(text)) {
    return { type: 'checkin', fields: { name: text.replace(/今天|又|了|打卡/g, '') || '打卡', count: 1, history: [true], cat: /跑步|健身|游泳/.test(text) ? '运动' : /读书|学习|背/.test(text) ? '学习' : '生活' }, label: '打卡' };
  }
  return { type: 'note', fields: { text, mood: /开心|成功|喜欢|爽/.test(text) ? 1 : /累|烦|焦虑/.test(text) ? -1 : 0, tags: buildNoteTags(text), date: new Date().toISOString() }, label: '随手记' };
}

function createEntry(rawText) {
  const entries = readEntries();
  const routedEntry = routeTextLocally(rawText);
  const entryId = `local_${Date.now()}`;
  const now = new Date().toISOString();
  entries[routedEntry.type].unshift({ _id: entryId, id: entryId, type: routedEntry.type, rawText, createdAt: now, updatedAt: now, aiSource: 'local_test', ...routedEntry.fields });
  return Promise.resolve({ entries: writeEntries(entries), entryId, label: routedEntry.label, reply: LOCAL_TIMEOUT_REPLY, aiSource: 'local_test' });
}

function listEntries() {
  return Promise.resolve({ entries: readEntries() });
}

function deleteEntry(entryId) {
  const entries = readEntries();
  Object.keys(entries).forEach((type) => {
    entries[type] = entries[type].filter((entry) => entry._id !== entryId && entry.id !== entryId);
  });
  return Promise.resolve({ entries: writeEntries(entries) });
}

function findEntry(entries, entryId) {
  for (const type of Object.keys(entries)) {
    const entry = entries[type].find((item) => item._id === entryId || item.id === entryId);
    if (entry) return entry;
  }
  return null;
}

function parseDateString(dateString) {
  if (!dateString) return null;
  const matchedDate = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!matchedDate) return null;
  return { year: Number(matchedDate[1]), month: Number(matchedDate[2]), day: Number(matchedDate[3]) };
}

function updateEntry(entryId, fields) {
  const entries = readEntries();
  const entry = findEntry(entries, entryId);
  if (!entry) return Promise.reject(new Error('记录不存在'));

  Object.keys(fields || {}).forEach((key) => {
    if (key !== 'buyDateText' && fields[key] !== undefined) entry[key] = fields[key];
  });
  if (entry.type === 'asset' && fields.buyDateText !== undefined) {
    entry.buyDate = parseDateString(fields.buyDateText);
    entry.needDate = !entry.buyDate;
  }
  entry.updatedAt = new Date().toISOString();
  return Promise.resolve({ entries: writeEntries(entries) });
}

function updateCheckin(entryId) {
  const entries = readEntries();
  const entry = entries.checkin.find((item) => item._id === entryId || item.id === entryId);
  if (entry) {
    entry.count = Number(entry.count || 0) + 1;
    entry.history = (entry.history || []).concat(true).slice(-30);
  }
  return Promise.resolve({ entries: writeEntries(entries), reply: entry ? `第 ${entry.count} 次「${entry.name}」` : '已打卡' });
}

function getMonthlyReport(persona) {
  const allEntries = readEntries();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const isCurrentMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === year && d.getMonth() === month;
  };
  const monthEntries = {
    ...allEntries,
    ledger: allEntries.ledger.filter(e => isCurrentMonth(e.date)),
    note: allEntries.note.filter(e => isCurrentMonth(e.date))
  };
  const report = buildReportSummary(monthEntries);
  return Promise.resolve({ report, summary: buildLocalReportText(report, persona) });
}

function clearEntries() {
  return Promise.resolve({ entries: writeEntries(EMPTY_ENTRIES) });
}

function refineEntry() {
  return Promise.resolve({ entries: readEntries(), refined: false, reply: '本地测试模式暂不复核。' });
}

module.exports = {
  clearEntries,
  createEntry,
  deleteEntry,
  getMonthlyReport,
  listEntries,
  refineEntry,
  updateEntry,
  updateCheckin
};
