#!/bin/bash

# Script to configure CORS for Google Cloud Storage bucket
# This allows your frontend to upload/download files directly from GCS

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Configuring CORS for Google Cloud Storage bucket...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed.${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get bucket names from environment or use defaults
DEV_BUCKET=${GCP_BUCKET_NAME:-"banana-shop-bucket-dev"}
PROD_BUCKET=${GCP_BUCKET_NAME_PROD:-"banana-shop-bucket-prod"}

# Apply CORS to development bucket
echo -e "${YELLOW}Applying CORS configuration to development bucket: ${DEV_BUCKET}${NC}"
gcloud storage buckets update gs://${DEV_BUCKET} --cors-file=cors-config.json

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ CORS configured successfully for ${DEV_BUCKET}${NC}"
else
    echo -e "${RED}✗ Failed to configure CORS for ${DEV_BUCKET}${NC}"
fi

# Ask if they want to configure production bucket too
read -p "Do you want to configure CORS for production bucket (${PROD_BUCKET})? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Applying CORS configuration to production bucket: ${PROD_BUCKET}${NC}"
    gcloud storage buckets update gs://${PROD_BUCKET} --cors-file=cors-config.json
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ CORS configured successfully for ${PROD_BUCKET}${NC}"
    else
        echo -e "${RED}✗ Failed to configure CORS for ${PROD_BUCKET}${NC}"
    fi
fi

echo -e "${GREEN}Done!${NC}"
echo "You can verify CORS configuration with:"
echo "  gcloud storage buckets describe gs://${DEV_BUCKET} --format='default(cors_config)'"
