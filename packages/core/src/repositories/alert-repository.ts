/**
 * @hephaitos/core - Alert Repository
 * L2 (Cells) - 알림 저장소
 */

import type { IResult, IAlert, ICreateAlertInput } from '@hephaitos/types';

export interface IAlertRepository {
  create(input: ICreateAlertInput): Promise<IResult<IAlert>>;
  getById(id: string): Promise<IResult<IAlert | null>>;
  getByUserId(userId: string, status?: string): Promise<IResult<IAlert[]>>;
  trigger(id: string): Promise<IResult<IAlert>>;
  cancel(id: string): Promise<IResult<IAlert>>;
  delete(id: string): Promise<IResult<boolean>>;
}

export class InMemoryAlertRepository implements IAlertRepository {
  private alerts: Map<string, IAlert> = new Map();

  async create(input: ICreateAlertInput): Promise<IResult<IAlert>> {
    const now = new Date().toISOString();
    const alert: IAlert = {
      id: crypto.randomUUID(),
      ...input,
      status: 'active',
      created_at: now,
      updated_at: now,
    };
    this.alerts.set(alert.id, alert);
    return { success: true, data: alert, metadata: { timestamp: now, duration_ms: 0 } };
  }

  async getById(id: string): Promise<IResult<IAlert | null>> {
    return { success: true, data: this.alerts.get(id) ?? null, metadata: { timestamp: new Date().toISOString(), duration_ms: 0 } };
  }

  async getByUserId(userId: string, status?: string): Promise<IResult<IAlert[]>> {
    let alerts = Array.from(this.alerts.values()).filter(a => a.user_id === userId);
    if (status) alerts = alerts.filter(a => a.status === status);
    return { success: true, data: alerts, metadata: { timestamp: new Date().toISOString(), duration_ms: 0 } };
  }

  async trigger(id: string): Promise<IResult<IAlert>> {
    const alert = this.alerts.get(id);
    if (!alert) return { success: false, error: new Error('Not found'), metadata: { timestamp: new Date().toISOString(), duration_ms: 0 } };
    const updated: IAlert = { ...alert, status: 'triggered', triggered_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this.alerts.set(id, updated);
    return { success: true, data: updated, metadata: { timestamp: new Date().toISOString(), duration_ms: 0 } };
  }

  async cancel(id: string): Promise<IResult<IAlert>> {
    const alert = this.alerts.get(id);
    if (!alert) return { success: false, error: new Error('Not found'), metadata: { timestamp: new Date().toISOString(), duration_ms: 0 } };
    const updated: IAlert = { ...alert, status: 'cancelled', updated_at: new Date().toISOString() };
    this.alerts.set(id, updated);
    return { success: true, data: updated, metadata: { timestamp: new Date().toISOString(), duration_ms: 0 } };
  }

  async delete(id: string): Promise<IResult<boolean>> {
    this.alerts.delete(id);
    return { success: true, data: true, metadata: { timestamp: new Date().toISOString(), duration_ms: 0 } };
  }
}

export function createAlertRepository(): IAlertRepository {
  return new InMemoryAlertRepository();
}
