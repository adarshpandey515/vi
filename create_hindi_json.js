const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = __dirname;
const INPUT = path.join(ROOT, 'jsons', 'adarsh_pandey.json');
const OUTPUT = path.join(ROOT, 'jsons', 'adarsh_hindi.json');

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

function toDevanagariDigits(text) {
  return String(text).replace(/\d/g, (d) => DEVANAGARI_DIGITS[Number(d)]);
}

function isUrlLike(text) {
  return /^(https?:\/\/|viapp:\/\/|www\.)/i.test(String(text).trim());
}

function isEmailLike(text) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(text).trim());
}

function isCodeLike(text) {
  return /^[A-Z0-9._\-/#:+\s]+$/.test(String(text).trim());
}

function shouldTranslate(text) {
  const value = String(text);
  if (!value.trim()) return false;
  if (isUrlLike(value) || isEmailLike(value)) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  // Keep hard identifiers mostly intact; numerals will still be localized separately.
  if (isCodeLike(value) && !/[a-z]/.test(value)) return false;
  return true;
}

function translateViaGoogle(text) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`;
    https
      .get(url, (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          try {
            const parsed = JSON.parse(raw);
            const translated = Array.isArray(parsed?.[0])
              ? parsed[0].map((part) => (Array.isArray(part) ? part[0] : '')).join('')
              : '';
            resolve(translated || text);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

async function translateWithRetry(text, maxRetries = 3) {
  let lastErr;
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      return await translateViaGoogle(text);
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    }
  }
  throw lastErr;
}

async function translateMaybe(text) {
  const source = String(text);
  if (isUrlLike(source) || isEmailLike(source)) {
    return source;
  }

  if (!shouldTranslate(source)) {
    return toDevanagariDigits(source);
  }

  if (source.length <= 450) {
    const translated = await translateWithRetry(source);
    return toDevanagariDigits(translated);
  }

  // Split long content conservatively for translation API stability.
  const parts = source.split(/(\n+)/);
  const out = [];
  for (const part of parts) {
    if (!part || /^\n+$/.test(part)) {
      out.push(part);
      continue;
    }
    const translated = await translateWithRetry(part);
    out.push(toDevanagariDigits(translated));
  }
  return out.join('');
}

function collectStrings(node, set) {
  if (typeof node === 'string') {
    set.add(node);
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item) => collectStrings(item, set));
    return;
  }

  if (node && typeof node === 'object') {
    Object.values(node).forEach((value) => collectStrings(value, set));
  }
}

function mapStrings(node, translatedMap) {
  if (typeof node === 'string') {
    return translatedMap.get(node) ?? node;
  }

  if (Array.isArray(node)) {
    return node.map((item) => mapStrings(item, translatedMap));
  }

  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      out[key] = mapStrings(value, translatedMap);
    }
    return out;
  }

  return node;
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function main() {
  const raw = fs.readFileSync(INPUT, 'utf8');
  const source = JSON.parse(raw);

  const unique = new Set();
  collectStrings(source, unique);
  const uniqueStrings = [...unique];

  const translatedMap = new Map();
  const batches = chunkArray(uniqueStrings, 8);

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];
    // Small concurrency helps speed while staying stable with public endpoint.
    const translated = await Promise.all(
      batch.map(async (txt) => {
        try {
          const out = await translateMaybe(txt);
          return [txt, out];
        } catch (_err) {
          return [txt, toDevanagariDigits(txt)];
        }
      }),
    );

    translated.forEach(([src, out]) => translatedMap.set(src, out));
    process.stdout.write(`Translated batch ${i + 1}/${batches.length}\r`);
  }

  const hindiJson = mapStrings(source, translatedMap);
  fs.writeFileSync(OUTPUT, `${JSON.stringify(hindiJson, null, 2)}\n`, 'utf8');
  console.log(`\nCreated: ${path.relative(ROOT, OUTPUT)}`);
}

main().catch((err) => {
  console.error('Failed to create Hindi JSON:', err.message);
  process.exit(1);
}); 
