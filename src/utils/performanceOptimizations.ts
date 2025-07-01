// 🚀 Performance-Optimierungen für Virtual Todos

// Memoization Cache für Virtual Todo Generation
const virtualTodoCache = new Map<string, any>();
const MAX_CACHE_SIZE = 50;

// Performance-Metriken
export interface PerformanceMetrics {
  totalGenerated: number;
  totalDuration: number;
  cacheHits: number;
  cacheMisses: number;
}

const performanceMetrics: PerformanceMetrics = {
  totalGenerated: 0,
  totalDuration: 0,
  cacheHits: 0,
  cacheMisses: 0,
};

/**
 * 🎯 Cache-Key Generator für konsistente Caching-Strategien
 */
export function generateCacheKey(params: Record<string, any>): string {
  return JSON.stringify(params, Object.keys(params).sort());
}

/**
 * 🧹 Cache-Management: Verhindert Memory-Leaks
 */
export function manageCacheSize(cache: Map<string, any>, maxSize: number = MAX_CACHE_SIZE) {
  if (cache.size >= maxSize) {
    const keysToDelete = Array.from(cache.keys()).slice(0, Math.floor(maxSize / 5));
    keysToDelete.forEach((key) => cache.delete(key));
    
    console.log(`🧹 Cache bereinigt: ${keysToDelete.length} Einträge entfernt`);
  }
}

/**
 * 🚀 Performance-Monitor: Misst und loggt Ausführungszeiten
 */
export function withPerformanceMonitoring<T>(
  operationName: string,
  operation: () => T,
  targetMs: number = 50
): T {
  const startTime = performance.now();
  const result = operation();
  const duration = performance.now() - startTime;

  // Update Metriken
  performanceMetrics.totalDuration += duration;

  // Performance-Warnung bei Überschreitung des Ziels
  if (duration > targetMs) {
    console.warn(
      `⚠️ Performance-Ziel verfehlt: ${operationName} dauerte ${duration.toFixed(2)}ms (Ziel: <${targetMs}ms)`
    );
  }

  // Erfolgreiche Performance-Logs nur in Development
  if (process.env.NODE_ENV === "development") {
    console.log(`🚀 ${operationName}: ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * 🎯 Background-Task Scheduler: Führt Aufgaben ohne UI-Blocking aus
 */
export function scheduleBackgroundTask(task: () => void, delay: number = 100) {
  setTimeout(task, delay);
}

/**
 * 📊 Performance-Statistiken abrufen
 */
export function getPerformanceStats() {
  const avgDuration = performanceMetrics.totalDuration / (performanceMetrics.cacheMisses || 1);
  const cacheHitRate = performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses) * 100;

  return {
    ...performanceMetrics,
    avgDurationMs: avgDuration.toFixed(2),
    cacheHitRatePercent: cacheHitRate.toFixed(1),
  };
}

/**
 * 🧹 Cache-Reset für alle Performance-Caches
 */
export function clearAllPerformanceCaches() {
  virtualTodoCache.clear();
  console.log("🧹 Alle Performance-Caches bereinigt");
} 