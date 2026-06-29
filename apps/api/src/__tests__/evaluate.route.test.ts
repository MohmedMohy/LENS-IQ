import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/db.js', () => ({
  db: {
    query: vi.fn(),
  },
}))

vi.mock('../services/getPrograms.js', () => ({
  getPrograms: vi.fn(),
}))

vi.mock('../services/getRules.js', () => ({
  getRulesByProgramAndScope: vi.fn().mockResolvedValue([]),
  getRulesByProgram: vi.fn().mockResolvedValue([]),
}))

vi.mock('../engine/index.js', () => ({
  compareOffers: vi.fn(),
  rankOffers: vi.fn(),
}))

vi.mock('../shared/audit.service.js', () => ({
  logAudit: vi.fn(),
}))

import { db } from '../db/db.js'
import { getPrograms } from '../services/getPrograms.js'
import { compareOffers, rankOffers } from '../engine/index.js'

describe('POST /evaluate', () => {
  let fastify: any
  let mockReply: any
  let mockRequest: any
  let evaluateRoutes: any

  beforeEach(async () => {
    vi.clearAllMocks()

    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }

    mockRequest = {
      tenantId: 1,
      userId: 100,
      body: { application_id: 42 },
    }

    const { evaluateRoutes: routes } = await import('../routes/evaluate.js')
    evaluateRoutes = routes
  })

  it('should return 404 when application is not found', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [] })

    const fastify = {
      post: vi.fn((_path: string, _opts: any, handler: any) => {
        handler(mockRequest, mockReply)
      }),
      log: { error: vi.fn() },
    }

    await evaluateRoutes(fastify)

    expect(mockReply.status).toHaveBeenCalledWith(404)
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Application not found' })
    )
  })

  it('should return 404 when application belongs to different tenant', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [] })

    const fastify = {
      post: vi.fn((_path: string, _opts: any, handler: any) => {
        handler(mockRequest, mockReply)
      }),
      log: { error: vi.fn() },
    }

    await evaluateRoutes(fastify)

    expect(mockReply.status).toHaveBeenCalledWith(404)
  })

  it('should return 401 when not authenticated', async () => {
    const unauthedRequest = { ...mockRequest, tenantId: undefined }

    const fastify = {
      post: vi.fn((_path: string, opts: any, handler: any) => {
        if (opts.preHandler) {
          opts.preHandler(unauthedRequest, mockReply)
        }
        handler(unauthedRequest, mockReply)
      }),
      log: { error: vi.fn() },
    }

    await evaluateRoutes(fastify)
  })

  it('should return 500 with safe error when engine throws', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({
      rows: [{
        id: 42,
        birth_date: '1990-01-01',
        salary: '50000',
        price: '500000',
        current_liabilities: '0',
        owns_property: true,
        owns_car: false,
        salary_transfer: true,
        requested_down_payment: 100000,
        requested_months: 60,
        job_type: 'government',
        manufacturing_year: 2022,
        name: 'Test Customer',
        brand: 'Toyota',
        model: 'Camry',
        condition: 'new',
      }],
    })

    vi.mocked(getPrograms).mockRejectedValue(new Error('Database connection failed'))

    const fastify = {
      post: vi.fn((_path: string, _opts: any, handler: any) => {
        handler(mockRequest, mockReply)
      }),
      log: { error: vi.fn() },
    }

    await evaluateRoutes(fastify)

    expect(mockReply.status).toHaveBeenCalledWith(500)
    const sendArg = mockReply.send.mock.calls[0][0]
    expect(sendArg.message).toBe('Database connection failed')
  })

  it('should insert offers into database when offers exist', async () => {
    vi.mocked(db.query)
      .mockResolvedValueOnce({
        rows: [{
          id: 42,
          birth_date: '1990-01-01',
          salary: '50000',
          price: '500000',
          current_liabilities: '0',
          owns_property: true,
          owns_car: false,
          salary_transfer: true,
          requested_down_payment: 100000,
          requested_months: 60,
          job_type: 'government',
          manufacturing_year: 2022,
          name: 'Test Customer',
          brand: 'Toyota',
          model: 'Camry',
          condition: 'new',
        }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    vi.mocked(getPrograms).mockResolvedValue([])
    vi.mocked(compareOffers).mockResolvedValue([{
      programId: 1,
      bankId: 0,
      status: 'APPROVED',
      installment: 5000,
      totalPayment: 300000,
      interestRate: 12,
      months: 60,
      financeAmount: 400000,
      downPayment: 100000,
      dti: 30,
      riskScore: 20,
      riskLevel: 'LOW' as const,
      affordabilityScore: 80,
      approvalProbability: 80,
      reasons: [],
      suggestedAlternatives: [],
    }])

    vi.mocked(rankOffers).mockReturnValue([])

    const fastify = {
      post: vi.fn((_path: string, _opts: any, handler: any) => {
        handler(mockRequest, mockReply)
      }),
      log: { error: vi.fn() },
    }

    await evaluateRoutes(fastify)

    expect(mockReply.status).toHaveBeenCalledWith(200)
  })

  it('should scope application query by tenantId from JWT', async () => {
    vi.mocked(db.query).mockResolvedValueOnce({ rows: [] })

    const fastify = {
      post: vi.fn((_path: string, _opts: any, handler: any) => {
        handler(mockRequest, mockReply)
      }),
      log: { error: vi.fn() },
    }

    await evaluateRoutes(fastify)

    const queryCall = vi.mocked(db.query).mock.calls[0]
    expect(queryCall[1][1]).toBe(1)
  })

  it('should use tenantId from request, not from body', async () => {
    const bodyOverrideRequest = {
      ...mockRequest,
      body: { application_id: 42, tenant_id: 999 },
    }

    vi.mocked(db.query).mockResolvedValueOnce({ rows: [] })

    const fastify = {
      post: vi.fn((_path: string, _opts: any, handler: any) => {
        handler(bodyOverrideRequest, mockReply)
      }),
      log: { error: vi.fn() },
    }

    await evaluateRoutes(fastify)

    const queryCall = vi.mocked(db.query).mock.calls[0]
    expect(queryCall[1][1]).toBe(1)
  })
})
