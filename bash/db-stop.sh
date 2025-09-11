#!/bin/bash
cd "$(dirname "$0")/.."
export npm_config_userconfig="$(pwd)/.npmrc"
export npm_config_globalconfig="/dev/null" 

echo "🔍 Checking for existing Wasp database containers..."

# Stop and remove any existing Wasp database containers
EXISTING_CONTAINERS=$(docker ps -a --filter "name=wasp-dev-db" --format "{{.Names}}")
if [ ! -z "$EXISTING_CONTAINERS" ]; then
    echo "🛑 Stopping existing Wasp database containers..."
    echo "$EXISTING_CONTAINERS" | xargs docker stop
    echo "🗑️  Removing existing Wasp database containers..."
    echo "$EXISTING_CONTAINERS" | xargs docker rm
    echo "✅ Cleaned up existing containers"
else
    echo "ℹ️  No existing Wasp database containers found"
fi

# Check if port 5432 is still in use after cleanup
if lsof -i :5432 >/dev/null 2>&1; then
    echo "⚠️  Port 5432 is still in use by another process:"
    lsof -i :5432
else
    echo "✅ Port 5432 is now available"
fi
