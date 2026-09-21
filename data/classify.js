// 页面配置：一组图片，点击图片播放对应声音（内容固定，无需接口）
// 排列顺序：按文件名前缀（2 / 4 / 6）分组，组内按像素面积从小到大
// 素材目录：static/classify/（图片）、static/classify/audio/（声音）
// 换素材时替换文件即可，路径不用改
export default {
  tab: '按声音分类',
  images: [
    {
      image: '/static/classify/2-jimi.png',
      group: '2',
      width: 85,
      height: 171, // 85x171，28.3KB
      audio: '/static/classify/audio/beep-low.wav',
    },
    {
      image: '/static/classify/2-jingpian.png',
      group: '2',
      width: 85,
      height: 171, // 85x171，25.7KB
      audio: '/static/classify/audio/beep-mid.wav',
    },
    {
      image: '/static/classify/2-remo.png',
      group: '2',
      width: 87,
      height: 171, // 87x171，29.9KB
      audio: '/static/classify/audio/beep-high.wav',
    },
    {
      image: '/static/classify/4-shan.png',
      group: '4',
      width: 170,
      height: 169, // 170x169，52.4KB
      audio: '/static/classify/audio/beep-low.wav',
    },
    {
      image: '/static/classify/4-dan.png',
      group: '4',
      width: 171,
      height: 169, // 171x169，51.7KB
      audio: '/static/classify/audio/beep-mid.wav',
    },
    {
      image: '/static/classify/4-diezi.png',
      group: '4',
      width: 171,
      height: 169, // 171x169，57.5KB
      audio: '/static/classify/audio/beep-high.wav',
    },
    {
      image: '/static/classify/4-naodian.png',
      group: '4',
      width: 171,
      height: 169, // 171x169，49.9KB
      audio: '/static/classify/audio/beep-low.wav',
    },
    {
      image: '/static/classify/4-diqiuyi.png',
      group: '4',
      width: 172,
      height: 169, // 172x169，56.7KB
      audio: '/static/classify/audio/beep-mid.wav',
    },
    {
      image: '/static/classify/4-huangping.png',
      group: '4',
      width: 170,
      height: 171, // 170x171，48.5KB
      audio: '/static/classify/audio/beep-high.wav',
    },
    {
      image: '/static/classify/4-mokuai.png',
      group: '4',
      width: 170,
      height: 171, // 170x171，53.4KB
      audio: '/static/classify/audio/beep-low.wav',
    },
    {
      image: '/static/classify/4-baosi.png',
      group: '4',
      width: 171,
      height: 171, // 171x171，59.1KB
      audio: '/static/classify/audio/beep-mid.wav',
    },
    {
      image: '/static/classify/4-chahu.png',
      group: '4',
      width: 171,
      height: 171, // 171x171，52.0KB
      audio: '/static/classify/audio/beep-high.wav',
    },
    {
      image: '/static/classify/4-qing.png',
      group: '4',
      width: 171,
      height: 171, // 171x171，47.8KB
      audio: '/static/classify/audio/beep-low.wav',
    },
    {
      image: '/static/classify/4-she.png',
      group: '4',
      width: 171,
      height: 171, // 171x171，52.6KB
      audio: '/static/classify/audio/beep-mid.wav',
    },
    {
      image: '/static/classify/4-xianglian.png',
      group: '4',
      width: 171,
      height: 171, // 171x171，50.9KB
      audio: '/static/classify/audio/beep-high.wav',
    },
    {
      image: '/static/classify/4-guangdian.png',
      group: '4',
      width: 172,
      height: 171, // 172x171，65.4KB
      audio: '/static/classify/audio/beep-low.wav',
    },
    {
      image: '/static/classify/6-tuoluoyi.png',
      group: '6',
      width: 170,
      height: 256, // 170x256，79.3KB
      audio: '/static/classify/audio/beep-mid.wav',
    },
    {
      image: '/static/classify/6-2000.png',
      group: '6',
      width: 171,
      height: 256, // 171x256，80.0KB
      audio: '/static/classify/audio/beep-high.wav',
    },
    {
      image: '/static/classify/6-niban.png',
      group: '6',
      width: 171,
      height: 256, // 171x256，95.6KB
      audio: '/static/classify/audio/beep-low.wav',
    },
    {
      image: '/static/classify/6-qing2.png',
      group: '6',
      width: 171,
      height: 256, // 171x256，67.9KB
      audio: '/static/classify/audio/beep-mid.wav',
    },
    {
      image: '/static/classify/6-hupo.png',
      group: '6',
      width: 172,
      height: 256, // 172x256，92.8KB
      audio: '/static/classify/audio/beep-high.wav',
    },
  ],
};
