interface DomainIconPreset {
  keywords: string[];
  icon: string;
  name: string;
}

const PRESETS: DomainIconPreset[] = [
  // 品牌 / 服务
  { keywords: ["github.com"], icon: "/static/icons/brand/github.png", name: "GitHub" },
  { keywords: ["bilibili.com"], icon: "/static/icons/brand/bilibili.png", name: "哔哩哔哩" },
  { keywords: ["weibo.com", "weibo.cn"], icon: "/static/icons/brand/weibo.png", name: "微博" },
  { keywords: ["qq.com", "v.qq.com", "y.qq.com"], icon: "/static/icons/brand/qq_symbol.png", name: "QQ" },
  { keywords: ["aliyun.com", "alibaba.com", "alibabacloud.com"], icon: "/static/icons/brand/aliyun.svg", name: "阿里云" },
  { keywords: ["cloud.tencent.com", "tencent.com"], icon: "/static/icons/brand/tencentcloud.png", name: "腾讯云" },
  { keywords: ["huawei.com", "huaweicloud.com"], icon: "/static/icons/brand/huawei.png", name: "华为" },
  { keywords: ["douyin.com"], icon: "/static/icons/brand/douyin.svg", name: "抖音" },
  { keywords: ["gitee.com"], icon: "/static/icons/brand/gitee.svg", name: "Gitee" },
  { keywords: ["iqiyi.com"], icon: "/static/icons/brand/iqy.svg", name: "爱奇艺" },
  { keywords: ["youku.com"], icon: "/static/icons/brand/youku.svg", name: "优酷" },
  { keywords: ["youtube.com", "youtu.be"], icon: "/static/icons/brand/youtube.svg", name: "YouTube" },
  { keywords: ["acfun.cn"], icon: "/static/icons/brand/acfun.svg", name: "AcFun" },
  { keywords: ["kuaishou.com"], icon: "/static/icons/brand/kuaishou.svg", name: "快手" },
  { keywords: ["mgtv.com"], icon: "/static/icons/brand/mangguo.svg", name: "芒果TV" },
  { keywords: ["music.163.com", "163.com"], icon: "/static/icons/brand/wangyiyun.svg", name: "网易云音乐" },
  { keywords: ["migu.cn"], icon: "/static/icons/brand/migu.svg", name: "咪咕" },
  { keywords: ["le.com"], icon: "/static/icons/brand/leshi.svg", name: "乐视" },
  { keywords: ["pan.baidu.com", "baidu.com", "baidubce.com"], icon: "/static/icons/brand/baiduyun.svg", name: "百度云" },
  { keywords: ["jdcloud.com", "jd.com"], icon: "/static/icons/brand/jingdongyun.svg", name: "京东云" },
  { keywords: ["js.design"], icon: "/static/icons/brand/jsdesign.svg", name: "即时设计" },
  { keywords: ["tianyancha.com"], icon: "/static/icons/brand/tsy.png", name: "天眼查" },
  { keywords: ["volcengine.com"], icon: "/static/icons/brand/huoshanfanyi.png", name: "火山翻译" },
  { keywords: ["imgurl.org"], icon: "/static/icons/brand/imgurl.png", name: "ImgURL" },
  { keywords: ["mtab.cc"], icon: "/static/icons/brand/mtab.png", name: "Mtab" },
  { keywords: ["onenav.com", "onenav.cc"], icon: "/static/icons/brand/onenav.png", name: "OneNav" },

  // 搜索引擎
  { keywords: ["baidu.com"], icon: "/static/icons/engine/baidu.svg", name: "百度" },
  { keywords: ["google.com", "google.cn", "google.com.hk"], icon: "/static/icons/engine/google.svg", name: "Google" },
  { keywords: ["bing.com"], icon: "/static/icons/engine/bing.svg", name: "Bing" },
  { keywords: ["sogou.com"], icon: "/static/icons/engine/sougou.svg", name: "搜狗" },
  { keywords: ["so.360.cn", "360.cn", "haosou.com"], icon: "/static/icons/engine/360.svg", name: "360搜索" },
  { keywords: ["duckduckgo.com", "duck.com"], icon: "/static/icons/engine/DuckDuckGo.svg", name: "DuckDuckGo" },
];

export function matchIconByDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    // 优先匹配更长的 keyword（更精确的域名优先）
    const sorted = [...PRESETS].sort((a, b) => {
      const aMax = Math.max(...a.keywords.map(k => k.length));
      const bMax = Math.max(...b.keywords.map(k => k.length));
      return bMax - aMax;
    });
    for (const preset of sorted) {
      if (preset.keywords.some(kw => hostname === kw || hostname.endsWith("." + kw))) {
        return preset.icon;
      }
    }
  } catch {
    // invalid URL
  }
  return null;
}
