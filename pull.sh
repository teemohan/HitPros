
#!/bin/bash
CURRENT_DIR=$(pwd)
# 组合成完整的本地绝对路径
BASE_PATH="${CURRENT_DIR}/"

# 构建 file 的绝对路径
file="${BASE_PATH}shopify/.shopifyignore"
search_string="assets/*"

echo "npm run pull"
if grep -q "$search_string" "$file"; then
    echo "=================="
else
    echo "删除 .shopifyignore 文件"
    rm "$file"
    #printf $search_string > "$file"
fi
# 尝试进入 shopify 目录
shopify_dir="${BASE_PATH}shopify/"
echo "Navigating to shopify directory: $shopify_dir"
# cd "$shopify_dir" || (echo "Error navigating to shopify directory"; exit 1)

# 确认进入 shopify 目录后
# echo "Current directory after navigating to shopify:"
# pwd

# 拉取主题文件
echo "Pulling Shopify theme..."
shopify theme pull --path="$shopify_dir"
if [ $? -ne 0 ]; then
  echo "Error pulling Shopify theme"
  exit 1
fi
