import { Event, EventType, EventChoice } from './Event';

export class SocialEvent extends Event {
  constructor(
    id: string,
    title: string,
    description: string,
    choices: EventChoice[],
    expiresAt?: Date
  ) {
    super(id, title, description, EventType.Social, choices, expiresAt);
  }
}