#!/bin/bash
cd "$(dirname "$0")/.."
export npm_config_userconfig="$(pwd)/.npmrc"
export npm_config_globalconfig="/dev/null"
wasp deploy railway launch micro-banana
