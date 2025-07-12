export interface DomainEvent {
  aggregateId: string;
  eventType: string;
  occurredAt: Date;
}