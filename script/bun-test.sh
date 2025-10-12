#!/bin/bash

if [ -n "$CI" ]; then
  # If running in CI, retain existing environment variables and load .env.test.
  source .env.test
  bun test
else
  # If running locally, clear all environment variables before loading .env.test.
  env -i PATH="$PATH" DEBUG="$DEBUG" bash -c 'exec bun test "$@"' bash "$@"
fi
