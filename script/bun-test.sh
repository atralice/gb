#!/bin/bash

if [ -n "$CI" ]; then
  # If running in CI, retain existing environment variables and load .env.test.
  source .env.test
  
  # If test files are provided as arguments, run only those; otherwise run all tests
  if [ $# -gt 0 ]; then
    bun test "$@"
  else
    bun test
  fi
else
  # If running locally, clear all environment variables before loading .env.test.
  if [ $# -eq 0 ]; then
    env -i PATH="$PATH" HOME="$HOME" DEBUG="$DEBUG" bash -c 'exec bun test --randomize "$@"' bash "$@"
  else
    env -i PATH="$PATH" HOME="$HOME" DEBUG="$DEBUG" bash -c 'exec bun test "$@"' bash "$@"
  fi
fi