const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SAMPLE_PATH = path.join(ROOT, 'user_data_sample.json');
const JSON_DIR = path.join(ROOT, 'jsons');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function money(n) {
  return n.toFixed(2);
}

function updateInvoices(data, options) {
  const next = options.totalDueNum;
  const prev = options.prevDueNum;
  const old = options.oldDueNum;

  if (data.currentBilling) {
    data.currentBilling.totalDue = money(next);
    data.currentBilling.status = options.billStatus;
    data.currentBilling.invoiceNumber = options.invoiceNumber;
  }

  if (data.homePageSummary) {
    data.homePageSummary.totalAmount = money(next);
  }

  if (data.dashboardStatistics) {
    data.dashboardStatistics.monthlySpend = money(next);
    data.dashboardStatistics.averageSpend = money(options.averageSpendNum);
    data.dashboardStatistics.remainingBudget = money(options.remainingBudgetNum);
  }

  if (data.billBreakdown) {
    data.billBreakdown.finalTotal = money(next);
    data.billBreakdown.totalCharges = money(next - options.adjustmentsNum);
    data.billBreakdown.adjustments = money(options.adjustmentsNum);
  }

  if (data.reportSummary && Array.isArray(data.reportSummary.invoicesAvailable)) {
    if (data.reportSummary.invoicesAvailable[0]) data.reportSummary.invoicesAvailable[0].amount = money(next);
    if (data.reportSummary.invoicesAvailable[1]) data.reportSummary.invoicesAvailable[1].amount = money(prev);
    if (data.reportSummary.invoicesAvailable[2]) data.reportSummary.invoicesAvailable[2].amount = money(old);
  }

  if (data.adhocReportsData && Array.isArray(data.adhocReportsData.invoiceHistory)) {
    if (data.adhocReportsData.invoiceHistory[0]) data.adhocReportsData.invoiceHistory[0].amount = money(next);
    if (data.adhocReportsData.invoiceHistory[1]) data.adhocReportsData.invoiceHistory[1].amount = money(prev);
    if (data.adhocReportsData.invoiceHistory[2]) data.adhocReportsData.invoiceHistory[2].amount = money(old);
  }

  if (data.paymentsTabData && Array.isArray(data.paymentsTabData.upcomingPayments)) {
    if (data.paymentsTabData.upcomingPayments[0]) data.paymentsTabData.upcomingPayments[0].amount = money(options.nextMonthDueNum);
    if (data.paymentsTabData.upcomingPayments[1]) data.paymentsTabData.upcomingPayments[1].amount = money(options.afterNextMonthDueNum);
  }

  if (data.comparisonTrendsData && data.comparisonTrendsData.thisMonth) {
    data.comparisonTrendsData.thisMonth.amount = Math.round(next);
    data.comparisonTrendsData.thisMonth.previousMonth = Math.round(prev);
  }

  if (data.forecastData) {
    if (Array.isArray(data.forecastData.actualBills) && data.forecastData.actualBills.length) {
      data.forecastData.actualBills[data.forecastData.actualBills.length - 1] = Math.round(next);
    }
    if (Array.isArray(data.forecastData.forecastBills) && data.forecastData.forecastBills.length >= 3) {
      data.forecastData.forecastBills[0] = Math.round(options.nextMonthDueNum);
      data.forecastData.forecastBills[1] = Math.round(options.afterNextMonthDueNum);
      data.forecastData.forecastBills[2] = Math.round(options.afterNextMonthDueNum * 0.95);
    }
  }

  if (data.historicalMonthlyData && Array.isArray(data.historicalMonthlyData.totals) && data.historicalMonthlyData.totals.length) {
    data.historicalMonthlyData.totals[data.historicalMonthlyData.totals.length - 1] = Math.round(next);
  }
}

function updateConnections(data, options) {
  const departments = options.departments;
  const names = options.connectionNames;
  const spends = options.connectionSpendsNum;
  let totalFromConnections = 0;

  (data.connections || []).forEach((c, idx) => {
    if (names[idx]) c.employeeName = names[idx];
    if (departments[idx]) c.department = departments[idx];
    if (typeof spends[idx] === 'number') c.monthlySpend = money(spends[idx]);
    c.phoneNumber = String(Number(options.phoneStart) + idx);
    c.costCenter = `CC-${(c.department || 'GEN').slice(0, 3).toUpperCase()}-0${idx + 1}`;
    totalFromConnections += toNum(c.monthlySpend);
  });

  if (data.homePageSummary && Array.isArray(data.homePageSummary.connectionsTable)) {
    data.homePageSummary.connectionsTable.forEach((row, idx) => {
      row.number = String(Number(options.phoneStart) + idx);
      if (names[idx]) row.employee = names[idx];
      if (departments[idx]) row.department = departments[idx];
      if (typeof spends[idx] === 'number') row.monthlySpend = money(spends[idx]);
    });
  }

  if (Array.isArray(data.billBreakdownByConnection)) {
    data.billBreakdownByConnection.forEach((row, idx) => {
      row.phoneNumber = String(Number(options.phoneStart) + idx);
      if (names[idx]) row.employeeName = names[idx];
      if (departments[idx]) row.department = departments[idx];
      if (typeof spends[idx] === 'number') row.subtotal = money(spends[idx]);
    });
  }

  return totalFromConnections;
}

