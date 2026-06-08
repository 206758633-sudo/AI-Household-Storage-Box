const { ENTRY_TYPES, MOOD_EMOJI } = require('./constants');
const {
  formatDuration,
  formatMonthDay,
  getConstellation,
  getDaysBetween,
  getDaysSince,
  getNextMonthlyDate,
  getNextYearlyDate,
  getZodiacAnimal
} = require('./date-utils');

function getEntrySubtype(entry) {
  if (entry.type === 'countdown') return entry.sub || (entry.person ? '生日' : '纪念日');
  if (entry.type === 'checkin') return entry.cat || '生活';
  if (entry.type === 'ledger') return entry.cat || '其他';
  if (entry.type === 'asset') return entry.cat || '生活';
  if (entry.type === 'subscription') return entry.cat || '生活';
  return '全部';
}

function getCountdownCard(entry, today) {
  const targetDate = getNextYearlyDate(entry.date.month, entry.date.day, today);
  const days = getDaysBetween(targetDate, today);
  const detail = entry.date.year
    ? `${entry.date.year}年${entry.date.month}月${entry.date.day}日`
    : `${entry.date.month}月${entry.date.day}日`;
  return {
    bigText: String(days),
    unit: '天',
    meta: detail,
    title: entry.title,
    extra: entry.date.year && entry.person
      ? `${targetDate.getFullYear() - entry.date.year}岁 · 属${getZodiacAnimal(entry.date.year)} · ${getConstellation(entry.date.month, entry.date.day)}`
      : ''
  };
}

function getCheckinCard(entry) {
  return {
    bigText: String(entry.count || 0),
    unit: '次',
    meta: getEntrySubtype(entry),
    title: entry.name,
    extra: (entry.history || []).slice(-7).map(Boolean)
  };
}

function getLedgerCard(entry) {
  return {
    bigText: `¥${entry.amount}`,
    unit: '',
    meta: formatMonthDay(entry.date),
    title: entry.title,
    extra: entry.cat || '其他'
  };
}

function getAssetIcon(name) {
  if (/相机|camera|sony/i.test(name || '')) return '📷';
  if (/iphone|手机/i.test(name || '')) return '📱';
  if (/ipad|平板/i.test(name || '')) return '📲';
  if (/mac|电脑/i.test(name || '')) return '💻';
  if (/耳机|headphone/i.test(name || '')) return '🎧';
  if (/手表|watch/i.test(name || '')) return '⌚';
  return '📦';
}

function getAssetCard(entry, today) {
  if (entry.needDate || !entry.buyDate) {
    return {
      bigText: '待补',
      unit: '',
      meta: `${entry.price || 0}元 · 补购买日期后算日均`,
      title: entry.name,
      extra: '待补',
      icon: getAssetIcon(entry.name)
    };
  }

  const usedDays = getDaysSince(entry.buyDate, today);
  const dailyCost = (Number(entry.price || 0) / Math.max(1, usedDays)).toFixed(2);
  return {
    bigText: formatDuration(usedDays),
    unit: '',
    meta: `${entry.price}元 · ${dailyCost}元/天`,
    title: entry.name,
    extra: entry.cat || '生活',
    icon: getAssetIcon(entry.name)
  };
}

function getSubscriptionCard(entry, today) {
  const billDate = entry.billDate || { day: 1 };
  const targetDate = entry.cycle === '年'
    ? getNextYearlyDate(billDate.month || 1, billDate.day, today)
    : getNextMonthlyDate(billDate.day, today);
  return {
    bigText: String(getDaysBetween(targetDate, today)),
    unit: '天',
    meta: `每${entry.cycle || '月'}¥${entry.price}`,
    title: `${entry.name}还有`,
    extra: entry.cat || '生活'
  };
}

function getNoteCard(entry) {
  return {
    bigText: MOOD_EMOJI[String(entry.mood || 0)],
    unit: '',
    meta: formatMonthDay(entry.date),
    title: entry.text,
    extra: entry.tags || []
  };
}

function buildEntryCard(entry, today = new Date()) {
  const builders = {
    countdown: getCountdownCard,
    checkin: getCheckinCard,
    ledger: getLedgerCard,
    asset: getAssetCard,
    subscription: getSubscriptionCard,
    note: getNoteCard
  };
  const cardBody = builders[entry.type](entry, today);
  return {
    ...cardBody,
    id: entry._id || entry.id,
    type: entry.type,
    icon: cardBody.icon || entry.icon || ENTRY_TYPES[entry.type].icon,
    label: ENTRY_TYPES[entry.type].label,
    rawEntry: entry
  };
}

function isEntryRecent(entry, today = new Date()) {
  const createdAt = entry.createdAt || entry.date;
  if (!createdAt) return false;
  const days = getDaysBetween(new Date(createdAt), today);
  return days <= 0 && days >= -3;
}

function isEntryUrgent(entry, today = new Date()) {
  if (entry.type === 'countdown') {
    return Number(getCountdownCard(entry, today).bigText) <= 14;
  }
  if (entry.type !== 'subscription') return false;
  return Number(getSubscriptionCard(entry, today).bigText) <= 14;
}

function isEntryTodo(entry) {
  return Boolean(entry.needDate || (entry.tags || []).includes('待分类'));
}

function matchStatusFilter(entry, status, today = new Date()) {
  if (status === 'urgent') return isEntryUrgent(entry, today);
  if (status === 'todo') return isEntryTodo(entry);
  if (status === 'recent') return isEntryRecent(entry, today);
  return true;
}

function flattenEntries(entries) {
  return Object.keys(entries).flatMap((type) => entries[type].map((entry) => ({ ...entry, type })));
}

module.exports = {
  buildEntryCard,
  flattenEntries,
  getEntrySubtype,
  isEntryTodo,
  isEntryUrgent,
  matchStatusFilter
};
