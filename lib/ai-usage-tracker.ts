/**
 * AI Usage Tracker
 * 
 * Utility to log AI API usage for analytics and cost monitoring.
 * Uses service role to bypass RLS and ensure logging always succeeds.
 */

import { createServiceClient } from '@/lib/supabase'

// Gemini 2.5 Flash pricing (January 2026)
// Source: https://ai.google.dev/pricing
const PRICING = {
    input_per_million: 0.075,   // $0.075 per 1M input tokens
    output_per_million: 0.30,   // $0.30 per 1M output tokens
}

export interface AIUsageLog {
    userId?: string | null
    endpoint: string
    model?: string
    inputTokens?: number
    outputTokens?: number
    latencyMs?: number
    success?: boolean
    errorMessage?: string
    metadata?: Record<string, any>
}

/**
 * Calculate estimated cost based on token usage
 */
function calculateCost(inputTokens?: number, outputTokens?: number): number {
    const inputCost = ((inputTokens || 0) * PRICING.input_per_million) / 1_000_000
    const outputCost = ((outputTokens || 0) * PRICING.output_per_million) / 1_000_000
    return inputCost + outputCost
}

/**
 * Log AI usage to the database.
 * This function is non-blocking and will silently fail if logging fails.
 * 
 * @param data - The usage data to log
 * @returns Promise<void>
 * 
 * @example
 * ```typescript
 * const startTime = performance.now()
 * const result = await generateText({ ... })
 * const latencyMs = Math.round(performance.now() - startTime)
 * 
 * logAIUsage({
 *   userId: user?.id,
 *   endpoint: '/api/generate-nem',
 *   inputTokens: result.usage?.promptTokens,
 *   outputTokens: result.usage?.completionTokens,
 *   latencyMs,
 *   success: true
 * }).catch(() => {})
 * ```
 */
export async function logAIUsage(data: AIUsageLog): Promise<void> {
    try {
        const supabase = createServiceClient()

        const inputTokens = data.inputTokens || 0
        const outputTokens = data.outputTokens || 0
        const totalTokens = inputTokens + outputTokens
        const estimatedCost = calculateCost(inputTokens, outputTokens)

        await supabase.from('ai_usage_logs').insert({
            user_id: data.userId || null,
            endpoint: data.endpoint,
            model: data.model || 'gemini-2.5-flash',
            input_tokens: inputTokens || null,
            output_tokens: outputTokens || null,
            total_tokens: totalTokens || null,
            estimated_cost_usd: estimatedCost || null,
            latency_ms: data.latencyMs || null,
            success: data.success ?? true,
            error_message: data.errorMessage || null,
            metadata: data.metadata || {}
        })
    } catch (error) {
        // Silent fail - don't break the app if logging fails
        console.error('[AI Usage Tracker] Error logging usage:', error)
    }
}

/**
 * Helper to create a timer for measuring latency
 * 
 * @example
 * ```typescript
 * const timer = createTimer()
 * const result = await generateText({ ... })
 * const latencyMs = timer.elapsed()
 * ```
 */
export function createTimer() {
    const startTime = performance.now()
    return {
        elapsed: () => Math.round(performance.now() - startTime)
    }
}

/**
 * Wrapper function to track AI usage with automatic timing
 * 
 * @example
 * ```typescript
 * const result = await trackAIUsage(
 *   () => generateText({ model: google("gemini-2.5-flash"), prompt }),
 *   { userId: user?.id, endpoint: '/api/generate-nem' }
 * )
 * ```
 */
export async function trackAIUsage<T extends { usage?: { promptTokens?: number; completionTokens?: number } }>(
    aiCall: () => Promise<T>,
    options: { userId?: string | null; endpoint: string; metadata?: Record<string, any> }
): Promise<T> {
    const timer = createTimer()

    try {
        const result = await aiCall()

        // Log success - non-blocking
        logAIUsage({
            userId: options.userId,
            endpoint: options.endpoint,
            inputTokens: result.usage?.promptTokens,
            outputTokens: result.usage?.completionTokens,
            latencyMs: timer.elapsed(),
            success: true,
            metadata: options.metadata
        }).catch(() => { })

        return result
    } catch (error) {
        // Log failure - non-blocking
        logAIUsage({
            userId: options.userId,
            endpoint: options.endpoint,
            latencyMs: timer.elapsed(),
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            metadata: options.metadata
        }).catch(() => { })

        throw error
    }
}
