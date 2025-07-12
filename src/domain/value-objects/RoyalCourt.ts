import { Ruler } from '../entities/Ruler';

export class RoyalCourt {
  private readonly _king: Ruler;
  private readonly _queen: Ruler;
  private readonly _advisors: Map<string, unknown>;

  constructor() {
    this._king = new Ruler('King', 'The King');
    this._queen = new Ruler('Queen', 'The Queen');
    this._advisors = new Map();
  }

  get king(): Ruler {
    return this._king;
  }

  get queen(): Ruler {
    return this._queen;
  }

  get advisors(): Map<string, unknown> {
    return new Map(this._advisors);
  }
}