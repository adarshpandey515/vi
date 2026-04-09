const fs = require('fs');

const templatePath = 'Vi_Enterprise_Combined.html';
const outputPath = 'html/adarsh_pandey.html';

const template = fs.readFileSync(templatePath, 'utf8');
const output = fs.readFileSync(outputPath, 'utf8');

function ids(html) {
  const re = /\bid="([^"]+)"/g;
  const map = new Map();
  let match;
  while ((match = re.exec(html))) {
    map.set(match[1], (map.get(match[1]) || 0) + 1);
  }
  return map;
}

function pages(html) {
  const re = /<div class="page" id="([^"]+)"/g;
  const items = [];
  let match;
  while ((match = re.exec(html))) {
    items.push(match[1]);
  }
  return items;
}

function count(html, re) {
  const m = html.match(re);
  return m ? m.length : 0;
}

const idsTemplate = ids(template);
const idsOutput = ids(output);

const missingInOutput = [...idsTemplate.keys()].filter((k) => !idsOutput.has(k));
const extraInOutput = [...idsOutput.keys()].filter((k) => !idsTemplate.has(k));
const dupInOutput = [...idsOutput.entries()].filter(([, n]) => n > 1);

const pagesTemplate = pages(template);
const pagesOutput = pages(output);

const metrics = {
  divOpenTemplate: count(template, /<div\b/g),
  divCloseTemplate: count(template, /<\/div>/g),
  divOpenOutput: count(output, /<div\b/g),
  divCloseOutput: count(output, /<\/div>/g),
  tableOpenTemplate: count(template, /<table\b/g),
  tableCloseTemplate: count(template, /<\/table>/g),
  tableOpenOutput: count(output, /<table\b/g),
  tableCloseOutput: count(output, /<\/table>/g),
  trOpenTemplate: count(template, /<tr\b/g),
  trCloseTemplate: count(template, /<\/tr>/g),
  trOpenOutput: count(output, /<tr\b/g),
  trCloseOutput: count(output, /<\/tr>/g),
  tdOpenTemplate: count(template, /<td\b/g),
  tdCloseTemplate: count(template, /<\/td>/g),
  tdOpenOutput: count(output, /<td\b/g),
  tdCloseOutput: count(output, /<\/td>/g),
};

const keys = [
  'Department-Wise Bill Breakdown',
  'Custom Report Builder',
  'Collections Engine',
  'Current Plans',
  'Self-Service & Disputes',
  'chartForecast',
  'chartScenario',
];

const lines = [];
lines.push('STRUCTURE_COMPARE_REPORT');
lines.push('');
lines.push(`PAGES_TEMPLATE=${pagesTemplate.length} -> ${pagesTemplate.join(',')}`);
lines.push(`PAGES_OUTPUT=${pagesOutput.length} -> ${pagesOutput.join(',')}`);
lines.push('');
lines.push('TAG_BALANCE_METRICS');
for (const [k, v] of Object.entries(metrics)) {
  lines.push(`${k}=${v}`);
}
lines.push('');
lines.push(`MISSING_IDS_IN_OUTPUT=${missingInOutput.length}`);
for (const id of missingInOutput.slice(0, 120)) lines.push(`  - ${id}`);
lines.push('');
lines.push(`EXTRA_IDS_IN_OUTPUT=${extraInOutput.length}`);
for (const id of extraInOutput.slice(0, 120)) lines.push(`  + ${id}`);
lines.push('');
lines.push(`DUPLICATE_IDS_IN_OUTPUT=${dupInOutput.length}`);
for (const [id, n] of dupInOutput.slice(0, 120)) lines.push(`  * ${id} x${n}`);
lines.push('');
lines.push('KEY_PHRASE_COUNTS');
for (const k of keys) {
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(escaped, 'g');
  lines.push(`${k} | template=${count(template, re)} output=${count(output, re)}`);
}

fs.writeFileSync('structure_compare_report.txt', lines.join('\n'));
console.log('Wrote structure_compare_report.txt');