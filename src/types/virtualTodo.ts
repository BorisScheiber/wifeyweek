import type { Todo, RecurringTodo } from "../services/todoService";

/**
 * VirtualTodo: Clientseitig generierte Todos basierend auf RecurringTodo-Regeln
 * Diese werden nicht in der DB gespeichert, sondern nur bei Interaktion materialisiert
 */
export interface VirtualTodo extends Omit<Todo, "id" | "created_at"> {
  /** Virtual ID im Format: virtual_${recurringId}_${date} */
  id: string;

  /** Flag zur Identifikation von virtuellen Todos */
  is_virtual: true;

  /** Referenz auf die originale RecurringTodo-Regel */
  recurring_id: string;

  /** Original-Titel aus der RecurringTodo-Regel */
  original_title: string;

  /** Datum für das dieses virtuelle Todo generiert wurde */
  date: string;

  /** Zeit wird von der RecurringTodo-Regel übernommen */
  time?: string;

  /** Virtuelle Todos sind standardmäßig nicht erledigt */
  is_done: false;
}

/**
 * Union Type für echte und virtuelle Todos
 * Ermöglicht einheitliche Behandlung in der UI
 */
export type SmartTodo = Todo | VirtualTodo;

/**
 * Type Guard: Prüft ob ein SmartTodo ein VirtualTodo ist
 */
export function isVirtualTodo(todo: SmartTodo): todo is VirtualTodo {
  return "is_virtual" in todo && todo.is_virtual === true;
}

/**
 * Type Guard: Prüft ob ein SmartTodo ein echtes Todo ist
 */
export function isRealTodo(todo: SmartTodo): todo is Todo {
  return !("is_virtual" in todo);
}

/**
 * Generiert eine Virtual Todo ID im Format: virtual_${recurringId}_${date}
 * @param recurringId Die ID der RecurringTodo-Regel
 * @param date Das Datum im Format YYYY-MM-DD
 * @returns Virtual Todo ID
 */
export function generateVirtualTodoId(
  recurringId: string,
  date: string
): string {
  return `virtual_${recurringId}_${date}`;
}

/**
 * Extrahiert RecurringTodo ID und Datum aus einer Virtual Todo ID
 * @param virtualId Virtual Todo ID im Format virtual_${recurringId}_${date}
 * @returns Object mit recurringId und date, oder null bei ungültiger ID
 */
export function parseVirtualTodoId(
  virtualId: string
): { recurringId: string; date: string } | null {
  const match = virtualId.match(/^virtual_(.+)_(\d{4}-\d{2}-\d{2})$/);
  if (!match) return null;

  return {
    recurringId: match[1],
    date: match[2],
  };
}

/**
 * Hilfsfunktion: Erstellt ein VirtualTodo aus RecurringTodo und Datum
 * @param recurringTodo Die RecurringTodo-Regel
 * @param date Datum für das virtuelle Todo
 * @returns VirtualTodo instance
 */
export function createVirtualTodo(
  recurringTodo: RecurringTodo,
  date: string
): VirtualTodo {
  return {
    id: generateVirtualTodoId(recurringTodo.id, date),
    is_virtual: true,
    title: recurringTodo.title,
    original_title: recurringTodo.title,
    date: date,
    time: recurringTodo.time || undefined,
    is_done: false,
    recurring_id: recurringTodo.id,
  };
}
