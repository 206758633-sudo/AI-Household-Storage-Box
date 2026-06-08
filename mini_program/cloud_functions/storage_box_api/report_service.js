const { callHunyuanJson } = require('./hunyuan_client');
const { logWarn } = require('./logger');

function sumLedgerAmount(ledgerEntries) {
  return ledgerEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

function groupLedgerByCategory(ledgerEntries) {
  return ledgerEntries.reduce((categoryMap, entry) => {
    const category = entry.cat || '其他';
    categoryMap[category] = (categoryMap[category] || 0) + Number(entry.amount || 0);
    return categoryMap;
  }, {});
}

function buildReport(entries) {
  const ledgerEntries = entries.ledger || [];
  const checkinEntries = entries.checkin || [];
  const noteEntries = entries.note || [];
  const categoryAmounts = groupLedgerByCategory(ledgerEntries);
  const totalAmount = sumLedgerAmount(ledgerEntries);
  const totalCheckins = checkinEntries.reduce((sum, entry) => sum + Number(entry.count || 0), 0);
  const topCategory = Object.keys(categoryAmounts).sort((a, b) => categoryAmounts[b] - categoryAmounts[a])[0] || '暂无';

  return {
    categoryAmounts,
    topCategory,
    totalAmount,
    totalCheckins,
    totalLedgerCount: ledgerEntries.length,
    totalNoteCount: noteEntries.length
  };
}

function buildLocalReportText(report, persona) {
  const textMap = {
    '温柔': `这个月你记了 ${report.totalLedgerCount} 笔账共 ¥${report.totalAmount}，${report.topCategory}最多；打卡 ${report.totalCheckins} 次，继续稳稳收纳生活。`,
    '毒舌': `${report.totalLedgerCount} 笔账 ¥${report.totalAmount}，${report.topCategory}很抢镜；打卡 ${report.totalCheckins} 次，还算没摆烂。`,
    '老妈': `这月花了 ¥${report.totalAmount}，${report.topCategory}最多要留意；打卡 ${report.totalCheckins} 次，妈觉得挺好。`
  };
  return textMap[persona] || textMap['温柔'];
}

function buildReportMessages(report, persona) {
  return [
    {
      role: 'system',
      content: '你是生活月报助手。只引用用户提供的统计数字，不得编造金额、次数或分类。输出 JSON: {"summary":""}。'
    },
    {
      role: 'user',
      content: JSON.stringify({ persona, report })
    }
  ];
}

async function buildMonthlyReport(entries, persona) {
  const report = buildReport(entries);
  if (report.totalLedgerCount + report.totalNoteCount < 5) {
    return { report, summary: '再记几天，月报会更好看。' };
  }

  try {
    const aiResult = await callHunyuanJson(buildReportMessages(report, persona));
    return { report, summary: String(aiResult.summary || buildLocalReportText(report, persona)).slice(0, 120) };
  } catch (error) {
    logWarn('report_service', 'AI report fallback', { message: error.message });
    return { report, summary: buildLocalReportText(report, persona) };
  }
}

module.exports = {
  buildLocalReportText,
  buildMonthlyReport,
  buildReport,
  groupLedgerByCategory,
  sumLedgerAmount
};

