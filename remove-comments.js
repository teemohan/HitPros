const fs = require('fs');
const path = require('path');

const TARGET_DIRS = [
  './shopify/assets',
  './shopify/sections',
  './shopify/snippets'
];

const FILE_EXTENSIONS = ['.js', '.css', '.liquid'];
const SKIP_MINIFIED = ['.min.js', '.min.css', 'element.js'];

// 匹配各种注释的正则表达式
const COMMENT_PATTERNS = [
  /\/\*[\s\S]*?\*\//g,                        // CSS/JS 块注释
  /\{\{\/\*[\s\S]*?\*\/\}\}/g,                // Shopify {{/* */}} 注释
  /<!--[\s\S]*?-->/g,                         // HTML 注释
  /{%\s*comment\s*%}[\s\S]*?{%\s*endcomment\s*%}/g, // Liquid 注释块
  /(^|[ \t])\/\/[^\n]*/g                      // JS 单行注释（可能在行尾或整行）
];

// 递归处理文件
function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

// 注释移除逻辑
function removeComments(content) {
  let cleaned = content;
  for (const pattern of COMMENT_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned;
}

// 主逻辑
for (const dir of TARGET_DIRS) {
  const absDir = path.resolve(__dirname, dir);
  if (!fs.existsSync(absDir)) continue;

  walk(absDir, filePath => {
    const ext = path.extname(filePath);
    const base = path.basename(filePath);

    if (
      FILE_EXTENSIONS.includes(ext) &&
      !SKIP_MINIFIED.some(suffix => base.endsWith(suffix))
    ) {
      console.log(`处理文件: ${filePath}`);
      const content = fs.readFileSync(filePath, 'utf8');
      const cleaned = removeComments(content);
      fs.writeFileSync(filePath, cleaned, 'utf8');
    }
  });
}

console.log('所有注释清除完成 ✅');
