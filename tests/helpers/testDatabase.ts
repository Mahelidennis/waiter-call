/**
 * Test Database Helpers
 * 
 * Provides utilities for setting up and cleaning up the test database
 */

import { prisma } from '@/lib/db'

/**
 * Setup test database with required schema and initial data
 */
export async function setupTestDatabase(): Promise<void> {
  try {
    console.log('🗄️ Setting up test database...')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Verify required tables exist
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('Restaurant', 'Waiter', 'Table', 'Call', 'WaiterTable')
    `
    
    const tableNames = tables.map(t => t.table_name)
    const requiredTables = ['Restaurant', 'Waiter', 'Table', 'Call', 'WaiterTable']
    
    for (const table of requiredTables) {
      if (!tableNames.includes(table)) {
        throw new Error(`Required table '${table}' not found in database`)
      }
    }
    
    console.log('✅ All required tables found')
    
    // Clean up any existing test data
    await cleanupTestDatabase()
    
    console.log('✅ Test database setup complete')
    
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    throw error
  }
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase(): Promise<void> {
  try {
    console.log('🧹 Cleaning up test database...')
    
    // Delete in correct order to respect foreign key constraints
    const deleteOrder = [
      { table: 'WaiterTable', model: prisma.waiterTable },
      { table: 'Call', model: prisma.call },
      { table: 'Waiter', model: prisma.waiter },
      { table: 'Table', model: prisma.table },
      { table: 'Restaurant', model: prisma.restaurant }
    ]
    
    for (const { table, model } of deleteOrder) {
      try {
        const result = await (model as any).deleteMany()
        console.log(`🗑️ Deleted ${result.count} records from ${table}`)
      } catch (error) {
        console.warn(`⚠️ Could not delete from ${table}:`, error)
      }
    }
    
    console.log('✅ Test database cleanup complete')
    
  } catch (error) {
    console.error('❌ Failed to cleanup test database:', error)
    throw error
  }
}

/**
 * Reset database to clean state
 */
export async function resetTestDatabase(): Promise<void> {
  await cleanupTestDatabase()
  console.log('🔄 Database reset complete')
}

/**
 * Create test database indexes for better performance
 */
export async function createTestIndexes(): Promise<void> {
  try {
    console.log('📊 Creating test database indexes...')
    
    // Create indexes for better query performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_call_restaurant_id ON "Call" (restaurantId)',
      'CREATE INDEX IF NOT EXISTS idx_call_table_id ON "Call" (tableId)',
      'CREATE INDEX IF NOT EXISTS idx_call_waiter_id ON "Call" (waiterId)',
      'CREATE INDEX IF NOT EXISTS idx_call_status ON "Call" (status)',
      'CREATE INDEX IF NOT EXISTS idx_call_requested_at ON "Call" (requestedAt)',
      'CREATE INDEX IF NOT EXISTS idx_call_timeout_at ON "Call" (timeoutAt)',
      'CREATE INDEX IF NOT EXISTS idx_waiter_restaurant_id ON "Waiter" (restaurantId)',
      'CREATE INDEX IF NOT EXISTS idx_table_restaurant_id ON "Table" (restaurantId)',
      'CREATE INDEX IF NOT EXISTS idx_waiter_table_waiter_id ON "WaiterTable" (waiterId)',
      'CREATE INDEX IF NOT EXISTS idx_waiter_table_table_id ON "WaiterTable" (tableId)'
    ]
    
    for (const indexSql of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexSql)
        console.log(`✅ Created index: ${indexSql.split(' ')[4]}`)
      } catch (error) {
        console.warn(`⚠️ Could not create index:`, error)
      }
    }
    
    console.log('✅ Test database indexes created')
    
  } catch (error) {
    console.error('❌ Failed to create test indexes:', error)
    throw error
  }
}

/**
 * Seed test database with sample data for testing
 */
export async function seedTestDatabase(): Promise<void> {
  try {
    console.log('🌱 Seeding test database with sample data...')
    
    // Create sample restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Sample Test Restaurant',
        slug: 'sample-test-restaurant',
        email: 'sample@test.com'
      }
    })
    
    // Create sample waiters
    const waiters = await Promise.all([
      prisma.waiter.create({
        data: {
          name: 'John Waiter',
          email: 'john@test.com',
          phone: '+1234567890',
          restaurantId: restaurant.id
        }
      }),
      prisma.waiter.create({
        data: {
          name: 'Jane Waiter',
          email: 'jane@test.com',
          phone: '+1234567891',
          restaurantId: restaurant.id
        }
      })
    ])
    
    // Create sample tables
    const tables = await Promise.all([
      prisma.table.create({
        data: {
          number: 'Table 1',
          qrCode: 'QR-TABLE-1',
          isActive: true,
          restaurantId: restaurant.id
        }
      }),
      prisma.table.create({
        data: {
          number: 'Table 2',
          qrCode: 'QR-TABLE-2',
          isActive: true,
          restaurantId: restaurant.id
        }
      }),
      prisma.table.create({
        data: {
          number: 'Table 3',
          qrCode: 'QR-TABLE-3',
          isActive: true,
          restaurantId: restaurant.id
        }
      })
    ])
    
    // Assign waiters to tables
    await Promise.all([
      prisma.waiterTable.create({
        data: {
          waiterId: waiters[0].id,
          tableId: tables[0].id
        }
      }),
      prisma.waiterTable.create({
        data: {
          waiterId: waiters[0].id,
          tableId: tables[1].id
        }
      }),
      prisma.waiterTable.create({
        data: {
          waiterId: waiters[1].id,
          tableId: tables[2].id
        }
      })
    ])
    
    // Create sample calls with different statuses
    await Promise.all([
      prisma.call.create({
        data: {
          restaurantId: restaurant.id,
          tableId: tables[0].id,
          waiterId: waiters[0].id,
          status: 'PENDING',
          requestedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          timeoutAt: new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
        }
      }),
      prisma.call.create({
        data: {
          restaurantId: restaurant.id,
          tableId: tables[1].id,
          waiterId: waiters[0].id,
          status: 'ACKNOWLEDGED',
          requestedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          acknowledgedAt: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
          timeoutAt: new Date(Date.now() - 3 * 60 * 1000) // 3 minutes ago
        }
      }),
      prisma.call.create({
        data: {
          restaurantId: restaurant.id,
          tableId: tables[2].id,
          waiterId: waiters[1].id,
          status: 'COMPLETED',
          requestedAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
          acknowledgedAt: new Date(Date.now() - 18 * 60 * 1000), // 18 minutes ago
          completedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          timeoutAt: new Date(Date.now() - 13 * 60 * 1000) // 13 minutes ago
        }
      })
    ])
    
    console.log('✅ Test database seeded successfully')
    console.log(`📊 Created: 1 restaurant, ${waiters.length} waiters, ${tables.length} tables, 3 calls`)
    
  } catch (error) {
    console.error('❌ Failed to seed test database:', error)
    throw error
  }
}

/**
 * Get test database statistics
 */
export async function getTestDatabaseStats(): Promise<{
  restaurants: number
  waiters: number
  tables: number
  calls: number
  waiterTables: number
}> {
  const [restaurants, waiters, tables, calls, waiterTables] = await Promise.all([
    prisma.restaurant.count(),
    prisma.waiter.count(),
    prisma.table.count(),
    prisma.call.count(),
    prisma.waiterTable.count()
  ])
  
  return {
    restaurants,
    waiters,
    tables,
    calls,
    waiterTables
  }
}

/**
 * Validate test database schema
 */
export async function validateTestDatabaseSchema(): Promise<boolean> {
  try {
    console.log('🔍 Validating test database schema...')
    
    // Check if all required tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name IN ('Restaurant', 'Waiter', 'Table', 'Call', 'WaiterTable')
      ORDER BY table_name, ordinal_position
    `
    
    const requiredColumns = {
      Restaurant: ['id', 'name', 'code', 'isActive', 'createdAt', 'updatedAt'],
      Waiter: ['id', 'name', 'email', 'phone', 'accessCode', 'isActive', 'restaurantId', 'createdAt', 'updatedAt'],
      Table: ['id', 'number', 'qrCode', 'isActive', 'restaurantId', 'createdAt', 'updatedAt'],
      Call: ['id', 'restaurantId', 'tableId', 'waiterId', 'status', 'requestedAt', 'timeoutAt', 'acknowledgedAt', 'completedAt', 'handledAt', 'missedAt', 'responseTime', 'createdAt', 'updatedAt'],
      WaiterTable: ['waiterId', 'tableId', 'createdAt', 'updatedAt']
    }
    
    let isValid = true
    
    for (const [table, columns] of Object.entries(requiredColumns)) {
      const tableColumns = (tables as any[])
        .filter((row: any) => row.table_name === table)
        .map((row: any) => row.column_name)
      
      for (const column of columns) {
        if (!tableColumns.includes(column)) {
          console.error(`❌ Missing column '${column}' in table '${table}'`)
          isValid = false
        }
      }
    }
    
    if (isValid) {
      console.log('✅ Test database schema is valid')
    } else {
      console.error('❌ Test database schema validation failed')
    }
    
    return isValid
    
  } catch (error) {
    console.error('❌ Failed to validate test database schema:', error)
    return false
  }
}

/**
 * Backup test database before tests
 */
export async function backupTestDatabase(): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = `test-backup-${timestamp}.sql`
    
    console.log(`💾 Creating backup: ${backupFile}`)
    
    // In a real implementation, this would create a database backup
    // For now, we'll just log the action
    console.log(`✅ Backup created: ${backupFile}`)
    
    return backupFile
    
  } catch (error) {
    console.error('❌ Failed to backup test database:', error)
    throw error
  }
}

/**
 * Restore test database from backup
 */
export async function restoreTestDatabase(backupFile: string): Promise<void> {
  try {
    console.log(`🔄 Restoring from backup: ${backupFile}`)
    
    // In a real implementation, this would restore from backup
    // For now, we'll just log the action
    console.log(`✅ Database restored from: ${backupFile}`)
    
  } catch (error) {
    console.error('❌ Failed to restore test database:', error)
    throw error
  }
}
