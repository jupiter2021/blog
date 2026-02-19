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
                     ┌───────────────────┐     ┌──────────────────┐
                     │  Cloudflare R2    │────▶│assets.eqigxue.top│
                     │  (对象存储)        │     │  (CDN 自定义域名) │
                     └───────────────────┘     └──────────────────┘
```

- **Hugo + Blowfish 主题**：静态站点生成，支持中文（CJK）、目录、标签、搜索
- **Cloudflare Pages**：自动检测 GitHub 推送并构建部署，通常 1-2 分钟内完成
- **Cloudflare R2**：对象存储，存放图片、视频、Live Photo 等媒体资源
  - Bucket：`blog-assets`
  - 自定义域名：`assets.eqigxue.top`
  - CORS：通过 Cloudflare Transform Rule 添加 `Access-Control-Allow-Origin: *`
  - 缓存策略：Edge TTL 1 年，Browser TTL 30 天

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
│   │   └── livephoto.html  # Apple Live Photo
│   └── partials/
│       ├── extend-head-uncached.html  # preconnect + LivePhotosKit
│       └── extend-footer.html         # 滚动追踪 + lazy load 脚本
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
- 视频：`preload="none"` + IntersectionObserver 按需加载 + 自动 poster 封面
- Live Photo：`proactively-loads-video="false"` 延迟加载 MOV
- CDN：`preconnect` + `dns-prefetch` 预热连接
- LivePhotosKit JS：`defer` 加载，不阻塞首屏

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
- Apple LivePhotosKit：https://developer.apple.com/documentation/livephotoskitjs
