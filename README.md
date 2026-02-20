# Korben's Blog

基于 Hugo + Blowfish 主题，托管在 Cloudflare Pages 上的个人博客。

## 🏗️ 网站架构

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│   GitHub     │────▶│  Cloudflare Pages │────▶│   eqigxue.top    │
│  (源码仓库)   │     │  (自动构建部署)     │     │   (博客站点)      │
└──────────────┘     └───────────────────┘     └──────────────────┘
                                                       │
                                                       │ 引用媒体资源
                                                       ▼
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│Cloudflare R2 │────▶│ Azure Front Door  │────▶│assets.eqigxue.top│
│ (对象存储)    │     │ (中国大陆加速)      │     │  (CDN 自定义域名) │
└──────────────┘     └───────────────────┘     └──────────────────┘
```

- **Hugo + Blowfish 主题**：静态站点生成，支持中文（CJK）、目录、标签、搜索
- **Cloudflare Pages**：自动检测 GitHub 推送并构建部署，通常 1-2 分钟内完成
- **Cloudflare R2**：对象存储，存放图片、视频、Live Photo 等媒体资源
  - Bucket：`blog-assets`
  - R2 Dev URL：`pub-4faeacf4b985496ca7503a45ffd87c8d.r2.dev`
- **Azure Front Door Standard**：中国大陆加速，HKG POP 节点，延迟 ~60ms
  - Profile：`blog-assets-afd`，资源组 `RG-For-Website`
  - 自定义域名：`assets.eqigxue.top`，DigiCert 托管证书
  - 缓存策略：`OverrideAlways`，TTL 23:59:59
  - CORS：规则集添加 `Access-Control-Allow-Origin: *`
  - 健康探测：`HEAD /uploads/2026/02/fuji-cover.jpg`
  - 路由：中国移动沈阳 → NTT 香港 → Microsoft HKG31 POP

## 📁 目录结构

```
hugo-site/
├── content/
│   ├── posts/              # 博客文章
│   ├── about/              # 关于页面
│   └── page/               # 其他页面（归档、搜索、旅行等）
├── assets/css/custom.css   # 自定义样式（TOC 毛玻璃、滚动追踪等）
├── layouts/
│   ├── _default/single.html  # 文章布局（TOC 在左侧）
│   ├── shortcodes/         # 自定义 shortcode
│   │   ├── img.html        # CDN 图片（lazy load）
│   │   ├── video.html      # CDN 视频（lazy load + poster）
│   │   └── livephoto.html  # Live Photo（纯 HTML5 实现）
│   └── partials/
│       ├── extend-head-uncached.html  # CDN preconnect
│       └── extend-footer.html         # 滚动追踪 + Live Photo 播放器 + medium-zoom 滚动锁
├── config/_default/        # 主题配置
├── themes/blowfish/        # Blowfish 主题（git submodule）
├── data/travel.yaml        # 旅行地图数据
└── hugo.yaml               # Hugo 主配置
```

## ✍️ 写新文章

### 方法一：手动创建

在 `content/posts/` 目录下创建新的 Markdown 文件：

```bash
touch content/posts/2026-02-08-my-new-post.md
```

文件开头添加 Front Matter：

```markdown
---
title: "文章标题"
date: 2026-02-08T20:00:00+08:00
draft: false
slug: "my-new-post"
categories: 
  - 分类名
tags:
  - 标签1
  - 标签2
image: https://example.com/cover.jpg
---

正文内容...
```

### 方法二：使用 Hugo 命令

```bash
cd hugo-site
hugo new posts/my-new-post.md
```

## 🖼️ 媒体资源管理

所有媒体资源存放在 Cloudflare R2 对象存储中，通过自定义域名 `assets.eqigxue.top` 提供 CDN 加速。

### 上传资源到 R2

```bash
# 安装 wrangler（如未安装）
npm install -g wrangler

# 上传图片
npx wrangler r2 object put blog-assets/uploads/2026/02/article-name/image.jpg \
  --file=./image.jpg --content-type="image/jpeg" --remote

