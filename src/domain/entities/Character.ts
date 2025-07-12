import { CharacterType } from '../value-objects/CharacterType';

export class Character {
  constructor(
    public readonly type: CharacterType,
    public readonly name: string,
  ) {}
}