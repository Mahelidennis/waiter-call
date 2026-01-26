/* eslint-disable no-console */
const { spawn } = require('node:child_process')

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} ${args.join(' ')} failed with code ${code}`))
    })
  })
}

async function runWithTimeout(label, fn, timeoutMs) {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out after ${Math.round(timeoutMs / 1000)}s. ` +
            `This usually means DATABASE_URL is wrong/unreachable from Vercel.`
        )
      )
    }, timeoutMs)
  })

  try {
    await Promise.race([fn(), timeout])
  } finally {
    clearTimeout(timeoutId)
  }
}

async function main() {
  console.log('Running prisma generate…')
  
  // Try to generate Prisma client with retry logic
  let retries = 0
  const maxRetries = 3
  
  while (retries < maxRetries) {
    try {
      await run('npx', ['prisma', 'generate'])
      console.log('Prisma generate successful')
      break
    } catch (error) {
      retries++
      console.log(`Prisma generate attempt ${retries} failed: ${error.message}`)
      
      if (retries >= maxRetries) {
        console.log('Warning: Prisma generate failed, but continuing with build...')
        console.log('This might be due to file locks. The build may still work.')
      } else {
        console.log(`Retrying in 2 seconds... (${retries}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  const skipMigrate =
    String(process.env.SKIP_PRISMA_MIGRATE || '').toLowerCase() === '1' ||
    String(process.env.SKIP_PRISMA_MIGRATE || '').toLowerCase() === 'true'

  if (skipMigrate) {
    console.log('Skipping prisma migrate deploy (SKIP_PRISMA_MIGRATE=true).')
  } else {
    // Keep Vercel from hanging for 45 minutes if DB is unreachable.
    console.log('Running prisma migrate deploy…')
    await runWithTimeout(
      'prisma migrate deploy',
      () => run('npx', ['prisma', 'migrate', 'deploy']),
      120_000
    )
  }

  console.log('Running next build…')
  await run('npx', ['next', 'build'])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

