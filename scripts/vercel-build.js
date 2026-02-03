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
  console.log('Starting deployment build...')
  
  // Skip Prisma operations for deployment to avoid issues
  console.log('Skipping prisma generate (will use postinstall)')
  console.log('Skipping prisma migrate deploy (database already set up)')

  console.log('Running next build…')
  await run('npx', ['next', 'build'])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

