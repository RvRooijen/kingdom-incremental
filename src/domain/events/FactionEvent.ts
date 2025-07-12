import { DomainEvent } from './DomainEvent';

export interface FactionEvent extends DomainEvent {
  faction: string;
  change?: number;
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
  description?: string;
}

export class FactionApprovalChangedEvent implements FactionEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly faction: string,
    public readonly change: number,
    public readonly occurredAt: Date = new Date()
  ) {}

  get eventType(): string {
    return 'FactionApprovalChanged';
  }
}

export class FactionRebellionEvent implements FactionEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly faction: string,
    public readonly severity: 'critical' = 'critical',
    public readonly description: string,
    public readonly occurredAt: Date = new Date()
  ) {}

  get eventType(): string {
    return 'FactionRebellion';
  }
}

export class FactionUnrestEvent implements FactionEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly faction: string,
    public readonly severity: 'severe' = 'severe',
    public readonly description: string,
    public readonly occurredAt: Date = new Date()
  ) {}

  get eventType(): string {
    return 'FactionUnrest';
  }
}