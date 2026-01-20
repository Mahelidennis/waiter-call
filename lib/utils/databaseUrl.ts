const ALLOWED_PROTOCOLS = ['postgresql:', 'postgres:']
const REQUIRED_QUERY_PARAMS: Record<string, string> = {
  sslmode: 'require',
  pgbouncer: 'true',
  connection_limit: '1',
}
const SESSION_POOLER_PORT = 6543

export function validateDatabaseUrl(url: string | undefined) {
  if (!url) {
    return {
      isValid: false,
      errorMessage: 'DATABASE_URL is not set. Please add it to your environment variables.',
    }
  }

  const trimmed = url.trim()

  if (trimmed.includes('DATABASE_URL=')) {
    return {
      isValid: false,
      errorMessage: "DATABASE_URL value should not include 'DATABASE_URL=' inside it. Only use the raw URL.",
    }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return {
      isValid: false,
      errorMessage: 'DATABASE_URL is not a valid URL. Please copy the full connection string from Supabase.',
    }
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return {
      isValid: false,
      errorMessage: "DATABASE_URL must start with 'postgresql://' or 'postgres://'.",
    }
  }

  if (!parsed.username || parsed.password === '') {
    return {
      isValid: false,
      errorMessage: 'DATABASE_URL must include both username and password.',
    }
  }

  if (!parsed.hostname) {
    return {
      isValid: false,
      errorMessage: 'DATABASE_URL must include a host.',
    }
  }

  const database = parsed.pathname.replace(/^\//, '')
  if (!database) {
    return {
      isValid: false,
      errorMessage: 'DATABASE_URL must include a database name at the end of the URL.',
    }
  }

  const warnings: string[] = []

  // Enforce Supabase session pooler usage (6543)
  const originalPort = parsed.port ? Number(parsed.port) : SESSION_POOLER_PORT
  let normalizedPort = originalPort
  if (originalPort !== SESSION_POOLER_PORT) {
    warnings.push(
      `Using port ${originalPort}. Switching to ${SESSION_POOLER_PORT} for Supabase session pooler.`
    )
    normalizedPort = SESSION_POOLER_PORT
  }

  // Normalize query params to enforce pooling + SSL
  const params = new URLSearchParams(parsed.search)
  for (const [key, requiredValue] of Object.entries(REQUIRED_QUERY_PARAMS)) {
    const currentValue = params.get(key)
    if (currentValue !== requiredValue) {
      warnings.push(
        currentValue
          ? `Normalized "${key}" from "${currentValue}" to "${requiredValue}".`
          : `Added "${key}=${requiredValue}" to DATABASE_URL.`
      )
      params.set(key, requiredValue)
    }
  }

  const normalizedSearch = params.toString()
  const normalizedUrl = `${parsed.protocol}//${parsed.username}:${parsed.password}@${parsed.hostname}:${normalizedPort}/${database}${
    normalizedSearch ? `?${normalizedSearch}` : ''
  }`

  return {
    isValid: true,
    normalizedUrl,
    warnings: warnings.length ? warnings : undefined,
  }
}

