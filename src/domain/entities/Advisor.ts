import { AdvisorType } from '../value-objects/AdvisorType';

export class Advisor {
  constructor(
    public readonly type: AdvisorType,
    public readonly name: string,
  ) {}
}