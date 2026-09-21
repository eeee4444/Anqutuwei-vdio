# 微信小程序（按声音分类）

基于 TDesign 的微信小程序，只保留一个页面：**图片宫格页**。

## 页面说明

一组图片的宫格列表，可上下滚动，点击任意图片播放它对应的声音。

### 界面构成

```
┌─────────────────────────────┐
│  按声音分类                  │  导航栏（白底）
├─────────────────────────────┤
│  21 张            点击播放    │  顶部信息条（滚动时固定在顶部）
├─────────────────────────────┤
│  ▎小尺寸  3 张               │  分组标题（竖色条 + 名称 + 数量）
│  [图] [图] [图]              │  一排 4 个
│                             │
│  ▎中尺寸  13 张              │
│  [图] [图]                   │  一排 2 个
│  ...                        │
│  ▎大尺寸  5 张               │
│  [图] [图]                   │
│                             │
│         — 到底了 —           │  列表结束提示
└─────────────────────────────┘
```

- **排列顺序**：先按文件名前缀（`2` / `4` / `6`）分组，组内按像素面积从小到大
- **每行张数按分组决定**：`2` 开头的图窄，一排 **4 个**；其余分组一排 2 个
- 一个分组结束就换行，所以同组图片不会被拆到两行，也不会和相邻分组混在同一行
- 不满一行的行水平居中（`2` 组只有 3 张，以及两个分组各有一张落单）
- **图片按原始像素尺寸展示**，不裁切、不拉伸，也不统一成方框，带圆角和淡阴影
- 按住图片会轻微缩小（`hover-class`），松开后播放声音
- 整体灰色背景（`@bg-color` = `#f3f3f3`），导航栏保持白色
- 21 张图片，内容固定，没有下拉刷新和网络请求

三组对应的尺寸区间：

| 前缀 | 尺寸 | 张数 | 每行 | 行数 |
| --- | --- | --- | --- | --- |
| `2-` | 85–87 × 171 | 3 | 4 | 1 |
| `4-` | 170–172 × 169–171 | 13 | 2 | 7 |
| `6-` | 170–172 × 256 | 5 | 2 | 3 |

### 想改界面的这几处

都在 `pages/home/index.js` 顶部：

```js
// 每行张数
const COLUMNS_BY_GROUP = {
  2: 4, // 2 开头的图一排 4 个
};
const DEFAULT_COLUMNS = 2; // 其余分组一排 2 个

// 分组标题。改成空字符串就只留数量和留白，不显示文字
const GROUP_LABELS = {
  2: '小尺寸',
  4: '中尺寸',
  6: '大尺寸',
};
```

> `GROUP_LABELS` 里的“小/中/大尺寸”是按图片像素大小写的占位说法。如果 `2` / `4` / `6` 在你那边代表别的含义（比如分辨档次、业务分类），改这里就行。

配色和间距在 `variable.less`（`@brand-color` 竖色条、`@font-color-*` 文字、`@bg-color` 背景）和 `pages/home/index.less`。

> 一排 4 个时总宽若超出屏幕，图片会按比例略微缩小（`.home-cell--shrink`）。当前 3 张 85px 的图加间距共 281px，未超出可用的 351px，所以仍是原始尺寸。

## 目录结构

```
├── components/nav/         # 自定义导航栏
├── data/classify.js        # 页面配置：图片顺序 + 尺寸 + 声音（由脚本生成）
├── pages/home/             # 唯一页面（宫格 + 上下滚动）
├── scripts/                # 素材整理与预览脚本（可选，见下）
├── static/classify/        # 图片资源 2-*.png / 4-*.png / 6-*.png
│   └── audio/              # 声音资源（当前是 3 段 1 秒占位音）
├── app.js / app.json       # 小程序入口与全局配置
└── variable.less           # 全局 less 变量
```

## 声音素材

现在用的是 **3 段 1 秒的占位音**（440Hz / 660Hz / 880Hz 短音），循环分配给 21 张图片：同一张图片固定一个声音，不同图片可能共用同一个声音。

换成真实声音时，把 `static/classify/audio/` 下的文件替换掉即可，或者按需要在 `data/classify.js` 里改 `audio` 路径。

## 替换素材

> 详细操作步骤见 **[docs/替换素材.md](docs/替换素材.md)**（给某张图换声音、添加新图片）。
>
> 关键前提：`data/classify.js` 是脚本生成的，**手改之后不要再跑 `build-classify.js`**，否则会被重写。给单张图换声音时，声音文件请用 `beep-*` 之外的名字。

图片文件名格式为 `<前缀>-<名字>.png`，例如 `2-jimi.png`、`4-chahu.png`。前缀代表尺寸分类，决定排列顺序：

```js
export default {
  tab: '按声音分类', // 导航栏标题
  images: [
    {
      image: '/static/classify/2-jimi.png',
      width: 85,
      height: 171, // 85x171，28.3KB
      audio: '/static/classify/audio/beep-low.wav',
    },
    // ...
  ],
};
```

`data/classify.js` 由脚本生成，**平时不用手改**：把图片按 `<前缀>-<名字>.png` 放进 `static/classify/`，重新跑一次 `build-classify.js` 就会自动读出新尺寸并按前缀 + 面积排好序。

> 前缀只要保证数字部分能按大小排序即可（现在是 2 / 4 / 6）。加一组新的就用更大的数字，比如 `8-xxx.png` 会排在最后。

> 图片和声音都按固定路径引用，小程序里没法扫描目录，所以配置必须由脚本生成或手工补上。

## 脚本

```bash
node scripts/build-classify.js   # 扫描图片 -> 排序 -> 生成占位音 -> 输出 data/classify.js
node scripts/verify-classify.js  # 校验素材是否存在、尺寸是否一致、顺序是否正确
```

`build-classify.js` 做了三件事：

1. 扫描 `static/classify/` 里所有 `<前缀>-<名字>.png`，读出实际像素尺寸
2. 按内容 MD5 跳过重复图片
3. 生成 1 秒占位音，按「前缀分组 + 组内面积升序」输出 `data/classify.js`

`verify-classify.js` 会逐张核对：文件是否存在、配置的 `width`/`height` 和实际是否一致（不一致图片会被拉伸）、排列顺序是否符合前缀分组 + 组内面积升序、分组有没有被拆行或混行、有没有图片放在目录里却没进配置。

### 浏览器预览

`scripts/preview-natural-size.html` 是个静态预览页，用 1:1 的手机宽度查看图片按原始尺寸排布的效果。它直接读取 `data/classify.js`，不会和真实配置脱节。

因为要用 `fetch` 读配置文件，**需要通过 HTTP 打开**，不能直接双击 `file://`：

```bash
# 项目根目录起个静态服务
python -m http.server 8765 --bind 127.0.0.1

# 再用 Edge / Chrome 打开（或截图）
# http://127.0.0.1:8765/scripts/preview-natural-size.html
msedge --headless=new --window-size=375,2000 \
  --screenshot=scripts/preview-natural-size.png \
  http://127.0.0.1:8765/scripts/preview-natural-size.html
```

预览页加载后会在控制台核对每张图的渲染尺寸，确认没有被拉伸。

## 开发预览

```bash
# 安装项目依赖
npm install
```

打开[微信开发者工具](https://mp.weixin.qq.com/debug/wxadoc/dev/devtools/download.html)，导入整个项目，构建 npm 包，即可预览。

### 基础库版本

最低基础库版本 `^2.6.5`

## 开源协议

TDesign 遵循 [MIT 协议](https://github.com/TDesignOteam/tdesign-miniprogram-starter/blob/main/LICENSE)。
