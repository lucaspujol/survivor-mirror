export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function readMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    const detail = body?.detail
    if (typeof detail === 'string') return detail
    // Pydantic validation errors arrive as a list of {loc, msg, type}.
    if (Array.isArray(detail) && typeof detail[0]?.msg === 'string') return detail[0].msg
  } catch {
    // Body was not JSON; fall through to the generic message.
  }
  return `Erreur ${response.status}`
}

/**
 * The Vite proxy makes /api same-origin, so the auth cookie rides along with
 * fetch's default credentials mode. Nothing to configure.
 */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...init.headers },
  })

  if (!response.ok) {
    throw new ApiError(response.status, await readMessage(response))
  }

  return response.status === 204 ? (undefined as T) : await response.json()
}

/**
 * Same as `api`, for a multipart form. The content type is left to the
 * browser: it alone knows the boundary it generated for the body.
 */
export async function apiForm<T>(path: string, body: FormData, method = 'POST'): Promise<T> {
  const response = await fetch(path, { method, body })

  if (!response.ok) {
    throw new ApiError(response.status, await readMessage(response))
  }

  return response.status === 204 ? (undefined as T) : await response.json()
}
