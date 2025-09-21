#!/bin/bash

# 🚀 Quick Deployment Setup Script

set -e

echo "🚀 CookBook Connect - Deployment Setup"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "\n${BLUE}[STEP]${NC} $1"
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

# Check if Railway CLI is installed
print_step "Checking Railway CLI..."
if command -v railway &> /dev/null; then
    print_success "Railway CLI is installed"
else
    print_warning "Railway CLI not found. Installing..."
    npm install -g @railway/cli
    print_success "Railway CLI installed"
fi

# Check if user is logged in
print_step "Checking Railway authentication..."
if railway whoami &> /dev/null; then
    RAILWAY_USER=$(railway whoami)
    print_success "Logged in as: $RAILWAY_USER"
else
    print_warning "Not logged in to Railway"
    echo "Please run: railway login"
    echo "Then run this script again"
    exit 1
fi

# Create Railway project
print_step "Setting up Railway project..."
echo "This will create a new Railway project for your backend"
echo "Press Enter to continue or Ctrl+C to cancel"
read -r

# Initialize Railway project
if railway init; then
    print_success "Railway project initialized"
else
    print_error "Failed to initialize Railway project"
    exit 1
fi

# Set up environment variables
print_step "Setting up environment variables..."
echo ""
echo "Please provide the following information:"
echo ""

# Database URL
echo -n "Supabase Database URL: "
read -r DATABASE_URL
railway variables set DATABASE_URL="$DATABASE_URL"

# Redis URL
echo -n "Upstash Redis URL: "
read -r REDIS_URL
railway variables set REDIS_URL="$REDIS_URL"

# Gemini API Key
echo -n "Google Gemini API Key: "
read -r GEMINI_API_KEY
railway variables set GEMINI_API_KEY="$GEMINI_API_KEY"

# JWT Secrets
echo -n "JWT Secret (or press Enter for auto-generated): "
read -r JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
fi
railway variables set JWT_SECRET="$JWT_SECRET"

echo -n "JWT Refresh Secret (or press Enter for auto-generated): "
read -r JWT_REFRESH_SECRET
if [ -z "$JWT_REFRESH_SECRET" ]; then
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
fi
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"

# Set other environment variables
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
railway variables set AI_PROVIDER="gemini"
railway variables set GEMINI_MODEL="gemini-1.5-flash"
railway variables set GEMINI_TEMPERATURE="0.7"
railway variables set GEMINI_MAX_TOKENS="1000"
railway variables set API_PREFIX="api"
railway variables set THROTTLE_TTL="60"
railway variables set THROTTLE_LIMIT="100"
railway variables set AI_CACHE_TTL="3600"
railway variables set AI_MAX_REQUESTS_PER_HOUR="100"
railway variables set SEARCH_RESULTS_LIMIT="50"
railway variables set CACHE_TTL="300"
railway variables set CACHE_MAX_ITEMS="1000"
railway variables set BCRYPT_ROUNDS="12"
railway variables set LOG_LEVEL="info"
railway variables set LOG_FORMAT="json"

print_success "Environment variables configured"

# Deploy the application
print_step "Deploying application..."
if railway up; then
    print_success "Application deployed successfully!"
else
    print_error "Deployment failed"
    exit 1
fi

# Run database migrations
print_step "Running database migrations..."
if railway run "npx prisma migrate deploy"; then
    print_success "Database migrations completed"
else
    print_warning "Database migrations failed or not needed"
fi

# Get deployment URL
print_step "Getting deployment information..."
DEPLOYMENT_URL=$(railway status --json | jq -r '.deployments[0].url' 2>/dev/null || echo "")

echo ""
echo "🎉 Deployment Setup Complete!"
echo "=============================="
echo ""

if [ -n "$DEPLOYMENT_URL" ]; then
    echo "🌐 Application URL: $DEPLOYMENT_URL"
    echo "🔍 GraphQL Playground: $DEPLOYMENT_URL/graphql"
    echo "❤️  Health Check: $DEPLOYMENT_URL/health"
else
    echo "🌐 Check your Railway dashboard for the application URL"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Test your deployment endpoints"
echo "2. Set up GitHub Actions secrets for CI/CD"
echo "3. Configure custom domain (optional)"
echo "4. Set up monitoring and alerts"
echo ""
echo ""
print_success "Setup completed successfully!"
