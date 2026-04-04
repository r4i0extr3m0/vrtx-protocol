import { apiClient } from "@/src/api/ApiClient";
import { storage } from "@/src/infra/mmkv";
import { isInternetReachable, subscribeToNetworkState } from "@/src/infra/network";
import type { SyncQueueOperation } from "@/src/types";

const QUEUE_KEY = "vrtxprotocol.sync.queue";
const LAST_SYNC_KEY = "vrtxprotocol.sync.last_timestamp";
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

type QueueListener = (queue: SyncQueueOperation[]) => void;
type SyncEntityPayload = object & { id?: string; updatedAt?: string };

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(retries: number): number {
  return BASE_DELAY_MS * Math.pow(2, Math.min(retries, 4));
}

/**
 * Sincronização Delta: Filtra apenas os campos que mudaram ou garante que estamos
 * enviando apenas o estado mais recente de uma entidade para evitar tráfego desnecessário.
 */
function deduplicateQueue(queue: SyncQueueOperation[]): SyncQueueOperation[] {
  const seen = new Map<string, number>(); 
  const result: SyncQueueOperation[] = [];

  for (const op of queue) {
    const payload = op.data as SyncEntityPayload;
    const entityId = typeof payload.id === "string" ? payload.id : op.id;
    const key = `${op.entity}:${op.table}:${entityId}`;

    // Se já existe uma operação para esta entidade na fila
    if (seen.has(key)) {
      const idx = seen.get(key)!;
      const existingOp = result[idx];

      // Se a nova operação for um DELETE, ela sobrescreve qualquer CREATE/UPDATE anterior
      if (op.type === "delete") {
        result[idx] = op;
      } 
      // Se a operação existente for um CREATE, mantemos como CREATE mas atualizamos os dados
      else if (existingOp.type === "create" && op.type === "update") {
        result[idx] = {
          ...existingOp,
          data: { ...(existingOp.data as object), ...(op.data as object) },
          timestamp: op.timestamp,
        };
      }
      // Se ambas forem UPDATE, mesclamos os dados (Delta Merge)
      else if (existingOp.type === "update" && op.type === "update") {
        result[idx] = {
          ...existingOp,
          data: { ...(existingOp.data as object), ...(op.data as object) },
          timestamp: op.timestamp,
        };
      } else {
        // Caso contrário (ex: CREATE após DELETE), apenas adicionamos como nova
        seen.set(key, result.length);
        result.push(op);
      }
    } else {
      seen.set(key, result.length);
      result.push(op);
    }
  }

  return result;
}

export class SyncQueueService {
  private queue: SyncQueueOperation[] = [];
  private listeners = new Set<QueueListener>();
  private isProcessing = false;
  private unsubscribeNetwork?: () => void;

  constructor() {
    this.loadQueue();
    this.unsubscribeNetwork = subscribeToNetworkState((reachable) => {
      if (reachable) {
        void this.processQueue();
      }
    });
  }

  dispose(): void {
    this.unsubscribeNetwork?.();
  }

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener(this.queue);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getQueue(): SyncQueueOperation[] {
    return [...this.queue];
  }

  replaceQueue(nextQueue: SyncQueueOperation[]): void {
    this.queue = deduplicateQueue([...nextQueue]);
    this.saveQueue();
  }

  enqueue(operation: SyncQueueOperation): void {
    this.queue.push(operation);
    this.queue = deduplicateQueue(this.queue);
    this.saveQueue();
    void this.processQueue();
  }

  private loadQueue(): void {
    const raw = storage.getString(QUEUE_KEY);
    if (!raw) {
      this.queue = [];
      return;
    }
    try {
      this.queue = JSON.parse(raw) as SyncQueueOperation[];
    } catch (error) {
      console.error("[SyncQueueService.loadQueue]", error);
      this.queue = [];
    }
  }

  private saveQueue(): void {
    storage.set(QUEUE_KEY, JSON.stringify(this.queue));
    this.listeners.forEach((listener) => listener(this.getQueue()));
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    const reachable = await isInternetReachable();
    if (!reachable) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const current = this.queue[0];
        const success = await this.executeOperation(current);

        if (!success) {
          current.retries += 1;
          if (current.retries >= MAX_RETRIES) {
            current.lastError = `Max retries (${MAX_RETRIES}) reached`;
            this.queue.shift();
          } else {
            this.queue.push(this.queue.shift() as SyncQueueOperation);
            this.saveQueue();
            await wait(backoffDelay(current.retries));
          }
          this.saveQueue();
          continue;
        }

        this.queue.shift();
        this.saveQueue();
        
        // Atualiza o timestamp da última sincronização bem-sucedida
        storage.set(LAST_SYNC_KEY, new Date().toISOString());
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeOperation(operation: SyncQueueOperation): Promise<boolean> {
    try {
      const payload = operation.data as SyncEntityPayload;

      if (operation.entity === "food_recognition") {
        // Mock para IA de alimentos
        return true;
      }

      if (operation.type === "create") {
        const result = await apiClient.insertOne(
          operation.table,
          payload as Record<string, unknown>,
        );
        return result.error === null;
      }

      const entityId = typeof payload.id === "string" ? payload.id : operation.id;

      if (operation.type === "update") {
        const result = await apiClient.updateOne(
          operation.table,
          entityId,
          payload as Partial<Record<string, unknown>>,
        );
        return result.error === null;
      }

      if (operation.type === "delete") {
        const result = await apiClient.deleteOne(operation.table, entityId);
        return result.error === null;
      }

      return false;
    } catch (error) {
      console.error("[SyncQueueService.executeOperation]", error);
      return false;
    }
  }
}

let syncQueueServiceInstance: SyncQueueService | null = null;

export function getSyncQueueService(): SyncQueueService {
  if (!syncQueueServiceInstance) {
    syncQueueServiceInstance = new SyncQueueService();
  }
  return syncQueueServiceInstance;
}
