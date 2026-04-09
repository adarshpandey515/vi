const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TEMPLATE_PATH = path.join(ROOT, 'Vi_Enterprise_Combined.html');
const JSON_DIR = path.join(ROOT, 'jsons');
const OUTPUT_DIR = path.join(ROOT, 'html');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function toNumber(value, fallback = 0) {
  const raw = typeof value === 'string' ? value.replace(/,/g, '').trim() : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMonth(label) {
  if (typeof label !== 'string') return 'NA';
  return label.slice(0, 3);
}

function escapeJsSingleQuoted(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, ' ');
}

function jsString(value) {
  return `'${escapeJsSingleQuoted(value)}'`;
}

const CP1252_UNICODE_TO_BYTE = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

function mojibakeScore(value) {
  const matches = String(value).match(/[\u00C2\u00C3\u00E0\u00E2\u00F0]/g);
  return matches ? matches.length : 0;
}

function decodeCp1252Utf8IfBetter(value) {
  const input = String(value);
  const bytes = [];

  for (const ch of input) {
    const cp = ch.codePointAt(0);
    if (cp <= 0xff) {
      bytes.push(cp);
      continue;
    }

    const mapped = CP1252_UNICODE_TO_BYTE.get(cp);
    if (mapped !== undefined) {
      bytes.push(mapped);
      continue;
    }

    // Preserve genuine Unicode characters by appending their UTF-8 bytes.
    const utf8 = Buffer.from(ch, 'utf8');
    for (const b of utf8) bytes.push(b);
  }

  const decoded = Buffer.from(bytes).toString('utf8');
  if (decoded.includes('\uFFFD')) {
    return input;
  }

  return mojibakeScore(decoded) < mojibakeScore(input) ? decoded : input;
}

function repairMojibakeText(html) {
  const input = String(html);
  if (!/[\u00C2\u00C3\u00E0\u00E2\u00F0]/.test(input)) {
    return input;
  }

  return input
    .split('\n')
    .map((line) => (/[\u00C2\u00C3\u00E0\u00E2\u00F0]/.test(line) ? decodeCp1252Utf8IfBetter(line) : line))
    .join('\n');
}

