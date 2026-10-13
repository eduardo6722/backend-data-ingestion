#!/bin/sh
set -eu

./node_modules/.bin/nest build --watch --preserveWatchOutput &
compiler_pid=$!

wait_for_output() {
  i=0
  while [ ! -f dist/main.js ]; do
    i=$((i + 1))
    if [ "$i" -gt 150 ]; then
      echo "Timed out waiting for dist/main.js" >&2
      kill "$compiler_pid" 2>/dev/null || true
      exit 1
    fi
    sleep 0.2
  done
}

wait_for_output

node --enable-source-maps \
  --watch \
  --watch-path=dist \
  --watch-kill-signal=SIGKILL \
  --watch-preserve-output \
  dist/main.js &
app_pid=$!

term() {
  kill "$app_pid" "$compiler_pid" 2>/dev/null || true
  wait "$app_pid" "$compiler_pid" 2>/dev/null || true
}
trap term INT TERM

wait "$app_pid"
status=$?
kill "$compiler_pid" 2>/dev/null || true
wait "$compiler_pid" 2>/dev/null || true
exit "$status"
