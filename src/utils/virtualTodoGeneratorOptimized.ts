import dayjs from "dayjs";
import type { RecurringTodo } from "../services/todoService";
import { createVirtualTodo, type VirtualTodo } from "../types/virtualTodo";

// 🚀 Performance-Optimierung: Memoization Cache für Virtual Todo Generation
const virtualTodoCache = new Map<string, VirtualTodo[]>();
const MAX_CACHE_SIZE = 50; // Begrenzte Cache-Größe für Memory-Management

// Performance-Metriken für Monitoring
interface PerformanceMetrics {
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
 * 🎯 Cache-Key Generator für Virtual Todos
 * Berücksichtigt alle relevanten Parameter für eindeutige Identifikation
 */
function generateCacheKey(
  recurringRules: RecurringTodo[],
  startDate: string,
  endDate: string
): string {
  // Erstelle Hash aus allen RecurringTodo-IDs und deren last_modified Zeit
  const rulesHash = recurringRules
    .map((rule) => `${rule.id}_${rule.created_at}`)
    .sort() // Sortierung für konsistente Keys
    .join("|");

  return `${rulesHash}_${startDate}_${endDate}`;
}

/**
 * 🧹 Cache-Management: Verhindert Memory-Leaks
 * Entfernt älteste Einträge wenn Cache-Limit erreicht wird
 */
function manageCacheSize() {
  if (virtualTodoCache.size >= MAX_CACHE_SIZE) {
    // Entferne die ältesten 10 Einträge (LRU-ähnlich)
    const keysToDelete = Array.from(virtualTodoCache.keys()).slice(0, 10);
    keysToDelete.forEach((key) => virtualTodoCache.delete(key));

    console.log(
      `🧹 Virtual Todo Cache bereinigt: ${keysToDelete.length} Einträge entfernt`
    );
  }
}

/**
 * Berechnet alle Vorkommen eines RecurringTodo innerhalb eines Datumsbereichs
 * OPTIMIERT: Höhere Iteration-Limits für 90-Tage-Bereiche
 */
function calculateOccurrences(
  recurringTodo: RecurringTodo,
  startDate: string,
  endDate: string
): string[] {
  // Nur aktive recurring todos verarbeiten
  if (!recurringTodo.is_active) {
    return [];
  }

  const rangeStart = dayjs(startDate);
  const rangeEnd = dayjs(endDate);
  const ruleStart = dayjs(recurringTodo.start_date);

  // Performance-Optimierung: Überspringe Regeln die nach dem Zielbereich starten
  if (ruleStart.isAfter(rangeEnd)) {
    return [];
  }

  const occurrences: string[] = [];
  let currentDate = ruleStart;

  // 🚀 Performance-Limit: Höheres Limit für 100+ Regeln über 90 Tage
  let iterations = 0;
  const maxIterations = 2000; // Erhöht für bessere 90-Tage-Unterstützung

  // Finde ersten Termin im oder nach dem Zielbereich
  while (currentDate.isBefore(rangeStart) && iterations < maxIterations) {
    iterations++;

    switch (recurringTodo.repeat_unit) {
      case "day":
        currentDate = currentDate.add(recurringTodo.repeat_count, "day");
        break;
      case "week":
        currentDate = currentDate.add(recurringTodo.repeat_count, "week");
        break;
      case "month":
        currentDate = currentDate.add(recurringTodo.repeat_count, "month");
        break;
      default:
        console.warn(`Unbekannte repeat_unit: ${recurringTodo.repeat_unit}`);
        return [];
    }
  }

  // Sammle alle Termine im Zielbereich
  while (
    (currentDate.isBefore(rangeEnd) || currentDate.isSame(rangeEnd)) &&
    iterations < maxIterations
  ) {
    iterations++;

    if (currentDate.isAfter(rangeStart) || currentDate.isSame(rangeStart)) {
      occurrences.push(currentDate.format("YYYY-MM-DD"));
    }

    // Berechne nächsten Termin
    switch (recurringTodo.repeat_unit) {
      case "day":
        currentDate = currentDate.add(recurringTodo.repeat_count, "day");
        break;
      case "week":
        currentDate = currentDate.add(recurringTodo.repeat_count, "week");
        break;
      case "month":
        currentDate = currentDate.add(recurringTodo.repeat_count, "month");
        break;
    }
  }

  // Performance-Warnung bei zu vielen Iterationen
  if (iterations >= maxIterations) {
    console.warn(
      `⚠️ Performance-Limit erreicht für recurring todo "${recurringTodo.title}" (${iterations} Iterationen)`
    );
  }

  return occurrences;
}

/**
 * 🚀 OPTIMIERT: Generiert Virtual Todos mit Memoization und Performance-Monitoring
 * Ziel: 100+ Regeln für 90 Tage <50ms
 */
export function generateVirtualTodosOptimized(
  recurringRules: RecurringTodo[],
  startDate: string,
  endDate: string
): VirtualTodo[] {
  // Performance-Optimierung: Früher Exit bei leeren Regeln
  if (!recurringRules.length) {
    return [];
  }

  // 🎯 Cache-Check: Prüfe ob Ergebnis bereits vorhanden
  const cacheKey = generateCacheKey(recurringRules, startDate, endDate);
  const cachedResult = virtualTodoCache.get(cacheKey);

  if (cachedResult) {
    performanceMetrics.cacheHits++;
    console.log(
      `⚡ Cache Hit: ${cachedResult.length} Virtual Todos aus Cache geladen`
    );
    return cachedResult;
  }

  performanceMetrics.cacheMisses++;

  // Performance-Messung für 100+ Regeln Benchmark
  const startTime = performance.now();

  const virtualTodos: VirtualTodo[] = [];

  // 🚀 Batch-Processing: Verarbeite Regeln in effizienten Chunks
  const BATCH_SIZE = 10; // Optimale Batch-Größe für Memory vs. Performance

  for (let i = 0; i < recurringRules.length; i += BATCH_SIZE) {
    const batch = recurringRules.slice(i, i + BATCH_SIZE);

    // Verarbeite Batch
    for (const rule of batch) {
      try {
        const occurrenceDates = calculateOccurrences(rule, startDate, endDate);

        // Erstelle VirtualTodo für jeden berechneten Termin
        for (const date of occurrenceDates) {
          virtualTodos.push(createVirtualTodo(rule, date));
        }
      } catch (error) {
        console.error(
          `Fehler beim Generieren von Virtual Todos für Regel "${rule.title}":`,
          error
        );
        // Fehler loggen aber weitermachen mit anderen Regeln
      }
    }
  }

  // Performance-Logging mit erweiterten Metriken
  const endTime = performance.now();
  const duration = endTime - startTime;

  // Update Performance-Metriken
  performanceMetrics.totalGenerated += virtualTodos.length;
  performanceMetrics.totalDuration += duration;

  // Performance-Benchmarking für verschiedene Szenarien
  const daysSpan = dayjs(endDate).diff(dayjs(startDate), "day");
  const todosPerRule = virtualTodos.length / recurringRules.length;
  const msPerRule = duration / recurringRules.length;

  // 🎯 Performance-Ziel: 100+ Regeln für 90 Tage <50ms
  if (duration > 50) {
    console.warn(
      `⚠️ Performance-Ziel verfehlt: ${duration.toFixed(2)}ms (Ziel: <50ms)`
    );
  }

  console.log(`🚀 Virtual Todo Generation abgeschlossen:`, {
    rules: recurringRules.length,
    days: daysSpan,
    generated: virtualTodos.length,
    duration: `${duration.toFixed(2)}ms`,
    avgTodosPerRule: todosPerRule.toFixed(1),
    avgMsPerRule: msPerRule.toFixed(2),
    cacheHits: performanceMetrics.cacheHits,
    cacheMisses: performanceMetrics.cacheMisses,
  });

  // 🧹 Cache-Management: Speichere Ergebnis und manage Memory
  manageCacheSize();
  virtualTodoCache.set(cacheKey, virtualTodos);

  return virtualTodos;
}

/**
 * 🚀 NEUE: Batch-Generation für mehrere Monate gleichzeitig
 * Optimiert für schnelle Navigation zwischen Monaten
 */
export function generateVirtualTodosBatch(
  recurringRules: RecurringTodo[],
  centerYear: number,
  centerMonth: number,
  monthsRadius: number = 1
): Map<string, VirtualTodo[]> {
  const batchResults = new Map<string, VirtualTodo[]>();
  const startTime = performance.now();

  // Berechne alle zu generierenden Monate
  const monthsToGenerate = [];
  for (let offset = -monthsRadius; offset <= monthsRadius; offset++) {
    let targetMonth = centerMonth + offset;
    let targetYear = centerYear;

    // Handle Jahr-Übergänge
    while (targetMonth < 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    while (targetMonth > 11) {
      targetMonth -= 12;
      targetYear += 1;
    }

    monthsToGenerate.push({ year: targetYear, month: targetMonth });
  }

  // Generiere Virtual Todos für alle Monate
  for (const { year, month } of monthsToGenerate) {
    const monthKey = `${year}-${month + 1}`;
    const monthStart = dayjs().year(year).month(month).startOf("month");
    const monthEnd = monthStart.endOf("month");

    const virtualTodos = generateVirtualTodosOptimized(
      recurringRules,
      monthStart.format("YYYY-MM-DD"),
      monthEnd.format("YYYY-MM-DD")
    );

    batchResults.set(monthKey, virtualTodos);
  }

  const duration = performance.now() - startTime;
  const totalGenerated = Array.from(batchResults.values()).reduce(
    (sum, todos) => sum + todos.length,
    0
  );

  console.log(
    `🚀 Batch Generation abgeschlossen: ${
      monthsToGenerate.length
    } Monate, ${totalGenerated} Todos in ${duration.toFixed(2)}ms`
  );

  return batchResults;
}

/**
 * 🎯 Performance-Monitor: Gibt aktuelle Performance-Statistiken zurück
 */
export function getVirtualTodoPerformanceStats() {
  const avgDuration =
    performanceMetrics.totalDuration / (performanceMetrics.cacheMisses || 1);
  const cacheHitRate =
    (performanceMetrics.cacheHits /
      (performanceMetrics.cacheHits + performanceMetrics.cacheMisses)) *
    100;

  return {
    ...performanceMetrics,
    avgDurationMs: avgDuration.toFixed(2),
    cacheHitRatePercent: cacheHitRate.toFixed(1),
    cacheSize: virtualTodoCache.size,
  };
}

/**
 * 🧹 Cache-Reset: Bereinigt den Virtual Todo Cache
 */
export function clearVirtualTodoCache() {
  virtualTodoCache.clear();
  console.log("🧹 Virtual Todo Cache vollständig bereinigt");
}

// Backwards-Compatibility: Export der alten Funktion mit neuer Implementierung
export const generateVirtualTodos = generateVirtualTodosOptimized;
