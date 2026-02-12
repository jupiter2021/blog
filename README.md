# Korben's Blog

基于 Hugo + Blowfish 主题，托管在 Cloudflare Pages 上的个人博客。

## 📁 目录结构

```
hugo-site/
├── content/
│   ├── posts/          # 博客文章
│   └── about/          # 关于页面
├── static/uploads/     # 本地图片资源
├── config/_default/    # 主题配置
├── themes/blowfish/    # Blowfish 主题
└── hugo.yaml           # Hugo 主配置
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

## 🖼️ 添加图片

### 使用外链图床（推荐）
直接在 Markdown 中引用图床链接：
```markdown
![描述](https://pic.imgdb.cn/item/xxx.jpg)
```

### 使用本地图片
1. 将图片放入 `static/uploads/2026/` 目录
2. 在 Markdown 中引用：
```markdown
![描述](/uploads/2026/image.jpg)
```

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

- 博客地址: https://eqigxue.top
- GitHub 仓库: https://github.com/jupiter2021/blog
- Hugo 文档: https://gohugo.io/documentation/
- Blowfish 主题文档: https://blowfish.page/docs/
