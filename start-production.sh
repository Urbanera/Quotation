#!/bin/bash

# Production startup script for Replit deployment
# This script builds the application and starts it in production mode

echo "Building application for production..."
npm run build

echo "Starting production server..."
npm start