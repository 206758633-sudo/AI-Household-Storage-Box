const LEDGER_KEYWORDS = {
  '餐饮': ['奶茶', '咖啡', '饭', '餐', '外卖', '早餐', '午饭', '晚饭', '零食', '火锅', '茶'],
  '交通': ['打车', '地铁', '公交', '车费', '加油', '高铁', '机票', '滴滴', '停车'],
  '购物': ['衣服', '鞋', '超市', '淘宝', '京东', '买了', '入手'],
  '娱乐': ['电影', '游戏', '演唱会', '剧', '门票', '唱歌']
};

const DURABLE_WORDS = ['手机', '电脑', '平板', 'iphone', 'ipad', 'mac', 'watch', '相机', '投影', '洗碗机', '机器人', '耳机', '显示器', '键盘', 'switch', '手表', '空调', '冰箱'];
const SUBSCRIPTION_WORDS = ['每月', '每年', '包月', '包年', '会员', '订阅', '续费', '续了', 'icloud', '网盘', 'midjourney', 'chatgpt', 'plus', 'vip', '加速器'];
const HABIT_WORDS = ['打卡', '坚持', '喝水', '跑步', '健身', '读书', '早起', '散步', '游泳', '跳绳', '背单词', '冥想', '护肤'];
const POSITIVE_WORDS = ['开心', '上线', '成功', '好看', '高兴', '爽', '棒', '喜欢', '治愈', '幸福', '值'];
const NEGATIVE_WORDS = ['累', '烦', '头疼', '难过', '哭', '崩溃', '焦虑', '气', '丧', '疼'];

function getNumbers(text) {
  return (text.match(/\d+(?:\.\d+)?/g) || []).map(Number);
}

function getAmount(text) {
  const numbers = getNumbers(text);
  return numbers.length ? Math.max(...numbers) : null;
}

function getLedgerCategory(text) {
  const loweredText = text.toLowerCase();
  const category = Object.keys(LEDGER_KEYWORDS).find((key) => LEDGER_KEYWORDS[key].some((word) => loweredText.includes(word)));
  return category || '其他';
}

function getMoodScore(text) {
  const positiveCount = POSITIVE_WORDS.filter((word) => text.includes(word)).length;
  const negativeCount = NEGATIVE_WORDS.filter((word) => text.includes(word)).length;
  return Math.max(-2, Math.min(2, positiveCount - negativeCount));
}

function getNoteTags(text) {
  const tags = [];
  if (/工作|项目|会议|上线|加班/.test(text)) tags.push('工作');
  if (/累|烦|焦虑|崩溃/.test(text)) tags.push('情绪');
  if (/妈|爸|家|女儿|孩子/.test(text)) tags.push('家人');
  if (!tags.length) tags.push('待分类');
  return tags;
}

function parseDateText(text) {
  const dateMatch = text.match(/(?:(\d{4})\s*年)?\s*(\d{1,2})\s*月\s*(\d{1,2})/);
  if (!dateMatch) return null;
  return {
    year: dateMatch[1] ? Number(dateMatch[1]) : null,
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3])
  };
}

function routeSubscription(text, amount) {
  const cycle = /年/.test(text) ? '年' : '月';
  const name = text.replace(/续了?|订阅|开通|的?会员|每月|每年|包月|包年|\d+元?|¥/g, '').replace(/[，,。.\s]/g, '') || '某订阅';
  return {
    type: 'subscription',
    fields: { name, cycle, price: amount || 0, billDate: { day: new Date().getDate() }, cat: /学习|课程/.test(text) ? '学习' : '生活' },
    reply: `记好啦，${name}订阅会帮你看着。`
  };
}

function routeAsset(text, amount) {
  const name = text.replace(/买了?|入手|购入|新增?/g, '').replace(/\d+(\.\d+)?元?/g, '').replace(/[¥，,。]/g, '').trim() || '新物品';
  return {
    type: 'asset',
    fields: { name, price: amount, buyDate: null, needDate: true, cat: /手机|电脑|ipad|相机|耳机|watch/i.test(text) ? '电子产品' : '生活', status: '使用中' },
    reply: `先收进资产，购买日期之后可以补。`
  };
}

function routeCountdown(text, dateParts) {
  const title = text.replace(/(\d{4})?\s*年?\s*\d{1,2}\s*月\s*\d{1,2}日?/, '').replace(/[，,。.\s]/g, '') || '某个日子';
  return {
    type: 'countdown',
    fields: { title, date: dateParts, recurring: true, person: /生日|爸|妈|老公|老婆|孩子/.test(text), sub: /生日/.test(text) ? '生日' : '纪念日' },
    reply: `记下啦，${title}不会忘。`
  };
}

function routeLedger(text, amount) {
  const cat = getLedgerCategory(text);
  const title = text.replace(/\d+(\.\d+)?元?/g, '').replace(/[，,。.\s]/g, '') || cat;
  return {
    type: 'ledger',
    fields: { title, amount, cat, date: new Date().toISOString() },
    reply: `记上啦，${cat} ¥${amount}。`
  };
}

function routeCheckin(text) {
  const name = HABIT_WORDS.find((word) => text.includes(word)) || text.replace(/今天|又|了|打卡/g, '').replace(/[，,。.\s]/g, '') || '打卡';
  return {
    type: 'checkin',
    fields: { name, count: 1, history: [true], cat: /跑步|健身|游泳|跳绳|运动/.test(text) ? '运动' : /读书|学习|背/.test(text) ? '学习' : '生活' },
    reply: `第 1 次「${name}」，继续保持。`
  };
}

function routeNote(text) {
  return {
    type: 'note',
    fields: { text, mood: getMoodScore(text), tags: getNoteTags(text), date: new Date().toISOString() },
    reply: '这条先放随手记啦。'
  };
}

function routeText(rawText) {
  const text = String(rawText || '').trim();
  const loweredText = text.toLowerCase();
  const amount = getAmount(text);
  const dateParts = parseDateText(text);

  if (SUBSCRIPTION_WORDS.some((word) => loweredText.includes(word))) return routeSubscription(text, amount);
  if (amount !== null && amount >= 300 && DURABLE_WORDS.some((word) => loweredText.includes(word))) return routeAsset(text, amount);
  if (dateParts) return routeCountdown(text, dateParts);
  if (amount !== null && /(买|花|付|充|打车|地铁|奶茶|咖啡|饭|餐|电影|衣服|鞋|超市|外卖|车费|元|块|¥)/.test(text)) return routeLedger(text, amount);
  if (HABIT_WORDS.some((word) => loweredText.includes(word))) return routeCheckin(text);
  return routeNote(text);
}

module.exports = {
  routeText
};

