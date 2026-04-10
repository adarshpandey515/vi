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

function normalizeIndicDigits(value) {
  return String(value)
    .replace(/[\u0966-\u096F]/g, (ch) => String(ch.codePointAt(0) - 0x0966)) // Devanagari ०-९
    .replace(/[\u0660-\u0669]/g, (ch) => String(ch.codePointAt(0) - 0x0660)) // Arabic-Indic ٠-٩
    .replace(/[\u06F0-\u06F9]/g, (ch) => String(ch.codePointAt(0) - 0x06F0)) // Eastern Arabic-Indic ۰-۹
    .replace(/\u066B/g, '.')
    .replace(/\u066C/g, ',');
}

function toNumber(value, fallback = 0) {
  const raw = typeof value === 'string' ? normalizeIndicDigits(value).replace(/,/g, '').trim() : value;
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
  const normalized = normalizeIndicDigits(value).trim();
  const m = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
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
  const accountCategory = (data.accountSummary && data.accountSummary.accountCategory)
    ? String(data.accountSummary.accountCategory)
    : 'Enterprise';
  const localizedContent = (data.localizedContent && typeof data.localizedContent === 'object') ? data.localizedContent : {};
  const dynamicI18nMap = ['en', 'hi', 'mr', 'ml'].reduce((acc, lang) => {
    const langContent = (localizedContent && typeof localizedContent[lang] === 'object' && localizedContent[lang]) ? localizedContent[lang] : {};
    acc[lang] = {
      accountCategory,
      accountInformation: 'Account Information',
      billNumber: 'Bill Number',
      dueBy: 'Due By',
      totalAmount: 'Total Amount',
      usageSummary: 'Usage Summary',
      usage: 'Usage', 
      dataUsage: 'Data Usage',
      smsUsage: 'SMS Usage',
      callUsage: 'Call Usage',
      voiceUsage: 'Voice Usage',
      enterpriseBillingStatement: 'Enterprise Billing Statement',
      generated: 'Generated',
      alertBilling: 'Billing',
      alertUsage: 'Usage',
      alertPlanExpiry: 'Plan Expiry',
      alertServiceReq: 'Service Req',
      alertSimActivation: 'SIM Activation',
      ...langContent,
    };
    return acc;
  }, {});
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
  const commitmentsModel = String(commitments.model || 'Device');
  const commitmentsNumber = String(commitments.number || (Array.isArray(data.connections) && data.connections[0] ? data.connections[0].phoneNumber : '9876543210'));
  const commitmentsMonthly = Math.round(toNumber(commitments.monthly || 399, 399));
  const commitmentsPaid = Math.max(0, Math.round(toNumber(commitments.paid || 8, 8)));
  const commitmentsTotal = Math.max(1, Math.round(toNumber(commitments.total || 24, 24)));
  const commitmentsRemaining = toNumber(commitments.remaining || 6384, 6384);
  const commitmentsEnd = String(commitments.end || 'Oct 2027');
  const commitmentsPct = Math.max(0, Math.min(100, Math.round((commitmentsPaid / commitmentsTotal) * 100)));
  const commitmentsActive = Math.max(1, Math.round(toNumber(commitments.activeEmi || 1, 1)));
  const complaints = (data.customerSupport && Array.isArray(data.customerSupport.complaints)) ? data.customerSupport.complaints : [];

  const isHindiContent = /[\u0900-\u097F]/.test(`${companyName} ${JSON.stringify(data.accountSummary || {})} ${JSON.stringify(data.templateOverrides || {})}`);
  const uiText = isHindiContent
    ? {
      dataBoostersTitle: 'डेटा बूस्टर',
      buy: 'खरीदें',
      recommended: 'अनुशंसित',
      activated: 'सक्रिय हुआ',
      intlRoaming: 'अंतर्राष्ट्रीय रोमिंग',
      collectionCentersTitle: 'कलेक्शन सेंटर',
      directionsTo: 'दिशा निर्देश:',
      complaintDetailTitle: 'शिकायत विवरण',
      filed: 'दर्ज',
      escalate: 'एस्केलेट',
      chat: 'चैट',
      withdraw: 'वापस लें',
      callbackTitle: 'कॉलबैक शेड्यूल करें',
      callbackWithin30: '30 मिनट के भीतर',
      callbackWithin2h: '2 घंटे के भीतर',
      callbackTomorrow10: 'कल सुबह 10 बजे',
      confirm: 'पुष्टि करें',
      callbackScheduled: 'कॉलबैक शेड्यूल हो गया',
      planChangeTitle: 'प्लान परिवर्तन',
      current: 'वर्तमान',
      select: 'चुनें',
      effectiveNextCycle: 'अगले बिलिंग चक्र से लागू।',
      savePerMonth: 'बचत',
      noOverage: 'कोई ओवरेज नहीं',
      unlimitedPremium: 'अनलिमिटेड | प्रीमियम',
      billPaymentFor: 'बिल भुगतान',
      earnCashback: 'पहले भुगतान पर Rs.200 कैशबैक पाएं!',
      minTxnValid: 'न्यूनतम लेनदेन Rs.2,000 | 31 Mar 2026 तक मान्य',
      linkedBankViaUpi: 'UPI से लिंक्ड बैंक खाता',
      walletBalance: 'वॉलेट बैलेंस',
      payInEmi: 'EMI में भुगतान, 0% ब्याज',
      instantCashback: '5% तुरंत कैशबैक',
      comparisonLabel: 'तुलना',
      selfServiceDisputes: 'स्व-सेवा और विवाद',
      raiseDisputeTitle: 'विवाद दर्ज करें',
      categoryPlaceholderDisplay: 'श्रेणी...',
      connectionPlaceholderDisplay: 'कनेक्शन...',
      amountPlaceholder: 'राशि (Rs.)',
      describeIssuePlaceholder: 'अपनी समस्या लिखें...',
      aiGenerateDescription: 'AI विवरण बनाएं',
      aiFeedback: 'AI फीडबैक',
      genAiBadge: 'जनरेटिव AI',
      aiGeneratedTextLabel: 'AI-निर्मित टेक्स्ट',
      poweredByModel: 'GPT-4o द्वारा संचालित',
      applyToDescription: 'विवरण में जोड़ें',
      dismiss: 'हटाएं',
      submitDispute: 'विवाद सबमिट करें',
      selectCategoryConnectionToast: 'श्रेणी और कनेक्शन चुनें!',
      selectCategoryFirstToast: 'कृपया पहले श्रेणी चुनें',
      aiGeneratingDescriptionToast: 'AI विवाद विवरण बना रहा है...',
      aiGeneratingFeedbackToast: 'AI फीडबैक विश्लेषण बना रहा है...',
      aiAppliedToast: 'AI टेक्स्ट विवरण में जोड़ दिया गया',
      disputeSubmittedPrefix: 'विवाद',
      disputeSubmittedSuffix: 'सबमिट हुआ! SLA: 6 घंटे।',
      disputeWithdrawnToast: 'विवाद सफलतापूर्वक वापस लिया गया',
      noDisputesForConnection: 'इस कनेक्शन के लिए कोई विवाद नहीं',
      activeDisputeLabel: 'सक्रिय विवाद',
      pendingLabel: 'लंबित',
      resolvedLabel: 'सुलझे (90 दिन)',
      slaLabel: 'SLA',
      aiDisputeTitle: '[AI-निर्मित विवाद विवरण — GPT-4o]',
      aiFeedbackTitle: '[AI-निर्मित फीडबैक — Claude 3.5 Sonnet]',
      aiSeverityLine: 'गंभीरता: उच्च | विश्वास: 92% | समान मामलों का समाधान: 87%',
      aiResolutionLine: 'अनुशंसित समाधान: क्रेडिट नोट के साथ रेट्रोएक्टिव समायोजन।',
      aiAnalysisLine: 'AI विश्लेषण: 847 समान विवादों के आधार पर 4.2 घंटे में 91% समाधान दर।',
      aiActionLine: 'अनुशंसित कार्रवाई: बिलिंग ऑपरेशंस टीम को प्राथमिक एस्केलेशन।',
    }
    : {
      dataBoostersTitle: 'Data Boosters',
      buy: 'Buy',
      recommended: 'Recommended',
      activated: 'activated!',
      intlRoaming: 'Intl Roaming',
      collectionCentersTitle: 'Collection Centers',
      directionsTo: 'Directions to',
      complaintDetailTitle: 'Complaint Detail',
      filed: 'Filed',
      escalate: 'Escalate',
      chat: 'Chat',
      withdraw: 'Withdraw',
      callbackTitle: 'Schedule Callback',
      callbackWithin30: 'Within 30 min',
      callbackWithin2h: 'Within 2 hours',
      callbackTomorrow10: 'Tomorrow 10am',
      confirm: 'Confirm',
      callbackScheduled: 'Callback scheduled!',
      planChangeTitle: 'Plan Change',
      current: 'Current',
      select: 'Select',
      effectiveNextCycle: 'Effective next billing cycle.',
      savePerMonth: 'Save',
      noOverage: 'No overage',
      unlimitedPremium: 'Unlimited | Premium',
      billPaymentFor: 'Bill Payment for',
      earnCashback: 'Earn Rs.200 cashback on first payment!',
      minTxnValid: 'Min transaction Rs.2,000 | Valid till 31 Mar 2026',
      linkedBankViaUpi: 'Linked bank account via UPI',
      walletBalance: 'Wallet balance',
      payInEmi: 'Pay in EMIs, 0% interest',
      instantCashback: '5% instant cashback',
      comparisonLabel: 'Comparisons',
      selfServiceDisputes: 'Self-Service & Disputes',
      raiseDisputeTitle: 'Raise Dispute',
      categoryPlaceholderDisplay: 'Category...',
      connectionPlaceholderDisplay: 'Connection...',
      amountPlaceholder: 'Amount (Rs.)',
      describeIssuePlaceholder: 'Describe your issue...',
      aiGenerateDescription: 'AI Generate Description',
      aiFeedback: 'AI Feedback',
      genAiBadge: 'GenAI',
      aiGeneratedTextLabel: 'AI-Generated Text',
      poweredByModel: 'Powered by GPT-4o',
      applyToDescription: 'Apply to Description',
      dismiss: 'Dismiss',
      submitDispute: 'Submit Dispute',
      selectCategoryConnectionToast: 'Select category & connection!',
      selectCategoryFirstToast: 'Please select a category first',
      aiGeneratingDescriptionToast: 'AI generating dispute description...',
      aiGeneratingFeedbackToast: 'AI generating feedback analysis...',
      aiAppliedToast: 'AI text applied to description',
      disputeSubmittedPrefix: 'Dispute',
      disputeSubmittedSuffix: 'submitted! SLA: 6hr.',
      disputeWithdrawnToast: 'Dispute withdrawn successfully',
      noDisputesForConnection: 'No disputes for this connection',
      activeDisputeLabel: 'Active Dispute',
      pendingLabel: 'Pending',
      resolvedLabel: 'Resolved (90 days)',
      slaLabel: 'SLA',
      aiDisputeTitle: '[AI-Generated Dispute Description — GPT-4o]',
      aiFeedbackTitle: '[AI-Generated Feedback — Claude 3.5 Sonnet]',
      aiSeverityLine: 'Severity: High | Confidence: 92% | Similar cases resolved: 87%',
      aiResolutionLine: 'Recommended resolution: Retroactive adjustment with credit note.',
      aiAnalysisLine: 'AI Analysis: Based on 847 similar disputes, 91% resolution rate within 4.2 hours.',
      aiActionLine: 'Recommended action: Priority escalation to billing operations team.',
    };

  const disputeCategoryOptions = [
    { value: 'Billing Error', label: isHindiContent ? 'बिलिंग त्रुटि' : 'Billing Error' },
    { value: 'Roaming', label: isHindiContent ? 'रोमिंग' : 'Roaming' },
    { value: 'Data Overage', label: isHindiContent ? 'डेटा ओवरेज' : 'Data Overage' },
    { value: 'VAS/Subscription', label: isHindiContent ? 'VAS/सब्सक्रिप्शन' : 'VAS/Subscription' },
    { value: 'Device EMI', label: isHindiContent ? 'डिवाइस EMI' : 'Device EMI' },
  ];
  const disputeCategoryOptionsHtml = `<option value="Category...">${uiText.categoryPlaceholderDisplay}</option>${disputeCategoryOptions.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('')}`;
  const disputeConnectionOptionsHtml = `<option value="Connection...">${uiText.connectionPlaceholderDisplay}</option>${connections.map((c) => `<option value="${String(c.phoneNumber || '')}">${String(c.phoneNumber || '')}</option>`).join('')}`;
  const disputeCardHtml = `<div class="grid g2"><div class="card bl-red"><div class="card-h"><h3>${uiText.raiseDisputeTitle}</h3></div><div class="card-b"><select class="fi" style="margin-bottom:8px" id="dispute-cat">${disputeCategoryOptionsHtml}</select><select class="fi" style="margin-bottom:8px" id="dispute-conn">${disputeConnectionOptionsHtml}</select><input placeholder="${uiText.amountPlaceholder}" style="margin-bottom:8px" id="dispute-amt"><textarea style="min-height:60px;margin-bottom:8px" placeholder="${uiText.describeIssuePlaceholder}" id="dispute-desc"></textarea><div style="display:flex;gap:8px;margin-bottom:10px"><button class="btn s blu" onclick="aiGenerateDesc()" style="display:flex;align-items:center;gap:4px"><span class="ic" style="width:14px;height:14px"><svg><use href="#i-brain"/></svg></span> ${uiText.aiGenerateDescription}</button><button class="btn s" onclick="aiGenerateFeedback()" style="display:flex;align-items:center;gap:4px"><span class="ic" style="width:14px;height:14px"><svg><use href="#i-zap"/></svg></span> ${uiText.aiFeedback}</button></div><div id="ai-gen-panel" style="display:none;margin-bottom:10px;padding:10px;border:1px solid var(--blue);border-radius:6px;background:#eff6ff"><div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span class="badge blue">${uiText.genAiBadge}</span><span class="xs fb">${uiText.aiGeneratedTextLabel}</span><span class="xs mt" style="margin-left:auto">${uiText.poweredByModel}</span></div><p class="sm" id="ai-gen-text" style="line-height:1.6"></p><div style="margin-top:8px;display:flex;gap:8px"><button class="btn s blu" onclick="applyAiText()">${uiText.applyToDescription}</button><button class="btn s" onclick="document.getElementById('ai-gen-panel').style.display='none'">${uiText.dismiss}</button></div></div><button class="btn pri" style="width:100%" onclick="submitDispute()">${uiText.submitDispute}</button></div></div>`;
  const aiDisputeTemplates = isHindiContent
    ? {
      'Billing Error': {
        d: 'मैं अपने एंटरप्राइज खाते में गलत बिलिंग शुल्क के संबंध में विवाद दर्ज कर रहा/रही हूं। यह शुल्क डुप्लिकेट/त्रुटिपूर्ण प्रतीत होता है और बिलिंग अवधि में उपयोग की गई किसी सेवा से मेल नहीं खाता। कृपया हमारे एंटरप्राइज SLA के अनुसार तत्काल समीक्षा कर इस राशि को रिवर्स करें।',
        f: 'इस बिलिंग विसंगति से हमारे विभागीय बजट पर प्रभाव पड़ा है। हमें SLA के अनुसार समयबद्ध समाधान अपेक्षित है। पूर्व में ऐसे मामलों का समाधान क्रेडिट नोट से हुआ है।',
      },
      Roaming: {
        d: 'मेरे कनेक्शन पर लगाए गए अंतरराष्ट्रीय रोमिंग शुल्क पर मैं विवाद दर्ज करना चाहता/चाहती हूं। ये शुल्क सक्रिय किए गए रोमिंग पैक की शर्तों के अनुरूप नहीं लगते। कृपया CDR का विस्तृत विश्लेषण कर पैक शर्तों से तुलना करें।',
        f: 'हमारी एंटरप्राइज यात्रा नीति के अनुसार प्री-अप्रूव्ड रोमिंग पैक अनिवार्य हैं। शुल्क पैक रेट कार्ड से अधिक हैं। कृपया रेट्रोएक्टिव पैक लाभ लागू कर अंतर राशि क्रेडिट करें।',
      },
      'Data Overage': {
        d: 'मैं अपने कनेक्शन पर डेटा ओवरेज शुल्क पर विवाद दर्ज कर रहा/रही हूं। उपयोग पैटर्न मेरी प्रोफाइल से मेल नहीं खाता और संभव है कि मीटरिंग में सिस्टम/बैकग्राउंड ट्रैफिक शामिल हुआ हो, जिसे हमारे एंटरप्राइज प्लान में शून्य-रेटेड होना चाहिए।',
        f: 'हमारे एंटरप्राइज समझौते के अनुसार सिस्टम अपडेट और VPN ट्रैफिक शून्य-रेटेड होना चाहिए। कृपया DPI लॉग सत्यापित कर व्यवसायिक और गैर-व्यवसायिक उपयोग अलग करें और शुल्क समायोजित करें।',
      },
      'VAS/Subscription': {
        d: 'मैं VAS/सब्सक्रिप्शन शुल्क पर विवाद दर्ज कर रहा/रही हूं जो मेरी स्पष्ट सहमति के बिना सक्रिय हुआ। TRAI नियमों और हमारे एंटरप्राइज समझौते के अनुसार एडमिन अनुमोदन के बिना कोई VAS सक्रिय नहीं होना चाहिए।',
        f: 'यह अनधिकृत सक्रियण हमारी एंटरप्राइज VAS नीति का उल्लंघन है। कृपया सेवा तुरंत निष्क्रिय करें, सभी शुल्क रिवर्स करें और ऑडिट ट्रेल साझा करें।',
      },
      'Device EMI': {
        d: 'मैं बिल में दिखाए गए डिवाइस EMI शुल्क पर विवाद कर रहा/रही हूं। EMI राशि खरीद के समय सहमत किस्त अनुसूची से मेल नहीं खाती।',
        f: 'कृपया मूल डिवाइस फाइनेंस समझौते से EMI राशि का सत्यापन करें। यदि ब्याज दर परिवर्तन के कारण अंतर है तो अनुबंध के अनुसार पूर्व लिखित सूचना अपेक्षित है।',
      },
    }
    : {
      'Billing Error': {
        d: 'I am raising a dispute regarding an incorrect billing charge on my enterprise account. The charge appears to be a duplicate/erroneous entry that does not correspond to any service consumed during the billing period. I request an immediate review and reversal of this amount as per our enterprise SLA agreement.',
        f: 'This billing discrepancy has impacted our department budget allocation. We expect a resolution within the SLA-committed timeframe of 6 hours. Similar issues in the past were resolved via credit note.',
      },
      Roaming: {
        d: 'I wish to dispute international roaming charges applied to my connection. The charges appear excessive and do not align with the roaming pack I had activated prior to travel. I request a detailed CDR analysis and comparison with the pack terms.',
        f: 'Our enterprise travel policy requires pre-approved roaming packs. The charges exceed the pack rate card. Please apply the retroactive pack benefit and credit the differential amount.',
      },
      'Data Overage': {
        d: 'I am disputing data overage charges on my connection. The data consumption pattern does not match my usage profile, and I suspect the metering may include background/system updates that should be zero-rated under our enterprise plan terms.',
        f: 'As per our enterprise agreement, system updates and VPN traffic should be zero-rated. Please verify the DPI logs to segregate business vs. non-business data consumption and adjust charges accordingly.',
      },
      'VAS/Subscription': {
        d: 'I am raising a dispute for a VAS/subscription charge that was activated without my explicit consent. As per TRAI regulations and our enterprise agreement, no VAS should be activated without documented approval from the account administrator.',
        f: 'This unauthorized activation violates our enterprise policy on VAS management. Please deactivate the service immediately, reverse all charges, and provide an audit trail.',
      },
      'Device EMI': {
        d: 'I am disputing the device EMI charge shown on my bill. The EMI amount does not match the agreed installment schedule as per the device purchase agreement signed at the time of procurement.',
        f: 'Please cross-verify the EMI amount with the original device finance agreement. If there is a discrepancy due to interest rate changes, we require prior written notification as per our contract terms.',
      },
    };
  const aiDisputeTemplatesLiteral = JSON.stringify(aiDisputeTemplates);

  const boosterPacks = Array.isArray(templateOverrides.dataBoosters) && templateOverrides.dataBoosters.length
    ? templateOverrides.dataBoosters
    : [
      { label: '5 GB', price: '99' },
      { label: '10 GB', price: '179', recommended: true },
      { label: '25 GB', price: '399' },
      { label: uiText.intlRoaming, price: '499' },
    ];

  const boosterRowsHtml = boosterPacks.map((pack) => {
    const title = String(pack.label || 'Pack');
    const price = String(pack.price || '0');
    const recommended = !!pack.recommended;
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid ${recommended ? 'var(--green)' : 'var(--border)'};border-radius:8px;margin-bottom:8px;${recommended ? 'background:var(--green-light);' : ''}"><div><p class="fs">${title}</p>${recommended ? `<span class="badge green">${uiText.recommended}</span>` : ''}</div><div style="display:flex;align-items:center;gap:10px"><span class="fb tb">Rs.${price}</span><button class="btn blu s" onclick="showToast('${escapeJsSingleQuoted(title)} ${escapeJsSingleQuoted(uiText.activated)}');closeModal('booster-modal')">${uiText.buy}</button></div></div>`;
  }).join('');

  const boosterModalHtml = `<div class="mbg" id="booster-modal"><div class="mbox"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;border:none;padding:0">${uiText.dataBoostersTitle}</h3><button class="btn s gh" onclick="closeModal('booster-modal')">&times;</button></div>${boosterRowsHtml}</div></div>`;

  const channelCardsHtml = centers.map((center) => `<div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer" onclick="showToast('${escapeJsSingleQuoted(uiText.directionsTo)} ${escapeJsSingleQuoted(String(center.name || ''))}')"><p class="fs">${String(center.name || '')}</p><p class="xs mt">${String(center.city || '')}</p></div>`).join('');
  const channelModalHtml = `<div class="mbg" id="channel-modal"><div class="mbox"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;border:none;padding:0">${uiText.collectionCentersTitle}</h3><button class="btn s gh" onclick="closeModal('channel-modal')">&times;</button></div>${channelCardsHtml}</div></div>`;

  const complaintNumbersOptions = connections.map((c) => `<option>${String(c.phoneNumber || '')}</option>`).join('');
  const newComplaintModalHtml = `<div class="mbg" id="new-complaint-modal"><div class="mbox"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;border:none;padding:0">${isHindiContent ? 'नई शिकायत' : 'New Complaint'}</h3><button class="btn s gh" onclick="closeModal('new-complaint-modal')">&times;</button></div><select class="fi" style="margin-bottom:8px"><option>${isHindiContent ? 'कनेक्शन...' : 'Connection...'}</option>${complaintNumbersOptions}</select><input placeholder="${isHindiContent ? 'विषय' : 'Subject'}" style="margin-bottom:8px"><textarea style="min-height:60px;margin-bottom:8px" placeholder="${isHindiContent ? 'विवरण...' : 'Describe...'}"></textarea><button class="btn pri" style="width:100%" onclick="showToast('${isHindiContent ? 'शिकायत जमा हुई!' : 'Complaint submitted!'}');closeModal('new-complaint-modal')">${isHindiContent ? 'जमा करें' : 'Submit'}</button></div></div>`;

  const complaintSample = complaints[0] || { ticketId: 'DSP-001', complaint: 'Issue', amount: '0', status: isHindiContent ? 'खुला' : 'Open', createdDate: dueDate };
  const complaintStatusRaw = String(complaintSample.status || '');
  const complaintStatusLower = complaintStatusRaw.toLowerCase();
  const complaintStatusClass = complaintStatusLower.includes('resolved') || complaintStatusRaw.includes('हल') ? 'green' : (complaintStatusLower.includes('progress') || complaintStatusRaw.includes('प्रगति') ? 'orange' : 'red');
  const complaintDateText = String(complaintSample.createdDate || dueDate || '');
  const complaintDetailModalHtml = `<div class="mbg" id="complaint-detail-modal"><div class="mbox"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;border:none;padding:0">${uiText.complaintDetailTitle}</h3><button class="btn s gh" onclick="closeModal('complaint-detail-modal')">&times;</button></div><div style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><strong>${String(complaintSample.ticketId || 'DSP-001')}</strong><span class="badge ${complaintStatusClass}">${complaintStatusRaw || (isHindiContent ? 'खुला' : 'Open')}</span></div><p class="sm" style="margin-bottom:8px">${String(complaintSample.complaint || 'Issue')} - Rs.${formatINR(toNumber(complaintSample.amount, 0)).replace(/\.00$/, '')}<br><span class="xs mt">${uiText.filed}: ${complaintDateText}</span></p><div style="padding:10px;background:var(--muted-bg);border-radius:6px;font-size:13px;margin-bottom:10px">${String(complaintSample.description || complaintSample.complaint || '')}</div><div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="showToast('${isHindiContent ? 'एस्केलेट किया गया!' : 'Escalated!'}');closeModal('complaint-detail-modal')">${uiText.escalate}</button><button class="btn blu" style="flex:1" onclick="showToast('${isHindiContent ? 'चैट खुला' : 'Chat opened'}')">${uiText.chat}</button><button class="btn" style="flex:1;color:var(--red);border-color:var(--red)" onclick="showToast('${isHindiContent ? 'वापस लिया गया' : 'Withdrawn'}');closeModal('complaint-detail-modal')">${uiText.withdraw}</button></div></div></div>`;

  const callbackDefaultNumber = String((connections[0] && connections[0].phoneNumber) || '');
  const callbackModalHtml = `<div class="mbg" id="callback-modal"><div class="mbox"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;border:none;padding:0">${uiText.callbackTitle}</h3><button class="btn s gh" onclick="closeModal('callback-modal')">&times;</button></div><select class="fi" style="margin-bottom:8px" id="cb-time"><option>${uiText.callbackWithin30}</option><option>${uiText.callbackWithin2h}</option><option>${uiText.callbackTomorrow10}</option></select><input value="${callbackDefaultNumber}" style="margin-bottom:8px"><button class="btn pri" style="width:100%" onclick="showToast('${uiText.callbackScheduled}');closeModal('callback-modal')">${uiText.confirm}</button></div></div>`;

  const firstCurrentPlan = String((connections[0] && connections[0].plan && (connections[0].plan.code || connections[0].plan.name)) || 'Plus 799');
  const planOptionSource = Array.isArray(templateOverrides.planSwitchOptions) && templateOverrides.planSwitchOptions.length
    ? templateOverrides.planSwitchOptions
    : [
      { code: (data.planRecommendations && Array.isArray(data.planRecommendations.availablePlanDowngrades) && data.planRecommendations.availablePlanDowngrades[0]) || 'Enterprise Lite 399', detail: isHindiContent ? `30GB | ${uiText.savePerMonth} Rs.400/mo` : '30GB | Save Rs.400/mo' },
      { code: (data.planRecommendations && Array.isArray(data.planRecommendations.availablePlanUpgrades) && data.planRecommendations.availablePlanUpgrades[0]) || 'Enterprise Max 999', detail: isHindiContent ? `100GB | ${uiText.noOverage}` : '100GB | No overage' },
      { code: (data.planRecommendations && Array.isArray(data.planRecommendations.availablePlanUpgrades) && data.planRecommendations.availablePlanUpgrades[1]) || 'Enterprise Ultra 1499', detail: uiText.unlimitedPremium },
    ];
  const planSwitchOptionsHtml = planOptionSource.slice(0, 3).map((opt) => `<div style="padding:10px;border:1px solid var(--border);border-radius:6px;margin-bottom:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:.15s" onmouseover="this.style.borderColor='var(--blue)'" onmouseout="this.style.borderColor=''"><div><p class="fs">${String(opt.code || '')}</p><p class="xs mt">${String(opt.detail || '')}</p></div><button class="btn s" onclick="switchPlan('${escapeJsSingleQuoted(String(opt.code || ''))}',this)">${uiText.select}</button></div>`).join('');
  const planSwitchModalHtml = `<div class="mbg" id="plan-switch-modal"><div class="mbox"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;border:none;padding:0">${uiText.planChangeTitle}</h3><button class="btn s gh" onclick="closeModal('plan-switch-modal')">&times;</button></div><div style="padding:10px;background:var(--muted-bg);border-radius:6px;margin-bottom:10px;font-size:13px"><div style="display:flex;justify-content:space-between"><span>${uiText.current}:</span><strong id="plan-current-display">${firstCurrentPlan}</strong></div></div>${planSwitchOptionsHtml}<p class="xs mt" style="font-style:italic">${uiText.effectiveNextCycle}</p></div></div>`;

  const amazonPayModalHtml = `<div class="mbg" id="amazonpay-modal"><div class="mbox"><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;border:none;padding:0"><span style="font-weight:900;color:#232f3e">amazon</span><span style="background:#FF9900;color:#fff;padding:1px 6px;border-radius:3px;font-size:12px;margin-left:4px">pay</span></h3><button class="btn s gh" onclick="closeModal('amazonpay-modal')">&times;</button></div><div style="text-align:center;margin:16px 0"><span style="font-size:24px" class="fb tr" id="amazonpay-amount">Rs.${amountDueDisplay}</span><p class="xs mt">${uiText.billPaymentFor} ${accountNumber}</p></div><div style="padding:12px;background:linear-gradient(135deg,#FFF3E0,#FFF8E1);border:1px solid #FF9900;border-radius:8px;margin-bottom:12px;text-align:center"><p class="fs" style="color:#E65100">🎉 ${uiText.earnCashback}</p><p class="xs mt">${uiText.minTxnValid}</p></div><div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer;transition:.15s;display:flex;align-items:center;gap:12px" onmouseover="this.style.borderColor='#FF9900';this.style.background='#FFF8E1'" onmouseout="this.style.borderColor='';this.style.background=''" onclick="processAmazonPay('Amazon Pay UPI')"><span class="ic ic-xl" style="color:#FF9900"><svg><use href="#i-phone"/></svg></span><div><p class="fs">Amazon Pay UPI</p><p class="xs mt">${uiText.linkedBankViaUpi}</p></div></div><div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer;transition:.15s;display:flex;align-items:center;gap:12px" onmouseover="this.style.borderColor='#FF9900';this.style.background='#FFF8E1'" onmouseout="this.style.borderColor='';this.style.background=''" onclick="processAmazonPay('Amazon Pay Balance')"><span class="ic ic-xl" style="color:#FF9900"><svg><use href="#i-wallet"/></svg></span><div><p class="fs">Amazon Pay Balance</p><p class="xs mt">${uiText.walletBalance}: Rs.1,450</p></div></div><div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer;transition:.15s;display:flex;align-items:center;gap:12px" onmouseover="this.style.borderColor='#FF9900';this.style.background='#FFF8E1'" onmouseout="this.style.borderColor='';this.style.background=''" onclick="processAmazonPay('Amazon Pay Later')"><span class="ic ic-xl" style="color:#FF9900"><svg><use href="#i-clock"/></svg></span><div><p class="fs">Amazon Pay Later</p><p class="xs mt">${uiText.payInEmi}</p></div></div><div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer;transition:.15s;display:flex;align-items:center;gap:12px" onmouseover="this.style.borderColor='#FF9900';this.style.background='#FFF8E1'" onmouseout="this.style.borderColor='';this.style.background=''" onclick="processAmazonPay('Amazon Pay ICICI Card')"><span class="ic ic-xl" style="color:#FF9900"><svg><use href="#i-credit"/></svg></span><div><p class="fs">Amazon Pay ICICI Card</p><p class="xs mt">${uiText.instantCashback}</p></div></div></div></div>`;

  const htmlEscape = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const formatPaymentDate = (raw) => {
    const txt = String(raw || '').trim();
    if (!txt) return 'NA';
    if (/^\d{4}-\d{2}-\d{2}$/.test(txt)) {
      const [yyyy, mm, dd] = txt.split('-');
      return `${dd} ${monthName(Number(mm), true)} ${yyyy}`;
    }
    return toShortDateLabel(txt);
  };

  const normalizePaymentMethod = (raw) => {
    const method = String(raw || '').trim();
    const lower = method.toLowerCase();
    if (!method) return 'NA';
    if (lower === 'netbanking') return 'NetBanking';
    if (lower === 'e-nach') return 'E-NACH';
    return method;
  };

  const paymentRowsSource = data.paymentsTabData && Array.isArray(data.paymentsTabData.paymentHistory)
    ? data.paymentsTabData.paymentHistory
    : [];
  const paymentHistoryRows = (paymentRowsSource.length ? paymentRowsSource : [{ date: dueDate, amount: totalDue, method: 'UPI', status: 'Success' }])
    .slice(0, 8)
    .map((p) => {
      const statusRaw = String(p.status || '').toLowerCase();
      const displayStatus = statusRaw.includes('success') || statusRaw.includes('paid')
        ? 'Paid'
        : (statusRaw.includes('delay') || statusRaw.includes('pending') || statusRaw.includes('progress')
          ? 'Pending'
          : (statusRaw.includes('fail') || statusRaw.includes('error')
            ? 'Failed'
            : (String(p.status || 'Pending').trim() || 'Pending')));
      const statusClass = displayStatus === 'Paid' ? 'green' : (displayStatus === 'Failed' ? 'red' : 'orange');
      const amountText = formatINR(toNumber(p.amount, 0)).replace(/\.00$/, '');
      return `<tr><td>${htmlEscape(formatPaymentDate(p.date))}</td><td>Rs.${amountText}</td><td>${htmlEscape(normalizePaymentMethod(p.method))}</td><td><span class="badge ${statusClass}">${htmlEscape(displayStatus)}</span></td></tr>`;
    })
    .join('');

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
  const alertsStatsHtml = `<div class="grid g5" style="margin-bottom:16px" id="alerts-stats"><div class="card bl-red" style="text-align:center"><div class="card-b"><div style="color:var(--red);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-receipt"/></svg></span></div><p style="font-size:24px" class="fb">${billingAlertsCount}</p><p class="xs mt up" data-dynamic-i18n="alertBilling">Billing</p></div></div><div class="card bl-blue" style="text-align:center"><div class="card-b"><div style="color:var(--blue);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-chart"/></svg></span></div><p style="font-size:24px" class="fb">${usageAlertsCount}</p><p class="xs mt up" data-dynamic-i18n="alertUsage">Usage</p></div></div><div class="card bl-orange" style="text-align:center"><div class="card-b"><div style="color:var(--orange);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-package"/></svg></span></div><p style="font-size:24px" class="fb">${planServiceAlertsCount}</p><p class="xs mt up" data-dynamic-i18n="alertPlanExpiry">Plan Expiry</p></div></div><div class="card bl-purple" style="text-align:center"><div class="card-b"><div style="color:var(--purple);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-headphones"/></svg></span></div><p style="font-size:24px" class="fb">${serviceReqCount}</p><p class="xs mt up" data-dynamic-i18n="alertServiceReq">Service Req</p></div></div><div class="card bl-green" style="text-align:center"><div class="card-b"><div style="color:var(--green);margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#i-phone"/></svg></span></div><p style="font-size:24px" class="fb">${simActivationAlertsCount}</p><p class="xs mt up" data-dynamic-i18n="alertSimActivation">SIM Activation</p></div></div></div>`;
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
    const alertTypeKey = ({
      'Data Usage': 'dataUsage',
      'SMS Usage': 'smsUsage',
      'Call Usage': 'callUsage',
      'Voice Usage': 'voiceUsage',
      'International Roaming': 'intlRoaming',
    })[alertType];
    const alertTypeHtml = alertTypeKey
      ? `<span data-dynamic-i18n="${alertTypeKey}">${alertType}</span>`
      : alertType;
    const title = alertType === 'Data Usage'
      ? `${alertTypeHtml}${util} - ${employee} (${connection})`
      : `${alertTypeHtml}${util ? ` ${util}` : ''} - ${employee}`;
    const recommendation = String(a.recommendation || a.autoRecommendation || 'Review usage trend');
    const line2 = usageText ? `${usageText}. ${recommendation}` : recommendation;
    const ts = String(a.timestamp || 'recent');
    return `<div style="padding:10px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;cursor:pointer" onclick="switchTab(2);showToast('Navigating to Usage tab...')"><span class="badge ${sevClass}" style="min-width:40px;text-align:center">${severity}</span><div style="flex:1"><p class="fs sm">${title}</p><p class="xs mt">${line2}</p></div><span class="xs mt">${ts}</span></div>`;
  }).join('');

  const complaintsSummary = (data.customerSupport && data.customerSupport.complaintsSummary) || {};
  const complaintOpen = Math.max(0, Math.round(toNumber(complaintsSummary.openTickets, 0)));
  const complaintInProgress = Math.max(0, Math.round(toNumber(complaintsSummary.inProgressTickets, 0)));
  const complaintResolved = Math.max(0, Math.round(toNumber(complaintsSummary.resolvedTickets, 0)));
  const complaintsRowsHtml = complaints.map((c) => {
    const id = String(c.ticketId || 'DSP-NA');
    const desc = String(c.complaint || c.description || 'Issue');
    const amount = `Rs.${formatINR(c.amount || 0).replace(/\.00$/, '')}`;
    const status = String(c.status || 'Open');
    const statusLower = status.toLowerCase();
    const statusClass = statusLower.includes('resolved') ? 'green' : (statusLower.includes('progress') ? 'orange' : 'red');
    return `<tr class="ck" onclick="showToast('${id}: ${escapeJsSingleQuoted(desc)}')"><td class="fs tb">${id}</td><td>${desc}</td><td>${amount}</td><td><span class="badge ${statusClass}">${status}</span></td></tr>`;
  }).join('');

  const usageAlertsByConn = new Map();
  usageAlertsList.forEach((a) => {
    const k = String(a.connection || '');
    if (!k || /all lines/i.test(k)) return;
    usageAlertsByConn.set(k, (usageAlertsByConn.get(k) || 0) + 1);
  });
  const planAlertsList = Array.isArray(data.planServiceAlerts) ? data.planServiceAlerts : [];
  const planAlertsByConn = new Map();
  planAlertsList.forEach((a) => {
    const k = String(a.connection || '');
    if (!k) return;
    planAlertsByConn.set(k, (planAlertsByConn.get(k) || 0) + 1);
  });
  const connWeights = connections.map((c) => Math.max(1, Math.round(toNumber(c.alerts && c.alerts.activeAlerts, 1))));
  const weightSum = connWeights.reduce((s, v) => s + v, 0) || 1;
  const allocateByWeight = (total) => {
    const raw = connections.map((_c, i) => (total * connWeights[i]) / weightSum);
    const floor = raw.map((v) => Math.floor(v));
    let rem = Math.max(0, total - floor.reduce((s, v) => s + v, 0));
    const order = raw.map((v, i) => ({ i, frac: v - floor[i] })).sort((a, b) => b.frac - a.frac);
    for (let j = 0; j < rem; j += 1) floor[order[j % Math.max(1, order.length)].i] += 1;
    return floor;
  };
  const billingAlloc = allocateByWeight(billingAlertsCount);
  const serviceAlloc = allocateByWeight(serviceReqCount);
  const simAlloc = allocateByWeight(simActivationAlertsCount);
  const alertsByConnLiteral = `{${connections.map((c, i) => {
    const n = String(c.phoneNumber || '');
    return `${jsString(n)}:{billing:${billingAlloc[i] || 0},usage:${usageAlertsByConn.get(n) || 0},plan:${planAlertsByConn.get(n) || 0},service:${serviceAlloc[i] || 0},sim:${simAlloc[i] || 0}}`;
  }).join(',')}}`;

  const supportTicketsSrc = (data.disputeTrackerData && Array.isArray(data.disputeTrackerData.disputes))
    ? data.disputeTrackerData.disputes
    : complaints;
  const supportTicketsLiteral = `[${supportTicketsSrc.map((d, idx) => {
    const id = String(d.ticketId || `DSP-${idx + 1}`);
    const charge = String(d.category || d.complaint || d.description || 'Billing Issue');
    const amount = toNumber(d.amount, 0).toFixed(2);
    const status = String(d.status || 'Open');
    const conn = String(d.connection || '');
    return `{id:${jsString(id)},charge:${jsString(charge)},amount:${amount},status:${jsString(status)},conn:${jsString(conn)}}`;
  }).join(',')}]`;

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
  const disputeSummaryHtml = `<strong>${activeDisputesCount} ${uiText.activeDisputeLabel}${activeDisputesCount === 1 ? '' : (isHindiContent ? '' : 's')}</strong> | ${pendingDisputesCount} ${uiText.pendingLabel} | ${resolvedDisputesCount} ${uiText.resolvedLabel} | <span class="tg">${uiText.slaLabel}: ${disputeSla}</span>`;

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
      ? (isHindiContent ? 'सुलझा' : 'Resolved')
      : (rawStatus.includes('pending') ? (isHindiContent ? 'लंबित' : 'Pending') : (isHindiContent ? 'समीक्षा में' : 'In Review'));
    const statusColor = status === 'Resolved' ? 'green' : (status === 'Pending' ? 'red' : 'orange');
    const amount = Math.round(toNumber(d.amount, 0));
    return `{id:${jsString(String(d.ticketId || 'DSP-NA'))},connName:${jsString(`${employee} (...${String(mappedConn).slice(-3)})`)},conn:${jsString(String(mappedConn))},desc:${jsString(String(d.description || d.category || 'Billing dispute'))},amt:${amount},status:${jsString(status)},statusColor:${jsString(statusColor)}}`;
  });
  const allDisputesJs = allDisputesJsRows.length
    ? `[${allDisputesJsRows.join(',')}]`
    : `[{id:'DSP-NA',connName:${jsString(isHindiContent ? 'कोई विवाद नहीं' : 'No Disputes')},conn:'NA',desc:${jsString(isHindiContent ? 'इस खाते के लिए कोई विवाद नहीं मिला' : 'No disputes found for this account')},amt:0,status:${jsString(isHindiContent ? 'सुलझा' : 'Resolved')},statusColor:'green'}]`;

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
  const scenarioDescriptionMapLiteral = `{${scenarioRows.map((s) => {
    const label = String(s.name || 'Scenario');
    const desc = String(s.description || s.impact || `Projected monthly bill: Rs.${formatINR(toNumber(s.billAmount || s.monthlyAmount, chargeTotal)).replace(/\.00$/, '')}`);
    return `${jsString(label)}:${jsString(desc)}`;
  }).join(',')}}`;
  const scenarioLabelsLiteral = JSON.stringify(scenarioLabels);
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
  output = output.replace(/Globe Consultancy Services Ltd/g, companyName.replace(/\.$/, ''));
  output = output.replace(/Globe Consultancy Services Limited/g, companyName);
  output = output.replace(/Adarsh Pandey Enterprises Ltd\./g, companyName);
  output = output.replace(/Adarsh Pandey Enterprises Ltd/g, companyName.replace(/\.$/, ''));
  output = output.replace(/<span class="mt">Account category<\/span><span class="fs">[^<]*<\/span>/g, `<span class="mt">Account category</span><span class="fs" data-dynamic-i18n="accountCategory">${accountCategory}</span>`);
  output = output.replace(/<p class="xs mt" style="color:var\(--muted\)">Account Category<\/p><p class="fs" style="font-size:14px">[^<]*<\/p>/g, `<p class="xs mt" style="color:var(--muted)">Account Category</p><p class="fs" style="font-size:14px" data-dynamic-i18n="accountCategory">${accountCategory}</p>`);
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
  output = output.replace(/var st=String\(t\.status\|\|'Open'\);var sl=st\.toLowerCase\(\);\s*var cl=sl\.indexOf\('resolved'\)>=0\?'green':\(sl\.indexOf\('progress'\)>=0\|\|sl\.indexOf\('review'\)>=0\|\|sl\.indexOf\('pending'\)>=0\?'orange':'red'\);/g, "var raw=String(t.status||'Open');var sl=raw.toLowerCase();\n      var st=sl.indexOf('resolved')>=0?'Resolved':((sl.indexOf('progress')>=0||sl.indexOf('review')>=0||sl.indexOf('pending')>=0)?'In Progress':'Open');\n      var cl=st==='Resolved'?'green':(st==='In Progress'?'orange':'red');");
  output = output.replace(/\/\* PAGE 5: Dashboard \*\//, `/* PAGE 4: Customer Support */
  var supportTicketsAll=${supportTicketsLiteral};
  var supportFiltered=currentFilter===0?supportTicketsAll:supportTicketsAll.filter(function(t){return filtered.some(function(c){return c.num===t.conn})});
  var sOpen=supportFiltered.filter(function(t){var x=String(t.status||'').toLowerCase();return x.indexOf('open')>=0||x.indexOf('active')>=0}).length;
  var sInProg=supportFiltered.filter(function(t){var x=String(t.status||'').toLowerCase();return x.indexOf('progress')>=0||x.indexOf('review')>=0||x.indexOf('pending')>=0}).length;
  var sResolved=supportFiltered.filter(function(t){return String(t.status||'').toLowerCase().indexOf('resolved')>=0}).length;
  var sCards=document.querySelectorAll('#page-4 .grid.g3 .card .card-b .fb');
  if(sCards&&sCards.length>=3){sCards[0].textContent=String(sOpen);sCards[1].textContent=String(sInProg);sCards[2].textContent=String(sResolved);}
  var csBody=document.querySelector('#page-4 .card table tbody');
  if(csBody){
    var rows=(supportFiltered.length?supportFiltered:[{id:'NA',charge:'No complaints',amount:0,status:'Resolved',conn:''}]).map(function(t){
      var raw=String(t.status||'Open');var sl=raw.toLowerCase();
      var st=sl.indexOf('resolved')>=0?'Resolved':((sl.indexOf('progress')>=0||sl.indexOf('review')>=0||sl.indexOf('pending')>=0)?'In Progress':'Open');
      var cl=st==='Resolved'?'green':(st==='In Progress'?'orange':'red');
      var cls=cl==='green'?'tg':'tb';
      return '<tr class="ck" onclick="showToast(\\''+String(t.id).replace(/'/g,'')+': '+String(t.charge).replace(/'/g,'')+'\\')"><td class="fs '+cls+'">'+t.id+'</td><td>'+t.charge+'</td><td>Rs.'+Number(t.amount||0).toLocaleString('en-IN',{maximumFractionDigits:2})+'</td><td><span class="badge '+cl+'">'+st+'</span></td></tr>';
    }).join('');
    csBody.innerHTML=rows;
  }

  /* PAGE 5: Dashboard */`);
  output = output.replace(/(Active Lines<\/p><p class="fs" style="font-size:14px">)\d+ of \d+(<\/p>)/g, `$1${lineCount} of ${lineCount}$2`);
  output = output.replace(/<span class="badge purple">4 '\+t\.insights<\/span>/g, `<span class="badge purple">${aiInsightsCount} '+t.insights</span>`);
  output = output.replace(/Save Rs\.1,247/g, `Save Rs.${formatINR(savingsRaw).replace(/\.00$/, '')}`);
  output = output.replace(/<div class="card-b" id="plan-recs">[\s\S]*?<\/div><\/div><\/div>/, `<div class="card-b" id="plan-recs">${aiRecItemsHtml || aiRecFallback}<button class="btn grn" style="width:100%" onclick="showToast('All recommendations applied! Save Rs.${aiApplySavingsText}/mo');launchConfetti()">Apply All Savings</button></div></div></div>`);
  output = output.replace(/AI Recommendations <span class="badge green">Save Rs\.[0-9,]+(?:\.[0-9]{2})?<\/span>/g, `AI Recommendations <span class="badge green">Save Rs.${aiApplySavingsText}</span>`);
  output = output.replace(/Globe[\s\u00A0]+Enterprise/g, companyName);
  output = output.replace(/Globe Consultancy Services Building/g, `${companyName} Building`);
  output = output.replace(/<div class="grid g2"><div class="card"><div class="card-h"><h3>Current Plans<\/h3><\/div><div style="padding:0"><table><thead><tr><th>Line<\/th><th>User<\/th><th>Plan<\/th><th>Cost<\/th><th>Action<\/th><\/tr><\/thead><tbody>[\s\S]*?<\/tbody><\/table><\/div><\/div>/, `<div class="grid g2"><div class="card"><div class="card-h"><h3>Current Plans</h3></div><div style="padding:0"><table><thead><tr><th>Line</th><th>User</th><th>Plan</th><th>Cost</th><th>Action</th></tr></thead><tbody>${currentPlanRows}</tbody></table></div></div>`);
  output = output.replace(/<div class="grid g2"><div class="card bl-red"><div class="card-h"><h3>Raise Dispute<\/h3><\/div><div class="card-b"><select class="fi" style="margin-bottom:8px" id="dispute-cat">[\s\S]*?<button class="btn pri" style="width:100%" onclick="submitDispute\(\)">Submit Dispute<\/button><\/div><\/div>/, disputeCardHtml);

  const dynamicI18nJson = JSON.stringify(dynamicI18nMap).replace(/</g, '\\u003c');
  output = output.replace(/  var orig=window\.changeLang;/, `  window.dynamicI18nMap=${dynamicI18nJson};\n  function translateDynamicContent(lang){\n    var map=window.dynamicI18nMap&&window.dynamicI18nMap[lang]||window.dynamicI18nMap&&window.dynamicI18nMap.en||{};\n    document.querySelectorAll('[data-dynamic-i18n]').forEach(function(el){\n      var key=el.getAttribute('data-dynamic-i18n');\n      if(key&&Object.prototype.hasOwnProperty.call(map,key)){el.textContent=map[key];}\n    });\n  }\n  var orig=window.changeLang;`);
  output = output.replace(/window\.changeLang=function\(lang\)\{if\(typeof orig==='function'\)orig\(lang\);translateAllContent\(lang\)\};/, `window.changeLang=function(lang){if(typeof orig==='function')orig(lang);translateAllContent(lang);translateDynamicContent(lang)};`);
  output = output.replace(/setTimeout\(function\(\)\{translateAllContent\(sel\.value\)\},100\);/g, `setTimeout(function(){translateAllContent(sel.value);translateDynamicContent(sel.value)},100);`);
  output = output.replace(/setTimeout\(function\(\)\{translateAllContent\(sel\.value\)\},400\);/g, `setTimeout(function(){translateAllContent(sel.value);translateDynamicContent(sel.value)},400);`);
  output = output.replace(/setTimeout\(function\(\)\{var sel=document\.getElementById\('langSelect'\);if\(sel&&sel\.value&&sel\.value!=='en'\)translateAllContent\(sel\.value\)\},500\);/g, `setTimeout(function(){var sel=document.getElementById('langSelect');if(sel&&sel.value&&sel.value!=='en'){translateAllContent(sel.value);translateDynamicContent(sel.value)}},500);`);

  output = output.replace(/var connOpts='<option>Connection\.\.\.<\/option>';/g, `var connOpts='<option value="Connection...">${escapeJsSingleQuoted(uiText.connectionPlaceholderDisplay)}</option>';`);
  output = output.replace(/if\(dTitle\) dTitle\.textContent=i===0\?'Self-Service & Disputes':'Self-Service & Disputes — '\+filtered\[0\]\.num;/g, `if(dTitle) dTitle.textContent=i===0?${jsString(uiText.selfServiceDisputes)}:${jsString(`${uiText.selfServiceDisputes} — `)}+filtered[0].num;`);
  output = output.replace(/dSummary\.innerHTML='<strong>'\+active\+' Active Dispute'\+\(active!==1\?'s':''\)\+'<\/strong> \| '\+pending\+' Pending \| '\+resolved\+' Resolved \(90 days\) \| <span class="tg">SLA: 98%<\/span>';/g, `dSummary.innerHTML='<strong>'+active+' ${escapeJsSingleQuoted(uiText.activeDisputeLabel)}'+(active!==1?${jsString(isHindiContent ? '' : 's')}:'' )+'</strong> | '+pending+' ${escapeJsSingleQuoted(uiText.pendingLabel)} | '+resolved+' ${escapeJsSingleQuoted(uiText.resolvedLabel)} | <span class="tg">${escapeJsSingleQuoted(uiText.slaLabel)}: 98%</span>';`);
  output = output.replace(/dList\.innerHTML='<div style="padding:16px;text-align:center" class="mt">No disputes for this connection<\/div>';/g, `dList.innerHTML='<div style="padding:16px;text-align:center" class="mt">${escapeJsSingleQuoted(uiText.noDisputesForConnection)}</div>';`);
  output = output.replace(/showToast\('Dispute withdrawn successfully'\)/g, `showToast(${jsString(uiText.disputeWithdrawnToast)})`);
  output = output.replace(/showToast\('Select category & connection!'\)/g, `showToast(${jsString(uiText.selectCategoryConnectionToast)})`);
  output = output.replace(/showToast\('Please select a category first'\)/g, `showToast(${jsString(uiText.selectCategoryFirstToast)})`);
  output = output.replace(/showToast\('AI generating dispute description\.\.\.'\)/g, `showToast(${jsString(uiText.aiGeneratingDescriptionToast)})`);
  output = output.replace(/showToast\('AI generating feedback analysis\.\.\.'\)/g, `showToast(${jsString(uiText.aiGeneratingFeedbackToast)})`);
  output = output.replace(/showToast\('AI text applied to description'\)/g, `showToast(${jsString(uiText.aiAppliedToast)})`);
  output = output.replace(/showToast\('Dispute '\+id\+' submitted! SLA: 6hr\.'\)/g, `showToast(${jsString(`${uiText.disputeSubmittedPrefix} `)}+id+${jsString(` ${uiText.disputeSubmittedSuffix}`)})`);
  output = output.replace(/\?\'Self-Service & Disputes\':\'Self-Service & Disputes — '\+filtered\[0\]\.num/g, `?${jsString(uiText.selfServiceDisputes)}:${jsString(`${uiText.selfServiceDisputes} — `)}+filtered[0].num`);
  output = output.replace("if(dTitle) dTitle.textContent=i===0?'Self-Service & Disputes':'Self-Service & Disputes — '+filtered[0].num;", `if(dTitle) dTitle.textContent=i===0?${jsString(uiText.selfServiceDisputes)}:${jsString(`${uiText.selfServiceDisputes} — `)}+filtered[0].num;`);
  output = output.replace(/d\.status==='In Review'/g, "(d.status==='In Review'||d.status==='समीक्षा में')");
  output = output.replace(/d\.status==='Pending'/g, "(d.status==='Pending'||d.status==='लंबित')");
  output = output.replace(/d\.status==='Resolved'/g, "(d.status==='Resolved'||d.status==='सुलझा')");
  output = output.replace(/>Withdraw<\/button>/g, `>${escapeJsSingleQuoted(uiText.withdraw)}<\/button>`);
  output = output.replace(/<span class="badge red">Open<\/span>/g, `<span class="badge red">${isHindiContent ? 'खुला' : 'Open'}</span>`);
  output = output.replace(/\' Connection: \'\+conn\+'\.\'/g, isHindiContent ? "' कनेक्शन: '+conn+'.'" : "' Connection: '+conn+'.'");
  output = output.replace(/\' Disputed amount: Rs\.\'\+amt\+'\.\'/g, isHindiContent ? "' विवादित राशि: Rs.'+amt+'.'" : "' Disputed amount: Rs.'+amt+'.'");
  output = output.replace(/var aiDescTpl=\{[\s\S]*?\};/, `var aiDescTpl=${aiDisputeTemplatesLiteral};`);
  output = output.replace(/'\[AI-Generated Dispute Description \\u2014 GPT-4o\]\\n\\n'/g, jsString(`${uiText.aiDisputeTitle}\n\n`));
  output = output.replace(/Severity: High \| Confidence: 92% \| Similar cases resolved: 87%/g, uiText.aiSeverityLine);
  output = output.replace(/Recommended resolution: Retroactive adjustment with credit note\./g, uiText.aiResolutionLine);
  output = output.replace(/'\[AI-Generated Feedback \\u2014 Claude 3\.5 Sonnet\]\\n\\n'/g, jsString(`${uiText.aiFeedbackTitle}\n\n`));
  output = output.replace(/AI Analysis: Based on 847 similar disputes, 91% resolution rate within 4\.2 hours\./g, uiText.aiAnalysisLine);
  output = output.replace(/Recommended action: Priority escalation to billing operations team\./g, uiText.aiActionLine);

  output = output.replace(/<div class="mbg" id="booster-modal">[\s\S]*?(?=<div class="mbg" id="channel-modal">)/, `${boosterModalHtml}\n\n`);
  output = output.replace(/<div class="mbg" id="channel-modal">[\s\S]*?(?=<div class="mbg" id="new-complaint-modal">)/, `${channelModalHtml}\n\n`);
  output = output.replace(/<div class="mbg" id="new-complaint-modal">[\s\S]*?(?=<div class="mbg" id="complaint-detail-modal">)/, `${newComplaintModalHtml}\n\n`);
  output = output.replace(/<div class="mbg" id="complaint-detail-modal">[\s\S]*?(?=<div class="mbg" id="callback-modal">)/, `${complaintDetailModalHtml}\n\n`);
  output = output.replace(/<div class="mbg" id="callback-modal">[\s\S]*?(?=<div class="mbg" id="plan-switch-modal">)/, `${callbackModalHtml}\n\n`);
  output = output.replace(/<div class="mbg" id="plan-switch-modal">[\s\S]*?(?=<!-- Amazon Pay Modal -->)/, `${planSwitchModalHtml}\n\n`);
  output = output.replace(/<div class="mbg" id="amazonpay-modal">[\s\S]*?(?=<div class="toast" id="toast">)/, `${amazonPayModalHtml}\n\n`);

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
  // Keep device/EMI model text fully JSON-driven, regardless of template seed text.
  output = output.replace(/Samsung(?:\s+Galaxy)?\s+S25\s+Ultra\s*-\s*\d{6,}/gi, `${commitmentsModel} - ${commitmentsNumber}`);
  output = output.replace(/(<div class="mbg" id="emi-modal">[\s\S]*?<p class="sm mt" style="margin-bottom:10px">)[\s\S]*?(<\/p>)/, `$1${commitmentsModel} - ${commitmentsNumber}$2`);
  output = output.replace(/<span class="fb">Rs\.[0-9,]+\/mo<\/span> \| [0-9]+ of [0-9]+ paid \| Rs\.[0-9,]+ remaining/g, `<span class="fb">Rs.${commitmentsMonthly}/mo</span> | ${commitmentsPaid} of ${commitmentsTotal} paid | Rs.${formatINR(commitmentsRemaining).replace(/\.00$/, '')} remaining`);
  output = output.replace(/<p class="fb">[0-9]+\/[0-9]+<\/p><p class="xs">Paid<\/p>/g, `<p class="fb">${commitmentsPaid}/${commitmentsTotal}</p><p class="xs">Paid</p>`);
  output = output.replace(/<p class="fb">Rs\.[0-9,]+<\/p><p class="xs">Left<\/p>/g, `<p class="fb">Rs.${formatINR(commitmentsRemaining).replace(/\.00$/, '')}</p><p class="xs">Left</p>`);
  output = output.replace(/<p class="fb">[A-Za-z]{3} [0-9]{4}<\/p><p class="xs">End<\/p>/g, `<p class="fb">${commitmentsEnd}</p><p class="xs">End</p>`);
  output = output.replace(/showToast\('Foreclosure: Rs\.[0-9,]+'\)/g, `showToast('Foreclosure: Rs.${formatINR(commitmentsRemaining).replace(/\.00$/, '')}')`);
  output = output.replace(/(<div class="prog-f" style="width:)[0-9]+%?(;background:var\(--blue\)"><\/div>)/g, (_m, p1, p2) => `${p1}${commitmentsPct}%${p2}`);

  output = output.replace(/<tbody><tr><td>Plan Rental<\/td><td>Rs\.[\s\S]*?<\/tr><tr class="tot"><td>Total<\/td><td>Rs\.[\s\S]*?<\/tr><\/tbody>/, chargeTableBodyHtml);
  output = output.replace(/(<div class="mbg" id="month-modal">[\s\S]*?<table><tbody>)[\s\S]*?(<\/tbody><\/table><\/div><\/div>)/, `$1${monthDetailRows}$2`);
  output = output.replace(/<div class="card"><div class="card-h"><h3>Charge Table<\/h3><\/div><div style="padding:0"><table><thead><tr><th>Category<\/th><th>Amount<\/th><th>%<\/th><\/tr><\/thead><tbody>[\s\S]*?<\/tbody><\/table><\/div><\/div>/, `<div class="card"><div class="card-h"><h3>Charge Table</h3></div><div style="padding:0"><table><thead><tr><th>Category</th><th>Amount</th><th>%</th></tr></thead>${chargeTableBodyHtml}</table></div></div>`);
  output = output.replace(/<div id="report-payment" class="rsec"><div class="card bl-green"><div class="card-h"><h3>Payment History<\/h3><\/div><div style="padding:0"><table><thead><tr><th>Date<\/th><th>Amount<\/th><th>Method<\/th><th>Status<\/th><\/tr><\/thead><tbody>[\s\S]*?<\/tbody><\/table><\/div><\/div><\/div>/, `<div id="report-payment" class="rsec"><div class="card bl-green"><div class="card-h"><h3>Payment History</h3></div><div style="padding:0"><table><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead><tbody>${paymentHistoryRows}</tbody></table></div></div></div>`);
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
  output = output.replace(/\/\* PAGE 15: Alerts \*\/[\s\S]*?\/\* Update charts with filtered data \*\//, `/* PAGE 15: Alerts */
  var alertStats=document.getElementById('alerts-stats');
  if(alertStats){
    var alertsByConn=${alertsByConnLiteral};
    var sumBy=function(k){return filtered.reduce(function(s,c){var x=alertsByConn[c.num]||{};return s+Number(x[k]||0)},0)};
    var aBilling=i===0?${billingAlertsCount}:sumBy('billing');
    var aUsage=i===0?${usageAlertsCount}:sumBy('usage');
    var aPlan=i===0?${planServiceAlertsCount}:sumBy('plan');
    var aSvc=i===0?${serviceReqCount}:sumBy('service');
    var aSim=i===0?${simActivationAlertsCount}:sumBy('sim');
    var aStats=[{t:aBilling,l:'Billing',c:'red',icon:'i-receipt'},{t:aUsage,l:'Usage',c:'blue',icon:'i-chart'},{t:aPlan,l:'Plan Expiry',c:'orange',icon:'i-package'},{t:aSvc,l:'Service Req',c:'purple',icon:'i-headphones'},{t:aSim,l:'SIM Activation',c:'green',icon:'i-phone'}];
    alertStats.innerHTML=aStats.map(function(s){return '<div class="card bl-'+s.c+'" style="text-align:center"><div class="card-b"><div style="color:var(--'+s.c+');margin-bottom:4px"><span class="ic ic-xl"><svg><use href="#'+s.icon+'"/></svg></span></div><p style="font-size:24px" class="fb">'+s.t+'</p><p class="xs mt up">'+s.l+'</p></div></div>'}).join('');
  }

  /* Update charts with filtered data */`);
  output = output.replace(/var ratio=totalAmt\/[0-9]+(?:\.[0-9]+)?;/g, `var ratio=totalAmt/${ratioBaseTotal};`);
  output = output.replace(/mc\('chartChargeDonut',\{type:'doughnut',data:\{labels:\['Plan','Data','Roaming','Add-Ons','Taxes'\],datasets:\[\{data:\[totalPlan,totalData,totalRoaming,totalVas,totalTax\][\s\S]*?\}\}\}\);/, `mc('chartChargeDonut',{type:'doughnut',data:{labels:['Plan','Data','Roaming','Add-Ons','Taxes'],datasets:[{data:[totalPlan,totalData,totalRoaming,totalVas,totalTax],backgroundColor:['#c62828','#f57f17','#0d47a1','#6a1b9a','#546e7a'],borderWidth:2,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:false,animation:{animateRotate:true,duration:800},plugins:{legend:{position:'right',labels:{font:{size:11,family:'Inter',weight:'500'}}}}}});\n  var chargeBody=document.getElementById('report-charge-table-body');\n  if(chargeBody){\n    var fmtAmt=function(v){return Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});};\n    var rows=[\n      ['Plan Rental',totalPlan],\n      ['Data Overage',totalData],\n      ['Intl Roaming',totalRoaming],\n      ['Add-Ons',totalVas],\n      ['Taxes (18%)',totalTax]\n    ];\n    chargeBody.innerHTML=rows.map(function(r){var pct=totalAmt>0?((r[1]/totalAmt)*100).toFixed(1):'0.0';return '<tr><td>'+r[0]+'</td><td>Rs.'+fmtAmt(r[1])+'</td><td>'+pct+'%</td></tr>';}).join('')+'<tr class="tot"><td>Total</td><td>Rs.'+fmtAmt(totalAmt)+'</td><td>100%</td></tr>';\n  }`);
  output = output.replace(/mc\('chartChargeDonut',\{type:'doughnut',data:\{labels:\['Plan','Data','Roaming','Add-Ons','Taxes'\],datasets:\[\{data:\[[0-9.,\s]+\]/g, `mc('chartChargeDonut',{type:'doughnut',data:{labels:['Plan','Data','Roaming','Add-Ons','Taxes'],datasets:[{data:[${jsonPlanCharge.toFixed(2)},${jsonDataCharge.toFixed(2)},${jsonRoamingCharge.toFixed(2)},${jsonAddOnCharge.toFixed(2)},${jsonTaxCharge.toFixed(2)}]`);
  output = output.replace(/mc\('chartForecast',\{type:'line',data:\{labels:\[[\s\S]*?\}\}\}\);/g, forecastChartScript);
  output = output.replace(/mc\('chartScenario',\{type:'bar',data:\{labels:\[[\s\S]*?\}\}\}\);/g, scenarioChartScript);
  output = output.replace(/var fAmt=Math\.round\(totalAmt\*0\.92\);[\s\S]*?mc\('chartScenario',\{type:'bar',data:\{labels:\[[\s\S]*?\}\}\}\);/, forecastFilterScript);
  output = output.replace(/if \(label && label\.textContent === 'Comparison'\) label\.textContent = 'Comparisons';/g, `if (label && label.textContent === 'Comparison') label.textContent = ${jsString(uiText.comparisonLabel)};`);
  output = output.replace(/var scenarioPopups=\{[\s\S]*?\};/, `var scenarioPopups=${scenarioDescriptionMapLiteral};`);
  output = output.replace(/var labels=\['Current','If \+20% Data','If Roaming Trip','Optimized'\];/, `var labels=${scenarioLabelsLiteral};`);

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

  // Final-pass dispute localization (must run after forecastFilterScript replacement).
  output = output.replace(/if\(dTitle\) dTitle\.textContent=i===0\?'Self-Service & Disputes':'Self-Service & Disputes — '\+filtered\[0\]\.num;/g, `if(dTitle) dTitle.textContent=i===0?${jsString(uiText.selfServiceDisputes)}:${jsString(`${uiText.selfServiceDisputes} — `)}+filtered[0].num;`);
  output = output.replace(/if\(dTitle\)[^\n]+/g, `if(dTitle) dTitle.textContent=i===0?${jsString(uiText.selfServiceDisputes)}:${jsString(`${uiText.selfServiceDisputes} — `)}+filtered[0].num;`);
  output = output.replace(/d\.status==='In Review'/g, "(d.status==='In Review'||d.status==='समीक्षा में')");
  output = output.replace(/d\.status==='Pending'/g, "(d.status==='Pending'||d.status==='लंबित')");
  output = output.replace(/d\.status==='Resolved'/g, "(d.status==='Resolved'||d.status==='सुलझा')");
  output = output.replace(/var connOpts='<option>Connection\.\.\.<\/option>';/g, `var connOpts='<option value="Connection...">${escapeJsSingleQuoted(uiText.connectionPlaceholderDisplay)}</option>';`);
  output = output.replace(/>Withdraw<\/button>/g, `>${escapeJsSingleQuoted(uiText.withdraw)}<\/button>`);
  output = output.replace(/<span class="badge red">Open<\/span>/g, `<span class="badge red">${isHindiContent ? 'खुला' : 'Open'}</span>`);
  output = output.replace(/\' Connection: \'\+conn\+'\.\'/g, isHindiContent ? "' कनेक्शन: '+conn+'.'" : "' Connection: '+conn+'.'");
  output = output.replace(/\' Disputed amount: Rs\.\'\+amt\+'\.\'/g, isHindiContent ? "' विवादित राशि: Rs.'+amt+'.'" : "' Disputed amount: Rs.'+amt+'.'");

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
