/**
 * Logger ultra-optimizado para mínimo impacto en rendimiento
 * - Logging asíncrono no-bloqueante
 * - Batching automático
 * - Sampling inteligente
 * - Cache en memoria
 */

interface LogEntry {
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  category: string;
  message: string;
  context?: Record<string, any>;
  timestamp: number;
  sessionId?: string;
  userId?: string;
}

interface LoggerConfig {
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  sampleRate: number; // 0-1, qué porcentaje de logs guardar
  enableConsole: boolean;
}

class LightweightLogger {
  private buffer: LogEntry[] = [];
  private config: LoggerConfig;
  private flushTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      batchSize: 50, // Procesar en lotes de 50
      flushInterval: 5000, // Flush cada 5 segundos
      maxRetries: 2,
      sampleRate: 0.1, // Solo guardar 10% de logs por defecto
      enableConsole: process.env.NODE_ENV === 'development',
      ...config
    };

    this.startFlushTimer();
  }

  /**
   * Log principal - completamente asíncrono y no-bloqueante
   */
  public log(level: LogEntry['level'], category: string, message: string, context?: Record<string, any>): void {
    // Sampling: solo procesar un porcentaje de logs
    if (!this.shouldLog(level, category)) {
      return;
    }

    const entry: LogEntry = {
      level,
      category,
      message,
      context: this.sanitizeContext(context),
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getCurrentUserId()
    };

    // Console log inmediato (no bloquea)
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Agregar al buffer (operación síncrona rápida)
    this.buffer.push(entry);

    // Auto-flush si el buffer está lleno
    if (this.buffer.length >= this.config.batchSize) {
      this.flushAsync();
    }
  }

  /**
   * Sampling inteligente - solo log críticos siempre
   */
  private shouldLog(level: LogEntry['level'], category: string): boolean {
    // Siempre log errores críticos
    if (level === 'ERROR' || level === 'FATAL') {
      return true;
    }

    // Siempre log eventos críticos del negocio
    if (category === 'auth' || category === 'payment' || category === 'ai_error') {
      return true;
    }

    // Sampling para el resto
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Sanitizar contexto para evitar datos pesados
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    const sanitized: Record<string, any> = {};
    const maxSize = 1000; // Limitar tamaño del contexto

    for (const [key, value] of Object.entries(context)) {
      // Excluir datos sensibles o muy grandes
      if (this.isSensitiveKey(key) || this.isOversized(value)) {
        continue;
      }

      sanitized[key] = this.truncateValue(value);
      
      // Limitar tamaño total del contexto
      if (JSON.stringify(sanitized).length > maxSize) {
        break;
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    return sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));
  }

  private isOversized(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    
    try {
      const str = JSON.stringify(value);
      return str && str.length > 500; // Limitar tamaño individual
    } catch (error) {
      // Si no se puede serializar, considerarlo como oversized
      return true;
    }
  }

  private truncateValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }
    
    if (typeof value === 'string' && value.length > 200) {
      return value.substring(0, 200) + '...';
    }
    return value;
  }

  /**
   * Log a consola (síncrono pero muy rápido)
   */
  private logToConsole(entry: LogEntry): void {
    const emoji = this.getLevelEmoji(entry.level);
    console.log(
      `${emoji} [${entry.level}] ${entry.category}: ${entry.message}`,
      entry.context ? entry.context : ''
    );
  }

  private getLevelEmoji(level: string): string {
    const emojis = {
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      FATAL: '💥'
    };
    return emojis[level as keyof typeof emojis] || '📝';
  }

  /**
   * Flush asíncrono - no bloquea la aplicación
   */
  private async flushAsync(): Promise<void> {
    if (this.isProcessing || this.buffer.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.buffer.splice(0, this.config.batchSize);

    try {
      await this.sendToDatabase(batch);
    } catch (error) {
      // En caso de error, volver a poner en buffer (con límite)
      if (this.buffer.length < this.config.batchSize * 2) {
        this.buffer.unshift(...batch);
      }
      console.error('Error flushing logs:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Envío optimizado a base de datos
   */
  private async sendToDatabase(entries: LogEntry[]): Promise<void> {
    // Usar fetch nativo (más rápido que supabase client)
    const response = await fetch('/api/logs/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: entries })
    });

    if (!response.ok) {
      throw new Error(`Failed to send logs: ${response.status}`);
    }
  }

  /**
   * Timer para flush automático
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flushAsync();
      }
    }, this.config.flushInterval);
  }

  /**
   * Métodos de utilidad
   */
  private getSessionId(): string | undefined {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('sessionId') || undefined;
    }
    return undefined;
  }

  private getCurrentUserId(): string | undefined {
    // Implementar según tu sistema de auth
    return undefined;
  }

  /**
   * Métodos públicos de conveniencia
   */
  public debug(category: string, message: string, context?: Record<string, any>): void {
    this.log('DEBUG', category, message, context);
  }

  public info(category: string, message: string, context?: Record<string, any>): void {
    this.log('INFO', category, message, context);
  }

  public warn(category: string, message: string, context?: Record<string, any>): void {
    this.log('WARN', category, message, context);
  }

  public error(category: string, message: string, context?: Record<string, any>): void {
    this.log('ERROR', category, message, context);
  }

  public fatal(category: string, message: string, context?: Record<string, any>): void {
    this.log('FATAL', category, message, context);
  }

  /**
   * Flush manual para shutdown graceful
   */
  public async flush(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flushAsync();
  }
}

// Instancia singleton optimizada
export const logger = new LightweightLogger({
  sampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.2, // 5% en prod, 20% en dev
  batchSize: 100, // Lotes más grandes en producción
  flushInterval: 10000 // Flush cada 10 segundos en producción
});

// Exportar tipos
export type { LogEntry, LoggerConfig };
