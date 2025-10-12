#!/bin/bash

LOCK_FILE="/tmp/deferred-test.lock"

# Check if lock file exists
if [ -f "$LOCK_FILE" ]; then
    echo "Error: Tests are already running. If this is incorrect, delete $LOCK_FILE"
    exit 1
fi

# Create lock file
touch "$LOCK_FILE"

# Ensure lock file is removed even if script fails
trap 'rm -f "$LOCK_FILE"' EXIT

# Run tests: if no args, randomize; otherwise pass args through
if [ $# -eq 0 ]; then
    ./script/bun-test.sh --randomize "$@"
else
    ./script/bun-test.sh "$@"
fi
