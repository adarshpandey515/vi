const fs = require('fs');
const path = require('path');

// Utility function to generate random number in range
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min, max, decimals = 2) {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (value == null) return 0;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

const addressBook = [
  {
    line1: 'Tower B, 5th Floor',
    line2: 'DLF Cyber City',
    city: 'Gurugram',
    postalCode: '122002',
    state: 'Haryana',
    country: 'India'
  },
  {
    line1: 'Orchid Business Park',
    line2: 'Western Express Highway',
    city: 'Mumbai',
    postalCode: '400063',
    state: 'Maharashtra',
    country: 'India'
  },
  {
    line1: 'Crystal Plaza, 3rd Floor',
    line2: 'MG Road',
    city: 'Bengaluru',
    postalCode: '560001',
    state: 'Karnataka',
    country: 'India'
  }
];

function formatAddressHtml(address) {
  return `${address.line1}, ${address.line2}<br>${address.city} ${address.postalCode},<br>${address.state}, ${address.country}`;
}

// Generate diverse data for each account
function generateAccountData(accountName, accountNumber, phoneBase) {
  const departments = ['Leadership', 'Sales', 'Engineering', 'Finance', 'Marketing', 'Product', 'Support', 'Executive', 'Management', 'HR'];
  const monthlySpend = randomBetween(6000, 12000);
  const averageSpend = randomBetween(5000, 11000);
  const budgetUtilization = randomBetween(70, 95);
  const monthlyBudget = (monthlySpend / (budgetUtilization / 100)).toFixed(2);
  const remainingBudget = (monthlyBudget - monthlySpend).toFixed(2);
  
  const daysRemaining = randomBetween(1, 10);
  const lateFeeIfNotPaid = randomBetween(30, 100).toFixed(2);

  const address = addressBook[randomBetween(0, addressBook.length - 1)];
  const companyAddress = `${address.line1}, ${address.line2}, ${address.city} ${address.postalCode}, ${address.state}, ${address.country}`;
  const companyAddressHtml = formatAddressHtml(address);
  
  // Bill breakdown - varied
  const basePlans = randomBetween(3000, 4500).toFixed(2);
  const dataOverage = randomBetween(200, 1200).toFixed(2);
  const roaming = randomBetween(500, 2500).toFixed(2);
  const vasServices = randomBetween(300, 1200).toFixed(2);
  const subtotal = (parseFloat(basePlans) + parseFloat(dataOverage) + parseFloat(roaming) + parseFloat(vasServices)).toFixed(2);
  const gstRate = randomBetween(10, 18);
  const gstAmount = (parseFloat(subtotal) * (gstRate / 100)).toFixed(2);
  const totalCharges = (parseFloat(subtotal) + parseFloat(gstAmount)).toFixed(2);
  const adjustments = randomDecimal(100, 500);
  const totalDue = (parseFloat(totalCharges) + parseFloat(adjustments)).toFixed(2);
  
  // Connection data - diverse
  const connections = [];
  const plans = ['Max 999', 'Plus 799', 'Basic 599', 'Max 999', 'Plus 799'];
  const planCosts = { 'Max 999': 999, 'Plus 799': 799, 'Basic 599': 599 };
  const employees = [accountName, 'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Vikram Singh'];
  
  for (let i = 0; i < 5; i++) {
    const planCode = plans[i];
    const dataUsed = randomDecimal(20, 90);
    const dataLimit = planCode === 'Max 999' ? 100 : planCode === 'Plus 799' ? 75 : 50;
    const dataUtil = (parseFloat(dataUsed) / parseFloat(dataLimit) * 100).toFixed(0);
    
    const callsUsed = randomBetween(400, 2500);
    const callsLimit = 3000;
    
    const smsUsed = randomBetween(50, 250);
    const smsLimit = planCode === 'Max 999' ? 1000 : planCode === 'Plus 799' ? 500 : 300;

    const dataLocal = Number((parseFloat(dataUsed) * (randomBetween(70, 95) / 100)).toFixed(1));
    const dataRoaming = Number((Math.max(0, parseFloat(dataUsed) - dataLocal)).toFixed(1));
    const callsLocal = Math.floor(callsUsed * (randomBetween(70, 90) / 100));
    const callsInternational = Math.max(0, callsUsed - callsLocal);
    const smsLocal = Math.floor(smsUsed * (randomBetween(70, 95) / 100));
    const smsInternational = Math.max(0, smsUsed - smsLocal);
    
    const roamingUsed = randomBetween(1000, 6000);
    
    const planCost = planCosts[planCode];
    const chargeDataOverage = randomDecimal(0, 500);
    const chargeRoaming = randomDecimal(100, 800);
    const chargeVas = randomDecimal(150, 500);
    const chargeTax = randomDecimal(200, 500);
    const connectionSubtotal = (planCost + parseFloat(chargeDataOverage) + parseFloat(chargeRoaming) + parseFloat(chargeVas) + parseFloat(chargeTax)).toFixed(2);
    
    const monthlySpendConnection = randomDecimal(800, 3500);
    const monthlyLimitConnection = randomBetween(1500, 3500);
    const limitUtilization = (parseFloat(monthlySpendConnection) / monthlyLimitConnection * 100).toFixed(0);
    
    const paymentStatuses = ['On-time', 'Delayed', 'Autopay Active', 'Occasional Delay'];
    const paymentStatus = paymentStatuses[randomBetween(0, 3)];
    const delaysInLast12 = paymentStatus === 'On-time' ? randomBetween(0, 2) : paymentStatus === 'Delayed' ? randomBetween(3, 8) : randomBetween(1, 3);
    const onTimePercentage = 100 - (delaysInLast12 * 12);
    const riskScore = delaysInLast12 === 0 ? randomBetween(10, 40) : delaysInLast12 < 3 ? randomBetween(40, 70) : randomBetween(70, 100);
    const riskPriority = riskScore > 75 ? 'HIGH' : riskScore > 50 ? 'MEDIUM' : 'LOW';
    
    connections.push({
      phoneNumber: `${phoneBase}${String(i).padStart(2, '0')}`,
      employeeName: employees[i],
      department: departments[randomBetween(0, departments.length - 1)],
      costCenter: `CC-${String(randomBetween(100, 999)).slice(0, 3)}-${String(i + 1).padStart(2, '0')}`,
      isPrimary: i === 0,
      plan: {
        name: planCode.split(' ')[0],
        code: planCode,
        baseCost: planCost.toString()
      },
      monthlySpend: monthlySpendConnection,
      monthlyLimit: monthlyLimitConnection.toString(),
      limitUtilization: limitUtilization + '%',
      status: 'Active',
      usage: {
        data: {
          used: parseFloat(dataUsed),
          limit: parseFloat(dataLimit),
          local: dataLocal,
          roaming: dataRoaming,
          unit: 'GB',
          utilization: dataUtil + '%'
        },
        calls: {
          used: callsUsed,
          limit: callsLimit,
          local: callsLocal,
          international: callsInternational,
          unit: 'minutes'
        },
        sms: {
          used: smsUsed,
          limit: smsLimit,
          local: smsLocal,
          international: smsInternational,
          unit: 'messages'
        },
        roaming: {
          used: roamingUsed,
          unit: 'minutes'
        }
      },
      charges: {
        planCost: planCost.toString(),
        dataOverage: chargeDataOverage,
        roaming: chargeRoaming,
        vas: chargeVas,
        tax: chargeTax
      },
      paymentStatus: paymentStatus,
      paymentHistory: {
        onTimePercentage: Math.max(0, onTimePercentage),
        averageDelayDays: randomDecimal(0, 15),
        delaysInLast12Months: delaysInLast12
      },
      collectionRiskScore: riskScore,
      collectionPriority: riskPriority,
      lateFeesAccumulated: riskScore > 50 ? randomDecimal(50, 300) : '0.00',
      alerts: {
        activeAlerts: randomBetween(0, 3),
        billingAlerts: [],
        usageAlerts: [],
        serviceAlerts: []
      }
    });
  }

  const billBreakdownByConnection = connections.map((c) => {
    const items = [];
    const planAmount = toNumber(c.plan.baseCost);
    items.push({
      description: `${c.plan.code} (${c.phoneNumber})`,
      category: 'Plan Rental',
      amount: planAmount
    });
    if (toNumber(c.charges.dataOverage) > 0) {
      items.push({ description: 'Data overage charges', category: 'Data Overage', amount: toNumber(c.charges.dataOverage) });
    }
    if (toNumber(c.charges.roaming) > 0) {
      items.push({ description: 'International roaming usage', category: 'Intl Roaming', amount: toNumber(c.charges.roaming) });
    }
    if (toNumber(c.charges.vas) > 0) {
      items.push({ description: 'Value added services', category: 'Add-Ons', amount: toNumber(c.charges.vas) });
    }
    if (toNumber(c.charges.tax) > 0) {
      items.push({ description: 'GST allocation', category: 'Taxes', amount: toNumber(c.charges.tax) });
    }
    return {
      phoneNumber: c.phoneNumber,
      employeeName: c.employeeName,
      department: c.department,
      subtotal: toNumber(c.monthlySpend),
      lineItems: items
    };
  });

  const deptMap = {};
  connections.forEach((c) => {
    if (!deptMap[c.department]) {
      deptMap[c.department] = { lines: 0, spent: 0 };
    }
    deptMap[c.department].lines += 1;
    deptMap[c.department].spent += toNumber(c.monthlySpend);
  });

  const departmentSpend = Object.keys(deptMap).map((dept) => {
    const spent = deptMap[dept].spent;
    const budget = Math.round(spent * (randomBetween(110, 130) / 100));
    const pct = Math.round((spent / budget) * 100);
    const status = pct > 95 ? 'Over' : pct > 85 ? 'Watch' : 'OK';
    return {
      department: dept,
      lines: deptMap[dept].lines,
      budget: budget.toFixed(2),
      spent: spent.toFixed(2),
      status
    };
  });

  const paymentMethods = ['NEFT', 'UPI', 'Card', 'NetBanking'];
  const paymentHistory = [
    { date: '01 Feb 2026', amount: totalDue, method: paymentMethods[0], status: 'Paid' },
    { date: '03 Jan 2026', amount: randomBetween(6500, 8200).toFixed(2), method: paymentMethods[1], status: 'Paid' },
    { date: '01 Dec 2025', amount: randomBetween(6000, 7800).toFixed(2), method: paymentMethods[2], status: 'Paid' }
  ];

  const forecastBase = Math.round(parseFloat(totalDue));
  const forecastData = {
    historicalMonths: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    forecastMonths: ['Mar*', 'Apr*', 'May*'],
    actualBills: [],
    forecastBills: [],
    upperBand: [],
    lowerBand: []
  };
  const histTotals = [
    randomBetween(5500, 7500),
    randomBetween(5500, 7500),
    randomBetween(5500, 7500),
    randomBetween(5500, 7500),
    randomBetween(5500, 7500),
    forecastBase
  ];
  forecastData.actualBills = histTotals;
  const f1 = Math.round(forecastBase * 0.92);
  const f2 = Math.round(f1 * 0.98);
  const f3 = Math.round(f2 * 0.97);
  forecastData.forecastBills = [forecastBase, f1, f2, f3].slice(1);
  forecastData.upperBand = forecastData.forecastBills.map((v) => Math.round(v * 1.06));
  forecastData.lowerBand = forecastData.forecastBills.map((v) => Math.round(v * 0.9));

  const scenarioData = {
    labels: ['Current', 'If +20% Data', 'If Roaming Trip', 'Optimized'],
    values: [
      forecastBase,
      Math.round(forecastBase * 1.15),
      Math.round(forecastBase * 1.35),
      Math.round(forecastBase * 0.85)
    ]
  };
  
  return {
    accountSummary: {
      accountNumber: accountNumber,
      accountName: accountName,
      companyName: `${accountName} Enterprises Ltd.`,
      companyAddress: companyAddress,
      companyAddressHtml: companyAddressHtml,
      address: address,
      accountCategory: 'ENTERPRISE',
      totalConnections: 5,
      accountStatus: 'Active'
    },
    companyAddressHtml: companyAddressHtml,
    currentBilling: {
      invoiceNumber: `INV-2026-${String(randomBetween(1, 12)).padStart(2, '0')}-${accountNumber.substring(4)}`,
      billPeriod: {
        startDate: '01/02/2026',
        endDate: '28/02/2026'
      },
      generatedDate: `${String(randomBetween(15, 30)).padStart(2, '0')}/03/2026`,
      dueDate: `${String(randomBetween(10, 20)).padStart(2, '0')}/03/2026`,
      daysRemaining: daysRemaining,
      lateFeeIfNotPaid: lateFeeIfNotPaid,
      currencySymbol: 'Rs.',
      totalDue: totalDue,
      status: randomBetween(0, 1) === 0 ? 'Paid' : 'Unpaid'
    },
    dashboardStatistics: {
      monthlySpend: monthlySpend.toString(),
      averageSpend: averageSpend.toString(),
      monthlyBudget: monthlyBudget,
      budgetUtilization: budgetUtilization + '%',
      remainingBudget: remainingBudget,
      savingsOpportunity: randomDecimal(500, 2000),
      activeConnections: 5,
      inactiveConnections: 0,
      totalInvoices: randomBetween(6, 24),
      paidInvoices: randomBetween(4, 20),
      unpaidInvoices: randomBetween(0, 3)
    },
    billBreakdown: {
      basePlans: basePlans,
      dataOverage: dataOverage,
      roaming: roaming,
      vasServices: vasServices,
      subtotal: subtotal,
      taxes: {
        gst: {
          rate: gstRate + '%',
          amount: gstAmount
        }
      },
      previousBalance: '0.00',
      totalCharges: totalCharges,
      adjustments: adjustments,
      finalTotal: totalDue
    },
    connections: connections,
    billBreakdownByConnection: billBreakdownByConnection,
    reports: {
      paymentHistory: paymentHistory,
      departmentSpend: departmentSpend
    },
    forecastData: forecastData,
    scenarioData: scenarioData,
    voiceAndSmsMetrics: {
      summary: {
        totalCallsUsed: connections.reduce((sum, c) => sum + c.usage.calls.used, 0),
        totalCallsLimit: 15000,
        callsUtilization: Math.round(connections.reduce((sum, c) => sum + c.usage.calls.used, 0) / 15000 * 100) + '%',
        totalSmsUsed: connections.reduce((sum, c) => sum + c.usage.sms.used, 0),
        totalSmsLimit: 2600,
        smsUtilization: Math.round(connections.reduce((sum, c) => sum + c.usage.sms.used, 0) / 2600 * 100) + '%'
      },
      connectionBreakdown: connections.map(c => ({
        phoneNumber: c.phoneNumber,
        employeeName: c.employeeName,
        callsUsed: c.usage.calls.used,
        callsLimit: 3000,
        callUtilization: Math.round(c.usage.calls.used / 3000 * 100) + '%',
        smsUsed: c.usage.sms.used,
        smsLimit: c.usage.sms.limit,
        smsUtilization: Math.round(c.usage.sms.used / c.usage.sms.limit * 100) + '%'
      })),
      alerts: []
    },
    historicalMonthlyData: {
      months: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
      totals: [
        randomBetween(5500, 7500),
        randomBetween(5500, 7500),
        randomBetween(5500, 7500),
        randomBetween(5500, 7500),
        randomBetween(5500, 7500),
        Math.round(parseFloat(totalDue))
      ],
      plans: [
        randomBetween(3000, 4000),
        randomBetween(3000, 4000),
        randomBetween(3000, 4000),
        randomBetween(3000, 4000),
        randomBetween(3000, 4000),
        Math.round(parseFloat(basePlans))
      ],
      usage: [
        randomBetween(300, 600),
        randomBetween(300, 600),
        randomBetween(300, 600),
        randomBetween(300, 600),
        randomBetween(300, 600),
        Math.round(parseFloat(dataOverage))
      ],
      addOns: [
        randomBetween(500, 1000),
        randomBetween(500, 1000),
        randomBetween(500, 1000),
        randomBetween(500, 1000),
        randomBetween(500, 1000),
        Math.round(parseFloat(vasServices))
      ],
      roaming: [
        randomBetween(500, 2000),
        randomBetween(500, 2000),
        randomBetween(500, 2000),
        randomBetween(500, 2000),
        randomBetween(500, 2000),
        Math.round(parseFloat(roaming))
      ],
      taxes: [
        randomBetween(800, 1300),
        randomBetween(800, 1300),
        randomBetween(800, 1300),
        randomBetween(800, 1300),
        randomBetween(800, 1300),
        Math.round(parseFloat(gstAmount))
      ]
    }
  };
}

function main() {
  const accounts = [
    { name: 'Adarsh Pandey', number: 'ENT-99341022', phoneBase: '912340' },
    { name: 'Kritik Mishra', number: 'ENT-77452031', phoneBase: '934520' },
    { name: 'Sana Khan', number: 'ENT-55098114', phoneBase: '956780' }
  ];
  
  const jsonDir = path.join(__dirname, 'jsons');
  if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, { recursive: true });
  
  accounts.forEach(acc => {
    const data = generateAccountData(acc.name, acc.number, acc.phoneBase);
    const fileName = acc.name.toLowerCase().replace(/\s+/g, '_') + '.json';
    const filePath = path.join(jsonDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Generated: ${fileName}`);
  });
  
  console.log('Done! All JSON files generated with diverse data.');
}

main();
