#!/bin/bash

# 🚀 Deployment Script for CookBook Connect Backend

set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment is provided
if [ -z "$1" ]; then
    print_error "Environment not specified!"
    echo "Usage: ./scripts/deploy.sh production"
    exit 1
fi

ENVIRONMENT=$1

print_status "Deploying to $ENVIRONMENT environment..."

# Validate environment
if [ "$ENVIRONMENT" != "production" ]; then
    print_error "Invalid environment! Use 'production'"
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed!"
    echo "Install it with: npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    print_error "Not logged in to Railway!"
    echo "Login with: railway login"
    exit 1
fi

# Set Railway service for production
SERVICE_NAME="cookbook-backend"
print_status "Deploying to production service: $SERVICE_NAME"

# Build the application
print_status "Building application..."
if pnpm build; then
    print_success "Build completed successfully!"
else
    print_error "Build failed!"
    exit 1
fi

# Run tests
print_status "Running tests..."
if pnpm test --passWithNoTests; then
    print_success "Tests passed!"
else
    print_error "Tests failed!"
    exit 1
fi

# Deploy to Railway
print_status "Deploying to Railway..."
if railway deploy --service $SERVICE_NAME; then
    print_success "Deployment successful!"
else
    print_error "Deployment failed!"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
if railway run --service $SERVICE_NAME "npx prisma migrate deploy"; then
    print_success "Database migrations completed!"
else
    print_warning "Database migrations failed or not needed"
fi

# Get the deployment URL
DEPLOYMENT_URL=$(railway status --service $SERVICE_NAME --json | jq -r '.deployments[0].url' 2>/dev/null || echo "")

if [ -n "$DEPLOYMENT_URL" ]; then
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "🌐 Application URL: $DEPLOYMENT_URL"
    echo "🔍 GraphQL Playground: $DEPLOYMENT_URL/graphql"
    echo "❤️  Health Check: $DEPLOYMENT_URL/health"
    echo ""
else
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "🌐 Check your Railway dashboard for the application URL"
    echo ""
fi

print_status "Deployment process completed!"
