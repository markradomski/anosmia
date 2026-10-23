// Why the live camera can't be used, so the user is told the actual reason.
// Choosing a photo always remains available as the fallback.

export type CameraProblem = 'insecure' | 'denied' | 'missing' | 'failed' | 'unsupported'

export const CAMERA_PROBLEM_MESSAGES: Record<CameraProblem, string> = {
  insecure: 'The camera only works over a secure (https) connection, and this address isn’t one. You can choose a photo instead.',
  denied: 'Camera access is blocked for Anosmia. You can allow it in your browser’s site settings, or choose a photo instead.',
  missing: 'No camera was found on this device. You can choose a photo instead.',
  failed: 'The camera couldn’t start. Another app may be using it. Close it and try again, or choose a photo instead.',
  unsupported: 'This browser can’t open the camera. You can choose a photo instead.',
}

/**
 * Checked before asking for the camera. Browsers remove the camera API entirely outside a secure
 * context (https, or localhost), so its absence there is not a missing camera.
 */
export function cameraUnavailable(env: { isSecureContext: boolean; mediaDevices?: { getUserMedia?: unknown } }): CameraProblem | null {
  if (!env.isSecureContext) return 'insecure'
  if (typeof env.mediaDevices?.getUserMedia !== 'function') return 'unsupported'
  return null
}

/** Classify a getUserMedia rejection. */
export function cameraProblem(err: unknown): CameraProblem {
  const name = err instanceof Error || err instanceof DOMException ? err.name : ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
    case 'PermissionDeniedError':
      return 'denied'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return 'missing'
    case 'NotSupportedError':
    case 'TypeError':
      return 'unsupported'
    default:
      // NotReadableError / TrackStartError (camera busy or hardware fault), AbortError and anything unknown.
      return 'failed'
  }
}
