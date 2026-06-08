const { routeText } = require('./local_router');
const { callHunyuanJson } = require('./hunyuan_client');
const { logWarn } = require('./logger');

const COLLECTION_NAME = 'entries';
const TYPE_LABELS = {
  countdown: '倒数日',
  checkin: '打卡',
  ledger: '记账',
  asset: '资产',
  subscription: '订阅',
  note: '随手记'
};

function buildEmptyEntries() {
  return {
    countdown: [],
    checkin: [],
    ledger: [],
    asset: [],
    subscription: [],
    note: []
  };
}

function groupEntries(documents) {
  return documents.reduce((entries, document) => {
    const type = document.type || 'note';
    if (!entries[type]) entries[type] = [];
    entries[type].push(document);
    return entries;
  }, buildEmptyEntries());
}

function sanitizeRawText(rawText) {
  const text = String(rawText || '').trim();
  if (!text) {
    throw new Error('内容不能为空');
  }
  return text.slice(0, 200);
}

function buildClassifyMessages(rawText) {
  return [
    {
      role: 'system',
      content: [
        '你是生活记录归档助手，只输出 JSON。',
        'type 只能是 countdown/checkin/ledger/asset/subscription/note。',
        'ledger.cat 只能是 餐饮/交通/购物/娱乐/其他。',
        '不要修改用户原文里的数字；缺失字段留空或 null，不要编造。',
        '输出 schema: {"type":"","fields":{},"reply":""}。reply 不超过30字。'
      ].join('\n')
    },
    { role: 'user', content: rawText }
  ];
}

function normalizeAiResult(rawText, aiResult) {
  if (!aiResult || !TYPE_LABELS[aiResult.type] || !aiResult.fields) {
    return routeText(rawText);
  }
  return {
    type: aiResult.type,
    fields: aiResult.fields,
    reply: String(aiResult.reply || '记好啦。').slice(0, 30)
  };
}

async function classifyTextWithAi(rawText) {
  try {
    const aiResult = await callHunyuanJson(buildClassifyMessages(rawText));
    return { ...normalizeAiResult(rawText, aiResult), aiSource: 'hunyuan' };
  } catch (error) {
    logWarn('entry_service', 'AI classify fallback', { message: error.message });
    return null;
  }
}

function classifyTextLocally(rawText) {
  return { ...routeText(rawText), aiSource: 'local' };
}

function buildEntryDocument(options) {
  const now = new Date().toISOString();
  return {
    _openid: options.openid,
    type: options.classifyResult.type,
    rawText: options.rawText,
    icon: options.icon || '',
    createdAt: now,
    updatedAt: now,
    aiSource: options.classifyResult.aiSource,
    ...options.classifyResult.fields
  };
}

async function listEntries(db, openid) {
  const result = await db.collection(COLLECTION_NAME)
    .where({ _openid: openid })
    .orderBy('createdAt', 'desc')
    .get();
  return groupEntries(result.data || []);
}

async function createEntry(db, openid, rawText) {
  const safeText = sanitizeRawText(rawText);
  const classifyResult = classifyTextLocally(safeText);
  const entryDocument = buildEntryDocument({ openid, rawText: safeText, classifyResult });
  const addResult = await db.collection(COLLECTION_NAME).add({ data: entryDocument });
  return {
    entries: await listEntries(db, openid),
    entryId: addResult._id,
    label: TYPE_LABELS[classifyResult.type],
    reply: classifyResult.reply,
    aiSource: classifyResult.aiSource
  };
}

async function refineEntry(db, openid, entryId) {
  const result = await db.collection(COLLECTION_NAME).where({ _openid: openid, _id: entryId }).get();
  const entry = result.data[0];
  if (!entry) throw new Error('记录不存在');

  const classifyResult = await classifyTextWithAi(entry.rawText);
  if (!classifyResult) {
    return {
      entries: await listEntries(db, openid),
      refined: false,
      reply: '本地规则已收纳，AI 稍后再试。'
    };
  }

  await db.collection(COLLECTION_NAME).doc(entryId).update({
    data: {
      type: classifyResult.type,
      updatedAt: new Date().toISOString(),
      aiSource: classifyResult.aiSource,
      ...classifyResult.fields
    }
  });

  return {
    entries: await listEntries(db, openid),
    refined: true,
    label: TYPE_LABELS[classifyResult.type],
    reply: classifyResult.reply
  };
}

async function deleteEntry(db, openid, entryId) {
  await db.collection(COLLECTION_NAME).where({ _openid: openid, _id: entryId }).remove();
  return { entries: await listEntries(db, openid) };
}

async function clearEntries(db, openid) {
  await db.collection(COLLECTION_NAME).where({ _openid: openid }).remove();
  return { entries: await listEntries(db, openid) };
}

async function updateCheckin(db, openid, entryId) {
  const result = await db.collection(COLLECTION_NAME).where({ _openid: openid, _id: entryId, type: 'checkin' }).get();
  const entry = result.data[0];
  if (!entry) throw new Error('打卡记录不存在');

  const nextCount = Number(entry.count || 0) + 1;
  const nextHistory = (entry.history || []).concat(true).slice(-30);
  await db.collection(COLLECTION_NAME).doc(entryId).update({
    data: { count: nextCount, history: nextHistory, updatedAt: new Date().toISOString() }
  });

  return {
    entries: await listEntries(db, openid),
    reply: `第 ${nextCount} 次「${entry.name}」，继续保持。`
  };
}

module.exports = {
  clearEntries,
  createEntry,
  deleteEntry,
  listEntries,
  refineEntry,
  updateCheckin
};
