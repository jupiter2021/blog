---
title: "更新日志"
slug: "changelog"
showDate: false
showReadingTime: false
showWordCount: false
---

记录本站的功能更新与技术改进。

#### 🗓️ Roadmap

- [x] RSS 订阅优化（全文输出 + 图片）
- [ ] 文章阅读量统计
- [ ] 图片懒加载 + WebP/AVIF 自适应
- [ ] 全站搜索增强（支持标签、分类筛选）
- [ ] 更多文章支持 UltraHDR 图片
- [ ] i18n 英文版本

---

### 2025-03

**📡 RSS 订阅优化**

自定义 RSS 模板，添加 RSS 订阅图标，方便读者通过 RSS 阅读器订阅博客。

---

### 2025-02

**🖼️ UltraHDR 图片支持**

为文章中的 iPhone 照片启用了 [UltraHDR (Gain Map)](https://developer.android.com/media/platform/hdr-image-format) 支持。在 HDR 屏幕 + Chrome/Edge 浏览器下，照片高光区域将自动展现更高亮度和更丰富的色彩层次。非 HDR 设备仍正常显示 SDR 画面，完全向后兼容。

**📸 Live Photo 支持**

实现了类似 Apple Live Photo 的交互体验。长按或悬停照片即可播放动态画面，支持自定义 shortcode，兼容移动端触控。

**💬 Twikoo 评论系统**

接入 [Twikoo](https://twikoo.js.org/) 评论系统，后端部署在 Vercel + MongoDB Atlas。

**🔍 medium-zoom 图片放大**

文章内图片支持点击放大查看，使用 medium-zoom 库实现丝滑的缩放动画。

**🌐 Azure Front Door 全球加速**

媒体资源通过 Cloudflare R2 对象存储 + Azure Front Door Standard 进行全球 CDN 分发。

**🗺️ 旅行足迹地图**

使用 WebGL 3D 地球仪展示旅行足迹，支持交互式旋转和缩放，标记已到访城市。

**🌙 深色模式**

支持浅色 / 深色两种模式，一键切换。

---

### 2025-01

**🚀 架构迁移**

从虚拟机直接访问迁移到当前架构：Hugo + Cloudflare Pages 静态部署，媒体资源托管在 Cloudflare R2，全站 HTTPS。

