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
    if (mapped === undefined) {
      return input;
    }
    bytes.push(mapped);
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
  const accountNumber = data.accountSummary && data.accountSummary.accountNumber ? String(data.accountSummary.accountNumber) : 'NA';
  const companyName = (data.accountSummary && (data.accountSummary.companyName || data.accountSummary.accountName)) || 'Enterprise Account';
  const invoiceNumber = data.currentBilling && data.currentBilling.invoiceNumber ? String(data.currentBilling.invoiceNumber) : 'NA';
  const totalDue = toNumber(data.currentBilling && data.currentBilling.totalDue, 0).toFixed(2);
  const templateOverrides = data.templateOverrides || {};
  const reportSummary = data.reportSummary || {};
  const startDate = data.currentBilling && data.currentBilling.billPeriod ? data.currentBilling.billPeriod.startDate : '';
  const endDate = data.currentBilling && data.currentBilling.billPeriod ? data.currentBilling.billPeriod.endDate : '';
  const dueDate = data.currentBilling ? data.currentBilling.dueDate : '';
  const dueDays = Math.max(0, Math.round(toNumber(data.currentBilling && data.currentBilling.daysRemaining, 0)));
  const lineCount = Math.round(toNumber((data.accountSummary && data.accountSummary.totalConnections) || (Array.isArray(data.connections) ? data.connections.length : 0), 0));
  const savingsRaw = (data.dashboardStatistics && data.dashboardStatistics.savingsOpportunity) || (data.planRecommendations && data.planRecommendations.savingsOpportunity) || '0';
  const savingsText = formatINR(savingsRaw);
  const dashboardTotalText = formatINR((data.currentBilling && data.currentBilling.totalDue) || totalDue);
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

  const usageConnections = Array.isArray(data.connections) ? data.connections : [];
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
  const chargeTotal = toNumber(data.currentBilling && data.currentBilling.totalDue, chargeRows.reduce((sum, row) => sum + row[1], 0));
  const chargeTableBody = `${chargeRows.map(([label, amount]) => `<tr><td>${label}</td><td>Rs.${formatINR(amount)}</td><td>${chargeTotal > 0 ? ((amount / chargeTotal) * 100).toFixed(1) : '0.0'}%</td></tr>`).join('')}<tr class="tot"><td>Total</td><td>Rs.${formatINR(chargeTotal)}</td><td>100%</td></tr>`;

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
    acc.total += toNumber(c.monthlySpend, 0);
    return acc;
  }, { plan: 0, data: 0, roaming: 0, vas: 0, tax: 0, total: 0 });
  const employeeTotalRow = `<tr class="tot"><td>Total</td><td>Rs.${formatINR(employeeTotals.plan).replace(/\.00$/, '')}</td><td>Rs.${formatINR(employeeTotals.data).replace(/\.00$/, '')}</td><td>Rs.${formatINR(employeeTotals.roaming).replace(/\.00$/, '')}</td><td>Rs.${formatINR(employeeTotals.vas).replace(/\.00$/, '')}</td><td>Rs.${formatINR(employeeTotals.tax).replace(/\.00$/, '')}</td><td class="fb tr">Rs.${formatINR(employeeTotals.total || chargeTotal)}</td></tr>`;
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
  const ratioBaseTotal = Math.max(1, toNumber(employeeTotals.total || chargeTotal, 1)).toFixed(2);

  let output = html;
  output = output.replace(/Globe Consultancy Services Ltd\./g, companyName);
  output = output.replace(/Globe Consultancy Services Limited/g, companyName);
  output = output.replace(/ENT-88234571/g, accountNumber);
  output = output.replace(/INV-2026-03-ENT-0847/g, invoiceNumber);
  output = output.replace(/INV-2026-03-0847/g, invoiceNumber);
  output = output.replace(/Rs\.7,842\.50/g, `Rs.${totalDue}`);

  output = output.replace(/(Account:\s*[^|]+\|\s*)01 Feb - 28 Feb 2026/g, `$1${periodLabel}`);
  output = output.replace(/Due: 15 Mar 2026/g, `Due: ${dueShort}`);
  output = output.replace(/Due: 15 March 2026/g, `Due: ${dueLong}`);
  output = output.replace(/(id="dash-active">)5 Lines(<\/p>)/g, `$1${lineCount} Lines$2`);
  output = output.replace(/(id="dash-due">)3 Days(<\/p>)/g, `$1${dueDays} Days$2`);
  output = output.replace(/(id="dash-savings">)Rs\.1,247(<\/p>)/g, `$1Rs.${savingsText}$2`);
  output = output.replace(/(id="dash-totalpayable">)Rs\.[0-9,]+(?:\.[0-9]{2})?(<\/p>)/g, `$1Rs.${dashboardTotalText}$2`);
  output = output.replace(/(id="pay-due-amount">)Rs\.[0-9,]+(?:\.[0-9]{2})? due in [0-9]+ days(<\/p>)/g, `$1Rs.${dashboardTotalText} due in ${dueDays} days$2`);
  output = output.replace(/Pay Now Rs\.[0-9,]+(?:\.[0-9]{2})?/g, `Pay Now Rs.${dashboardTotalText}`);
  output = output.replace(/All Numbers \(5 lines\)/g, `All Numbers (${lineCount} lines)`);
  output = output.replace(/All Connections \(5 Lines\)/g, `All Connections (${lineCount} Lines)`);
  output = output.replace(/All Connections \(5 lines\)/g, `All Connections (${lineCount} lines)`);
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

  output = output.replace(/Commitments <span class="badge blue">[0-9]+ Active EMI<\/span>/g, `Commitments <span class="badge blue">${commitmentsActive} Active EMI</span>`);
  output = output.replace(/Samsung Galaxy S25 Ultra - 9876543210/g, `${commitmentsModel} - ${commitmentsNumber}`);
  output = output.replace(/<span class="fb">Rs\.[0-9,]+\/mo<\/span> \| [0-9]+ of [0-9]+ paid \| Rs\.[0-9,]+ remaining/g, `<span class="fb">Rs.${commitmentsMonthly}/mo</span> | ${commitmentsPaid} of ${commitmentsTotal} paid | Rs.${formatINR(commitmentsRemaining).replace(/\.00$/, '')} remaining`);
  output = output.replace(/<p class="fb">[0-9]+\/[0-9]+<\/p><p class="xs">Paid<\/p>/g, `<p class="fb">${commitmentsPaid}/${commitmentsTotal}</p><p class="xs">Paid</p>`);
  output = output.replace(/<p class="fb">Rs\.[0-9,]+<\/p><p class="xs">Left<\/p>/g, `<p class="fb">Rs.${formatINR(commitmentsRemaining).replace(/\.00$/, '')}</p><p class="xs">Left</p>`);
  output = output.replace(/<p class="fb">[A-Za-z]{3} [0-9]{4}<\/p><p class="xs">End<\/p>/g, `<p class="fb">${commitmentsEnd}</p><p class="xs">End</p>`);
  output = output.replace(/showToast\('Foreclosure: Rs\.[0-9,]+'\)/g, `showToast('Foreclosure: Rs.${formatINR(commitmentsRemaining).replace(/\.00$/, '')}')`);
  output = output.replace(/(<div class="prog-f" style="width:)[0-9]+%?(;background:var\(--blue\)"><\/div>)/g, (_m, p1, p2) => `${p1}${commitmentsPct}%${p2}`);

  output = output.replace(/<tbody><tr><td>Plan Rental<\/td><td>Rs\.[\s\S]*?<\/tr><tr class="tot"><td>Total<\/td><td>Rs\.[\s\S]*?<\/tr><\/tbody>/, `<tbody>${chargeTableBody}</tbody>`);
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
  output = output.replace(/mc\('chartForecast',\{type:'line',data:\{labels:\[[\s\S]*?\}\}\}\);/g, forecastChartScript);
  output = output.replace(/mc\('chartScenario',\{type:'bar',data:\{labels:\[[\s\S]*?\}\}\}\);/g, scenarioChartScript);

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
