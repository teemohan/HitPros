#!/bin/bash

# 创建输出目录
mkdir -p shopify/assets/purged

# 定义要处理的 CSS 文件数组
CSS_FILES=(
  "theme.css"
  "element.css"
  "shopify-style.css"
  "global.min.css"
)

# 定义安全列表
SAFELIST="swiper-,el-,vue-,js-,flickity,photoswipe,hidden,block,flex,grid,active,open,closed"

echo "===开始批量处理 CSS 文件==="

# 循环处理每个 CSS 文件
for css_file in "${CSS_FILES[@]}"; do
  input_file="./shopify/assets/$css_file"
  output_file="./shopify/assets/purged/$css_file"
  
  if [ -f "$input_file" ]; then
    echo "正在处理: $css_file"
    npx purgecss --content "./shopify/**/*.{liquid,js}" --css "$input_file" --output "$output_file" --safelist "$SAFELIST"
    
    # 检查文件大小变化
    if [ -f "$output_file" ]; then
      original_size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file")
      purged_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file")
      saved_bytes=$((original_size - purged_size))
      saved_percent=$((saved_bytes * 100 / original_size))
      
      echo "  原始大小: ${original_size} bytes"
      echo "  优化后: ${purged_size} bytes"
      echo "  节省: ${saved_bytes} bytes (${saved_percent}%)"
    fi
  else
    echo "警告: 文件不存在 - $input_file"
  fi
  echo ""
done

echo "===批量处理完成==="
echo "优化后的文件保存在: shopify/assets/purged/"