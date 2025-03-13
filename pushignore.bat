
echo templates/* > shopify\.shopifyignore
echo config/* >> shopify\.shopifyignore 
echo locales/* >> shopify\.shopifyignore
echo .shopify/* >> shopify\.shopifyignore
if not exist "shopify\" (
    cd shopify
)
shopify theme push
pause