# Node.js Scripts for Cross-Platform Development

这些 Node.js 脚本替代了原来的 shell 脚本，可以在 Windows、macOS 和 Linux 系统上运行。

## 可用脚本

### 开发相关
- `npm run start` - 启动 Shopify 开发服务器
- `npm run change-test` - 切换到测试商店
- `npm run change-live` - 切换到正式商店

### 主题管理
- `npm run pull` - 拉取 Shopify 主题文件
- `npm run pullcli` - 拉取主题文件（CLI 版本）
- `npm run merge` - 合并主题文件
- `npm run pushignore` - 推送主题（忽略特定文件）

### 构建和部署
- `npm run minify` - 压缩和清理文件
- `npm run deploycli` - 部署到 Shopify

### 样式处理
- `npm run tw` - 启动 Tailwind CSS 监听模式
- `npm run purge-advanced` - 高级 CSS 清理

## 脚本功能说明

### start.js
启动 Shopify 开发服务器，等同于 `shopify theme dev`

### pull.js
从 Shopify 拉取主题文件，会自动处理 `.shopifyignore` 文件

### pushignore.js
推送主题到 Shopify，会创建 `.shopifyignore` 文件来忽略模板、配置和语言文件

### merge.js
合并主题文件，先创建 `.shopifyignore` 然后拉取主题

### change-test.js / change-live.js
切换到不同的 Shopify 商店进行开发

### minify.js
- 复制 `shopify/` 目录到 `dist/`
- 压缩 JS 和 CSS 文件
- 删除 Liquid 文件中的注释
- 清理不必要的文件

### deploycli.js
先运行 minify 脚本，然后将 `dist/` 目录推送到 Shopify

## 依赖包

新增的依赖包：
- `fs-extra` - 增强的文件系统操作
- `glob` - 文件模式匹配
- `uglify-js` - JavaScript 压缩
- `uglifycss` - CSS 压缩

## 使用方法

1. 确保已安装 Node.js
2. 运行 `npm install` 安装依赖
3. 使用 `npm run <script-name>` 运行相应脚本

## 兼容性

这些脚本可以在以下系统上运行：
- Windows 10/11
- macOS
- Linux (Ubuntu, CentOS, etc.)

## 注意事项

- 确保已安装 Shopify CLI
- 某些脚本需要先登录 Shopify 账户
- 压缩功能需要 `uglify-js` 和 `uglifycss` 包