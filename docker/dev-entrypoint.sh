#!/bin/sh
set -eu

stamp_file="node_modules/.compose-lock-stamp"
lock_hash="$(sha256sum package-lock.json | awk '{print $1}')"

if [ ! -x node_modules/.bin/nest ] || [ ! -f "$stamp_file" ] || [ "$(cat "$stamp_file")" != "$lock_hash" ]; then
  npm ci --ignore-scripts --fetch-retries=5
  echo "$lock_hash" > "$stamp_file"
fi

./node_modules/.bin/prisma generate
./node_modules/.bin/prisma migrate deploy
exec npm run start:dev
