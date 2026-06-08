const ZODIAC_ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
const CONSTELLATION_DAYS = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22];
const CONSTELLATION_NAMES = ['摩羯', '水瓶', '双鱼', '白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯'];
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getZodiacAnimal(year) {
  return ZODIAC_ANIMALS[((year - 4) % 12 + 12) % 12];
}

function getConstellation(month, day) {
  return day < CONSTELLATION_DAYS[month - 1]
    ? CONSTELLATION_NAMES[month - 1]
    : CONSTELLATION_NAMES[month];
}

function getNextYearlyDate(month, day, today = new Date()) {
  const base = startOfDay(today);
  let targetDate = new Date(base.getFullYear(), month - 1, day);
  if (targetDate < base) {
    targetDate = new Date(base.getFullYear() + 1, month - 1, day);
  }
  return targetDate;
}

function getNextMonthlyDate(day, today = new Date()) {
  const base = startOfDay(today);
  let targetDate = new Date(base.getFullYear(), base.getMonth(), day);
  if (targetDate < base) {
    targetDate = new Date(base.getFullYear(), base.getMonth() + 1, day);
  }
  return targetDate;
}

function getDaysBetween(targetDate, today = new Date()) {
  return Math.round((startOfDay(targetDate) - startOfDay(today)) / DAY_MS);
}

function getDaysSince(dateParts, today = new Date()) {
  if (!dateParts || !dateParts.year) {
    return 0;
  }
  const targetDate = new Date(dateParts.year, dateParts.month - 1, dateParts.day);
  return Math.max(0, Math.round((startOfDay(today) - targetDate) / DAY_MS));
}

function formatDuration(days) {
  const years = Math.floor(days / 365);
  const remainDays = days - years * 365;
  const months = Math.floor(remainDays / 30);
  const restDays = remainDays - months * 30;

  if (years > 0) return `${years}年${remainDays}天`;
  if (months > 0) return `${months}月${restDays}天`;
  return `${days}天`;
}

function formatMonthDay(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

module.exports = {
  formatDuration,
  formatMonthDay,
  getConstellation,
  getDaysBetween,
  getDaysSince,
  getNextMonthlyDate,
  getNextYearlyDate,
  getZodiacAnimal
};

