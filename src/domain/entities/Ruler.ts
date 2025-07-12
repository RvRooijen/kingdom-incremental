export class Ruler {
  constructor(
    private readonly _title: string,
    private readonly _name: string,
  ) {}

  get title(): string {
    return this._title;
  }

  get name(): string {
    return this._name;
  }
}