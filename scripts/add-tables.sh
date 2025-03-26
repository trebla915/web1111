#!/bin/bash

# Check if an event ID is provided
if [ -z "$1" ]; then
  echo "Please provide an event ID as an argument"
  echo "Usage: ./add-tables.sh <event_id>"
  exit 1
fi

# Load environment variables from .env.local
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  export $(grep -v '^#' .env.local | xargs)
fi

# Choose action
ACTION="${2:-check}"

if [ "$ACTION" = "add" ]; then
  # Run the add tables script with the provided event ID
  echo "Adding tables for event ID: $1"
  node scripts/populate-tables.js $1
else
  # Just check existing tables
  echo "Checking tables for event ID: $1"
  node scripts/check-tables.js $1
fi 