import classify from '~/data/classify';

// 每个分组的每行张数：2 开头的图窄（85-87px），排 4 个也不会挤；其余分组排 2 个
const COLUMNS_BY_GROUP = {
  2: 4,
};
const DEFAULT_COLUMNS = 2;
const columnsOf = (group) => COLUMNS_BY_GROUP[group] || DEFAULT_COLUMNS;

// 分组标题。留空则只显示数量和分隔留白，不显示文字
const GROUP_LABELS = {
  2: '小尺寸',
  4: '中尺寸',
  6: '大尺寸',
};

// 把图片切成二维数组，WXML 里两层循环渲染成宫格
// 图片顺序已按前缀（2 / 4 / 6）分好组；一个分组结束就换行，
// 这样同组图片不会被拆到两行里、也不会和下一组混在同一行
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

  // 每个分组的总张数
  const totals = images.reduce((acc, pic) => {
    acc[pic.group] = (acc[pic.group] || 0) + 1;
    return acc;
  }, {});

  return rows.map((row, i) => {
    const groupStart = i === 0 || rows[i - 1].group !== row.group;
    return {
      ...row,
      groupStart,
      // 只有换了分组的那一行前面才插一条分组标题
      label: groupStart ? GROUP_LABELS[row.group] || '' : '',
      count: totals[row.group],
      // 不满一行的行水平居中显示
      partial: row.items.length < row.columns,
    };
  });
}

Page({
  data: {
    title: classify.tab,
    total: classify.images.length,
    rows: toRows(classify.images),
  },
  // 声音路径 -> 音频实例，首次点击时才创建
  audioMap: {},
  onUnload() {
    Object.keys(this.audioMap).forEach((src) => {
      this.audioMap[src].destroy();
    });
    this.audioMap = {};
  },
  // 同一个声音会被多张图片复用，按路径缓存，不重复创建实例
  getAudio(src) {
    if (this.audioMap[src]) return this.audioMap[src];

    const audio = wx.createInnerAudioContext();
    audio.onError((err) => {
      // 音频文件缺失时这里会提示文件不存在
      const notFound = /404|not found|ENOENT/i.test(err.errMsg || '');
      wx.showToast({
        title: notFound ? '声音文件不存在' : '声音播放失败',
        icon: 'none',
      });
    });
    audio.src = src;
    this.audioMap[src] = audio;

    return audio;
  },
  stopAllAudio() {
    Object.keys(this.audioMap).forEach((src) => {
      this.audioMap[src].stop();
    });
  },
  onImageTap(e) {
    const { audio: src } = e.currentTarget.dataset;

    // 换一种声音时，先停掉上一个可能还在播放的
    if (this.currentSrc && this.currentSrc !== src) {
      this.stopAllAudio();
    }
    this.currentSrc = src;

    const audio = this.getAudio(src);
    // 先 stop 再 play，保证重复点击同一张图片也能从头播放
    audio.stop();
    audio.play();
  },
  onImageError(e) {
    console.warn('图片加载失败：', e.detail);
  },
});
