const ENTRY_TYPES = {
  all: { icon: '🗂️', label: '全部', desc: '所有生活记录都在这里' },
  countdown: { icon: '📅', label: '倒数日', desc: '生日、账单、纪念日会自动倒数' },
  checkin: { icon: '⏰', label: '打卡', desc: '喝水、运动、学习都能一句话打卡' },
  ledger: { icon: '💰', label: '记账', desc: '消费会自动归入 5 个白名单分类' },
  asset: { icon: '📦', label: '资产', desc: '耐用品会显示已经陪你多久' },
  subscription: { icon: '💳', label: '订阅', desc: '会员、续费和账单会自动提醒' },
  note: { icon: '🌙', label: '随手记', desc: '心情和碎片想法先收起来' }
};

const NAV_ITEMS = [
  { key: 'all', icon: '🗂️', label: '全部' },
  { key: 'countdown', icon: '📅', label: '倒数日' },
  { key: 'checkin', icon: '⏰', label: '打卡' },
  { key: 'ledger', icon: '💰', label: '记账' },
  { key: 'asset', icon: '📦', label: '资产' },
  { key: 'subscription', icon: '💳', label: '订阅' },
  { key: 'note', icon: '🌙', label: '随手记' }
];

const SUBTABS = {
  all: [],
  countdown: ['全部', '生日', '账单', '纪念日'],
  checkin: ['全部', '运动', '生活', '学习'],
  ledger: ['全部', '餐饮', '交通', '购物', '娱乐', '其他'],
  asset: ['全部', '电子产品', '生活'],
  subscription: ['全部', '工作', '学习', '生活'],
  note: ['全部']
};

const CATEGORY_COLORS = {
  '餐饮': '#F2994A',
  '交通': '#5B8DEF',
  '购物': '#E26D9B',
  '娱乐': '#9B6DE2',
  '其他': '#9aa0a6'
};

const MOOD_EMOJI = {
  '-2': '😣',
  '-1': '🙁',
  '0': '😐',
  '1': '🙂',
  '2': '😍'
};

const PERSONAS = ['温柔', '毒舌', '老妈'];

const EMPTY_ENTRIES = {
  countdown: [],
  checkin: [],
  ledger: [],
  asset: [],
  subscription: [],
  note: []
};

module.exports = {
  CATEGORY_COLORS,
  EMPTY_ENTRIES,
  ENTRY_TYPES,
  MOOD_EMOJI,
  NAV_ITEMS,
  PERSONAS,
  SUBTABS
};

