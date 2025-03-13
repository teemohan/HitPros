set "CURRENT_DIR=%CD%"
set "shopify_dir=%CURRENT_DIR%\shopify"

echo templates/* > shopify\.shopifyignore
echo config/* >> shopify\.shopifyignore 
echo locales/* >> shopify\.shopifyignore
echo .shopify/* >> shopify\.shopifyignore

if not "%CD%"=="%shopify_dir%" (
    echo Navigating to shopify directory: %shopify_dir%
    cd /d "%shopify_dir%"
)

shopify theme pull
pause