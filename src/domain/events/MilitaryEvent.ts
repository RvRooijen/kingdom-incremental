import { Event, EventType, EventChoice } from './Event';

export class MilitaryEvent extends Event {
  constructor(
    id: string,
    title: string,
    description: string,
    choices: EventChoice[],
    expiresAt?: Date
  ) {
    super(id, title, description, EventType.Military, choices, expiresAt);
  }
}