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
  await run('npx', ['prisma', 'generate'])

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