# 上传视频
npx wrangler r2 object put blog-assets/uploads/2026/02/article-name/video.mp4 \
  --file=./video.mp4 --content-type="video/mp4" --remote

# 上传 Live Photo MOV
npx wrangler r2 object put blog-assets/uploads/2026/02/article-name/photo.mov \
  --file=./photo.mov --content-type="video/quicktime" --remote
```

> **注意：** 必须加 `--remote` 参数，否则会上传到本地模拟环境。

### 在文章中引用

使用自定义 shortcode，路径以 `/uploads/` 开头（会自动拼接 CDN 域名）：

```markdown
<!-- 图片 -->
{{</* img src="/uploads/2026/02/article-name/photo.jpg" alt="描述" caption="图片说明" */>}}

<!-- 视频（自动生成 poster：同名文件 + -poster.jpg） -->
{{</* video src="/uploads/2026/02/article-name/video.mp4" caption="视频说明" */>}}

<!-- Live Photo -->
{{</* livephoto photo="/uploads/2026/02/article-name/photo.jpg" video="/uploads/2026/02/article-name/photo.mov" caption="说明" */>}}
```

### 性能优化

- 图片：`loading="lazy" decoding="async" fetchpriority="low"`
- 视频：`preload="none"` + IntersectionObserver 按需加载（`rootMargin: 200px`）+ 自动 poster 封面
- Live Photo：视频预加载策略详见下方 Live Photo 章节
- CDN：`preconnect` + `dns-prefetch` 预热连接

## 📸 Live Photo 实现

完全抛弃 Apple LivePhotosKit JS（~138KB，Apple CDN 在中国大陆/微信中被屏蔽），改用纯 HTML5 `<img>` + `<video>` 实现。

### 架构

```
shortcodes/livephoto.html     → HTML 结构（img + video + LIVE 徽章）
assets/css/custom.css          → 样式 + 动画 + 微信兼容
partials/extend-footer.html    → 交互逻辑（hover/longpress/预加载）
```

### 短代码使用

```markdown
{{</* livephoto photo="/uploads/2026/02/photo.jpg" video="/uploads/2026/02/photo.mov" caption="说明" */>}}
```

- `photo`：静态图片路径（支持 CDN 前缀自动拼接）
- `video`：对应的 MOV/MP4 视频路径
- `caption`：可选，图片说明文字

### HTML 结构

```html
<div class="livephoto-player" data-live-photo data-video-src="...">
  <img class="livephoto-img" loading="lazy" draggable="false">
  <video class="livephoto-video" preload="none" loop muted
         playsinline webkit-playsinline x5-playsinline>
  <span class="livephoto-badge">LIVE</span>
</div>
```

- `x5-playsinline`：腾讯 X5 内核（微信浏览器）行内播放，防止全屏劫持
- `webkit-playsinline`：旧版 iOS Safari 行内播放
- `playsinline`：标准行内播放属性
- `draggable="false"`：防止桌面端拖拽图片

### 交互行为

| 平台 | 触发方式 | 参数 | 说明 |
|------|---------|------|------|
| 桌面端 | 鼠标悬停 (hover) | 延迟 `100ms` 后开始播放 | `mouseenter` → `startPlay()`，`mouseleave` → `stopPlay()` |
| 移动端 | 长按 (long-press) | 阈值 `180ms` | `touchstart` 计时 → 超时后播放，`touchend`/`touchcancel` → 停止 |

**参数调优说明：**
- 桌面端 `100ms` 延迟：防止鼠标快速划过时误触发，同时保持即时感
- 移动端 `180ms` 阈值：区分点击和长按；太短会误触，太长体验迟钝

### 视频预加载策略

```
视频默认 preload="none"
         ↓
进入视口前 500px  →  切换 preload="auto" + video.load()
         ↓
