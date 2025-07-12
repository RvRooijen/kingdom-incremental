export type FactionMood = 'Hostile' | 'Unhappy' | 'Neutral' | 'Content' | 'Loyal';

export class Faction {
  constructor(
    private readonly _type: string,
    private readonly _name: string,
    private _approvalRating: number = 50,
    private _mood: FactionMood = 'Neutral',
  ) {}

  get type(): string {
    return this._type;
  }

  get name(): string {
    return this._name;
  }

  get approvalRating(): number {
    return this._approvalRating;
  }

  get mood(): FactionMood {
    return this._mood;
  }

  changeApproval(delta: number): void {
    this._approvalRating = Math.max(0, Math.min(100, this._approvalRating + delta));
    this.updateMood();
  }

  private updateMood(): void {
    if (this._approvalRating <= 20) {
      this._mood = 'Hostile';
    } else if (this._approvalRating <= 40) {
      this._mood = 'Unhappy';
    } else if (this._approvalRating <= 60) {
      this._mood = 'Neutral';
    } else if (this._approvalRating <= 80) {
      this._mood = 'Content';
    } else {
      this._mood = 'Loyal';
    }
  }
}