import { describe, expect, it } from 'vitest'
import { CAMERA_PROBLEM_MESSAGES, cameraProblem, cameraUnavailable } from './cameraProblem'

describe('camera problems', () => {
  it('reports an insecure connection before anything else (plain http on a network address)', () => {
    expect(cameraUnavailable({ isSecureContext: false, mediaDevices: undefined })).toBe('insecure')
    expect(cameraUnavailable({ isSecureContext: false, mediaDevices: { getUserMedia: () => {} } })).toBe('insecure')
  })

  it('reports a browser without the camera API, and allows a supported one', () => {
    expect(cameraUnavailable({ isSecureContext: true, mediaDevices: undefined })).toBe('unsupported')
    expect(cameraUnavailable({ isSecureContext: true, mediaDevices: { getUserMedia: () => {} } })).toBeNull()
  })

  it.each([
    ['NotAllowedError', 'denied'], ['SecurityError', 'denied'],
    ['NotFoundError', 'missing'], ['OverconstrainedError', 'missing'],
    ['NotReadableError', 'failed'], ['AbortError', 'failed'], ['SomethingNew', 'failed'],
    ['NotSupportedError', 'unsupported'],
  ])('classifies %s as %s', (name, problem) => {
    expect(cameraProblem(new DOMException('x', name))).toBe(problem)
  })

  it('always offers choosing a photo instead', () => {
    for (const message of Object.values(CAMERA_PROBLEM_MESSAGES)) expect(message).toMatch(/choose a photo instead\.$/)
  })
})
