import { Kingdom } from '../../domain/entities/Kingdom';

export interface IKingdomRepository {
  findById(id: string): Promise<Kingdom | null>;
  save(kingdom: Kingdom): Promise<void>;
  exists(id: string): Promise<boolean>;
  findByName(name: string): Promise<Kingdom | null>;
}