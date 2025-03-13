set "CURRENT_DIR=%CD%"
set "shopify_dir=%CURRENT_DIR%\shopify"

if exist "shopify\.shopifyignore" (
    del /f /q "shopify\.shopifyignore"
)

if not "%CD%"=="%shopify_dir%" (
    echo Navigating to shopify directory: %shopify_dir%
    cd /d "%shopify_dir%"
)

shopify theme pull
pause