function applyCommonEdits(data, options) {
  data.accountSummary.accountNumber = options.accountNumber;
  data.currentBilling.invoiceNumber = options.invoiceNumber;
  data.currentBilling.status = options.billStatus;
  data.paymentInformation.bankDetails.accountNumber = options.bankMasked;
  data.paymentInformation.bankDetails.upiId = options.upiId;
  data.documentMetadata.generatedAt = options.generatedAt;
  data.documentMetadata.lastUpdated = options.lastUpdated;
  data.documentMetadata.dataVersion = options.dataVersion;

  if (Array.isArray(data.usageAlerts) && data.usageAlerts[0]) {
    data.usageAlerts[0].employee = options.primaryContact;
  }

  const connectionTotal = updateConnections(data, options);

  const totalDueNum = options.totalDueNum || connectionTotal;
  updateInvoices(data, {
    totalDueNum,
    prevDueNum: options.prevDueNum,
    oldDueNum: options.oldDueNum,
    billStatus: options.billStatus,
    invoiceNumber: options.invoiceNumber,
    averageSpendNum: options.averageSpendNum,
    remainingBudgetNum: options.remainingBudgetNum,
    adjustmentsNum: options.adjustmentsNum,
    nextMonthDueNum: options.nextMonthDueNum,
    afterNextMonthDueNum: options.afterNextMonthDueNum
  });

  return data;
}

function createAdarsh(base) {
  const data = clone(base);
  return applyCommonEdits(data, {
    accountNumber: 'ENT-99341022',
    invoiceNumber: 'INV-2026-04-1022',
    totalDueNum: 9124.0,
    billStatus: 'Unpaid',
    averageSpendNum: 7420.8,
    remainingBudgetNum: 876.0,
    adjustmentsNum: 420.5,
    prevDueNum: 8450.0,
    oldDueNum: 7998.5,
    nextMonthDueNum: 9380.0,
    afterNextMonthDueNum: 9010.0,
    bankMasked: 'XXXXXXXXX1022',
    upiId: 'adarshcorp@okhdfc',
    primaryContact: 'Adarsh Pandey',
    phoneStart: '9123401100',
    generatedAt: '2026-04-05T09:10:00Z',
    lastUpdated: '2026-04-05',
    dataVersion: '1.1',
    connectionNames: ['Adarsh Pandey', 'Neha Shukla', 'Harshit Verma', 'Ritu Jain', 'Faizan Khan'],
    departments: ['Leadership', 'Sales', 'Engineering', 'Finance', 'Operations'],
    connectionSpendsNum: [3250.0, 2050.5, 1680.0, 924.0, 1219.5]
  });
}

function createKritik(base) {
  const data = clone(base);
  return applyCommonEdits(data, {
    accountNumber: 'ENT-77452031',
    invoiceNumber: 'INV-2026-04-2031',
    totalDueNum: 6488.75,
    billStatus: 'Paid',
    averageSpendNum: 6210.4,
    remainingBudgetNum: 2511.25,
    adjustmentsNum: 188.75,
    prevDueNum: 6312.0,
    oldDueNum: 6075.5,
    nextMonthDueNum: 6740.0,
    afterNextMonthDueNum: 6595.0,
    bankMasked: 'XXXXXXXXX2031',
    upiId: 'kritikventures@okicici',
    primaryContact: 'Kritik Mishra',
    phoneStart: '9345202100',
    generatedAt: '2026-04-06T11:25:00Z',
    lastUpdated: '2026-04-06',
    dataVersion: '1.1',
    connectionNames: ['Kritik Mishra', 'Tanya Arora', 'Mohit Sinha', 'Devika Rao', 'Arjun Das'],
    departments: ['Management', 'Marketing', 'Product', 'Support', 'Finance'],
    connectionSpendsNum: [2299.0, 1320.75, 1148.5, 889.0, 831.5]
  });
}

function createSana(base) {
  const data = clone(base);
  return applyCommonEdits(data, {
    accountNumber: 'ENT-55098114',
    invoiceNumber: 'INV-2026-04-8114',
    totalDueNum: 11492.25,
    billStatus: 'Unpaid',
    averageSpendNum: 10088.4,
    remainingBudgetNum: 507.75,
    adjustmentsNum: 612.25,
    prevDueNum: 10225.0,
    oldDueNum: 9840.0,
    nextMonthDueNum: 12080.0,
    afterNextMonthDueNum: 11720.0,
    bankMasked: 'XXXXXXXXX8114',
    upiId: 'sanainfotech@oksbi',
    primaryContact: 'Sana Khan',
    phoneStart: '9567804400',
    generatedAt: '2026-04-07T13:00:00Z',
    lastUpdated: '2026-04-07',
    dataVersion: '1.1',
    connectionNames: ['Sana Khan', 'Ishaan Gupta', 'Megha Nair', 'Rohan Batra', 'Pooja Kulkarni'],
    departments: ['Executive', 'Tech', 'Sales', 'Operations', 'Legal'],
    connectionSpendsNum: [3780.0, 2475.25, 1930.0, 1687.0, 1620.0]
  });
}

function writeJson(fileName, data) {
  const outPath = path.join(JSON_DIR, fileName);
  fs.writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Created: ${path.relative(ROOT, outPath)}`);
}

function main() {
  ensureDir(JSON_DIR);
  const base = JSON.parse(fs.readFileSync(SAMPLE_PATH, 'utf8'));

  writeJson('adarsh_pandey.json', createAdarsh(base));
  writeJson('kritik_mishra.json', createKritik(base));
  writeJson('sana_khan.json', createSana(base));
}

main();
