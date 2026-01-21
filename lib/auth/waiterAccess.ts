import bcrypt from 'bcryptjs'

const ACCESS_CODE_LENGTH = 6
const SALT_ROUNDS = 10

export function generateNumericAccessCode(): string {
  let code = ''
  for (let i = 0; i < ACCESS_CODE_LENGTH; i += 1) {
    code += Math.floor(Math.random() * 10)
  }
  return code
}

export async function hashAccessCode(code: string): Promise<string> {
  return bcrypt.hash(code, SALT_ROUNDS)
}

export async function verifyAccessCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash)
}

