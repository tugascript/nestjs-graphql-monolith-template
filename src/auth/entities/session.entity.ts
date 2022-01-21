import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuidV4 } from 'uuid';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ tableName: 'auth_sessions' })
export class SessionEntity {
  @PrimaryKey({ type: 'uuid' })
  public id: string = uuidV4();

  @ManyToOne(() => UserEntity)
  public user: UserEntity;

  @Property({ onCreate: () => new Date() })
  public createdAt: Date = new Date();
}
