import { Injectable, OnDestroy } from '@angular/core';
import { SyncMessage } from '../models/game.models';

/**
 * Transporte entre vistas sobre BroadcastChannel (mismo origen y navegador).
 * Su API pública (`send` / `listen`) es el punto de sustitución por un
 * cliente WebSocket hacia FastAPI sin tocar GameService.
 */
@Injectable({ providedIn: 'root' })
export class SyncService implements OnDestroy {
  private static readonly CHANNEL_NAME = 'politecnicos-dijeron';

  private readonly channel: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(SyncService.CHANNEL_NAME)
      : null;

  /** El emisor no recibe sus propios mensajes (semántica de BroadcastChannel). */
  send(message: SyncMessage): void {
    this.channel?.postMessage(message);
  }

  /** Registra un handler y devuelve la función para cancelar la suscripción. */
  listen(handler: (message: SyncMessage) => void): () => void {
    const listener = (e: MessageEvent<SyncMessage>) => handler(e.data);
    this.channel?.addEventListener('message', listener);
    return () => this.channel?.removeEventListener('message', listener);
  }

  ngOnDestroy(): void {
    this.channel?.close();
  }
}