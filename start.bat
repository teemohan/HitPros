@echo off
echo Executing start.bat script...

:: 获取当前目录并设置 shopify 目录
set "CURRENT_DIR=%CD%"
set "shopify_dir=%CURRENT_DIR%\shopify"

echo Navigating to shopify directory: %shopify_dir%
cd /d "%shopify_dir%"

:: 运行 shopify theme dev 命令
shopify theme dev

pause
