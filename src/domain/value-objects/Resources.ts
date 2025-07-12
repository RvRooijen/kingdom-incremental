export class Resources {
  constructor(
    private readonly _gold: number = 100,
    private readonly _influence: number = 10,
    private readonly _loyalty: number = 50,
    private readonly _population: number = 1000,
    private readonly _militaryPower: number = 10,
  ) {}

  get gold(): number {
    return this._gold;
  }

  get influence(): number {
    return this._influence;
  }

  get loyalty(): number {
    return this._loyalty;
  }

  get population(): number {
    return this._population;
  }

  get militaryPower(): number {
    return this._militaryPower;
  }

  add(other: Resources): Resources {
    return new Resources(
      this._gold + other.gold,
      this._influence + other.influence,
      this._loyalty + other.loyalty,
      this._population + other.population,
      this._militaryPower + other.militaryPower,
    );
  }

  subtract(other: Resources): Resources {
    return new Resources(
      Math.max(0, this._gold - other.gold),
      Math.max(0, this._influence - other.influence),
      Math.max(0, this._loyalty - other.loyalty),
      Math.max(0, this._population - other.population),
      Math.max(0, this._militaryPower - other.militaryPower),
    );
  }
}