用户触发播放时视频已就绪，即时播放
```

- IntersectionObserver `rootMargin: '500px 0px'`
- 视频进入预加载区域后调用 `video.load()`，确保 hover 时能立即播放
- 比 `preload="metadata"` 方案响应更快，避免首帧延迟

### 微信浏览器兼容

微信使用腾讯 X5 内核，有以下特殊处理：

1. **防止视频全屏劫持**：`x5-playsinline` 属性
2. **防止长按弹出菜单**：`.livephoto-img` 上设置：
   ```css
   -webkit-touch-callout: none;  /* 禁用系统长按菜单 */
   -webkit-user-select: none;    /* 禁用文本选择 */
   user-select: none;
   pointer-events: none;         /* 触摸事件穿透到父容器 */
   ```
   `pointer-events: none` 让图片不接收触摸事件，微信无法识别为"长按图片"，从而不会弹出"转发/保存/收藏"菜单。触摸事件由父容器 `.livephoto-player` 处理。

### LIVE 徽章

纯 CSS 实现，不依赖任何外部图标：
- SVG 同心圆图标：通过 `::before` 伪元素 + data URI 内联 SVG
- 毛玻璃背景：`backdrop-filter: blur(8px)` + 半透明黑底
- 播放时隐藏：`.is-playing .livephoto-badge { opacity: 0 }`

### 播放状态管理

通过 CSS class `.is-playing` 切换状态：
- 添加 `is-playing`：视频 `opacity: 0 → 1`（`transition: 0.2s ease`），徽章隐藏
- 移除 `is-playing`：视频淡出，`video.pause()` + `video.currentTime = 0` 重置

## 🔒 medium-zoom 滚动锁定

Blowfish 内置 medium-zoom 1.1.0 图片灯箱，移动端缩放后滑动会误触关闭。采用 `position: fixed` 方案锁定页面：

```
打开灯箱 → 保存 scrollY → body position:fixed + top:-scrollY
                          + overlay/image touchmove preventDefault
关闭灯箱 → 恢复 position → window.scrollTo(0, savedScrollY)
```

- MutationObserver 监听 `body.childList` 变化，检测 `.medium-zoom-overlay` 出现/消失
- `position: fixed` 是 iOS Safari 最可靠的滚动冻结方式（`overflow: hidden` 在 iOS 上不够）
- 同时拦截 overlay 和放大图片的 `touchmove` 事件（`passive: false`）

## 👀 本地预览

```bash
cd hugo-site
hugo server -D
```

打开浏览器访问 http://localhost:1313/

- `-D` 参数会显示 `draft: true` 的草稿文章
- 修改文件后会自动热重载

## 🚀 发布文章

### 1. 确保文章不是草稿
将文章 Front Matter 中的 `draft: false`

### 2. 提交并推送

```bash
cd hugo-site
git add .
git commit -m "新文章: 文章标题"
git push
```

### 3. 自动部署
推送后，Cloudflare Pages 会自动检测到更新并开始构建部署，通常 1-2 分钟内完成。

## ☁️ Cloudflare Pages 管理

### 查看部署状态
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → 选择 `blog` 项目
3. 在 **Deployments** 标签查看构建历史

### 手动触发重新部署
如果需要强制重新部署：
1. 进入项目 → **Deployments**
2. 点击最新的部署 → **Retry deployment**

或者在本地：
```bash
git commit --allow-empty -m "Trigger rebuild"
git push
```

### 清除缓存
1. Cloudflare Dashboard → **Caching** → **Configuration**
2. 点击 **Purge Everything**

## ⚙️ 常用配置

### 修改站点信息
编辑 `config/_default/languages.zh-cn.toml`

### 修改菜单
编辑 `config/_default/menus.zh-cn.toml`

### 修改主题样式
编辑 `config/_default/params.toml`

## 🔗 相关链接

- 博客地址：https://eqigxue.top
- 媒体 CDN：https://assets.eqigxue.top
- GitHub 仓库：https://github.com/jupiter2021/blog
- Hugo 文档：https://gohugo.io/documentation/
- Blowfish 主题文档：https://blowfish.page/docs/
- Azure Front Door 文档：https://learn.microsoft.com/azure/frontdoor/
