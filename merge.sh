#!/bin/bash

# 获取当前目录
CURRENT_DIR=$(pwd)
SHOPIFY_DIR="$CURRENT_DIR/shopify"

# 创建或更新 .shopifyignore 文件
cat > "$SHOPIFY_DIR/.shopifyignore" << EOL
templates/*
config/*
locales/*
.shopify/*
EOL

# 如果当前不在 shopify 目录，则切换到该目录
if [ "$PWD" != "$SHOPIFY_DIR" ]; then
    echo "Navigating to shopify directory: $SHOPIFY_DIR"
    cd "$SHOPIFY_DIR" || exit 1
fi

# 拉取主题
shopify theme pull

echo "Theme pull completed!" 