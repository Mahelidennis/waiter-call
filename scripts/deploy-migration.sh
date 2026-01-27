#!/bin/bash

# Production Database Migration Script
# This script runs the menuUrl migration on production

echo "🚀 Starting production database migration..."

# Check if we're in production environment
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  Warning: Not in production environment"
    echo "This script should only run in production"
fi

# Run the migration
echo "📊 Running migration: add_menu_url_to_restaurant"
npx prisma migrate deploy

# Check if migration succeeded
if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo "🎉 menuUrl column has been added to Restaurant table"
else
    echo "❌ Migration failed!"
    echo "🔧 Please check the database connection and try again"
    exit 1
fi

echo "🔍 Verifying migration..."
npx prisma migrate status

echo "✨ Migration process completed!"
