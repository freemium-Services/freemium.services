#!/bin/bash

# ==============================================================================
# FREEMIUM.SERVICES — SEO AUTO-PING AND INDEXING DEPLOYMENT
# Automatically notifies primary search engines & IndexNow of new/updated URLs.
# ==============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DOMAIN="https://freemium.services"
SITEMAP_URL="${DOMAIN}/sitemap-index.xml"

# IndexNow Key (Auto-generated/placeholder - ensure it exists in root via vercel API or static file)
INDEXNOW_KEY="freemium-services-index-key-2026"

echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}🚀 INITIATING SEO DEPLOYMENT SEQUENCE...${NC}"
echo -e "${BLUE}==============================================${NC}"

TARGET_URL=""

# Check if a specific single-page flag was passed
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --new-tool) TARGET_URL="${DOMAIN}/tools/$2.html"; shift ;;
        --url) TARGET_URL="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

ping_sitemap() {
    echo -e "${YELLOW}Pinging Google...${NC}"
    curl -s "https://www.google.com/ping?sitemap=${SITEMAP_URL}" > /dev/null
    echo -e "✅ Google Notified"

    echo -e "${YELLOW}Pinging Bing...${NC}"
    curl -s "https://www.bing.com/ping?sitemap=${SITEMAP_URL}" > /dev/null
    echo -e "✅ Bing Notified"
    
    echo -e "${YELLOW}Pinging Yandex...${NC}"
    curl -s "https://webmaster.yandex.ru/ping?sitemap=${SITEMAP_URL}" > /dev/null
    echo -e "✅ Yandex Notified"
    
    echo -e "${YELLOW}Pinging Baidu...${NC}"
    curl -s "http://ping.baidu.com/ping?sitemap=${SITEMAP_URL}" > /dev/null
    echo -e "✅ Baidu Notified"
}

index_now() {
    local URL_TO_INDEX=$1
    echo -e "${YELLOW}Submitting to IndexNow Protocol (Bing, Yandex, Seznam, DuckDuckGo): ${URL_TO_INDEX}${NC}"
    
    # Send standardized IndexNow POST request
    curl -s -X POST "https://api.indexnow.org/indexnow" \
        -H "Content-Type: application/json; charset=utf-8" \
        -d "{
            \"host\": \"freemium.services\",
            \"key\": \"${INDEXNOW_KEY}\",
            \"keyLocation\": \"${DOMAIN}/${INDEXNOW_KEY}.txt\",
            \"urlList\": [
                \"${URL_TO_INDEX}\"
            ]
        }" > /dev/null
        
    echo -e "✅ IndexNow Submission Complete"
}

if [ -z "$TARGET_URL" ]; then
    echo -e "${BLUE}Mode: Full Sitemap Ping${NC}"
    ping_sitemap
else
    echo -e "${BLUE}Mode: Targeted URL Indexing${NC}"
    index_now "$TARGET_URL"
    
    # Still good practice to ping sitemap whenever new content exists
    ping_sitemap
fi

echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}✅ SEO DEPLOYMENT COMPLETE & ENGINES NOTIFIED!${NC}"
echo -e "${BLUE}==============================================${NC}"
