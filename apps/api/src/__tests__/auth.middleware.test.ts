import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../auth/token.service.js', () => ({
  verifyAccessToken: vi.fn(),
}))

vi.mock('../db/db.js', () => ({
  db: {
    query: vi.fn(),
  },
}))

import { verifyAccessToken } from '../auth/token.service.js'
import { db } from '../db/db.js'

describe('authMiddleware', () => {
  let mockReq: any
  let mockReply: any
  let authMiddleware: any

  beforeEach(async () => {
    vi.clearAllMocks()

    mockReq = {
      headers: {},
      cookies: {},
    }

    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }

    const mod = await import('../auth/auth.middleware.js')
    authMiddleware = mod.authMiddleware
  })

  it('should set tenantId from valid Bearer token', async () => {
    mockReq.headers.authorization = 'Bearer valid.jwt.token'
    vi.mocked(verifyAccessToken).mockReturnValue({
      tenantId: 1,
      email: 'test@test.com',
      role: 'admin',
      userType: 'tenant',
    })

    await authMiddleware(mockReq, mockReply)

    expect(mockReq.tenantId).toBe(1)
    expect(mockReq.tenantRole).toBe('admin')
    expect(mockReply.status).not.toHaveBeenCalled()
  })

  it('should return 401 for expired JWT', async () => {
    mockReq.headers.authorization = 'Bearer expired.jwt.token'
    vi.mocked(verifyAccessToken).mockImplementation(() => {
      throw new Error('jwt expired')
    })

    await authMiddleware(mockReq, mockReply)

    expect(mockReply.status).toHaveBeenCalledWith(401)
    expect(mockReq.tenantId).toBeUndefined()
  })

  it('should return 401 for tampered JWT', async () => {
    mockReq.headers.authorization = 'Bearer tampered.jwt.token'
    vi.mocked(verifyAccessToken).mockImplementation(() => {
      throw new Error('invalid signature')
    })

    await authMiddleware(mockReq, mockReply)

    expect(mockReply.status).toHaveBeenCalledWith(401)
  })

  it('should return 401 for missing auth', async () => {
    await authMiddleware(mockReq, mockReply)

    expect(mockReply.status).toHaveBeenCalledWith(401)
  })

  it('should set tenantId from valid cookie token', async () => {
    mockReq.cookies = { access_token: 'valid.cookie.jwt' }
    vi.mocked(verifyAccessToken).mockReturnValue({
      tenantId: 2,
      email: 'user@test.com',
      role: 'admin',
      userType: 'tenant',
    })

    await authMiddleware(mockReq, mockReply)

    expect(mockReq.tenantId).toBe(2)
  })

  it('should set tenantId from valid API key', async () => {
    mockReq.headers['x-api-key'] = 'valid-api-key'
    vi.mocked(db.query).mockResolvedValue({
      rows: [{ id: 3, role: 'widget' }],
    })

    await authMiddleware(mockReq, mockReply)

    expect(mockReq.tenantId).toBe(3)
    expect(mockReq.tenantRole).toBe('widget')
  })

  it('should return 401 for invalid API key', async () => {
    mockReq.headers['x-api-key'] = 'invalid-api-key'
    vi.mocked(db.query).mockResolvedValue({ rows: [] })

    await authMiddleware(mockReq, mockReply)

    expect(mockReply.status).toHaveBeenCalledWith(401)
  })

  it('should set userId and userType from JWT when present', async () => {
    mockReq.headers.authorization = 'Bearer valid.jwt.token'
    vi.mocked(verifyAccessToken).mockReturnValue({
      tenantId: 1,
      email: 'user@test.com',
      role: 'sales_agent',
      userId: 42,
      userType: 'user',
    })

    await authMiddleware(mockReq, mockReply)

    expect(mockReq.userId).toBe(42)
    expect(mockReq.userType).toBe('user')
  })

  it('should hash API key correctly', async () => {
    const crypto = await import('crypto')
    const hashSpy = vi.spyOn(crypto, 'createHash')

    mockReq.headers['x-api-key'] = 'test-api-key-123'
    vi.mocked(db.query).mockResolvedValue({ rows: [{ id: 4, role: 'widget' }] })

    await authMiddleware(mockReq, mockReply)

    expect(hashSpy).toHaveBeenCalledWith('sha256')
  })

  it('should prefer Bearer token over cookie token', async () => {
    mockReq.headers.authorization = 'Bearer valid.jwt.token'
    mockReq.cookies = { access_token: 'also-valid.jwt' }

    vi.mocked(verifyAccessToken).mockReturnValue({
      tenantId: 10,
      email: 'bearer@test.com',
      role: 'admin',
      userType: 'tenant',
    })

    await authMiddleware(mockReq, mockReply)

    expect(mockReq.tenantId).toBe(10)
  })
})
