#!/bin/bash

# 获取当前目录
CURRENT_DIR=$(pwd)
# 组合成完整的本地绝对路径
BASE_PATH="${CURRENT_DIR}/"

# 构建 shopify 目录路径
shopify_dir="${BASE_PATH}shopify/"
echo "Navigating to shopify directory: $shopify_dir"

# 创建或更新 .shopifyignore 文件
cat > "${shopify_dir}.shopifyignore" << EOL
templates/*
config/*
locales/*
.shopify/*
EOL

# 拉取主题
echo "Pulling Shopify theme..."
shopify theme pull --path="$shopify_dir"
if [ $? -ne 0 ]; then
  echo "Error pulling Shopify theme"
  exit 1
fi

echo "Theme pull completed!" 