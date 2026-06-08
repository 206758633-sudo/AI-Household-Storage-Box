const { CATEGORY_COLORS } = require('./constants');

function sumLedgerAmount(ledgerEntries) {
  return ledgerEntries.reduce((totalAmount, entry) => totalAmount + Number(entry.amount || 0), 0);
}

function groupLedgerByCategory(ledgerEntries) {
  return ledgerEntries.reduce((categoryMap, entry) => {
    const category = entry.cat || '其他';
    categoryMap[category] = (categoryMap[category] || 0) + Number(entry.amount || 0);
    return categoryMap;
  }, {});
}

function countCheckins(checkinEntries) {
  return checkinEntries.reduce((totalCount, entry) => totalCount + Number(entry.count || 0), 0);
}

function getTopMoodNote(noteEntries) {
  return noteEntries.slice().sort((left, right) => right.mood - left.mood)[0] || null;
}

function buildReportSummary(entries) {
  const ledgerEntries = entries.ledger || [];
  const noteEntries = entries.note || [];
  const checkinEntries = entries.checkin || [];
  const categoryAmounts = groupLedgerByCategory(ledgerEntries);
  const totalAmount = sumLedgerAmount(ledgerEntries);
  const totalCheckins = countCheckins(checkinEntries);
  const topCategory = Object.keys(categoryAmounts).sort((a, b) => categoryAmounts[b] - categoryAmounts[a])[0] || '暂无';
  const topMoodNote = getTopMoodNote(noteEntries);

  return {
    totalAmount,
    totalCheckins,
    totalLedgerCount: ledgerEntries.length,
    totalNoteCount: noteEntries.length,
    topCategory,
    topMoodText: topMoodNote ? topMoodNote.text : '暂无',
    categoryAmounts,
    categoryColors: CATEGORY_COLORS
  };
}

function buildLocalReportText(reportSummary, persona) {
  const textMap = {
    '温柔': `这个月你记了 ${reportSummary.totalLedgerCount} 笔账共 ¥${reportSummary.totalAmount}，${reportSummary.topCategory}最多；打卡 ${reportSummary.totalCheckins} 次，继续稳稳收纳生活。`,
    '毒舌': `${reportSummary.totalLedgerCount} 笔账 ¥${reportSummary.totalAmount}，${reportSummary.topCategory}很抢镜；打卡 ${reportSummary.totalCheckins} 次，还算没摆烂。`,
    '老妈': `这月花了 ¥${reportSummary.totalAmount}，${reportSummary.topCategory}最多要留意；打卡 ${reportSummary.totalCheckins} 次，妈觉得挺好。`
  };
  return textMap[persona] || textMap['温柔'];
}

module.exports = {
  buildLocalReportText,
  buildReportSummary,
  countCheckins,
  groupLedgerByCategory,
  sumLedgerAmount
};

