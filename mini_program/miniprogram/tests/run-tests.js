const assert = require('assert');
const {
  getConstellation,
  getDaysBetween,
  getDaysSince,
  getNextYearlyDate,
  getZodiacAnimal
} = require('../core/date-utils');
const { buildEntryCard, matchStatusFilter } = require('../core/entry-view-models');
const { buildReportSummary, sumLedgerAmount } = require('../core/report-rules');
const { routeText } = require('../../cloud_functions/storage_box_api/local_router');

function testRouteLedgerWhenInputHasMilkTeaAmount() {
  const result = routeText('奶茶18');
  assert.strictEqual(result.type, 'ledger');
  assert.strictEqual(result.fields.amount, 18);
  assert.strictEqual(result.fields.cat, '餐饮');
}

function testRouteCountdownWhenInputHasBirthdayDate() {
  const result = routeText('老爸生日1963年5月23');
  assert.strictEqual(result.type, 'countdown');
  assert.strictEqual(result.fields.date.year, 1963);
  assert.strictEqual(result.fields.person, true);
}

function testRouteAssetWhenDurableAmountIsHigh() {
  const result = routeText('买了iPhone 12 Pro 9299');
  assert.strictEqual(result.type, 'asset');
  assert.strictEqual(result.fields.price, 9299);
  assert.strictEqual(result.fields.needDate, true);
}

function testRouteCheckinWhenInputHasHabit() {
  const result = routeText('今天喝水了');
  assert.strictEqual(result.type, 'checkin');
  assert.strictEqual(result.fields.cat, '生活');
}

function testCountdownMetaWhenBirthdayHasYear() {
  const today = new Date(2026, 5, 7);
  const card = buildEntryCard({
    type: 'countdown',
    title: '老爸生日',
    date: { year: 1963, month: 5, day: 23 },
    person: true,
    sub: '生日'
  }, today);

  assert.strictEqual(getZodiacAnimal(1963), '兔');
  assert.strictEqual(getConstellation(5, 23), '双子');
  assert.ok(card.extra.includes('属兔'));
  assert.ok(card.extra.includes('双子'));
}

function testNextYearlyDateWhenDateAlreadyPassed() {
  const today = new Date(2026, 5, 7);
  const nextDate = getNextYearlyDate(5, 23, today);
  assert.strictEqual(nextDate.getFullYear(), 2027);
  assert.strictEqual(getDaysBetween(nextDate, today), 350);
}

function testAssetDailyCostWhenBuyDateExists() {
  const today = new Date(2026, 5, 7);
  const usedDays = getDaysSince({ year: 2020, month: 11, day: 10 }, today);
  const card = buildEntryCard({
    type: 'asset',
    name: 'iPhone',
    price: 9299,
    buyDate: { year: 2020, month: 11, day: 10 },
    needDate: false,
    cat: '电子产品'
  }, today);

  assert.ok(usedDays > 0);
  assert.ok(card.meta.includes('元/天'));
}

function testUrgentStatusWhenSubscriptionWithinFourteenDays() {
  const today = new Date(2026, 5, 7);
  const entry = {
    type: 'subscription',
    name: 'iCloud',
    cycle: '月',
    price: 6,
    billDate: { day: 15 },
    cat: '生活'
  };
  assert.strictEqual(matchStatusFilter(entry, 'urgent', today), true);
}

function testReportSummaryWhenLedgerExists() {
  const report = buildReportSummary({
    ledger: [
      { amount: 18, cat: '餐饮' },
      { amount: 12, cat: '交通' }
    ],
    checkin: [{ count: 3 }],
    note: []
  });

  assert.strictEqual(sumLedgerAmount([{ amount: 18 }, { amount: 12 }]), 30);
  assert.strictEqual(report.totalAmount, 30);
  assert.strictEqual(report.totalCheckins, 3);
}

const tests = [
  testRouteLedgerWhenInputHasMilkTeaAmount,
  testRouteCountdownWhenInputHasBirthdayDate,
  testRouteAssetWhenDurableAmountIsHigh,
  testRouteCheckinWhenInputHasHabit,
  testCountdownMetaWhenBirthdayHasYear,
  testNextYearlyDateWhenDateAlreadyPassed,
  testAssetDailyCostWhenBuyDateExists,
  testUrgentStatusWhenSubscriptionWithinFourteenDays,
  testReportSummaryWhenLedgerExists
];

tests.forEach((testCase) => {
  testCase();
});

process.stdout.write(`${tests.length} tests passed\n`);