function formatINR(value) {
  const num = toNumber(value, 0);
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseDDMMYYYY(value) {
  if (typeof value !== 'string') return null;
  const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return null;
  return { dd, mm, yyyy };
}

function monthName(mm, shortName = true) {
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const idx = Number(mm) - 1;
  if (idx < 0 || idx > 11) return '';
  return shortName ? monthsShort[idx] : monthsLong[idx];
}

function toShortDateLabel(ddmmyyyy) {
  const p = parseDDMMYYYY(ddmmyyyy);
  if (!p) return String(ddmmyyyy || '');
  return `${String(p.dd).padStart(2, '0')} ${monthName(p.mm, true)} ${p.yyyy}`;
}

function toLongDateLabel(ddmmyyyy) {
  const p = parseDDMMYYYY(ddmmyyyy);
  if (!p) return String(ddmmyyyy || '');
  return `${String(p.dd).padStart(2, '0')} ${monthName(p.mm, false)} ${p.yyyy}`;
}

function toPeriodRangeLabel(startDate, endDate) {
  const s = parseDDMMYYYY(startDate);
  const e = parseDDMMYYYY(endDate);
  if (!s || !e) return `${startDate || ''} - ${endDate || ''}`.trim();

  if (s.mm === e.mm && s.yyyy === e.yyyy) {
    return `${String(s.dd).padStart(2, '0')} ${monthName(s.mm, true)} - ${String(e.dd).padStart(2, '0')} ${monthName(e.mm, true)} ${e.yyyy}`;
  }

  return `${String(s.dd).padStart(2, '0')} ${monthName(s.mm, true)} ${s.yyyy} - ${String(e.dd).padStart(2, '0')} ${monthName(e.mm, true)} ${e.yyyy}`;
}

function buildTemplateState(data) {
  const historical = data.historicalMonthlyData || {};
  const months = Array.isArray(historical.months) && historical.months.length
    ? historical.months.map(normalizeMonth)
    : ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

  const totals = Array.isArray(historical.totals) && historical.totals.length
    ? historical.totals.map((v) => Math.round(toNumber(v, 0)))
    : [];

  const plans = Array.isArray(historical.plans) && historical.plans.length
    ? historical.plans.map((v) => Math.round(toNumber(v, 0)))
    : [];

  const usage = Array.isArray(historical.usage) && historical.usage.length
    ? historical.usage.map((v) => Math.round(toNumber(v, 0)))
    : [];

  const addOns = Array.isArray(historical.addOns) && historical.addOns.length
    ? historical.addOns.map((v) => Math.round(toNumber(v, 0)))
    : [];

  const roaming = Array.isArray(historical.roaming) && historical.roaming.length
    ? historical.roaming.map((v) => Math.round(toNumber(v, 0)))
    : [];

  const taxes = Array.isArray(historical.taxes) && historical.taxes.length
    ? historical.taxes.map((v) => Math.round(toNumber(v, 0)))
    : [];

  const phoneBreakdown = new Map();
  const byConnection = Array.isArray(data.billBreakdownByConnection) ? data.billBreakdownByConnection : [];
  for (const row of byConnection) {
    phoneBreakdown.set(String(row.phoneNumber || ''), row);
  }

  const voiceMap = new Map();
  const voiceRows = data.voiceAndSmsMetrics && Array.isArray(data.voiceAndSmsMetrics.connectionBreakdown)
    ? data.voiceAndSmsMetrics.connectionBreakdown
    : [];
  for (const row of voiceRows) {
    voiceMap.set(String(row.phoneNumber || ''), row);
  }

  const connections = Array.isArray(data.connections) ? data.connections : [];

  const ud = connections.map((c) => {
    const num = String(c.phoneNumber || 'NA');
    const voiceRow = voiceMap.get(num) || {};
    const dataUsed = toNumber(c.usage && c.usage.data && c.usage.data.used, 0);
    const dataLimit = toNumber(c.usage && c.usage.data && c.usage.data.limit, 1);
    const smsObj = voiceRow.sms || {};
    const callsObj = voiceRow.calls || {};
    const smsUsed = toNumber(smsObj.used, toNumber(voiceRow.smsUsed, toNumber(c.usage && c.usage.sms && c.usage.sms.used, 0)));
    const smsLimit = toNumber(smsObj.limit, toNumber(voiceRow.smsLimit, 1000));
    const callUsed = toNumber(callsObj.used, toNumber(voiceRow.callsUsed, toNumber(c.usage && c.usage.calls && c.usage.calls.used, 0)));
    const callLimit = toNumber(callsObj.limit, toNumber(voiceRow.callsLimit, 3000));
    const planLabel = `Vi Enterprise ${c.plan && (c.plan.code || c.plan.name) ? (c.plan.code || c.plan.name) : 'Plan'}`;

    return {
      data: dataUsed.toFixed(1),
      limit: String(Math.round(dataLimit)),
      pct: Math.round((dataUsed / (dataLimit || 1)) * 100),
      plan: planLabel,
      sms: Math.round(smsUsed),
      smsMax: Math.round(smsLimit),
      call: Math.round(callUsed),
      callMax: Math.round(callLimit),
    };
  });

  const connData = connections.map((c) => {
    const num = String(c.phoneNumber || 'NA');
    const breakdown = phoneBreakdown.get(num) || {};
    const lineItemsRaw = Array.isArray(breakdown.lineItems) ? breakdown.lineItems : [];

    let items = lineItemsRaw.map((item) => [
      String(item.description || 'Charge Item'),
      String(item.category || 'Other'),
      toNumber(item.amount, 0),
    ]);

    if (!items.length) {
      const charges = c.charges || {};
      items = [
        [`${c.plan && c.plan.code ? c.plan.code : c.plan && c.plan.name ? c.plan.name : 'Plan'} (${num})`, 'Plan Rental', toNumber(charges.planCost || (c.plan && c.plan.baseCost), 0)],
        ['Data Overage', 'Data Overage', toNumber(charges.dataOverage, 0)],
        ['International Roaming', 'Intl Roaming', toNumber(charges.roaming, 0)],
        ['Value Added Services', 'Add-Ons', toNumber(charges.vas, 0)],
        ['GST allocation', 'Taxes', toNumber(charges.tax, 0)],
      ].filter((row) => row[2] > 0);
    }

    return {
      num,
      name: String(c.employeeName || 'Unknown User'),
      plan: String(c.plan && (c.plan.code || c.plan.name) ? (c.plan.code || c.plan.name) : 'NA'),
      planCost: toNumber(c.charges && c.charges.planCost, toNumber(c.plan && c.plan.baseCost, 0)),
      dataOvg: toNumber(c.charges && c.charges.dataOverage, 0),
      roaming: toNumber(c.charges && c.charges.roaming, 0),
      vas: toNumber(c.charges && c.charges.vas, 0),
      tax: toNumber(c.charges && c.charges.tax, 0),
      total: toNumber(c.monthlySpend, 0),
      dept: String(c.department || 'General'),
      risk: Math.round(toNumber(c.collectionRiskScore, toNumber(breakdown.riskScore, 10))),
      items,
    };
  });

  return { months, totals, plans, usage, addOns, roaming, taxes, ud, connData };
}

function toJsArray(arr, mapper) {
  return `[${arr.map(mapper).join(',')}]`;
}

function buildStateBlock(state) {
  const monthsJs = toJsArray(state.months, (v) => jsString(v));
  const totalsJs = toJsArray(state.totals, (v) => String(Math.round(toNumber(v, 0))));
  const plansJs = toJsArray(state.plans, (v) => String(Math.round(toNumber(v, 0))));
  const usageJs = toJsArray(state.usage, (v) => String(Math.round(toNumber(v, 0))));
  const addOnsJs = toJsArray(state.addOns, (v) => String(Math.round(toNumber(v, 0))));
  const roamingJs = toJsArray(state.roaming, (v) => String(Math.round(toNumber(v, 0))));
  const taxesJs = toJsArray(state.taxes, (v) => String(Math.round(toNumber(v, 0))));

  const udJs = toJsArray(state.ud, (row) => {
    return `{data:${jsString(row.data)},limit:${jsString(row.limit)},pct:${Math.round(toNumber(row.pct, 0))},plan:${jsString(row.plan)},sms:${Math.round(toNumber(row.sms, 0))},smsMax:${Math.round(toNumber(row.smsMax, 0))},call:${Math.round(toNumber(row.call, 0))},callMax:${Math.round(toNumber(row.callMax, 0))}}`;
  });

  const connJs = toJsArray(state.connData, (row) => {
    const itemsJs = toJsArray(row.items || [], (item) => {
      return `[${jsString(item[0] || 'Item')},${jsString(item[1] || 'Other')},${toNumber(item[2], 0).toFixed(2)}]`;
    });

    return `{num:${jsString(row.num)},name:${jsString(row.name)},plan:${jsString(row.plan)},planCost:${toNumber(row.planCost, 0).toFixed(2)},dataOvg:${toNumber(row.dataOvg, 0).toFixed(2)},roaming:${toNumber(row.roaming, 0).toFixed(2)},vas:${toNumber(row.vas, 0).toFixed(2)},tax:${toNumber(row.tax, 0).toFixed(2)},total:${toNumber(row.total, 0).toFixed(2)},dept:${jsString(row.dept)},risk:${Math.round(toNumber(row.risk, 0))},items:${itemsJs}}`;
  });

  return [
    `var ci={};var months=${monthsJs};var totals=${totalsJs};var plans=${plansJs};var usage=${usageJs};var addOns=${addOnsJs};var roaming=${roamingJs};var taxes=${taxesJs};`,
    `var ud=${udJs};`,
    ``,
    `/* === PER-CONNECTION BILL DATA (generated from JSON) === */`,
    `var connData=${connJs};`,
    ``,
    `var currentFilter=0; /* 0=All, 1-5=individual */`,
  ].join('\n');
}

function replaceStateBlock(templateHtml, stateBlock) {
  const blockRegex = /var ci=\{\};var months=\[[\s\S]*?var currentFilter=0; \/\* 0=All, 1-5=individual \*\//;
  if (!blockRegex.test(templateHtml)) {
    throw new Error('Unable to find data-state block in template.');
  }
  return templateHtml.replace(blockRegex, stateBlock);
}

function replaceHeaderFields(html, data) {
  const connections = Array.isArray(data.connections) ? data.connections : [];
  const computedTotals = connections.reduce((acc, c) => {
    const planCost = toNumber(c.charges && c.charges.planCost, toNumber(c.plan && c.plan.baseCost, 0));
    const dataOvg = toNumber(c.charges && c.charges.dataOverage, 0);
    const roaming = toNumber(c.charges && c.charges.roaming, 0);
    const vas = toNumber(c.charges && c.charges.vas, 0);
    const tax = toNumber(c.charges && c.charges.tax, 0);
    acc.plan += planCost;
    acc.data += dataOvg;
    acc.roaming += roaming;
    acc.vas += vas;
    acc.tax += tax;
    acc.total += planCost + dataOvg + roaming + vas + tax;
    return acc;
  }, { plan: 0, data: 0, roaming: 0, vas: 0, tax: 0, total: 0 });

  const accountNumber = data.accountSummary && data.accountSummary.accountNumber ? String(data.accountSummary.accountNumber) : 'NA';
  const companyName = (data.accountSummary && (data.accountSummary.companyName || data.accountSummary.accountName)) || 'Enterprise Account';
  const invoiceNumber = data.currentBilling && data.currentBilling.invoiceNumber ? String(data.currentBilling.invoiceNumber) : 'NA';
  const canonicalTotalDue = computedTotals.total > 0 ? computedTotals.total : toNumber(data.currentBilling && data.currentBilling.totalDue, 0);
  const totalDue = canonicalTotalDue.toFixed(2);
  const templateOverrides = data.templateOverrides || {};
  const reportSummary = data.reportSummary || {};
  const startDate = data.currentBilling && data.currentBilling.billPeriod ? data.currentBilling.billPeriod.startDate : '';
  const endDate = data.currentBilling && data.currentBilling.billPeriod ? data.currentBilling.billPeriod.endDate : '';
  const dueDate = data.currentBilling ? data.currentBilling.dueDate : '';
  const dueDays = Math.max(0, Math.round(toNumber(data.currentBilling && data.currentBilling.daysRemaining, 0)));
  const lineCount = connections.length || Math.round(toNumber((data.accountSummary && data.accountSummary.totalConnections) || 0, 0));
  const savingsRaw = (data.dashboardStatistics && data.dashboardStatistics.savingsOpportunity) || (data.planRecommendations && data.planRecommendations.savingsOpportunity) || '0';
  const savingsText = formatINR(savingsRaw);
  const dashboardTotalText = formatINR(canonicalTotalDue);
  const periodLabel = toPeriodRangeLabel(startDate, endDate);
  const dueShort = toShortDateLabel(dueDate);
  const dueLong = toLongDateLabel(dueDate);

  const voiceSummary = (data.voiceAndSmsMetrics && data.voiceAndSmsMetrics.summary) || {};
  const voiceUsed = Math.round(toNumber(voiceSummary.totalCallsUsed, 0));
  const voiceLimit = Math.max(1, Math.round(toNumber(voiceSummary.totalCallsLimit, 0)));
  const voicePct = Math.round((voiceUsed / voiceLimit) * 100);
  const voiceRemaining = Math.max(0, voiceLimit - voiceUsed);
  const smsUsed = Math.round(toNumber(voiceSummary.totalSmsUsed, 0));
  const smsLimit = Math.max(1, Math.round(toNumber(voiceSummary.totalSmsLimit, 0)));
  const smsPct = Math.round((smsUsed / smsLimit) * 100);

  const quickDataLine = data.connections && data.connections[0] && data.connections[0].usage && data.connections[0].usage.data
    ? data.connections[0].usage.data
    : { used: 0, limit: 100 };
  const quickDataUsed = toNumber(quickDataLine.used, 0);
  const quickDataLimit = Math.max(1, toNumber(quickDataLine.limit, 100));
  const socialAppsGb = toNumber(templateOverrides.socialAppsGb, quickDataUsed * 0.31);

  const aiInsightsCount = Math.max(1, Math.round(toNumber(templateOverrides.aiInsightsCount || 4, 4)));
  const smartPaymentSlug = String(templateOverrides.smartPaymentSlug || `VBP-${String(accountNumber).replace(/\D/g, '').slice(-6).padStart(6, '0')}`);
  const deepPayLink = String(templateOverrides.deepPayLink || `viapp://pay/${accountNumber}`);
  const companyAddressHtmlOverride = String(templateOverrides.companyAddressHtml || templateOverrides.companyNameHtml || '');
  const companyAddressInlineOverride = String(templateOverrides.companyAddressInline || templateOverrides.companyNameInline || '');
  const fallbackAddressHtml = 'Tower B, 5th Floor, DLF Cyber City,<br>Sector 25A, Gurugram 122002,<br>Haryana, India';
  const effectiveAddressHtml = companyAddressHtmlOverride || fallbackAddressHtml;
  const effectiveAddressInline = companyAddressInlineOverride || effectiveAddressHtml.replace(/<br\s*\/?>/gi, ', ');
  const pdfAddressParts = effectiveAddressHtml
    .split(/<br\s*\/?>/i)
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .slice(0, 3);
  while (pdfAddressParts.length < 3) pdfAddressParts.push('');
  const pdfAddressArrayLiteral = `[${jsString(companyName)},${jsString(pdfAddressParts[0])},${jsString(pdfAddressParts[1])},${jsString(pdfAddressParts[2])}]`;

  const centers = Array.isArray(templateOverrides.collectionCenters) && templateOverrides.collectionCenters.length >= 3
    ? templateOverrides.collectionCenters
    : [{ name: 'Vi Store - Andheri', city: 'Mumbai 400053' }, { name: 'Vi Store - BKC', city: 'Mumbai 400051' }, { name: 'Reliance Digital', city: 'Mumbai 400014' }];

  const firstInvoiceAmountRaw = templateOverrides.firstInvoiceDownloadAmount || totalDue;
  const firstInvoiceAmount = String(firstInvoiceAmountRaw).replace(/^Rs\.?\s*/i, '').replace(/,/g, '').trim();
  const firstInvoiceAmountComma = Number.isFinite(Number(firstInvoiceAmount))
    ? Number(firstInvoiceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : firstInvoiceAmount;
  const amountDueDisplay = firstInvoiceAmountComma;

  const commitments = templateOverrides.commitments || {};
  const commitmentsModel = String(commitments.model || 'Samsung Galaxy S25 Ultra');
  const commitmentsNumber = String(commitments.number || (Array.isArray(data.connections) && data.connections[0] ? data.connections[0].phoneNumber : '9876543210'));
  const commitmentsMonthly = Math.round(toNumber(commitments.monthly || 399, 399));
  const commitmentsPaid = Math.max(0, Math.round(toNumber(commitments.paid || 8, 8)));
  const commitmentsTotal = Math.max(1, Math.round(toNumber(commitments.total || 24, 24)));
  const commitmentsRemaining = toNumber(commitments.remaining || 6384, 6384);
  const commitmentsEnd = String(commitments.end || 'Oct 2027');
  const commitmentsPct = Math.max(0, Math.min(100, Math.round((commitmentsPaid / commitmentsTotal) * 100)));
  const commitmentsActive = Math.max(1, Math.round(toNumber(commitments.activeEmi || 1, 1)));

  const usageConnections = connections;
  const textUsed = smsUsed;
  const textLimit = smsLimit;
  const textPct = smsPct;
  const textRemaining = Math.max(0, textLimit - textUsed);
  const talkUsed = voiceUsed;
  const talkLimit = voiceLimit;
  const talkPct = voicePct;
  const talkRemaining = Math.max(0, talkLimit - talkUsed);
  const usageReportRows = usageConnections.map((c) => {
    const number = String(c.phoneNumber || 'NA');
    const employee = String(c.employeeName || 'User');
    const dataUsedGb = toNumber(c.usage && c.usage.data && c.usage.data.used, 0).toFixed(1);
    const dataLimitGb = Math.round(toNumber(c.usage && c.usage.data && c.usage.data.limit, 0));
    const callsMin = Math.round(toNumber(c.usage && c.usage.calls && c.usage.calls.used, 0));
    const planCost = toNumber(c.charges && c.charges.planCost, toNumber(c.plan && c.plan.baseCost, 0));
    return `<tr class="ck" onclick="switchTab(2)"><td>${number}</td><td>${employee}</td><td>${dataUsedGb}/${dataLimitGb} GB</td><td>${callsMin.toLocaleString('en-IN')} min</td><td>Rs.${Math.round(planCost)}</td></tr>`;
  }).join('');

  const chargeRows = [
    ['Plan Rental', toNumber(data.billBreakdown && data.billBreakdown.basePlans, 0)],
    ['Data Overage', toNumber(data.billBreakdown && data.billBreakdown.dataOverage, 0)],
    ['Intl Roaming', toNumber(data.billBreakdown && data.billBreakdown.roaming, 0)],
    ['Add-Ons', toNumber(data.billBreakdown && data.billBreakdown.vasServices, 0)],
    ['Taxes (18%)', toNumber(data.billBreakdown && data.billBreakdown.taxes && data.billBreakdown.taxes.gst && data.billBreakdown.taxes.gst.amount, 0)],
  ];
  const jsonPlanCharge = toNumber(chargeRows[0][1], 0);
  const jsonDataCharge = toNumber(chargeRows[1][1], 0);
  const jsonRoamingCharge = toNumber(chargeRows[2][1], 0);
  const jsonAddOnCharge = toNumber(chargeRows[3][1], 0);
  const jsonTaxCharge = toNumber(chargeRows[4][1], 0);
  const chargeTotal = canonicalTotalDue || chargeRows.reduce((sum, row) => sum + row[1], 0);
  const expenseBudgetRaw = toNumber(
    (data.dashboardStatistics && data.dashboardStatistics.monthlyBudget)
      || (data.expenseManagement && data.expenseManagement.monthlyBudgetTracking && data.expenseManagement.monthlyBudgetTracking.total),
    chargeTotal,
  );
  const expenseSpentRaw = chargeTotal;
  const expenseUtilizationRaw = expenseBudgetRaw > 0 ? Math.round((expenseSpentRaw / expenseBudgetRaw) * 100) : 0;
  const expenseRemainingRaw = Math.max(0, expenseBudgetRaw - expenseSpentRaw);

  const historicalForExpense = data.historicalMonthlyData || {};
  const spendSeries = (Array.isArray(historicalForExpense.totals) && historicalForExpense.totals.length)
    ? historicalForExpense.totals.map((v) => Math.round(toNumber(v, 0)))
    : [Math.round(expenseSpentRaw)];
  const spendMonths = (Array.isArray(historicalForExpense.months) && historicalForExpense.months.length)
    ? historicalForExpense.months.map((m) => String(m))
    : ['Current'];
  const spendRowsHtml = spendMonths.map((m, i) => {
    const curr = toNumber(spendSeries[i], 0);
    if (i === 0) {
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)"><span class="sm">${m}</span><span class="fb">Rs.${formatINR(curr).replace(/\\.00$/, '')}</span><span class="badge blue">baseline</span></div>`;
    }
    const prev = toNumber(spendSeries[i - 1], 0);
    const deltaPct = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
    const deltaAbs = Math.abs(deltaPct).toFixed(1);
    const sign = deltaPct >= 0 ? '+' : '-';
    const badgeClass = deltaPct > 8 ? 'red' : (deltaPct >= 0 ? 'orange' : 'green');
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)"><span class="sm">${m}</span><span class="fb">Rs.${formatINR(curr).replace(/\\.00$/, '')}</span><span class="badge ${badgeClass}">${sign}${deltaAbs}%</span></div>`;
  }).join('');
  const monthlySpendCardHtml = `<div class="card bl-purple"><div class="card-h"><h3><span class="ic ic-lg"><svg><use href="#i-trending"/></svg></span> Monthly Spend Analytics</h3></div><div class="card-b" style="position:relative">${spendRowsHtml}</div></div>`;
  const expenseStatsHtml = `<div class="grid g4" style="margin-bottom:16px" id="expense-stats"><div class="card bl-red" style="text-align:center"><div class="card-b"><div style="color:var(--red);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-wallet"/></svg></span></div><p style="font-size:24px" class="fb">Rs.${formatINR(expenseSpentRaw).replace(/\.00$/, '')}</p><p class="xs mt up">Total Spend</p></div></div><div class="card bl-blue" style="text-align:center"><div class="card-b"><div style="color:var(--blue);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-shield"/></svg></span></div><p style="font-size:24px" class="fb">Rs.${formatINR(expenseBudgetRaw).replace(/\.00$/, '')}</p><p class="xs mt up">Monthly Budget</p></div></div><div class="card bl-orange" style="text-align:center"><div class="card-b"><div style="color:var(--orange);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-chart"/></svg></span></div><p style="font-size:24px" class="fb">${expenseUtilizationRaw}%</p><p class="xs mt up">Utilization</p></div></div><div class="card bl-green" style="text-align:center"><div class="card-b"><div style="color:var(--green);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-trending"/></svg></span></div><p style="font-size:24px" class="fb">Rs.${formatINR(expenseRemainingRaw).replace(/\.00$/, '')}</p><p class="xs mt up">Remaining</p></div></div></div>`;

  const alertsSummary = data.alertsSummary || {};
  const billingAlertsCount = Math.max(0, Math.round(toNumber(alertsSummary.billingAlerts, 0)));
  const usageAlertsCount = Math.max(0, Math.round(toNumber(alertsSummary.usageAlerts, 0)));
  const planServiceAlertsCount = Math.max(0, Math.round(toNumber(alertsSummary.planServiceAlerts, 0)));
  const serviceReqCount = Math.max(0, Math.round(toNumber(alertsSummary.serviceRequests, 0)));
  const simActivationAlertsCount = Math.max(0, Math.round(toNumber(alertsSummary.simActivationAlerts, 0)));
  const alertsStatsHtml = `<div class="grid g5" style="margin-bottom:16px" id="alerts-stats"><div class="card bl-red" style="text-align:center"><div class="card-b"><div style="color:var(--red);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-receipt"/></svg></span></div><p style="font-size:24px" class="fb">${billingAlertsCount}</p><p class="xs mt up">Billing</p></div></div><div class="card bl-blue" style="text-align:center"><div class="card-b"><div style="color:var(--blue);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-chart"/></svg></span></div><p style="font-size:24px" class="fb">${usageAlertsCount}</p><p class="xs mt up">Usage</p></div></div><div class="card bl-orange" style="text-align:center"><div class="card-b"><div style="color:var(--orange);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-package"/></svg></span></div><p style="font-size:24px" class="fb">${planServiceAlertsCount}</p><p class="xs mt up">Plan Expiry</p></div></div><div class="card bl-purple" style="text-align:center"><div class="card-b"><div style="color:var(--purple);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-headphones"/></svg></span></div><p style="font-size:24px" class="fb">${serviceReqCount}</p><p class="xs mt up">Service Req</p></div></div><div class="card bl-green" style="text-align:center"><div class="card-b"><div style="color:var(--green);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-phone"/></svg></span></div><p style="font-size:24px" class="fb">${simActivationAlertsCount}</p><p class="xs mt up">SIM Activation</p></div></div></div>`;
  const usageAlertsList = Array.isArray(data.usageAlerts) ? data.usageAlerts : [];
  const usageAlertsHtml = usageAlertsList.slice(0, 5).map((a) => {
    const severity = String(a.severity || 'LOW').toUpperCase();
    const sevClass = severity === 'HIGH' ? 'red' : (severity === 'MEDIUM' ? 'orange' : 'green');
    const alertType = String(a.alertType || 'Usage');
    const employee = String(a.employee || (a.connection || 'All Lines'));
    const connection = String(a.connection || 'All Lines');
    const util = a.current && a.current.utilization ? ` ${a.current.utilization}` : '';
    const used = a.current && Number.isFinite(toNumber(a.current.used, NaN)) ? `${toNumber(a.current.used, 0)}` : '';
    const limit = a.current && Number.isFinite(toNumber(a.current.limit, NaN)) ? `${toNumber(a.current.limit, 0)}` : '';
    const usageText = used && limit ? `${used} of ${limit}` : '';
    const title = alertType === 'Data Usage'
      ? `Data${util} - ${employee} (${connection})`
      : `${alertType}${util ? ` ${util}` : ''} - ${employee}`;
    const recommendation = String(a.recommendation || a.autoRecommendation || 'Review usage trend');
    const line2 = usageText ? `${usageText}. ${recommendation}` : recommendation;
    const ts = String(a.timestamp || 'recent');
    return `<div style="padding:10px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;cursor:pointer" onclick="switchTab(2);showToast('Navigating to Usage tab...')"><span class="badge ${sevClass}" style="min-width:40px;text-align:center">${severity}</span><div style="flex:1"><p class="fs sm">${title}</p><p class="xs mt">${line2}</p></div><span class="xs mt">${ts}</span></div>`;
  }).join('');

  const complaintsSummary = (data.customerSupport && data.customerSupport.complaintsSummary) || {};
  const complaintOpen = Math.max(0, Math.round(toNumber(complaintsSummary.openTickets, 0)));
  const complaintInProgress = Math.max(0, Math.round(toNumber(complaintsSummary.inProgressTickets, 0)));
  const complaintResolved = Math.max(0, Math.round(toNumber(complaintsSummary.resolvedTickets, 0)));
  const complaints = (data.customerSupport && Array.isArray(data.customerSupport.complaints)) ? data.customerSupport.complaints : [];
  const complaintsRowsHtml = complaints.map((c) => {
    const id = String(c.ticketId || 'DSP-NA');
    const desc = String(c.complaint || c.description || 'Issue');
    const amount = `Rs.${formatINR(c.amount || 0).replace(/\.00$/, '')}`;
    const status = String(c.status || 'Open');
    const statusLower = status.toLowerCase();
    const statusClass = statusLower.includes('resolved') ? 'green' : (statusLower.includes('progress') ? 'orange' : 'red');
    return `<tr class="ck" onclick="showToast('${id}: ${escapeJsSingleQuoted(desc)}')"><td class="fs tb">${id}</td><td>${desc}</td><td>${amount}</td><td><span class="badge ${statusClass}">${status}</span></td></tr>`;
  }).join('');

  const aiInsightsText = (() => {
    const quickInsights = data.aiInsights && Array.isArray(data.aiInsights.quickInsights)
      ? data.aiInsights.quickInsights
      : [];
    if (quickInsights.length) {
      const fromJson = quickInsights.slice(0, 4).map((q) => {
        const cat = String(q.category || 'Insight');
        const insight = String(q.insight || '').trim();
        return `${cat}: ${insight}`;
      }).filter(Boolean);
      if (fromJson.length) return fromJson;
    }
    const rows = [];
    const topUsage = usageConnections
      .map((c) => ({ name: String(c.employeeName || 'Line'), num: String(c.phoneNumber || ''), u: toNumber(c.usage && c.usage.data && c.usage.data.utilization, toNumber(String(c.usage && c.usage.data && c.usage.data.utilization || '').replace('%', ''), 0)) }))
      .sort((a, b) => b.u - a.u);
    if (topUsage[0]) rows.push(`Anomaly: Highest data utilization ${topUsage[0].u}% on ...${topUsage[0].num.slice(-3)}`);
    rows.push(`Savings: Rs.${formatINR(savingsRaw).replace(/\.00$/, '')}/mo possible`);
    const under = usageConnections.filter((c) => toNumber(String(c.usage && c.usage.data && c.usage.data.utilization || '').replace('%', ''), 0) < 50).length;
    rows.push(`Underutilized: ${under} line${under === 1 ? '' : 's'} <50% data`);
    const aiNextBill = Math.round(toNumber(
      data.predictiveAnalytics
      && data.predictiveAnalytics.spendForecast
      && Array.isArray(data.predictiveAnalytics.spendForecast.forecastedNext3Months)
      && data.predictiveAnalytics.spendForecast.forecastedNext3Months[0],
      canonicalTotalDue,
    ));
    rows.push(`Forecast: Next bill Rs.${formatINR(aiNextBill).replace(/\.00$/, '')}`);
    return rows.slice(0, 4);
  })();
  const aiInsightRows = aiInsightsText.map((txt, idx) => `<div style="padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="switchTab(${idx === 0 ? 8 : idx === 1 ? 10 : idx === 2 ? 2 : 12})"><p class="fs">${txt}</p></div>`).join('');

  const scenarioExamplesSource = (data.scenarioModeling && Array.isArray(data.scenarioModeling.scenarios))
    ? data.scenarioModeling.scenarios
    : [];
  const scenarioExamplesHtml = scenarioExamplesSource.slice(0, 2).map((s) => {
    const n = String(s.name || 'Scenario');
    const v = toNumber(s.billAmount || s.monthlyAmount, chargeTotal);
    return `"${n}" -> Estimated impact: Rs.${formatINR(v).replace(/\.00$/, '')}`;
  }).join(' | ');
  const chargeTableBody = `${chargeRows.map(([label, amount]) => `<tr><td>${label}</td><td>Rs.${formatINR(amount)}</td><td>${chargeTotal > 0 ? ((amount / chargeTotal) * 100).toFixed(1) : '0.0'}%</td></tr>`).join('')}<tr class="tot"><td>Total</td><td>Rs.${formatINR(chargeTotal)}</td><td>100%</td></tr>`;
  const chargeTableBodyHtml = `<tbody id="report-charge-table-body">${chargeTableBody}</tbody>`;
  const monthDetailRows = [
    ['Plan Rental', chargeRows[0][1], false],
    ['Data Overage', chargeRows[1][1], false],
    ['Add-Ons (VAS)', chargeRows[3][1], false],
    ['Roaming', chargeRows[2][1], false],
    ['Taxes (GST 18%)', chargeRows[4][1], true],
  ].map(([label, amount, forceDecimals]) => {
    const amountText = forceDecimals ? formatINR(amount) : formatINR(amount).replace(/\.00$/, '');
    return `<tr><td>${label}</td><td style="text-align:right">Rs.${amountText}</td></tr>`;
  }).join('') + `<tr class="tot"><td>Total</td><td style="text-align:right">Rs.${formatINR(chargeTotal)}</td></tr>`;

  const deptRows = data.expenseManagement && Array.isArray(data.expenseManagement.departmentBreakdown)
    ? data.expenseManagement.departmentBreakdown
    : [];
  const deptSpendRows = deptRows.map((d) => {
    const dept = String(d.department || 'Department');
    const lines = Math.round(toNumber(d.lines, 0));
    const budget = toNumber(d.budget, 0);
    const spend = toNumber(d.spend, 0);
    const util = String(d.utilization || `${budget > 0 ? Math.round((spend / budget) * 100) : 0}%`);
    const badgeColor = /^9/.test(util) ? 'red' : (/^8/.test(util) ? 'orange' : 'green');
    return `<tr><td>${dept}</td><td>${lines}</td><td>Rs.${formatINR(budget).replace(/\.00$/, '')}</td><td>Rs.${formatINR(spend).replace(/\.00$/, '')}</td><td><span class="badge ${badgeColor}">${util}</span></td></tr>`;
  }).join('');

  const itemizedList = usageConnections.map((c) => {
    const number = String(c.phoneNumber || 'NA');
    const employee = String(c.employeeName || 'User');
    const fileLabel = employee.replace(/\s+/g, '_');
    return `<div style="padding:10px;border:1px solid var(--border);border-radius:6px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:.15s" onmouseover="this.style.borderColor='var(--blue)'" onmouseout="this.style.borderColor=''" onclick="downloadItemizedPDF('CDR_${fileLabel}_Feb2026','${number} - ${employee}')"><span class="fs sm">${number} - ${employee}</span><button class="btn s blu"><span class="ic" style="width:12px;height:12px"><svg><use href="#i-download"/></svg></span> PDF</button></div>`;
  }).join('');

  const deptDocRows = deptRows.map((d) => {
    const dept = String(d.department || 'Department');
    const lines = Math.round(toNumber(d.lines, 0));
    const spend = toNumber(d.spend, 0);
    const budget = toNumber(d.budget, 0);
    const util = String(d.utilization || `${budget > 0 ? Math.round((spend / budget) * 100) : 0}%`);
    const badgeColor = /^9/.test(util) ? 'red' : (/^8/.test(util) ? 'orange' : 'green');
    return `<tr><td class="fs">${dept}</td><td>${lines}</td><td class="fb">Rs.${formatINR(spend)}</td><td>Rs.${formatINR(budget).replace(/\.00$/, '')}</td><td><span class="badge ${badgeColor}">${util}</span></td><td><button class="btn s" onclick="downloadDeptPDF('${dept}')"><span class="ic" style="width:12px;height:12px"><svg><use href="#i-download"/></svg></span> PDF</button></td></tr>`;
  }).join('');

  const employeeRows = usageConnections.map((c) => {
    const employee = String(c.employeeName || 'User');
    const planCost = toNumber(c.charges && c.charges.planCost, toNumber(c.plan && c.plan.baseCost, 0));
    const dataOvg = toNumber(c.charges && c.charges.dataOverage, 0);
    const roamingCost = toNumber(c.charges && c.charges.roaming, 0);
    const vasCost = toNumber(c.charges && c.charges.vas, 0);
    const taxCost = toNumber(c.charges && c.charges.tax, 0);
    const totalCost = toNumber(c.monthlySpend, planCost + dataOvg + roamingCost + vasCost + taxCost);
    return `<tr><td class="fs">${employee}</td><td>Rs.${formatINR(planCost).replace(/\.00$/, '')}</td><td>Rs.${formatINR(dataOvg).replace(/\.00$/, '')}</td><td>Rs.${formatINR(roamingCost).replace(/\.00$/, '')}</td><td>Rs.${formatINR(vasCost).replace(/\.00$/, '')}</td><td>Rs.${formatINR(taxCost).replace(/\.00$/, '')}</td><td class="fb tr">Rs.${formatINR(totalCost)}</td></tr>`;
  }).join('');
  const employeeTotals = usageConnections.reduce((acc, c) => {
    acc.plan += toNumber(c.charges && c.charges.planCost, toNumber(c.plan && c.plan.baseCost, 0));
    acc.data += toNumber(c.charges && c.charges.dataOverage, 0);
    acc.roaming += toNumber(c.charges && c.charges.roaming, 0);
    acc.vas += toNumber(c.charges && c.charges.vas, 0);
    acc.tax += toNumber(c.charges && c.charges.tax, 0);
    acc.total += toNumber(c.monthlySpend, toNumber(c.charges && c.charges.planCost, toNumber(c.plan && c.plan.baseCost, 0))
      + toNumber(c.charges && c.charges.dataOverage, 0)
      + toNumber(c.charges && c.charges.roaming, 0)
      + toNumber(c.charges && c.charges.vas, 0)
      + toNumber(c.charges && c.charges.tax, 0));
    return acc;
  }, { plan: 0, data: 0, roaming: 0, vas: 0, tax: 0, total: 0 });
  const employeeTotalRow = `<tr class="tot"><td>Total</td><td>Rs.${formatINR(employeeTotals.plan).replace(/\.00$/, '')}</td><td>Rs.${formatINR(employeeTotals.data).replace(/\.00$/, '')}</td><td>Rs.${formatINR(employeeTotals.roaming).replace(/\.00$/, '')}</td><td>Rs.${formatINR(employeeTotals.vas).replace(/\.00$/, '')}</td><td>Rs.${formatINR(employeeTotals.tax).replace(/\.00$/, '')}</td><td class="fb tr">Rs.${formatINR(employeeTotals.total || chargeTotal)}</td></tr>`;

  const homeConnectionsRows = usageConnections.map((c) => {
    const number = String(c.phoneNumber || 'NA');
    const employee = String(c.employeeName || 'User');
    const plan = String(c.plan && (c.plan.code || c.plan.name) ? (c.plan.code || c.plan.name) : 'NA');
    const planCost = toNumber(c.charges && c.charges.planCost, toNumber(c.plan && c.plan.baseCost, 0));
    const dataOvg = toNumber(c.charges && c.charges.dataOverage, 0);
    const roamingCost = toNumber(c.charges && c.charges.roaming, 0);
    const vasCost = toNumber(c.charges && c.charges.vas, 0);
    const taxCost = toNumber(c.charges && c.charges.tax, 0);
    const totalCost = planCost + dataOvg + roamingCost + vasCost + taxCost;
    return `<tr class="ck" onclick="event.stopPropagation();switchTab(2)"><td class="fs">${number}</td><td>${employee}</td><td>${plan}</td><td style="text-align:right">Rs.${formatINR(planCost).replace(/\.00$/, '')}</td><td style="text-align:right">Rs.${formatINR(dataOvg).replace(/\.00$/, '')}</td><td style="text-align:right">Rs.${formatINR(roamingCost).replace(/\.00$/, '')}</td><td style="text-align:right">Rs.${formatINR(vasCost).replace(/\.00$/, '')}</td><td style="text-align:right">Rs.${formatINR(taxCost).replace(/\.00$/, '')}</td><td style="text-align:right" class="fb tr">Rs.${formatINR(totalCost)}</td></tr>`;
  }).join('');
  const homeConnectionsTotalRow = `<tr class="tot"><td colspan="3">Total</td><td style="text-align:right">Rs.${formatINR(computedTotals.plan).replace(/\.00$/, '')}</td><td style="text-align:right">Rs.${formatINR(computedTotals.data).replace(/\.00$/, '')}</td><td style="text-align:right">Rs.${formatINR(computedTotals.roaming).replace(/\.00$/, '')}</td><td style="text-align:right">Rs.${formatINR(computedTotals.vas).replace(/\.00$/, '')}</td><td style="text-align:right">Rs.${formatINR(computedTotals.tax).replace(/\.00$/, '')}</td><td style="text-align:right" class="fb tr">Rs.${formatINR(canonicalTotalDue)}</td></tr>`;

  const usageLineOptions = `<option value="all">All Connections (${lineCount} Lines)</option>${usageConnections.map((c, idx) => `<option value="${idx}">${String(c.phoneNumber || 'NA')} - ${String(c.employeeName || 'User')}</option>`).join('')}`;

  const dashboardConnectionsRows = usageConnections.map((c, idx) => {
    const number = String(c.phoneNumber || 'NA');
    const employee = String(c.employeeName || 'User');
    const plan = String(c.plan && (c.plan.code || c.plan.name) ? (c.plan.code || c.plan.name) : 'NA');
    const planCost = toNumber(c.charges && c.charges.planCost, toNumber(c.plan && c.plan.baseCost, 0));
    const dataOvg = toNumber(c.charges && c.charges.dataOverage, 0);
    const roamingCost = toNumber(c.charges && c.charges.roaming, 0);
    const vasCost = toNumber(c.charges && c.charges.vas, 0);
    const taxCost = toNumber(c.charges && c.charges.tax, 0);
    const totalCost = planCost + dataOvg + roamingCost + vasCost + taxCost;
    const primaryText = idx === 0 ? ' (Primary)' : '';
    return `<tr class="ck" onclick="event.stopPropagation();switchTab(2)"><td class="fs">${number}</td><td>${employee}${primaryText}</td><td>${plan}</td><td style="text-align:right" class="fb tr">Rs.${formatINR(totalCost)}</td><td><span class="badge green">Active</span></td></tr>`;
  }).join('');
  const dashboardConnectionsTotalRow = `<tr class="tot"><td colspan="3">Total (All Lines)</td><td style="text-align:right">Rs.${formatINR(canonicalTotalDue)}</td><td></td></tr>`;

  const costCenterRows = usageConnections.map((c) => {
    const employee = String(c.employeeName || 'User');
    const phone = String(c.phoneNumber || 'NA');
    const department = String(c.department || 'Department');
    const costCenter = String(c.costCenter || 'NA');
    const monthlyLimit = toNumber(c.monthlyLimit, 0);
    const planCost = toNumber(c.charges && c.charges.planCost, toNumber(c.plan && c.plan.baseCost, 0));
    const dataOvg = toNumber(c.charges && c.charges.dataOverage, 0);
    const roamingCost = toNumber(c.charges && c.charges.roaming, 0);
    const vasCost = toNumber(c.charges && c.charges.vas, 0);
    const taxCost = toNumber(c.charges && c.charges.tax, 0);
    const spent = planCost + dataOvg + roamingCost + vasCost + taxCost;
    const pct = monthlyLimit > 0 ? Math.min(100, Math.round((spent / monthlyLimit) * 100)) : 0;
    const color = pct >= 90 ? 'red' : (pct >= 70 ? 'orange' : 'green');
    return `<tr><td class="fs">${employee}</td><td>...${phone.slice(-3)}</td><td>${department}</td><td class="tb">${costCenter}</td><td>Rs.${formatINR(monthlyLimit).replace(/\.00$/, '')}</td><td class="fb">Rs.${formatINR(spent).replace(/\.00$/, '')}</td><td><div style="display:flex;align-items:center;gap:6px"><div class="prog" style="width:60px;height:6px"><div class="prog-f" style="width:${pct}%;background:var(--${color})"></div></div><span class="badge ${color}">${pct}%</span></div></td></tr>`;
  }).join('');
  const aiRecs = data.planRecommendations && Array.isArray(data.planRecommendations.aiRecommendations)
    ? data.planRecommendations.aiRecommendations
    : [];
  const aiRecItemsHtml = aiRecs.slice(0, 3).map((r, idx) => {
    const recAction = String(r.actionType || 'Optimize');
    const recEmployee = String(r.employee || 'Line');
    const recTo = String(r.toPlan || r.plan || 'Recommended Plan');
    const recFrom = String(r.fromPlan || 'Current Plan');
    const recReason = String(r.reason || 'Usage-based recommendation.');
    const recSave = toNumber(r.monthlySavings || 0, 0);
    return `<div style="padding:10px;border:1px solid var(--border);border-radius:6px;margin-bottom:8px;cursor:pointer" id="rec-${idx}" onclick="openModal('plan-switch-modal');currentSwitchLine='${recEmployee}';document.getElementById('plan-current-display').textContent='${recFrom}'"><p class="fs sm">${recAction} ${recEmployee} to ${recTo}</p><p class="xs mt">${recReason} Save Rs.${formatINR(recSave).replace(/\.00$/, '')}/mo per line.</p></div>`;
  }).join('');
  const aiRecFallback = `<div style="padding:10px;border:1px solid var(--border);border-radius:6px;margin-bottom:8px"><p class="fs sm">No active recommendations</p><p class="xs mt">Usage and billing look healthy for this cycle.</p></div>`;
  const aiApplySavingsText = formatINR(savingsRaw).replace(/\.00$/, '');

  const plansTabRows = data.plansTabData && Array.isArray(data.plansTabData.currentPlans)
    ? data.plansTabData.currentPlans
    : [];
  const planFlagsByLine = new Map();
  plansTabRows.forEach((p) => {
    const key = String(p.connection || p.phoneNumber || '').slice(-3);
    if (!key) return;
    planFlagsByLine.set(key, { upgrade: !!p.upgrade, downgrade: !!p.downgrade });
  });

  const plansSource = usageConnections.length
    ? usageConnections.map((c) => {
      const key = String(c.phoneNumber || '').slice(-3);
      const flags = planFlagsByLine.get(key) || {};
      return {
        connection: c.phoneNumber,
        employee: c.employeeName,
        plan: c.plan && (c.plan.code || c.plan.name) ? (c.plan.code || c.plan.name) : 'Plan',
        cost: c.charges && c.charges.planCost ? c.charges.planCost : (c.plan && c.plan.baseCost ? c.plan.baseCost : '0'),
        status: c.status || 'Active',
        upgrade: !!flags.upgrade,
        downgrade: !!flags.downgrade,
      };
    })
    : plansTabRows;

  const currentPlanRows = plansSource.map((p) => {
    const line = String(p.connection || p.phoneNumber || 'NA');
    const employee = String(p.employee || p.employeeName || 'User');
    const plan = String(p.plan || p.planName || 'Plan');
    const cost = formatINR(toNumber(p.cost || p.planCost, 0)).replace(/\.00$/, '');
    const action = p.upgrade
      ? `<span class="lt" style="color:var(--green)" onclick="openModal('plan-switch-modal')">Upgrade</span>`
      : (p.downgrade
        ? `<span class="lt" style="color:var(--orange)" onclick="openModal('plan-switch-modal')">Downgrade</span>`
        : `<span class="lt b" onclick="showToast('${escapeJsSingleQuoted(plan)} details')">Details</span>`);
    return `<tr><td>...${line.slice(-3)}</td><td>${employee}</td><td>${plan}</td><td>Rs.${cost}</td><td>${action}</td></tr>`;
  }).join('');

  const numFilterOptions = `<option>All Numbers (${lineCount} lines)</option>${usageConnections.map((c) => {
    const fullName = String(c.employeeName || 'User').trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    const displayName = parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0)}.` : fullName;
    return `<option>${String(c.phoneNumber || 'NA')} - ${displayName}</option>`;
  }).join('')}`;

  const collectionsPriority = data.predictiveAnalytics && data.predictiveAnalytics.collectionsPriority
    ? data.predictiveAnalytics.collectionsPriority
    : {};
  const lowRiskCount = Math.max(0, Math.round(toNumber(collectionsPriority.lowRisk, 3)));
  const mediumRiskCount = Math.max(0, Math.round(toNumber(collectionsPriority.mediumRisk, 1)));
  const highRiskCount = Math.max(0, Math.round(toNumber(collectionsPriority.highRisk, 1)));
  const totalRiskBuckets = Math.max(1, lowRiskCount + mediumRiskCount + highRiskCount);
  const lowRiskPct = Math.round((lowRiskCount / totalRiskBuckets) * 100);
  const mediumRiskPct = Math.round((mediumRiskCount / totalRiskBuckets) * 100);
  const highRiskPct = Math.max(0, 100 - lowRiskPct - mediumRiskPct);

  const disputeSummary = data.disputeTrackerData && data.disputeTrackerData.summary
    ? data.disputeTrackerData.summary
    : {};
  const activeDisputesCount = Math.max(0, Math.round(toNumber(disputeSummary.activeDisputes, 2)));
  const pendingDisputesCount = Math.max(0, Math.round(toNumber(disputeSummary.pendingDisputes, 1)));
  const resolvedDisputesCount = Math.max(0, Math.round(toNumber(disputeSummary.resolvedDisputes, 3)));
  const disputeSla = String(disputeSummary.slaCompliance || '98%');
  const disputeSummaryHtml = `<strong>${activeDisputesCount} Active Dispute${activeDisputesCount === 1 ? '' : 's'}</strong> | ${pendingDisputesCount} Pending | ${resolvedDisputesCount} Resolved (90 days) | <span class="tg">SLA: ${disputeSla}</span>`;

  const employeeToConnection = new Map();
  usageConnections.forEach((c) => {
    employeeToConnection.set(String(c.employeeName || '').toLowerCase(), String(c.phoneNumber || ''));
  });

  const disputeRowsSource = data.disputeTrackerData && Array.isArray(data.disputeTrackerData.disputes)
    ? data.disputeTrackerData.disputes
    : [];

  const allDisputesJsRows = disputeRowsSource.map((d) => {
    const employee = String(d.employee || 'User');
    const mappedConn = employeeToConnection.get(employee.toLowerCase()) || String(d.connection || 'NA');
    const rawStatus = String(d.status || 'Pending').toLowerCase();
    const status = rawStatus.includes('resolved')
      ? 'Resolved'
      : (rawStatus.includes('pending') ? 'Pending' : 'In Review');
    const statusColor = status === 'Resolved' ? 'green' : (status === 'Pending' ? 'red' : 'orange');
    const amount = Math.round(toNumber(d.amount, 0));
    return `{id:${jsString(String(d.ticketId || 'DSP-NA'))},connName:${jsString(`${employee} (...${String(mappedConn).slice(-3)})`)},conn:${jsString(String(mappedConn))},desc:${jsString(String(d.description || d.category || 'Billing dispute'))},amt:${amount},status:${jsString(status)},statusColor:${jsString(statusColor)}}`;
  });
  const allDisputesJs = allDisputesJsRows.length
    ? `[${allDisputesJsRows.join(',')}]`
    : `[{id:'DSP-NA',connName:'No Disputes',conn:'NA',desc:'No disputes found for this account',amt:0,status:'Resolved',statusColor:'green'}]`;

  const forecastData = data.forecastData || {};
  const histMonths = Array.isArray(forecastData.historicalMonths) && forecastData.historicalMonths.length
    ? forecastData.historicalMonths.map((m) => String(m))
    : ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const actualBills = Array.isArray(forecastData.actualBills) && forecastData.actualBills.length
    ? forecastData.actualBills.map((v) => Math.round(toNumber(v, 0)))
    : state.totals;
  const rawForecastMonths = Array.isArray(forecastData.forecastMonths) ? forecastData.forecastMonths.map((m) => String(m)) : [];
  const rawForecastBills = Array.isArray(forecastData.forecastBills) ? forecastData.forecastBills.map((v) => Math.round(toNumber(v, 0))) : [];
  const rawUpper = Array.isArray(forecastData.upperConfidence) ? forecastData.upperConfidence.map((v) => Math.round(toNumber(v, 0))) : [];
  const rawLower = Array.isArray(forecastData.lowerConfidence) ? forecastData.lowerConfidence.map((v) => Math.round(toNumber(v, 0))) : [];
  const forecastHorizon = Math.max(rawForecastMonths.length, rawForecastBills.length, rawUpper.length, rawLower.length, 3);
  const forecastMonths = Array.from({ length: forecastHorizon }, (_, i) => rawForecastMonths[i] || `F${i + 1}`);
  const lastActual = actualBills.length ? actualBills[actualBills.length - 1] : Math.round(chargeTotal);
  const forecastBills = Array.from({ length: forecastHorizon }, (_, i) => rawForecastBills[i] || lastActual);
  const upperForecast = Array.from({ length: forecastHorizon }, (_, i) => rawUpper[i] || forecastBills[i]);
  const lowerForecast = Array.from({ length: forecastHorizon }, (_, i) => rawLower[i] || forecastBills[i]);
  const forecastLabels = histMonths.concat(forecastMonths);
  const forecastActualSeries = actualBills.concat(Array(forecastHorizon).fill(null));
  const forecastLeadNulls = Array(Math.max(histMonths.length - 1, 0)).fill(null);
  const forecastSeries = forecastLeadNulls.concat([lastActual], forecastBills);
  const upperSeries = forecastLeadNulls.concat([lastActual], upperForecast);
  const lowerSeries = forecastLeadNulls.concat([lastActual], lowerForecast);

  const scenarioRows = data.scenarioModeling && Array.isArray(data.scenarioModeling.scenarios) && data.scenarioModeling.scenarios.length
    ? data.scenarioModeling.scenarios
    : [{ name: 'Current', billAmount: chargeTotal }, { name: 'Optimized', billAmount: chargeTotal }];
  const scenarioLabels = scenarioRows.map((s) => String(s.name || 'Scenario'));
  const scenarioValues = scenarioRows.map((s) => Math.round(toNumber(s.billAmount || s.monthlyAmount, chargeTotal)));
  const scenarioPalette = ['#3b82f6', '#f59e0b', '#e60000', '#22c55e', '#8b5cf6', '#14b8a6'];
  const scenarioColors = scenarioLabels.map((_s, i) => scenarioPalette[i % scenarioPalette.length]);

  const forecastChartScript = `mc('chartForecast',{type:'line',data:{labels:${JSON.stringify(forecastLabels)},datasets:[{label:'Actual',data:${JSON.stringify(forecastActualSeries)},borderColor:'#e60000',borderWidth:2,pointRadius:5,pointBackgroundColor:'#e60000',tension:0.3,spanGaps:false},{label:'Forecast',data:${JSON.stringify(forecastSeries)},borderColor:'#8b5cf6',borderDash:[6,3],borderWidth:2,pointRadius:5,pointBackgroundColor:'#8b5cf6',tension:0.3,spanGaps:false},{label:'U',data:${JSON.stringify(upperSeries)},borderColor:'rgba(106,27,154,0.15)',borderWidth:1,fill:false,pointRadius:0,tension:0.3,spanGaps:false},{label:'L',data:${JSON.stringify(lowerSeries)},borderColor:'rgba(106,27,154,0.15)',borderWidth:1,fill:'-1',backgroundColor:'rgba(106,27,154,0.06)',pointRadius:0,tension:0.3,spanGaps:false}]},options:{...co,plugins:{...co.plugins,legend:{labels:{font:{size:11,family:'Inter'},filter:function(item){return item.text!=='U'&&item.text!=='L'}}}}}});`;
  const scenarioChartScript = `mc('chartScenario',{type:'bar',data:{labels:${JSON.stringify(scenarioLabels)},datasets:[{label:'Bill',data:${JSON.stringify(scenarioValues)},backgroundColor:${JSON.stringify(scenarioColors)},borderRadius:6}]},options:{...co,indexAxis:'y',plugins:{...co.plugins,legend:{display:false}},scales:{x:{ticks:{font:{size:10,family:'Inter'},callback:function(v){return 'Rs.'+v.toLocaleString()}}},y:{ticks:{font:{size:11,family:'Inter'}}}}}});`;
  const forecastFilterScript = `
  var forecastBaseTotal=${Math.max(1, Math.round(canonicalTotalDue))};
  var forecastLabels=${JSON.stringify(forecastLabels)};
  var forecastActualTemplate=${JSON.stringify(actualBills)};
  var forecastFutureTemplate=${JSON.stringify(forecastBills)};
  var forecastUpperTemplate=${JSON.stringify(upperForecast)};
  var forecastLowerTemplate=${JSON.stringify(lowerForecast)};
  var forecastRatio=Math.max(0.2,Math.min(3,totalAmt/Math.max(1,forecastBaseTotal)));
  var scaledActual=forecastActualTemplate.map(function(v){return Math.round(v*forecastRatio)});
  var scaledFuture=forecastFutureTemplate.map(function(v){return Math.round(v*forecastRatio)});
  var scaledUpper=forecastUpperTemplate.map(function(v){return Math.round(v*forecastRatio)});
  var scaledLower=forecastLowerTemplate.map(function(v){return Math.round(v*forecastRatio)});
  var forecastHorizon=${forecastHorizon};
  var forecastActualSeriesFiltered=scaledActual.concat(Array(forecastHorizon).fill(null));
  var leadNulls=Array(Math.max(scaledActual.length-1,0)).fill(null);
  var forecastSeriesFiltered=leadNulls.concat([Math.round(totalAmt)],scaledFuture.slice(0,forecastHorizon));
  var upperSeriesFiltered=leadNulls.concat([Math.round(totalAmt)],scaledUpper.slice(0,forecastHorizon));
  var lowerSeriesFiltered=leadNulls.concat([Math.round(totalAmt)],scaledLower.slice(0,forecastHorizon));
  mc('chartForecast',{type:'line',data:{labels:forecastLabels,datasets:[{label:'Actual',data:forecastActualSeriesFiltered,borderColor:'#e60000',borderWidth:2,pointRadius:5,pointBackgroundColor:'#e60000',tension:0.3,spanGaps:false},{label:'Forecast',data:forecastSeriesFiltered,borderColor:'#8b5cf6',borderDash:[6,3],borderWidth:2,pointRadius:5,pointBackgroundColor:'#8b5cf6',tension:0.3,spanGaps:false},{label:'U',data:upperSeriesFiltered,borderColor:'rgba(106,27,154,0.15)',borderWidth:1,fill:false,pointRadius:0,tension:0.3,spanGaps:false},{label:'L',data:lowerSeriesFiltered,borderColor:'rgba(106,27,154,0.15)',borderWidth:1,fill:'-1',backgroundColor:'rgba(106,27,154,0.06)',pointRadius:0,tension:0.3,spanGaps:false}]},options:{...co,plugins:{...co.plugins,legend:{labels:{font:{size:11,family:'Inter'},filter:function(item){return item.text!=='U'&&item.text!=='L'}}}}}});
  var scenarioLabels=${JSON.stringify(scenarioLabels)};
  var scenarioBaseValues=${JSON.stringify(scenarioValues)};
  var scenarioColors=${JSON.stringify(scenarioColors)};
  var scenarioVals=scenarioBaseValues.map(function(v){return Math.round(v*forecastRatio)});
  if(scenarioVals.length>0)scenarioVals[0]=Math.round(totalAmt);
  if(scenarioVals.length>1)scenarioVals[1]=Math.round(totalAmt+(totalData*0.2));
  if(scenarioVals.length>2)scenarioVals[2]=Math.round(totalAmt+Math.max(300,totalRoaming*0.5));
  if(scenarioVals.length>3)scenarioVals[3]=Math.round(Math.max(totalAmt*0.65,totalAmt-(totalData*0.25+totalVas*0.3+totalRoaming*0.15)));
  mc('chartScenario',{type:'bar',data:{labels:scenarioLabels,datasets:[{label:'Bill',data:scenarioVals,backgroundColor:scenarioColors,borderRadius:6}]},options:{...co,indexAxis:'y',plugins:{...co.plugins,legend:{display:false}},scales:{x:{ticks:{font:{size:10,family:'Inter'},callback:function(v){return 'Rs.'+v.toLocaleString()}}},y:{ticks:{font:{size:11,family:'Inter'}}}}}});
  `;
  const ratioBaseTotal = Math.max(1, toNumber(employeeTotals.total || chargeTotal, 1)).toFixed(2);

  const predictiveAnalytics = data.predictiveAnalytics || {};
  const delinquency = predictiveAnalytics.delinquencyRisk || {};
  const spendForecast = predictiveAnalytics.spendForecast || {};
  const budgetAlerts = predictiveAnalytics.budgetAlerts || {};

  const next3Months = Array.isArray(spendForecast.forecastedNext3Months)
    ? spendForecast.forecastedNext3Months.map((v) => toNumber(v, 0))
    : [];
  const nextMonthBase = Math.round(next3Months[0] || toNumber(spendForecast.currentMonth, chargeTotal) * 0.98 || chargeTotal);
  const quarterlyBase = Math.round(next3Months.reduce((s, v) => s + toNumber(v, 0), 0) || (nextMonthBase * 3));
  const annualBase = Math.round(quarterlyBase * 4);
  const trendText = String(spendForecast.trendAnalysis || 'Trend available');

  const riskLevel = String(delinquency.currentRiskLevel || 'Low');
  const riskScore = Math.round(toNumber(delinquency.riskScore, 0));
  const riskPct = String(delinquency.riskPercentage || `${riskScore}%`);
  const onTimePct = Math.round(toNumber(delinquency.onTimePaymentPercentage, 0));
  const avgDelayDays = toNumber(delinquency.averageDelayDays, 0).toFixed(1);
  const outstandingAmt = toNumber(delinquency.outstandingAmount, canonicalTotalDue);

  const budgetWarning = String(budgetAlerts.warningLevel || (expenseUtilizationRaw > 100 ? `Critical - ${expenseUtilizationRaw}% utilized` : `Caution - ${expenseUtilizationRaw}% utilized`));
  const budgetRemaining = toNumber(budgetAlerts.remaining, expenseRemainingRaw);
  const budgetRemainingPct = String(budgetAlerts.percentageRemaining || `${Math.max(0, Math.round((budgetRemaining / Math.max(1, expenseBudgetRaw)) * 100))}%`);

  const predCardsFunction = `function buildPredCards(filtered){
  var total=filtered.reduce(function(s,c){return s+c.total},0);
  var baseTotal=${Math.max(1, Math.round(canonicalTotalDue))};
  var ratio=baseTotal>0?total/baseTotal:1;
  var cards=[
    {t:'Next Month',v:${nextMonthBase},c:'green',ch:${jsString(trendText)}},
    {t:'Quarterly',v:${quarterlyBase},c:'orange',ch:'3-month outlook'},
    {t:'Annual',v:${annualBase},c:'blue',ch:'Projected'}
  ];
  return cards.map(function(f){
    var scaled=Math.round(f.v*ratio);
    return '<div class="card bl-'+f.c+'" style="text-align:center;cursor:pointer" onclick="showToast(&quot;'+f.t+': '+fmtI(scaled)+'. '+f.ch+'&quot;)"><div class="card-b"><p class="xs mt up">'+f.t+'</p><p style="font-size:24px;margin:4px 0" class="fb">'+fmtI(scaled)+'</p><span class="badge '+f.c+'">'+f.ch+'</span></div></div>';
  }).join('');
}`;

  const predRiskFunction = `function buildPredRisk(filtered){
  var risks=filtered.filter(function(c){return c.risk>0}).sort(function(a,b){return b.risk-a.risk});
  if(!risks.length){
    return '<div style="padding:10px;background:var(--muted-bg);border-radius:6px" class="sm">No risk data for selected scope.</div>';
  }
  var summary='<div style="padding:10px;background:#f8fafc;border-radius:6px;margin-bottom:10px;font-size:12px;color:#555"><strong>${riskLevel} Risk (${riskPct})</strong> | Score: ${riskScore} | On-time: ${onTimePct}% | Avg delay: ${avgDelayDays} days | Outstanding: Rs.'+(${Math.round(outstandingAmt)}).toLocaleString('en-IN')+'</div>';
  var body=risks.map(function(r){
    var c=r.risk>70?'red':r.risk>45?'orange':'green';
    var label=r.risk>70?'High Risk':(r.risk>45?'Medium Risk':'Low Risk');
    return '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><span class="fs sm">'+r.name+' (...'+r.num.slice(-3)+')</span><span class="badge '+c+'">'+r.risk+'%</span></div><div class="prog" style="margin-top:4px"><div class="prog-f" style="width:'+r.risk+'%;background:var(--'+c+')"></div></div><p class="xs mt">'+label+' | Total exposure '+fmt(r.total)+'</p></div>';
  }).join('');
  return summary+body;
}`;

  const deptBudgetMap = Object.fromEntries(deptRows.map((d) => [String(d.department || 'Department'), Math.max(1, toNumber(d.budget, 0))]));
  const predBudgetFunction = `function buildPredBudget(filtered){
  var depts={};filtered.forEach(function(c){if(!depts[c.dept])depts[c.dept]=0;depts[c.dept]+=c.total});
  var budgets=${JSON.stringify(deptBudgetMap)};
  var html='';
  Object.keys(depts).forEach(function(d){
    var spent=depts[d];var budget=budgets[d]||${Math.max(1, Math.round(expenseBudgetRaw / Math.max(1, lineCount)))};var pct=Math.round((spent/Math.max(1,budget))*100);
    var bg=pct>100?'var(--red-light)':(pct>85?'#fff7ed':'var(--green-light)');
    var tone=pct>100?'red':(pct>85?'orange':'green');
    html+='<div style="padding:8px;background:'+bg+';border-radius:6px;margin-bottom:6px;font-size:13px"><span class="fs">'+d+'</span> at <strong>'+pct+'%</strong> ('+fmt(spent)+' / '+fmtI(budget)+') <span class="badge '+tone+'" style="float:right">'+(pct>100?'Over':'Within')+'</span></div>';
  });
  html+='<div style="margin-top:8px;padding:8px;background:#f8fafc;border-radius:6px;font-size:12px;color:#555"><strong>Alert:</strong> ${budgetWarning} | Remaining: Rs.${formatINR(budgetRemaining)} (${budgetRemainingPct})</div>';
  html+='<div style="margin-top:10px;display:flex;gap:8px"><button class="btn s" onclick="showToast(&quot;Alerts enabled&quot;)">Set Alerts</button><button class="btn s blu" onclick="switchTab(3)">View Reports</button></div>';
  return html;
}`;

  let output = html;
  const numberMap = new Map([
    ['9876543210', '91234000'],
    ['9876543211', '91234001'],
    ['9876543212', '91234002'],
    ['9876543213', '91234003'],
    ['9876543214', '91234004'],
  ]);
  for (const [oldNum, newNum] of numberMap.entries()) {
    output = output.replace(new RegExp(oldNum, 'g'), newNum);
  }
  output = output.replace(/Sneha Reddy/g, 'Amit Patel');

  output = output.replace(/Globe Consultancy Services Ltd\./g, companyName);
  output = output.replace(/Globe Consultancy Services Limited/g, companyName);
  output = output.replace(/ENT-88234571/g, accountNumber);
  output = output.replace(/INV-2026-03-ENT-0847/g, invoiceNumber);
  output = output.replace(/INV-2026-03-0847/g, invoiceNumber);
  output = output.replace(/Rs\.7,842\.50/g, `Rs.${totalDue}`);

  output = output.replace(/(Account:\s*[^|]+\|\s*)01 Feb - 28 Feb 2026/g, `$1${periodLabel}`);
  output = output.replace(/Due: 15 Mar 2026/g, `Due: ${dueShort}`);
  output = output.replace(/Due: 15 March 2026/g, `Due: ${dueLong}`);
  output = output.replace(/01\/02\/2026 - 28\/02\/2026/g, `${startDate} - ${endDate}`);
  output = output.replace(/01\/02\/2026/g, startDate);
  output = output.replace(/15\/03\/2026/g, dueDate);
  output = output.replace(/01 Feb - 28 Feb 2026/g, periodLabel);
  output = output.replace(/15 Mar 2026/g, dueShort);
  output = output.replace(/15 March 2026/g, dueLong);
  output = output.replace(/due in \d+ days/g, `due in ${dueDays} days`);
  output = output.replace(/(id="dash-active">)5 Lines(<\/p>)/g, `$1${lineCount} Lines$2`);
  output = output.replace(/(id="dash-due">)3 Days(<\/p>)/g, `$1${dueDays} Days$2`);
  output = output.replace(/(id="dash-savings">)Rs\.1,247(<\/p>)/g, `$1Rs.${savingsText}$2`);
  output = output.replace(/(id="dash-totalpayable">)Rs\.[0-9,]+(?:\.[0-9]{2})?(<\/p>)/g, `$1Rs.${dashboardTotalText}$2`);
  output = output.replace(/(id="pay-due-amount">)Rs\.[0-9,]+(?:\.[0-9]{2})? due in [0-9]+ days(<\/p>)/g, `$1Rs.${dashboardTotalText} due in ${dueDays} days$2`);
  output = output.replace(/Pay Now Rs\.[0-9,]+(?:\.[0-9]{2})?/g, `Pay Now Rs.${dashboardTotalText}`);
  output = output.replace(/All Numbers \(5 lines\)/g, `All Numbers (${lineCount} lines)`);
  output = output.replace(/<select id="numFilter" onchange="filterByNumber\(this\.selectedIndex\)">[\s\S]*?<\/select>/, `<select id="numFilter" onchange="filterByNumber(this.selectedIndex)">${numFilterOptions}</select>`);
  output = output.replace(/All Connections \(5 Lines\)/g, `All Connections (${lineCount} Lines)`);
  output = output.replace(/All Connections \(5 lines\)/g, `All Connections (${lineCount} lines)`);
  output = output.replace(/<tbody id="home-connections-table">[\s\S]*?<\/tbody>/, `<tbody id="home-connections-table">${homeConnectionsRows}${homeConnectionsTotalRow}</tbody>`);
  output = output.replace(/<select class="fi" style="width:240px" id="usage-line" onchange="updateUsageDisplay\(this\.value\)">[\s\S]*?<\/select>/, `<select class="fi" style="width:240px" id="usage-line" onchange="updateUsageDisplay(this.value)">${usageLineOptions}</select>`);
  output = output.replace(/<h3 id="dash-conn-title">All Numbers \([0-9]+ Connections\)<\/h3>/, `<h3 id="dash-conn-title">All Numbers (${lineCount} Connections)</h3>`);
  output = output.replace(/<tbody id="dash-connections-table">[\s\S]*?<\/tbody>/, `<tbody id="dash-connections-table">${dashboardConnectionsRows}${dashboardConnectionsTotalRow}</tbody>`);
  output = output.replace(/<tbody id="expense-cost-table">[\s\S]*?<\/tbody>/, `<tbody id="expense-cost-table">${costCenterRows}</tbody>`);
  output = output.replace(/<div class="grid g4" style="margin-bottom:16px" id="expense-stats">[\s\S]*?(?=<div class="card bl-red"><div class="card-h"><h3><span class="ic ic-lg"><svg><use href="#i-wallet"\/><\/svg><\/span> Cost Center Assignments<\/h3>)/, expenseStatsHtml);
  output = output.replace(/(<p style="font-size:24px" class="fb">)Rs\.[0-9,]+(?:\.[0-9]{2})?(<\/p><p class="xs mt up">Total Spend<\/p>)/g, `$1Rs.${formatINR(expenseSpentRaw).replace(/\.00$/, '')}$2`);
  output = output.replace(/(<p style="font-size:24px" class="fb">)Rs\.[0-9,]+(?:\.[0-9]{2})?(<\/p><p class="xs mt up">Monthly Budget<\/p>)/g, `$1Rs.${formatINR(expenseBudgetRaw).replace(/\.00$/, '')}$2`);
  output = output.replace(/(<p style="font-size:24px" class="fb">)[0-9]+%(<\/p><p class="xs mt up">Utilization<\/p>)/g, `$1${expenseUtilizationRaw}%$2`);
  output = output.replace(/(<p style="font-size:24px" class="fb">)Rs\.[0-9,]+(?:\.[0-9]{2})?(<\/p><p class="xs mt up">Remaining<\/p>)/g, `$1Rs.${formatINR(expenseRemainingRaw).replace(/\.00$/, '')}$2`);
  output = output.replace(/<div class="card bl-purple"><div class="card-h"><h3><span class="ic ic-lg"><svg><use href="#i-trending"\/><\/svg><\/span> Monthly Spend Analytics<\/h3><\/div><div class="card-b" style="position:relative">[\s\S]*?<\/div><\/div>\s*<\/div>\s*<div class="card"><div class="card-h"><h3>Employee-Wise Billing Usage Report<\/h3>/, `${monthlySpendCardHtml}</div>\n\n<div class="card"><div class="card-h"><h3>Employee-Wise Billing Usage Report</h3>`);
  output = output.replace(/(<p style="font-size:24px" class="fb">)[0-9]+(<\/p><p class="xs mt up">Billing<\/p>)/g, `$1${billingAlertsCount}$2`);
  output = output.replace(/(<p style="font-size:24px" class="fb">)[0-9]+(<\/p><p class="xs mt up">Usage<\/p>)/g, `$1${usageAlertsCount}$2`);
  output = output.replace(/(<p style="font-size:24px" class="fb">)[0-9]+(<\/p><p class="xs mt up">Plan Expiry<\/p>)/g, `$1${planServiceAlertsCount}$2`);
  output = output.replace(/(<p style="font-size:24px" class="fb">)[0-9]+(<\/p><p class="xs mt up">Service Req<\/p>)/g, `$1${serviceReqCount}$2`);
  output = output.replace(/(<p style="font-size:24px" class="fb">)[0-9]+(<\/p><p class="xs mt up">SIM Activation<\/p>)/g, `$1${simActivationAlertsCount}$2`);
  output = output.replace(/<div class="grid g5" style="margin-bottom:16px" id="alerts-stats">[\s\S]*?(?=<div class="card bl-red"><div class="card-h"><h3><span class="ic ic-lg"><svg><use href="#i-bell"\/><\/svg><\/span> Billing Alerts)/, alertsStatsHtml);
  output = output.replace(/<div class="card bl-blue"><div class="card-h"><h3><span class="ic ic-lg"><svg><use href="#i-chart"\/><\/svg><\/span> Usage Alerts<\/h3>[\s\S]*?<\/div><\/div>\s*<div class="grid g2">/, `<div class="card bl-blue"><div class="card-h"><h3><span class="ic ic-lg"><svg><use href="#i-chart"/></svg></span> Usage Alerts</h3><span class="badge blue">${usageAlertsList.length} Active</span></div><div class="card-b">${usageAlertsHtml}</div></div>\n<div class="grid g2">`);
  output = output.replace(/<div class="grid g3" style="margin-bottom:16px">[\s\S]*?<\/div><\/div><\/div>/, `<div class="grid g3" style="margin-bottom:16px"><div class="card bl-red" style="text-align:center"><div class="card-b"><p style="font-size:28px" class="fb" style="color:var(--red)">${complaintOpen}</p><p class="xs mt up">Open</p></div></div><div class="card bl-orange" style="text-align:center"><div class="card-b"><p style="font-size:28px" class="fb" style="color:var(--orange)">${complaintInProgress}</p><p class="xs mt up">In Progress</p></div></div><div class="card bl-green" style="text-align:center"><div class="card-b"><p style="font-size:28px" class="fb" style="color:var(--green)">${complaintResolved}</p><p class="xs mt up">Resolved</p></div></div></div>`);
  output = output.replace(/<div class="card"><div class="card-h"><h3>Complaint Status<\/h3><button class="btn pri s" onclick="openModal\('new-complaint-modal'\)">\+ New<\/button><\/div><div style="padding:0"><table><thead><tr><th>Ticket<\/th><th>Charge<\/th><th>Amount<\/th><th>Status<\/th><\/tr><\/thead><tbody>[\s\S]*?<\/tbody><\/table><\/div><\/div>/, `<div class="card"><div class="card-h"><h3>Complaint Status</h3><button class="btn pri s" onclick="openModal('new-complaint-modal')">+ New</button></div><div style="padding:0"><table><thead><tr><th>Ticket</th><th>Charge</th><th>Amount</th><th>Status</th></tr></thead><tbody>${complaintsRowsHtml}</tbody></table></div></div>`);
  output = output.replace(/<div class="card bl-purple"><div class="card-h"><h3>AI Intelligence <span class="badge purple">[0-9]+ Insights<\/span><\/h3><\/div><div class="card-b sm">[\s\S]*?<\/div><\/div><\/div>\s*<h3 style="font-size:14px;margin:16px 0 8px" class="fs">Quick Actions<\/h3>/, `<div class="card bl-purple"><div class="card-h"><h3>AI Intelligence <span class="badge purple">4 Insights</span></h3></div><div class="card-b sm">${aiInsightRows}</div></div></div>\n<h3 style="font-size:14px;margin:16px 0 8px" class="fs">Quick Actions</h3>`);
  output = output.replace(/<div class="card bl-teal"><div class="card-h"><h3>Scenario Modeling <span class="badge teal">Advanced<\/span><\/h3><\/div><div class="card-b">[\s\S]*?<div style="margin-top:12px;padding:10px;background:#f0fdfa;border-radius:6px;border-left:3px solid #14b8a6"><p style="font-size:12px;color:#555"><strong>Scenario Examples:<\/strong>[\s\S]*?<\/p><\/div><\/div><\/div>/, `<div class="card bl-teal"><div class="card-h"><h3>Scenario Modeling <span class="badge teal">Advanced</span></h3></div><div class="card-b"><p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:12px"><strong>What-If Analysis:</strong> Scenario modeling is now JSON-driven for this account. Each scenario label and amount is rendered from input data in real time.</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><span class="badge blue">📊 Cost Impact Analysis</span><span class="badge green">📈 ROI Projections</span><span class="badge orange">⚡ Break-Even Calculator</span><span class="badge purple">🔄 Multi-Variable Simulation</span></div><div style="height:200px;position:relative"><canvas id="chartScenario"></canvas></div><div style="margin-top:12px;padding:10px;background:#f0fdfa;border-radius:6px;border-left:3px solid #14b8a6"><p style="font-size:12px;color:#555"><strong>Scenario Examples:</strong> ${scenarioExamplesHtml}</p></div></div></div>`);
  if (aiInsightsText.length >= 4) {
    output = output.replace(/Anomaly: Data spike 340% on \.\.\.210/g, aiInsightsText[0]);
    output = output.replace(/Savings: Rs\.[0-9,]+(?:\.[0-9]{2})?\/mo possible/g, aiInsightsText[1]);
    output = output.replace(/Underutilized: [0-9]+ lines? <50% data/g, aiInsightsText[2]);
    output = output.replace(/Forecast: Next bill Rs\.[0-9,]+(?:\.[0-9]{2})?/g, aiInsightsText[3]);
  }
  output = output.replace(/'Current':'[^']*'/, `'Current':${jsString(`Current scenario from JSON-based enterprise baseline for ${lineCount} lines and present charges.`)}`);
  output = output.replace(/'If \+20% Data':'[^']*'/, `'If +20% Data':${jsString('JSON scenario applies a 20% data-demand surge and recomputes projected monthly billing impact.')}`);
  output = output.replace(/'If Roaming Trip':'[^']*'/, `'If Roaming Trip':${jsString('JSON scenario models roaming-heavy periods and updates expected monthly spend and risk.')}`);
  output = output.replace(/'If Plan Optimization':'[^']*'/, `'If Plan Optimization':${jsString('JSON scenario models optimized plan mix and expected reduction in overage/roaming leakage.')}`);
  output = output.replace(/(Active Lines<\/p><p class="fs" style="font-size:14px">)\d+ of \d+(<\/p>)/g, `$1${lineCount} of ${lineCount}$2`);
  output = output.replace(/<span class="badge purple">4 '\+t\.insights<\/span>/g, `<span class="badge purple">${aiInsightsCount} '+t.insights</span>`);
  output = output.replace(/Save Rs\.1,247/g, `Save Rs.${formatINR(savingsRaw).replace(/\.00$/, '')}`);
  output = output.replace(/<div class="card-b" id="plan-recs">[\s\S]*?<\/div><\/div><\/div>/, `<div class="card-b" id="plan-recs">${aiRecItemsHtml || aiRecFallback}<button class="btn grn" style="width:100%" onclick="showToast('All recommendations applied! Save Rs.${aiApplySavingsText}/mo');launchConfetti()">Apply All Savings</button></div></div></div>`);
  output = output.replace(/AI Recommendations <span class="badge green">Save Rs\.[0-9,]+(?:\.[0-9]{2})?<\/span>/g, `AI Recommendations <span class="badge green">Save Rs.${aiApplySavingsText}</span>`);
  output = output.replace(/Globe[\s\u00A0]+Enterprise/g, companyName);
  output = output.replace(/Globe Consultancy Services Building/g, `${companyName} Building`);
  output = output.replace(/<div class="grid g2"><div class="card"><div class="card-h"><h3>Current Plans<\/h3><\/div><div style="padding:0"><table><thead><tr><th>Line<\/th><th>User<\/th><th>Plan<\/th><th>Cost<\/th><th>Action<\/th><\/tr><\/thead><tbody>[\s\S]*?<\/tbody><\/table><\/div><\/div>/, `<div class="grid g2"><div class="card"><div class="card-h"><h3>Current Plans</h3></div><div style="padding:0"><table><thead><tr><th>Line</th><th>User</th><th>Plan</th><th>Cost</th><th>Action</th></tr></thead><tbody>${currentPlanRows}</tbody></table></div></div>`);

  output = output.replace(/id="home-voice-total">[0-9,]+ MIN/g, `id="home-voice-total">${voiceUsed.toLocaleString('en-IN')} MIN`);
  output = output.replace(/id="home-voice-detail">[0-9,]+ of [0-9,]+ MIN/g, `id="home-voice-detail">${voiceUsed.toLocaleString('en-IN')} of ${voiceLimit.toLocaleString('en-IN')} MIN`);
  output = output.replace(/id="home-voice-bar" style="width:[0-9]+%/g, `id="home-voice-bar" style="width:${voicePct}%`);
  output = output.replace(/id="home-sms-detail">[0-9,]+ of [0-9,]+ SMS/g, `id="home-sms-detail">${smsUsed.toLocaleString('en-IN')} of ${smsLimit.toLocaleString('en-IN')} SMS`);
  output = output.replace(/id="home-sms-bar" style="width:[0-9]+%/g, `id="home-sms-bar" style="width:${smsPct}%`);
  output = output.replace(/\['SMS Usage','[^']+'\],\['Voice Usage','[^']+'\]/g, `['SMS Usage','${smsUsed.toLocaleString('en-IN')} of ${smsLimit.toLocaleString('en-IN')} (${smsPct}%)'],['Voice Usage','${voiceUsed.toLocaleString('en-IN')} of ${voiceLimit.toLocaleString('en-IN')} Min (${voicePct}%)']`);
  output = output.replace(/67\.3\/100 GB/g, `${quickDataUsed.toFixed(1)}/${Math.round(quickDataLimit)} GB`);
  output = output.replace(/67\.3 GB of 100 GB/g, `${quickDataUsed.toFixed(1)} GB of ${Math.round(quickDataLimit)} GB`);
  output = output.replace(/(<span style="font-size:10px;color:rgba\(255,255,255,.7\)">Social apps<\/span><span style="font-size:10px;color:rgba\(255,255,255,.6\)">)[0-9.]+ GB(<\/span>)/g, `$1${socialAppsGb.toFixed(2)} GB$2`);
  output = output.replace(/1,842 Min/g, `${voiceUsed.toLocaleString('en-IN')} Min`);
  output = output.replace(/out of 3,000 \| 1,158 remaining/g, `out of ${voiceLimit.toLocaleString('en-IN')} | ${voiceRemaining.toLocaleString('en-IN')} remaining`);
  output = output.replace(/id="smsCount">[0-9,]+ SMS/g, `id="smsCount">${textUsed.toLocaleString('en-IN')} SMS`);
  output = output.replace(/id="smsDetail">out of [0-9,]+ \| [0-9,]+ remaining/g, `id="smsDetail">out of ${textLimit.toLocaleString('en-IN')} | ${textRemaining.toLocaleString('en-IN')} remaining`);
  output = output.replace(/id="smsBar" style="width:[0-9]+%/g, `id="smsBar" style="width:${textPct}%`);
  output = output.replace(/id="callCount">[0-9,]+ Min/g, `id="callCount">${talkUsed.toLocaleString('en-IN')} Min`);
  output = output.replace(/id="callDetail">out of [0-9,]+ \| [0-9,]+ remaining/g, `id="callDetail">out of ${talkLimit.toLocaleString('en-IN')} | ${talkRemaining.toLocaleString('en-IN')} remaining`);
  output = output.replace(/id="callBar" style="width:[0-9]+%/g, `id="callBar" style="width:${talkPct}%`);

  output = output.replace(/https:\/\/pay\.vi\.com\/ent\/VBP-079487/g, `https://pay.vi.com/ent/${smartPaymentSlug}`);
  output = output.replace(/viapp:\/\/pay\/ENT-[A-Z0-9-]+/g, deepPayLink);
  output = output.replace(/Vi Store - Andheri/g, String(centers[0].name || 'Vi Store - Andheri'));
  output = output.replace(/Mumbai 400053/g, String(centers[0].city || 'Mumbai 400053'));
  output = output.replace(/Vi Store - BKC/g, String(centers[1].name || 'Vi Store - BKC'));
  output = output.replace(/Mumbai 400051/g, String(centers[1].city || 'Mumbai 400051'));
  output = output.replace(/Reliance Digital/g, String(centers[2].name || 'Reliance Digital'));
  output = output.replace(/Mumbai 400014/g, String(centers[2].city || 'Mumbai 400014'));

  output = output.replace(/downloadInvoicePDF\('([^']+?)','Feb 2026','[^']+'\)/g, (_m, inv) => `downloadInvoicePDF('${inv}','Feb 2026','${firstInvoiceAmountComma}')`);
  output = output.replace(/(\{m:'Feb 2026',inv:'[^']+',a:')[^']+(')/g, `$1${firstInvoiceAmountComma}$2`);
  output = output.replace(/(Amount Due:\s*<strong class="amount">)Rs\.[0-9,]+(?:\.[0-9]{2})?(<\/strong>)/g, `$1Rs.${amountDueDisplay}$2`);
  output = output.replace(/(<p style="font-size:20px" class="fb">)Rs\.[0-9,]+(?:\.[0-9]{2})?(<\/p>)/g, `$1Rs.${amountDueDisplay}$2`);
  output = output.replace(/Your current bill for this cycle is [^']*enterprise connections\./g, `Your current bill for this cycle is ₹${amountDueDisplay} for ${lineCount} enterprise connections.`);

  output = output.replace(/Commitments <span class="badge blue">[0-9]+ Active EMI<\/span>/g, `Commitments <span class="badge blue">${commitmentsActive} Active EMI</span>`);
  output = output.replace(/Samsung Galaxy S25 Ultra - 9876543210/g, `${commitmentsModel} - ${commitmentsNumber}`);
  output = output.replace(/<span class="fb">Rs\.[0-9,]+\/mo<\/span> \| [0-9]+ of [0-9]+ paid \| Rs\.[0-9,]+ remaining/g, `<span class="fb">Rs.${commitmentsMonthly}/mo</span> | ${commitmentsPaid} of ${commitmentsTotal} paid | Rs.${formatINR(commitmentsRemaining).replace(/\.00$/, '')} remaining`);
  output = output.replace(/<p class="fb">[0-9]+\/[0-9]+<\/p><p class="xs">Paid<\/p>/g, `<p class="fb">${commitmentsPaid}/${commitmentsTotal}</p><p class="xs">Paid</p>`);
  output = output.replace(/<p class="fb">Rs\.[0-9,]+<\/p><p class="xs">Left<\/p>/g, `<p class="fb">Rs.${formatINR(commitmentsRemaining).replace(/\.00$/, '')}</p><p class="xs">Left</p>`);
  output = output.replace(/<p class="fb">[A-Za-z]{3} [0-9]{4}<\/p><p class="xs">End<\/p>/g, `<p class="fb">${commitmentsEnd}</p><p class="xs">End</p>`);
  output = output.replace(/showToast\('Foreclosure: Rs\.[0-9,]+'\)/g, `showToast('Foreclosure: Rs.${formatINR(commitmentsRemaining).replace(/\.00$/, '')}')`);
  output = output.replace(/(<div class="prog-f" style="width:)[0-9]+%?(;background:var\(--blue\)"><\/div>)/g, (_m, p1, p2) => `${p1}${commitmentsPct}%${p2}`);

  output = output.replace(/<tbody><tr><td>Plan Rental<\/td><td>Rs\.[\s\S]*?<\/tr><tr class="tot"><td>Total<\/td><td>Rs\.[\s\S]*?<\/tr><\/tbody>/, chargeTableBodyHtml);
  output = output.replace(/(<div class="mbg" id="month-modal">[\s\S]*?<table><tbody>)[\s\S]*?(<\/tbody><\/table><\/div><\/div>)/, `$1${monthDetailRows}$2`);
  output = output.replace(/<div class="card"><div class="card-h"><h3>Charge Table<\/h3><\/div><div style="padding:0"><table><thead><tr><th>Category<\/th><th>Amount<\/th><th>%<\/th><\/tr><\/thead><tbody>[\s\S]*?<\/tbody><\/table><\/div><\/div>/, `<div class="card"><div class="card-h"><h3>Charge Table</h3></div><div style="padding:0"><table><thead><tr><th>Category</th><th>Amount</th><th>%</th></tr></thead>${chargeTableBodyHtml}</table></div></div>`);
  output = output.replace(/<div id="report-usage" class="rsec"><div class="card"><div class="card-h"><h3>Connection-Wise Usage<\/h3><\/div><div style="padding:0"><table><thead><tr><th>Number<\/th><th>User<\/th><th>Data<\/th><th>Calls<\/th><th>Plan<\/th><\/tr><\/thead><tbody>[\s\S]*?<\/tbody><\/table><\/div><\/div><\/div>/, `<div id="report-usage" class="rsec"><div class="card"><div class="card-h"><h3>Connection-Wise Usage</h3></div><div style="padding:0"><table><thead><tr><th>Number</th><th>User</th><th>Data</th><th>Calls</th><th>Plan</th></tr></thead><tbody>${usageReportRows}</tbody></table></div></div></div>`);
  output = output.replace(/<div id="report-dept" class="rsec"><div class="card bl-orange"><div class="card-h"><h3>Department-Wise Spend<\/h3><\/div><div style="padding:0"><table><thead><tr><th>Dept<\/th><th>Lines<\/th><th>Budget<\/th><th>Spent<\/th><th>Status<\/th><\/tr><\/thead><tbody>[\s\S]*?<\/tbody><\/table><\/div><\/div><\/div>/, `<div id="report-dept" class="rsec"><div class="card bl-orange"><div class="card-h"><h3>Department-Wise Spend</h3></div><div style="padding:0"><table><thead><tr><th>Dept</th><th>Lines</th><th>Budget</th><th>Spent</th><th>Status</th></tr></thead><tbody>${deptSpendRows}</tbody></table></div></div></div>`);

  output = output.replace(/(<p style="font-size:28px" class="fb">)[0-9]+(<\/p><p class="xs mt up">Invoices<\/p>)/, `$1${Math.round(toNumber(reportSummary.totalInvoicesGenerated, 0))}$2`);
  output = output.replace(/(<p style="font-size:28px" class="fb">)[0-9]+(<\/p><p class="xs mt up">Usage Reports<\/p>)/, `$1${Math.round(toNumber(reportSummary.usageReports, 0))}$2`);
  output = output.replace(/(<p style="font-size:28px" class="fb">)[0-9]+(<\/p><p class="xs mt up">Dept Reports<\/p>)/, `$1${Math.round(toNumber(reportSummary.departmentReports, 0))}$2`);
  output = output.replace(/(<p style="font-size:28px" class="fb">)[0-9]+(<\/p><p class="xs mt up">Custom Reports<\/p>)/, `$1${Math.round(toNumber(reportSummary.customReports, 0))}$2`);
  output = output.replace(/<div class="grid g2" style="gap:8px" id="doc-itemized-list">[\s\S]*?<\/div><\/div><\/div><\/div>/, `<div class="grid g2" style="gap:8px" id="doc-itemized-list">${itemizedList}</div></div></div>`);
  output = output.replace(/<tbody id="doc-dept-table">[\s\S]*?<\/tbody>/, `<tbody id="doc-dept-table">${deptDocRows}</tbody>`);
  output = output.replace(/<tbody id="expense-employee-table">[\s\S]*?<\/tbody>/, `<tbody id="expense-employee-table">${employeeRows}${employeeTotalRow}</tbody>`);
  output = output.replace(/<div class="card bl-blue"><div class="card-b c" id="dispute-summary">[\s\S]*?<\/div><\/div>/, `<div class="card bl-blue"><div class="card-b c" id="dispute-summary">${disputeSummaryHtml}</div></div>`);
  output = output.replace(/var allDisputes=\[[\s\S]*?\];/, `var allDisputes=${allDisputesJs};`);
  output = output.replace(/var ratio=totalAmt\/[0-9]+(?:\.[0-9]+)?;/g, `var ratio=totalAmt/${ratioBaseTotal};`);
  output = output.replace(/mc\('chartChargeDonut',\{type:'doughnut',data:\{labels:\['Plan','Data','Roaming','Add-Ons','Taxes'\],datasets:\[\{data:\[totalPlan,totalData,totalRoaming,totalVas,totalTax\][\s\S]*?\}\}\}\);/, `mc('chartChargeDonut',{type:'doughnut',data:{labels:['Plan','Data','Roaming','Add-Ons','Taxes'],datasets:[{data:[totalPlan,totalData,totalRoaming,totalVas,totalTax],backgroundColor:['#c62828','#f57f17','#0d47a1','#6a1b9a','#546e7a'],borderWidth:2,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:false,animation:{animateRotate:true,duration:800},plugins:{legend:{position:'right',labels:{font:{size:11,family:'Inter',weight:'500'}}}}}});\n  var chargeBody=document.getElementById('report-charge-table-body');\n  if(chargeBody){\n    var fmtAmt=function(v){return Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});};\n    var rows=[\n      ['Plan Rental',totalPlan],\n      ['Data Overage',totalData],\n      ['Intl Roaming',totalRoaming],\n      ['Add-Ons',totalVas],\n      ['Taxes (18%)',totalTax]\n    ];\n    chargeBody.innerHTML=rows.map(function(r){var pct=totalAmt>0?((r[1]/totalAmt)*100).toFixed(1):'0.0';return '<tr><td>'+r[0]+'</td><td>Rs.'+fmtAmt(r[1])+'</td><td>'+pct+'%</td></tr>';}).join('')+'<tr class="tot"><td>Total</td><td>Rs.'+fmtAmt(totalAmt)+'</td><td>100%</td></tr>';\n  }`);
  output = output.replace(/mc\('chartChargeDonut',\{type:'doughnut',data:\{labels:\['Plan','Data','Roaming','Add-Ons','Taxes'\],datasets:\[\{data:\[[0-9.,\s]+\]/g, `mc('chartChargeDonut',{type:'doughnut',data:{labels:['Plan','Data','Roaming','Add-Ons','Taxes'],datasets:[{data:[${jsonPlanCharge.toFixed(2)},${jsonDataCharge.toFixed(2)},${jsonRoamingCharge.toFixed(2)},${jsonAddOnCharge.toFixed(2)},${jsonTaxCharge.toFixed(2)}]`);
  output = output.replace(/mc\('chartForecast',\{type:'line',data:\{labels:\[[\s\S]*?\}\}\}\);/g, forecastChartScript);
  output = output.replace(/mc\('chartScenario',\{type:'bar',data:\{labels:\[[\s\S]*?\}\}\}\);/g, scenarioChartScript);
  output = output.replace(/var fAmt=Math\.round\(totalAmt\*0\.92\);[\s\S]*?mc\('chartScenario',\{type:'bar',data:\{labels:\[[\s\S]*?\}\}\}\);/, forecastFilterScript);

  // Fallback patch: keep scenario chart JSON-driven by removing legacy hardcoded overrides.
  output = output.replace(/if\(scenarioVals\.length>0\)scenarioVals\[0\]=Math\.round\(totalAmt\);\s*if\(scenarioVals\.length>1\)scenarioVals\[1\]=Math\.round\(totalAmt\+\(totalData\*0\.2\)\);\s*if\(scenarioVals\.length>2\)scenarioVals\[2\]=Math\.round\(totalAmt\+Math\.max\(300,totalRoaming\*0\.5\)\);\s*if\(scenarioVals\.length>3\)scenarioVals\[3\]=Math\.round\(Math\.max\(totalAmt\*0\.65,totalAmt-\(totalData\*0\.25\+totalVas\*0\.3\+totalRoaming\*0\.15\)\)\);/g, `if(scenarioVals.length>0&&currentFilter===0){\n    scenarioVals=scenarioBaseValues.slice();\n  }`);

  // Fallback patch: in filter mode, use JSON billBreakdown for the all-connections donut/table.
  output = output.replace(/\/\* PAGE 3: Reports[^\n]*\n\s*mc\('chartChargeDonut',\{type:'doughnut',data:\{labels:\['Plan','Data','Roaming','Add-Ons','Taxes'\],datasets:\[\{data:\[totalPlan,totalData,totalRoaming,totalVas,totalTax\][\s\S]*?\}\}\}\);/, `/* PAGE 3: Reports — update charge donut */\n  var jsonChargeVals=[${jsonPlanCharge.toFixed(2)},${jsonDataCharge.toFixed(2)},${jsonRoamingCharge.toFixed(2)},${jsonAddOnCharge.toFixed(2)},${jsonTaxCharge.toFixed(2)}];\n  var donutVals=currentFilter===0?jsonChargeVals:[totalPlan,totalData,totalRoaming,totalVas,totalTax];\n  var donutTotal=donutVals.reduce(function(s,v){return s+Number(v||0)},0);\n  mc('chartChargeDonut',{type:'doughnut',data:{labels:['Plan','Data','Roaming','Add-Ons','Taxes'],datasets:[{data:donutVals,backgroundColor:['#c62828','#f57f17','#0d47a1','#6a1b9a','#546e7a'],borderWidth:2,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:false,animation:{animateRotate:true,duration:800},plugins:{legend:{position:'right',labels:{font:{size:11,family:'Inter',weight:'500'}}}}}});`);

  output = output.replace(/function buildPredCards\(filtered\)\{[\s\S]*?\n\}\n\n\/\* Build Predictive risk \*\//, `${predCardsFunction}\n\n/* Build Predictive risk */`);
  output = output.replace(/function buildPredRisk\(filtered\)\{[\s\S]*?\n\}\n\n\/\* Build Predictive budget \*\//, `${predRiskFunction}\n\n/* Build Predictive budget */`);
  output = output.replace(/function buildPredBudget\(filtered\)\{[\s\S]*?\n\}\n\n\/\* Initialize dynamic sections on load \*\//, `${predBudgetFunction}\n\n/* Initialize dynamic sections on load */`);

  output = output.replace(/(<div class="card bl-orange"><div class="card-h"><h3>Collections Engine<\/h3><\/div><div class="card-b">[\s\S]*?)(<\/div><\/div>\s*<\/div>\s*<!-- PAGE 10: PLANS -->)/, (_m, block, suffix) => {
    let updated = block;
    updated = updated.replace(/Low Risk \(\d+\)/g, `Low Risk (${lowRiskCount})`);
    updated = updated.replace(/Medium \(\d+\)/g, `Medium (${mediumRiskCount})`);
    updated = updated.replace(/High Risk \(\d+\)/g, `High Risk (${highRiskCount})`);
    updated = updated.replace(/(Low Risk Connections \()\d+%(\))/g, `$1${lowRiskPct}%$2`);
    updated = updated.replace(/(Medium Risk Connection \()\d+%(\))/g, `$1${mediumRiskPct}%$2`);
    updated = updated.replace(/(High Risk Connection \()\d+%(\))/g, `$1${highRiskPct}%$2`);

    const scorePcts = [lowRiskPct, mediumRiskPct, highRiskPct];
    let idx = 0;
    updated = updated.replace(/(<strong>)\d+% Collection Priority Score(<\/strong>)/g, (_mm, p1, p2) => {
      const pct = scorePcts[Math.min(idx, scorePcts.length - 1)];
      idx += 1;
      return `${p1}${pct}% Collection Priority Score${p2}`;
    });
    let badgeIdx = 0;
    updated = updated.replace(/(<span class="badge (?:green|orange|red)"[^>]*>)\d+%/g, (_mm, p1) => {
      const pct = scorePcts[Math.min(badgeIdx, scorePcts.length - 1)];
      badgeIdx += 1;
      return `${p1}${pct}%`;
    });
    updated = updated.replace(/(Low Risk \([^)]*\)[\s\S]*?<div class="prog"><div class="prog-f" style="width:)\d+%/m, `$1${lowRiskPct}%`);
    updated = updated.replace(/(Medium \([^)]*\)[\s\S]*?<div class="prog"><div class="prog-f" style="width:)\d+%/m, `$1${mediumRiskPct}%`);
    updated = updated.replace(/(High Risk \([^)]*\)[\s\S]*?<div class="prog"><div class="prog-f" style="width:)\d+%/m, `$1${highRiskPct}%`);
    return `${updated}${suffix}`;
  });

  if (effectiveAddressHtml) {
    output = output.replace(/Tower B, 5th Floor, DLF Cyber City,<br>Sector 25A, Gurugram 122002,<br>Haryana, India/g, String(effectiveAddressHtml));
  }
  if (effectiveAddressInline) {
    output = output.replace(/Tower B, 5th Floor, DLF Cyber City, Sector 25A, Gurugram 122002, Haryana, India/g, String(effectiveAddressInline));
  }
  output = output.replace(/\['[^']+','Tower B, 5th Floor, DLF Cyber City,','Sector 25A, Gurugram 122002,','Haryana, India'\]/g, pdfAddressArrayLiteral);
  if (templateOverrides.accountManager) output = output.replace(/Ankit Mehra/g, String(templateOverrides.accountManager));
  if (templateOverrides.slaTier) output = output.replace(/Platinum/g, String(templateOverrides.slaTier));
  if (templateOverrides.creditLimit) output = output.replace(/Rs\.25,000/g, String(templateOverrides.creditLimit));
  if (templateOverrides.contractEnd) output = output.replace(/31 Mar 2027/g, String(templateOverrides.contractEnd));
  if (templateOverrides.contactPhone) output = output.replace(/\+91 124 456 7890/g, String(templateOverrides.contactPhone));
  output = output.replace(/function changeLang\(lang\)\{/, "function changeLang(lang){\n  document.documentElement.lang=(lang==='hi'||lang==='mr'||lang==='ml')?lang:'en';");

  // Guard against accidental duplicate insertion: keep only one Department-Wise Bill Breakdown card.
  const deptCardRegex = /<div class="card bl-orange"><div class="card-h"><h3><span class="ic ic-lg"><svg><use href="#i-users"\/><\/svg><\/span> Department-Wise Bill Breakdown<\/h3><\/div><div style="padding:0"><table>[\s\S]*?<\/table><\/div><\/div>/g;
  const deptCardMatches = output.match(deptCardRegex);
  if (deptCardMatches && deptCardMatches.length > 1) {
    let keepFirst = true;
    output = output.replace(deptCardRegex, (m) => {
      if (keepFirst) {
        keepFirst = false;
        return m;
      }
      return '';
    });
  }

  output = repairMojibakeText(output);

  return output;
}

function convertOne(template, jsonPath, outputPath) {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);

  const state = buildTemplateState(data);
  const stateBlock = buildStateBlock(state);

  let out = replaceStateBlock(template, stateBlock);
  out = replaceHeaderFields(out, data);

  fs.writeFileSync(outputPath, out, 'utf8');
}

function main() {
  if (!fs.existsSync(TEMPLATE_PATH)) throw new Error(`Template not found: ${TEMPLATE_PATH}`);
  if (!fs.existsSync(JSON_DIR)) throw new Error(`JSON folder not found: ${JSON_DIR}`);

  ensureDir(OUTPUT_DIR);
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const files = fs.readdirSync(JSON_DIR).filter((name) => name.toLowerCase().endsWith('.json'));
  if (!files.length) {
    console.log('No JSON files found to convert.');
    return;
  }

  let ok = 0;
  for (const fileName of files) {
    const inputPath = path.join(JSON_DIR, fileName);
    const outPath = path.join(OUTPUT_DIR, `${path.parse(fileName).name}.html`);

    try {
      convertOne(template, inputPath, outPath);
      ok += 1;
      console.log(`Built: html/${path.parse(fileName).name}.html`);
    } catch (err) {
      console.error(`Failed: ${fileName} -> ${err.message}`);
    }
  }

  console.log(`Done: ${ok}/${files.length} files generated.`);
}

main();
