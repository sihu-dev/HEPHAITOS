// ============================================
// Broker Validation Schemas (Zod)
// ============================================

import { z } from 'zod'

// ============================================
// Broker Query Schemas
// ============================================

export const brokerQuerySchema = z.object({
  userId: z.string().optional(),
  brokerId: z.string().optional(),
})

// ============================================
// Connect Broker Schema
// ============================================

export const connectBrokerSchema = z.object({
  userId: z.string().min(1, '사용자 ID가 필요합니다'),
  brokerId: z.string().min(1, '증권사 ID가 필요합니다'),
  credentials: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    accessToken: z.string().optional(),
    accountNumber: z.string().optional(),
    appKey: z.string().optional(),
    appSecret: z.string().optional(),
  }),
})

// ============================================
// Disconnect Broker Schema
// ============================================

export const disconnectBrokerSchema = z.object({
  userId: z.string().min(1, '사용자 ID가 필요합니다'),
  brokerId: z.string().optional(),
})

// ============================================
// Type Exports
// ============================================

export type BrokerQuery = z.infer<typeof brokerQuerySchema>
export type ConnectBrokerInput = z.infer<typeof connectBrokerSchema>
export type DisconnectBrokerInput = z.infer<typeof disconnectBrokerSchema>
