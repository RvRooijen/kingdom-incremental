import { Event, EventType, EventChoice } from './Event';

export class DiplomaticEvent extends Event {
  constructor(
    id: string,
    title: string,
    description: string,
    choices: EventChoice[],
    expiresAt?: Date
  ) {
    super(id, title, description, EventType.Diplomatic, choices, expiresAt);
  }
}