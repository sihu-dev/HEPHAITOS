// ============================================
// Slack Notification Service
// GPT V1 피드백: DLQ/Circuit 알림 시스템
// ============================================

import { safeLogger } from '@/lib/utils/safe-logger'

export interface SlackMessage {
  text?: string
  blocks?: SlackBlock[]
  attachments?: SlackAttachment[]
}

export interface SlackBlock {
  type: 'section' | 'header' | 'divider' | 'context'
  text?: {
    type: 'plain_text' | 'mrkdwn'
    text: string
    emoji?: boolean
  }
  fields?: Array<{
    type: 'plain_text' | 'mrkdwn'
    text: string
  }>
  elements?: Array<{
    type: 'plain_text' | 'mrkdwn' | 'image'
    text?: string
    image_url?: string
    alt_text?: string
  }>
}

export interface SlackAttachment {
  color?: string
  title?: string
  text?: string
  fields?: Array<{
    title: string
    value: string
    short?: boolean
  }>
  footer?: string
  ts?: number
}

/**
 * Slack Webhook 전송
 */
async function sendSlackWebhook(
  webhookUrl: string,
  message: SlackMessage
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      safeLogger.error('[Slack] Webhook failed', {
        status: response.status,
        statusText: response.statusText,
      })
      return false
    }

    return true
  } catch (error) {
    safeLogger.error('[Slack] Webhook error', { error })
    return false
  }
}

/**
 * DLQ 알림 전송
 */
export async function notifyDLQItem(options: {
  eventId: string
  orderId: string
  error: string
  failureCount: number
  provider: string
}): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL_ALERTS

  if (!webhookUrl) {
    safeLogger.warn('[Slack] SLACK_WEBHOOK_URL_ALERTS not configured')
    return false
  }

  const message: SlackMessage = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 Webhook DLQ Alert',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Event ID:*\n\`${options.eventId}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Order ID:*\n\`${options.orderId}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Provider:*\n${options.provider}`,
          },
          {
            type: 'mrkdwn',
            text: `*Failure Count:*\n${options.failureCount}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error:*\n\`\`\`${options.error}\`\`\``,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `🔗 <${process.env.NEXT_PUBLIC_APP_URL}/admin/monitoring|View Dashboard>`,
          },
        ],
      },
    ],
  }

  const success = await sendSlackWebhook(webhookUrl, message)

  if (success) {
    safeLogger.info('[Slack] DLQ alert sent', { eventId: options.eventId })
  }

  return success
}

/**
 * Circuit Breaker 오픈 알림
 */
export async function notifyCircuitOpen(options: {
  circuitName: string
  identifier: string
  failures: number
  cooldownMs: number
}): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL_ALERTS

  if (!webhookUrl) {
    safeLogger.warn('[Slack] SLACK_WEBHOOK_URL_ALERTS not configured')
    return false
  }

  const cooldownMinutes = Math.round(options.cooldownMs / 60000)

  const message: SlackMessage = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚡ Circuit Breaker Opened',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Circuit:*\n${options.circuitName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Identifier:*\n\`${options.identifier}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Consecutive Failures:*\n${options.failures}`,
          },
          {
            type: 'mrkdwn',
            text: `*Cooldown:*\n${cooldownMinutes} minutes`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `🔗 <${process.env.NEXT_PUBLIC_APP_URL}/admin/monitoring|View Dashboard>`,
          },
        ],
      },
    ],
  }

  const success = await sendSlackWebhook(webhookUrl, message)

  if (success) {
    safeLogger.info('[Slack] Circuit open alert sent', {
      circuit: options.circuitName,
    })
  }

  return success
}

/**
 * 일일 요약 알림
 */
export async function notifyDailySummary(options: {
  date: string
  webhooks: {
    total: number
    processed: number
    failed: number
    dlq: number
  }
  credits: {
    purchased: number
    spent: number
  }
  circuits: {
    openCount: number
  }
}): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL_REPORTS

  if (!webhookUrl) {
    safeLogger.warn('[Slack] SLACK_WEBHOOK_URL_REPORTS not configured')
    return false
  }

  const message: SlackMessage = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📊 Daily Summary - ${options.date}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Webhook Events*',
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Total:* ${options.webhooks.total}` },
          { type: 'mrkdwn', text: `*Processed:* ${options.webhooks.processed}` },
          { type: 'mrkdwn', text: `*Failed:* ${options.webhooks.failed}` },
          { type: 'mrkdwn', text: `*DLQ:* ${options.webhooks.dlq}` },
        ],
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Credits*',
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Purchased:* ${options.credits.purchased.toLocaleString()}` },
          { type: 'mrkdwn', text: `*Spent:* ${options.credits.spent.toLocaleString()}` },
        ],
      },
      { type: 'divider' },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Circuit Breaker Opens:* ${options.circuits.openCount}`,
          },
        ],
      },
    ],
  }

  return sendSlackWebhook(webhookUrl, message)
}

/**
 * 긴급 알림 (결제 실패 등)
 */
export async function notifyUrgent(options: {
  title: string
  message: string
  severity: 'high' | 'critical'
  context?: Record<string, string>
}): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL_ALERTS

  if (!webhookUrl) {
    return false
  }

  const emoji = options.severity === 'critical' ? '🔴' : '🟠'
  const color = options.severity === 'critical' ? '#FF0000' : '#FFA500'

  const contextFields = options.context
    ? Object.entries(options.context).map(([key, value]) => ({
        type: 'mrkdwn' as const,
        text: `*${key}:* ${value}`,
      }))
    : []

  const message: SlackMessage = {
    attachments: [
      {
        color,
        title: `${emoji} ${options.title}`,
        text: options.message,
        fields: options.context
          ? Object.entries(options.context).map(([title, value]) => ({
              title,
              value,
              short: true,
            }))
          : undefined,
        footer: 'HEPHAITOS Alert System',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  }

  return sendSlackWebhook(webhookUrl, message)
}
