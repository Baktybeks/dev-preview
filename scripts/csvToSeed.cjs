// scripts/csvToSeed.cjs — конвертация Checklist.csv в frontprep-seed формат
const fs = require('fs');
const path = require('path');

const CSV_PATH = process.argv[2] || path.join(process.env.USERPROFILE || '', 'Desktop', 'frontend-interview-checklist-DONE.xlsx - Checklist.csv');
const OUT_PATH = path.resolve(process.cwd(), 'scripts/seed/checklist-seed.json');

const SECTION_TO_SLUG = {
  '1. HTML': 'html',
  '2. CSS': 'css',
  '3. JavaScript — Core': 'javascript-core',
  '3. JavaScript - Core': 'javascript-core',
  '4. Async JavaScript': 'async-javascript',
  '5. React.js': 'react',
};

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^[0-9]+\.?\s*/, '')
    .replace(/['"«»]/g, '')
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapSectionToSlug(section) {
  if (!section || typeof section !== 'string') return 'other';
  const trimmed = section.trim();
  return (
    SECTION_TO_SLUG[trimmed] ||
    SECTION_TO_SLUG[trimmed.replace(/[\u2014\u2013]/g, '-')] ||
    slugify(trimmed) ||
    'other'
  );
}

function mapLevelToDifficulty(level) {
  if (!level) return 'junior';
  const l = String(level).toLowerCase();
  if (l.includes('senior')) return 'senior';
  if (l.includes('middle')) return 'middle';
  return 'junior';
}

function truncate(str, max) {
  if (typeof str !== 'string') return '';
  return str.length <= max ? str : str.slice(0, max - 3) + '...';
}

// Простой парсер CSV с поддержкой кавычек и переносов внутри полей
function parseCSV(content) {
  const rows = [];
  let i = 0;
  const len = content.length;

  function skipSpaces() {
    while (i < len && (content[i] === ' ' || content[i] === '\t')) i++;
  }

  function readField() {
    skipSpaces();
    if (i >= len) return null;
    if (content[i] === '"') {
      i++;
      let s = '';
      while (i < len) {
        if (content[i] === '"') {
          i++;
          if (content[i] === '"') { s += '"'; i++; }
          else break;
        } else {
          s += content[i++];
        }
      }
      return s;
    }
    let s = '';
    while (i < len && content[i] !== ',' && content[i] !== '\n' && content[i] !== '\r') s += content[i++];
    return s.trim();
  }

  while (i < len) {
    const row = [];
    while (i < len && content[i] !== '\n' && content[i] !== '\r') {
      const field = readField();
      row.push(field === null ? '' : field);
      if (i < len && content[i] === ',') i++;
    }
    if (row.length > 0) rows.push(row);
    while (i < len && (content[i] === '\n' || content[i] === '\r')) i++;
  }
  return rows;
}

function buildFromRows(rows) {
  const header = rows[0] || [];
  const topicIdx = header.findIndex((c) => c && c.includes('Вопрос'));
  const answerIdx = header.findIndex((c) => c === 'Ответы');
  const sectionIdx = header.findIndex((c) => c === 'Раздел');
  const levelIdx = header.findIndex((c) => c === 'Уровень');

  const dataRows = rows.slice(1).filter((r) => r.length > Math.max(topicIdx, answerIdx, sectionIdx, levelIdx) && (r[topicIdx] || '').trim());
  const questions = [];
  const categoriesMap = new Map();
  let order = 1;

  for (const r of dataRows) {
    const title = (r[topicIdx] || '').trim();
    const answer = (r[answerIdx] || '').trim().replace(/\r\n/g, '\n');
    const section = (r[sectionIdx] || '').trim();
    const level = r[levelIdx] || '';

    const slug = mapSectionToSlug(section || 'Разное');

    if (!categoriesMap.has(slug)) {
      categoriesMap.set(slug, {
        slug,
        name: section || slug,
        description: '',
        order: order++,
      });
    }

    questions.push({
      title: truncate(title, 1000),
      answer: truncate(answer, 10000),
      categorySlug: slug,
      difficulty: mapLevelToDifficulty(level),
    });
  }
  const categories = Array.from(categoriesMap.values());
  return { categories, questions };
}

function main() {
  console.log('📄 CSV:', CSV_PATH);
  if (!fs.existsSync(CSV_PATH)) {
    console.error('Файл не найден. Укажите путь: node scripts/csvToSeed.cjs "D:\\Desktop\\frontend-interview-checklist-DONE.xlsx - Checklist.csv"');
    process.exit(1);
  }

  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCSV(raw);
  const { categories, questions } = buildFromRows(rows);

  const outDir = path.dirname(OUT_PATH);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify({ categories, questions }, null, 2), 'utf-8');

  console.log('✅ Вопросов из CSV:', questions.length);
  console.log('💾 Сохранено:', OUT_PATH);
  console.log('Запустите сидинг: node scripts/seedData.cjs scripts/seed/checklist-seed.json');
}

main();
