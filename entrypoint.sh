#!/bin/sh
set -e

API_BASE="${API_BASE:-http://localhost:5173}"

sed -i "s|__API_BASE__|${API_BASE}|g" /usr/share/nginx/html/index.html

exec nginx -g 'daemon off;'
