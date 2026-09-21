// 素材整理脚本：扫描 static/classify/ 的图片 -> 按 2/4/6 前缀分组、组内按像素面积升序
// -> 生成 1 秒占位声音 -> 输出 data/classify.js
// 运行方式：node scripts/build-classify.js
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const imgDir = path.join(root, 'static', 'classify');
const audioDir = path.join(imgDir, 'audio');

// 文件名格式：<前缀>-<名字>.png，前缀代表尺寸分类，排序时前缀小的在前
const FILE_PATTERN = /^(\d+)-.+\.png$/i;

// 读取 PNG 尺寸（IHDR 固定在偏移 16 处），不依赖图片库
function readPngSize(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} 不是 PNG`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const files = fs.readdirSync(imgDir).filter((f) => FILE_PATTERN.test(f));
if (!files.length) throw new Error(`${imgDir} 里没有 <前缀>-<名字>.png 格式的图片`);

const pics = files.map((file) => {
  const full = path.join(imgDir, file);
  const { width, height } = readPngSize(full);
  return {
    file,
    prefix: file.match(FILE_PATTERN)[1],
    width,
    height,
    area: width * height,
    bytes: fs.statSync(full).size,
    md5: crypto.createHash('md5').update(fs.readFileSync(full)).digest('hex'),
  };
});

// 内容重复的图片只保留一个（按文件名排序取第一个，保证结果稳定）
const seen = new Map();
const unique = [];
pics
  .slice()
  .sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }))
  .forEach((p) => {
    if (seen.has(p.md5)) {
      console.log(`跳过重复图片：${p.file}  （与 ${seen.get(p.md5)} 内容相同）`);
      return;
    }
    seen.set(p.md5, p.file);
    unique.push(p);
  });

// 先按前缀分组，组内按像素面积升序（同面积再按宽、最后按文件名，保证顺序稳定）
const ordered = unique.sort(
  (a, b) =>
    Number(a.prefix) - Number(b.prefix) ||
    a.area - b.area ||
    a.width - b.width ||
    a.file.localeCompare(b.file, undefined, { numeric: true }),
);

// ---- 生成 1 秒占位声音：3 段不同音高的短音，循环分配给图片 ----
function toneWav(freq) {
  const rate = 16000;
  const samples = rate; // 1 秒
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i += 1) {
    const t = i / rate;
    const fade = Math.min(1, t / 0.02, (1 - t) / 0.05); // 淡入淡出，避免爆音
    const value = Math.sin(2 * Math.PI * freq * t) * 0.35 * Math.max(0, fade);
    data.writeInt16LE(Math.round(value * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // 单声道
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

fs.mkdirSync(audioDir, { recursive: true });
const tones = [
  { file: 'beep-low.wav', freq: 440 },
  { file: 'beep-mid.wav', freq: 660 },
  { file: 'beep-high.wav', freq: 880 },
];
tones.forEach((t) => fs.writeFileSync(path.join(audioDir, t.file), toneWav(t.freq)));
console.log(`生成占位声音：${tones.map((t) => t.file).join(', ')}`);

// width/height 是图片本来的像素尺寸，页面按这个尺寸原样展示（不裁切、不拉伸）
// group 是前缀（2 / 4 / 6），页面用它判断分组边界、留出分隔空白
const entry = (p, i) => `    {
      image: '/static/classify/${p.file}',
      group: '${p.prefix}',
      width: ${p.width},
      height: ${p.height}, // ${p.width}x${p.height}，${(p.bytes / 1024).toFixed(1)}KB
      audio: '/static/classify/audio/${tones[i % tones.length].file}',
    },`;

const out = `// 页面配置：一组图片，点击图片播放对应声音（内容固定，无需接口）
// 排列顺序：按文件名前缀（2 / 4 / 6）分组，组内按像素面积从小到大
// 素材目录：static/classify/（图片）、static/classify/audio/（声音）
// 换素材时替换文件即可，路径不用改
export default {
  tab: '按声音分类',
  images: [
${ordered.map(entry).join('\n')}
  ],
};
`;

fs.writeFileSync(path.join(root, 'data', 'classify.js'), out, 'utf8');

console.log(`\n共 ${ordered.length} 张图片`);
let lastPrefix = null;
ordered.forEach((p, i) => {
  if (p.prefix !== lastPrefix) {
    console.log(`\n  ${p.prefix} 开头：`);
    lastPrefix = p.prefix;
  }
  console.log(
    `    ${String(i + 1).padStart(2)}. ${p.file.padEnd(18)} ${`${p.width}x${p.height}`.padEnd(9)} 面积 ${String(p.area).padStart(6)}  -> ${tones[i % tones.length].file}`,
  );
});
