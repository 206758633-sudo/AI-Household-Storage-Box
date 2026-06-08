const { ENTRY_TYPES, EMPTY_ENTRIES, NAV_ITEMS, PERSONAS, SUBTABS } = require('../../core/constants');
const { buildEntryCard, flattenEntries, getEntrySubtype, matchStatusFilter } = require('../../core/entry-view-models');
const { buildReportSummary } = require('../../core/report-rules');
const {
  clearEntries,
  createEntry,
  deleteEntry,
  getMonthlyReport,
  listEntries,
  refineEntry,
  updateCheckin
} = require('../../services/cloud-api');

Page({
  data: {
    aiReply: '',
    cards: [],
    category: 'all',
    categoryTitle: '全部',
    currentIcon: '🗂️',
    detail: {},
    detailVisible: false,
    drawerVisible: false,
    entries: EMPTY_ENTRIES,
    inputText: '',
    loading: false,
    navItems: [],
    persona: '温柔',
    personas: PERSONAS,
    replyLabel: 'AI',
    report: {},
    reportText: '',
    reportTitle: '这个月，生活被好好收起来了',
    reportVisible: false,
    status: 'all',
    statusCount: { urgent: 0, todo: 0, recent: 0 },
    sub: '全部',
    summary: null,
    tabs: []
  },

  onLoad() {
    this.loadEntries();
  },

  async loadEntries() {
    this.setData({ loading: true });
    try {
      const data = await listEntries();
      this.setData({ entries: data.entries || EMPTY_ENTRIES });
      this.refreshView();
    } catch (error) {
      this.showToast('本地测试模式已启动');
    } finally {
      this.setData({ loading: false });
    }
  },

  refreshView() {
    const entries = this.data.entries;
    const allEntries = flattenEntries(entries);
    const cards = this.getVisibleEntries(allEntries).map((entry) => buildEntryCard(entry));
    this.setData({
      cards,
      categoryTitle: ENTRY_TYPES[this.data.category].label,
      currentIcon: ENTRY_TYPES[this.data.category].icon,
      navItems: this.buildNavItems(entries),
      statusCount: this.buildStatusCount(allEntries),
      summary: this.buildSummary(entries),
      tabs: SUBTABS[this.data.category] || []
    });
  },

  getVisibleEntries(allEntries) {
    if (this.data.category === 'all') {
      return allEntries
        .filter((entry) => matchStatusFilter(entry, this.data.status))
        .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
    }

    return allEntries
      .filter((entry) => entry.type === this.data.category)
      .filter((entry) => this.data.sub === '全部' || getEntrySubtype(entry) === this.data.sub);
  },

  buildNavItems(entries) {
    return NAV_ITEMS.map((item) => ({
      ...item,
      count: item.key === 'all'
        ? flattenEntries(entries).length
        : (entries[item.key] || []).length
    }));
  },

  buildStatusCount(allEntries) {
    return {
      urgent: allEntries.filter((entry) => matchStatusFilter(entry, 'urgent')).length,
      todo: allEntries.filter((entry) => matchStatusFilter(entry, 'todo')).length,
      recent: allEntries.filter((entry) => matchStatusFilter(entry, 'recent')).length
    };
  },

  buildSummary(entries) {
    const category = this.data.category;
    if (category === 'ledger') return this.buildLedgerSummary(entries.ledger || []);
    if (category === 'asset') return this.buildAssetSummary(entries.asset || []);
    if (category === 'subscription') return this.buildSubscriptionSummary(entries.subscription || []);
    return null;
  },

  buildLedgerSummary(ledgerEntries) {
    const totalAmount = ledgerEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    return { title: '本月记账', items: [{ value: `¥${totalAmount}`, label: '本月花销' }, { value: ledgerEntries.length, label: '笔数' }] };
  },

  buildAssetSummary(assetEntries) {
    const totalValue = assetEntries.reduce((sum, entry) => sum + Number(entry.price || 0), 0);
    return { title: '资产概览', items: [{ value: `¥${totalValue}`, label: '总价值' }, { value: assetEntries.length, label: '件数' }] };
  },

  buildSubscriptionSummary(subscriptionEntries) {
    const monthlyAmount = subscriptionEntries.reduce((sum, entry) => sum + (entry.cycle === '年' ? Number(entry.price || 0) / 12 : Number(entry.price || 0)), 0);
    return { title: '订阅概览', items: [{ value: `¥${monthlyAmount.toFixed(0)}`, label: '月支出' }, { value: subscriptionEntries.length, label: '订阅数' }] };
  },

  handleInput(event) {
    this.setData({ inputText: event.detail.value });
  },

  async submitText() {
    const rawText = this.data.inputText.trim();
    if (!rawText || this.data.loading) return;
    this.setData({ loading: true, aiReply: '本地规则快速收纳中...', replyLabel: '🪄 归档中' });

    try {
      const result = await createEntry(rawText, this.data.persona);
      this.setData({ entries: result.entries, inputText: '' });
      this.showAiReply(`已先归到 ${result.label}`, result.aiSource === 'local_test' ? '本地测试模式已收纳' : 'AI 正在后台复核...');
      this.refreshView();
      if (result.aiSource !== 'local_test') {
        this.refineCreatedEntry(result.entryId);
      }
    } catch (error) {
      this.showToast('归档失败，请稍后重试');
    } finally {
      this.setData({ loading: false });
    }
  },

  async refineCreatedEntry(entryId) {
    if (!entryId) return;
    try {
      const result = await refineEntry(entryId);
      this.setData({ entries: result.entries });
      this.refreshView();
      if (result.refined) {
        this.showAiReply(`AI复核：${result.label}`, result.reply);
      }
    } catch (error) {
      this.showToast('已先收纳，AI 复核稍后再试');
    }
  },

  async checkIn(event) {
    const entryId = event.currentTarget.dataset.id;
    try {
      const result = await updateCheckin(entryId);
      this.setData({ entries: result.entries });
      this.showAiReply('已打卡', result.reply);
      this.refreshView();
    } catch (error) {
      this.showToast('打卡失败');
    }
  },

  openDetail(event) {
    const { id } = event.currentTarget.dataset;
    const detail = this.data.cards.find((card) => card.id === id);
    this.setData({ detail, detailVisible: true });
  },

  async deleteCurrent() {
    if (!this.data.detail.id) return;
    try {
      const result = await deleteEntry(this.data.detail.id);
      this.setData({ entries: result.entries, detailVisible: false });
      this.refreshView();
      this.showToast('已删除');
    } catch (error) {
      this.showToast('删除失败');
    }
  },

  async openReport() {
    this.closeDrawer();
    try {
      const data = await getMonthlyReport(this.data.persona);
      this.setData({ report: data.report, reportText: data.summary, reportVisible: true });
    } catch (error) {
      const report = buildReportSummary(this.data.entries);
      this.setData({ report, reportText: '云函数暂不可用，已展示本地统计。', reportVisible: true });
    }
  },

  switchPersona(event) {
    this.setData({ persona: event.currentTarget.dataset.persona });
    this.openReport();
  },

  selectCategory(event) {
    const category = event.currentTarget.dataset.key;
    this.setData({ category, sub: '全部', status: 'all', drawerVisible: false });
    this.refreshView();
  },

  selectSub(event) {
    this.setData({ sub: event.currentTarget.dataset.sub });
    this.refreshView();
  },

  selectStatus(event) {
    const selectedStatus = event.currentTarget.dataset.status;
    this.setData({ status: this.data.status === selectedStatus ? 'all' : selectedStatus });
    this.refreshView();
  },

  clearStatus() {
    this.setData({ status: 'all' });
    this.refreshView();
  },

  openSettings() {
    this.closeDrawer();
    wx.showModal({
      title: '设置',
      content: '请在 config/env.js 配置云开发环境 ID，并在云函数环境变量中配置 LLM_API_KEY。AI Key 不会保存在前端。',
      showCancel: false
    });
  },

  async clearAllEntries() {
    const result = await clearEntries();
    this.setData({ entries: result.entries });
    this.refreshView();
  },

  mockVoice() {
    this.setData({ inputText: '买了iPhone 12 Pro 9299' });
    this.showToast('已填入示例文字，确认后发送');
  },

  openDrawer() {
    this.setData({ drawerVisible: true });
  },

  closeDrawer() {
    this.setData({ drawerVisible: false });
  },

  closeDetail() {
    this.setData({ detailVisible: false });
  },

  closeReport() {
    this.setData({ reportVisible: false });
  },

  stopTap() {},

  showEditPlaceholder() {
    this.showToast('编辑能力后续补齐');
  },

  showAiReply(replyLabel, aiReply) {
    this.setData({ replyLabel, aiReply });
  },

  showToast(title) {
    wx.showToast({ title, icon: 'none' });
  }
});
