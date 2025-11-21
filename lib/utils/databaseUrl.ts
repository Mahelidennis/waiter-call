const PROTOCOL = 'postgresql://'
const DATABASE_URL_PATTERN = /^postgresql:\/\/[^:]+:[^@]+@[^:]+:5432\/[^/]+$/i

export function validateDatabaseUrl(url: string | undefined) {
  if (!url) {
    return {
      isValid: false,
      errorMessage: 'DATABASE_URL is not set. Please add it to your environment variables.',
    }
  }

  const trimmed = url.trim()

  if (!trimmed.startsWith(PROTOCOL)) {
    return {
      isValid: false,
      errorMessage: "DATABASE_URL must start with 'postgresql://'.",
    }
  }

  if (trimmed.includes('DATABASE_URL=')) {
    return {
      isValid: false,
      errorMessage: "DATABASE_URL value should not include 'DATABASE_URL=' inside it. Only use the raw URL.",
    }
  }

  const duplicateProtocolIndex = trimmed.indexOf(PROTOCOL, PROTOCOL.length)
  if (duplicateProtocolIndex !== -1) {
    return {
      isValid: false,
      errorMessage: 'DATABASE_URL contains duplicate protocol segments (postgresql://postgresql://). Remove the extra protocol prefix.',
    }
  }

  if (!DATABASE_URL_PATTERN.test(trimmed)) {
    return {
      isValid: false,
      errorMessage:
        "DATABASE_URL must match the format: postgresql://<USERNAME>:<PASSWORD>@<HOST>:5432/<DATABASE>",
    }
  }

  return {
    isValid: true,
    normalizedUrl: trimmed,
  }
}

