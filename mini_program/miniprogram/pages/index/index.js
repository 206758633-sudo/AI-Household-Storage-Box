const { CATEGORY_COLORS, ENTRY_TYPES, EMPTY_ENTRIES, NAV_ITEMS, PERSONAS, SUBTABS } = require('../../core/constants');
const { buildEntryCard, flattenEntries, getEntrySubtype, matchStatusFilter } = require('../../core/entry-view-models');
const { getDaysSince } = require('../../core/date-utils');
const { buildReportSummary } = require('../../core/report-rules');
const {
  clearEntries,
  createEntry,
  deleteEntry,
  getMonthlyReport,
  listEntries,
  refineEntry,
  updateEntry,
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
    editForm: {},
    editVisible: false,
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
    flashId: '',
    pieSections: [],
    pieGradient: '',
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
    this.setData({ loading: true });
    this.showAiReply('🪄 归档中', '本地规则快速收纳中...', 1000);

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
    this.setData({ detail: this.buildDetailView(detail), detailVisible: true });
  },

  buildDetailView(detail) {
    if (!detail || !detail.rawEntry) return {};
    if (detail.type === 'asset') return this.buildAssetDetailView(detail);
    return {
      ...detail,
      typeIcon: ENTRY_TYPES[detail.type].icon,
      attrs: [
        { key: '补充信息', value: detail.meta || '暂无' },
        { key: '来源', value: detail.rawEntry.rawText || '云端记录' }
      ]
    };
  },

  buildAssetDetailView(detail) {
    const entry = detail.rawEntry;
    const buyDateText = this.getAssetBuyDateText(entry);
    const dailyCostText = this.getAssetDailyCostText(entry);
    return {
      ...detail,
      typeIcon: ENTRY_TYPES[detail.type].icon,
      bigText: entry.needDate || !entry.buyDate ? '待补日期' : detail.bigText,
      attrs: [
        { key: '购入价格', value: `${entry.price || 0} 元` },
        { key: '日均成本', value: dailyCostText },
        { key: '购买时间', value: buyDateText },
        { key: '分类', value: entry.cat || '生活' },
        { key: '使用状态', value: entry.status || '使用中' }
      ]
    };
  },

  getAssetBuyDateText(entry) {
    if (!entry.buyDate) return '待补充（AI 无法从一句话得知）';
    return `${entry.buyDate.year}年${entry.buyDate.month}月${entry.buyDate.day}日`;
  },

  getAssetDailyCostText(entry) {
    if (!entry.buyDate) return '待补购买日期';
    const usedDays = getDaysSince(entry.buyDate);
    const dailyCost = Number(entry.price || 0) / Math.max(1, usedDays);
    return `${dailyCost.toFixed(2)} 元/天`;
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

  openEditForm() {
    const detail = this.data.detail || {};
    const entry = detail.rawEntry || {};
    this.setData({
      detailVisible: false,
      editForm: this.buildEditForm(entry),
      editVisible: true
    });
  },

  buildEditForm(entry) {
    const baseForm = {
      entryId: entry._id || entry.id,
      type: entry.type,
      label: ENTRY_TYPES[entry.type].label,
      primaryValue: entry.title || entry.name || entry.text || '',
      amountValue: entry.amount || entry.price || '',
      categoryValue: entry.cat || entry.sub || '',
      cycleValue: entry.cycle || '',
      dateValue: this.formatEditDate(entry),
      moodValue: entry.mood === undefined ? '' : String(entry.mood),
      statusValue: entry.status || '',
      tagsValue: (entry.tags || []).join('，')
    };

    const formMeta = {
      countdown: { primaryLabel: '事件名称', amountLabel: '', categoryLabel: '子分类', dateLabel: '日期' },
      checkin: { primaryLabel: '习惯名称', amountLabel: '', categoryLabel: '分类', dateLabel: '' },
      ledger: { primaryLabel: '账目名称', amountLabel: '金额', categoryLabel: '分类', dateLabel: '' },
      asset: { primaryLabel: '资产名称', amountLabel: '价格', categoryLabel: '分类', dateLabel: '购买日期', statusLabel: '使用状态' },
      subscription: { primaryLabel: '订阅名称', amountLabel: '价格', categoryLabel: '分类', dateLabel: '', cycleLabel: '周期' },
      note: { primaryLabel: '内容', amountLabel: '', categoryLabel: '', dateLabel: '', moodLabel: '心情分值', tagsLabel: '标签' }
    };
    return { ...baseForm, ...formMeta[entry.type] };
  },

  formatEditDate(entry) {
    if (entry.type === 'countdown' && entry.date) {
      const year = entry.date.year ? `${entry.date.year}-` : '';
      return `${year}${String(entry.date.month).padStart(2, '0')}-${String(entry.date.day).padStart(2, '0')}`;
    }
    if (entry.type === 'asset' && entry.buyDate) {
      return `${entry.buyDate.year}-${String(entry.buyDate.month).padStart(2, '0')}-${String(entry.buyDate.day).padStart(2, '0')}`;
    }
    return '';
  },

  handleEditInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`editForm.${field}`]: event.detail.value });
  },

  buildUpdateFields(editForm) {
    if (editForm.type === 'countdown') return { title: editForm.primaryValue, sub: editForm.categoryValue, date: this.parseCountdownDate(editForm.dateValue) };
    if (editForm.type === 'checkin') return { name: editForm.primaryValue, cat: editForm.categoryValue };
    if (editForm.type === 'ledger') return { title: editForm.primaryValue, amount: Number(editForm.amountValue || 0), cat: editForm.categoryValue };
    if (editForm.type === 'asset') return { name: editForm.primaryValue, price: Number(editForm.amountValue || 0), cat: editForm.categoryValue, buyDateText: editForm.dateValue, status: editForm.statusValue || '使用中' };
    if (editForm.type === 'subscription') return { name: editForm.primaryValue, price: Number(editForm.amountValue || 0), cycle: editForm.cycleValue || '月', cat: editForm.categoryValue };
    return { text: editForm.primaryValue, mood: Number(editForm.moodValue || 0), tags: this.splitTags(editForm.tagsValue) };
  },

  parseCountdownDate(dateValue) {
    const matchedDate = String(dateValue || '').match(/^(?:(\d{4})-)?(\d{1,2})-(\d{1,2})$/);
    if (!matchedDate) return { month: 1, day: 1 };
    return {
      year: matchedDate[1] ? Number(matchedDate[1]) : null,
      month: Number(matchedDate[2]),
      day: Number(matchedDate[3])
    };
  },

  splitTags(tagsValue) {
    return String(tagsValue || '').split(/[,，\s]+/).filter(Boolean);
  },

  async saveEdit() {
    const editForm = this.data.editForm;
    if (!editForm.entryId || !editForm.primaryValue) {
      this.showToast('请填写主要内容');
      return;
    }
    try {
      const result = await updateEntry(editForm.entryId, this.buildUpdateFields(editForm));
      this.setData({ entries: result.entries, editVisible: false, editForm: {} });
      this.refreshView();
      this.showToast('已保存');
    } catch (error) {
      this.showToast('保存失败');
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

  clearAllEntries() {
    wx.showModal({
      title: '确认清空',
      content: '将删除全部记录，无法恢复',
      success: async (res) => {
        if (!res.confirm) return;
        const result = await clearEntries();
        this.setData({ entries: result.entries });
        this.refreshView();
      }
    });
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

  closeEdit() {
    this.setData({ editVisible: false, editForm: {} });
  },

  closeReport() {
    this.setData({ reportVisible: false });
  },

  stopTap() {},

  showAiReply(replyLabel, aiReply, duration = 1800) {
    if (this.aiReplyTimer) clearTimeout(this.aiReplyTimer);
    this.setData({ replyLabel, aiReply });
    this.aiReplyTimer = setTimeout(() => {
      this.setData({ replyLabel: 'AI', aiReply: '' });
      this.aiReplyTimer = null;
    }, duration);
  },

  showToast(title) {
    wx.showToast({ title, icon: 'none' });
  }
});
