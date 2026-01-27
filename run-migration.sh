#!/bin/bash

# Set your DATABASE_URL here
export DATABASE_URL="your_database_url_here"

# Run the migration
echo "Adding menuUrl column to Restaurant table..."
psql $DATABASE_URL -c "ALTER TABLE \"Restaurant\" ADD COLUMN \"menuUrl\" TEXT;"

echo "Verifying column was added..."
psql $DATABASE_URL -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'Restaurant' AND column_name = 'menuUrl';"

echo "Migration completed!"
