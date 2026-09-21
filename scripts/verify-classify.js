// 校验 data/classify.js：素材是否存在、尺寸是否和实际文件一致、排列是否按前缀分组 + 组内面积升序
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const classify = (await import(`file://${path.join(root, 'data', 'classify.js').replace(/\\/g, '/')}`)).default;

// 每行张数的配置直接从 pages/home/index.js 里读，避免两边各写一份、改一处漏一处
const pageSource = fs.readFileSync(path.join(root, 'pages', 'home', 'index.js'), 'utf8');

// 取指定标识符后面第一对配对的花括号内容（不依赖正则匹配嵌套），当 JS 对象求值
function readObjectLiteral(src, name) {
  const at = src.indexOf(name);
  if (at === -1) return {};
  const start = src.indexOf('{', at);
  if (start === -1) return {};
  let depth = 0;
  for (let i = start; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        // eslint-disable-next-line no-new-func
        return Function(`return (${src.slice(start, i + 1)})`)();
      }
    }
  }
  return {};
}

const COLUMNS_BY_GROUP = readObjectLiteral(pageSource, 'COLUMNS_BY_GROUP');
const DEFAULT_COLUMNS = Number((pageSource.match(/DEFAULT_COLUMNS\s*=\s*(\d+)/) || [, 2])[1]);
const columnsOf = (group) => COLUMNS_BY_GROUP[group] || DEFAULT_COLUMNS;
console.log(
  `每行张数：分组 ${Object.entries(COLUMNS_BY_GROUP).map(([g, c]) => `${g}->${c}列`).join(', ') || '（无特殊配置）'}，其余 ${DEFAULT_COLUMNS} 列`,
);

// 与 pages/home/index.js 的 toRows 保持一致：分组决定每行张数，一组结束就换行
function toRows(images) {
  const rows = [];
  let items = [];
  images.forEach((pic) => {
    const columns = columnsOf(pic.group);
    if (items.length && (items.length === columns || pic.group !== items[0].group)) {
      rows.push({ items, group: items[0].group, columns: columnsOf(items[0].group) });
      items = [];
    }
    items.push(pic);
  });
  if (items.length) rows.push({ items, group: items[0].group, columns: columnsOf(items[0].group) });
  return rows.map((row, i) => ({
    ...row,
    groupStart: i > 0 && row.group !== rows[i - 1].group,
    partial: row.items.length < row.columns,
  }));
}

function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

let missing = 0;
let sizeMismatch = 0;
const actual = [];

console.log(`【${classify.tab}】${classify.images.length} 张`);
classify.images.forEach((pic, i) => {
  const imgPath = path.join(root, pic.image.replace(/^\//, ''));
  const audioPath = path.join(root, pic.audio.replace(/^\//, ''));
  const imgOk = fs.existsSync(imgPath);
  const audioOk = fs.existsSync(audioPath);
  if (!imgOk || !audioOk) missing += 1;

  let real = { width: 0, height: 0 };
  let sizeOk = true;
  if (imgOk) {
    real = pngSize(imgPath);
    // 页面按配置里的 width/height 渲染，配错会导致图片被拉伸
    sizeOk = real.width === pic.width && real.height === pic.height;
    if (!sizeOk) sizeMismatch += 1;
  }
  actual.push({ ...real, file: path.basename(pic.image) });

  console.log(
    `  ${String(i + 1).padStart(2)}. ${imgOk ? 'OK ' : '缺失'} ${path.basename(pic.image).padEnd(18)}` +
      ` 实际${`${real.width}x${real.height}`.padEnd(9)} 配置${`${pic.width}x${pic.height}`.padEnd(9)}` +
      ` ${sizeOk ? '' : '尺寸不符! '}| ${audioOk ? 'OK ' : '缺失'} ${path.basename(pic.audio)}`,
  );
});

// 排列顺序：前缀数字递增，同一前缀内像素面积递增
const key = (file) => Number(file.split('-')[0]);
const orderedOk = actual.every((p, i) => {
  if (i === 0) return true;
  const prev = actual[i - 1];
  if (key(prev.file) !== key(p.file)) return key(prev.file) < key(p.file);
  return prev.width * prev.height <= p.width * p.height;
});
console.log(`\n排列顺序（前缀分组 + 组内面积升序）：${orderedOk ? '通过' : '失败'}`);

// 重复图片检查（按内容）
const hashes = new Map();
classify.images.forEach((pic) => {
  const h = crypto
    .createHash('md5')
    .update(fs.readFileSync(path.join(root, pic.image.replace(/^\//, ''))))
    .digest('hex');
  if (hashes.has(h)) console.log(`重复图片：${pic.image} 与 ${hashes.get(h)}`);
  hashes.set(h, pic.image);
});

// 有没有图片放在目录里但没进配置
const onDisk = fs.readdirSync(path.join(root, 'static', 'classify')).filter((f) => /\.png$/i.test(f));
const configured = new Set(classify.images.map((p) => path.basename(p.image)));
const notConfigured = onDisk.filter((f) => !configured.has(f));
if (notConfigured.length) console.log(`目录里有但没进配置：${notConfigured.join(', ')}`);

// 分组检查：每个分组必须完整落在连续的行里，不能被别的分组插进来打断
const rows = toRows(classify.images);
const mixedRows = rows.filter((row) => new Set(row.items.map((p) => p.group)).size > 1);
const seen = new Set();
let splitGroups = 0;
let lastGroup = null;
rows.forEach((row) => {
  if (row.group !== lastGroup) {
    // 同一个分组再次出现，说明中间被别的分组插进来了
    if (seen.has(row.group)) splitGroups += 1;
    seen.add(row.group);
    lastGroup = row.group;
  }
});
const separators = rows.filter((r) => r.groupStart);
console.log(
  `分组行检查：同一行混多个分组 ${mixedRows.length} 行，被别的分组打断 ${splitGroups} 个`,
);
console.log(`分隔位置：${separators.length} 处（分组 ${separators.map((r) => r.group).join(', ')}）`);

console.log(`\n行数：${rows.length}`);
rows.forEach((row, i) => {
  const names = row.items.map((p) => path.basename(p.image)).join(', ');
  const tags = [row.groupStart ? '[分隔]' : '      ', `${row.columns}列`, row.partial ? '居中' : '    '];
  console.log(`  ${String(i + 1).padStart(2)}. ${tags.join(' ')}  ${names}`);
});
console.log(`\n缺失文件：${missing}，尺寸配置不一致：${sizeMismatch}`);
