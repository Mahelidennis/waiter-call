-- Manual Migration for menuUrl Column
-- Run this in your Supabase SQL Editor

-- Add menuUrl column to Restaurant table
ALTER TABLE "Restaurant" ADD COLUMN "menuUrl" TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Restaurant' AND column_name = 'menuUrl';

-- Show current Restaurant table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Restaurant' 
ORDER BY ordinal_position;
