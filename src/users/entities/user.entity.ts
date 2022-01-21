import { Entity, Enum, Property } from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';
import { LocalBaseEntity } from '../../common/entities/base.entity';
import { OnlineStatusEnum } from '../enums/online-status.enum';

@ObjectType('User')
@Entity({ tableName: 'users' })
export class UserEntity extends LocalBaseEntity {
  @Field(() => String)
  @Property({ columnType: 'varchar(100)' })
  @IsString()
  @Length(3, 100, {
    message: 'Name has to be between 3 and 50 characters.',
  })
  @Matches(/(^[\p{L}0-9'.\s]*$)/u, {
    message: 'Name can only contain letters, dots, numbers and spaces.',
  })
  public name!: string;

  @Field(() => String)
  @Property({ columnType: 'varchar(120)', unique: true })
  @IsString()
  @Length(6, 110, {
    message: 'Last name has to be between 3 and 50 characters.',
  })
  @Matches(/(^[A-Za-z0-9.']*$)/u)
  public username!: string;

  @Field(() => String)
  @Property({ columnType: 'varchar(255)', unique: true })
  @IsEmail()
  public email!: string;

  @Field(() => String, { nullable: true })
  @Property({ columnType: 'varchar(255)', nullable: true })
  @IsOptional()
  @IsUrl()
  public picture?: string;

  @Field(() => OnlineStatusEnum)
  @Enum({ type: () => OnlineStatusEnum, default: OnlineStatusEnum.OFFLINE })
  @IsEnum(OnlineStatusEnum)
  public onlineState: OnlineStatusEnum = OnlineStatusEnum.OFFLINE;

  @Property()
  @IsString()
  public password!: string;

  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  @Property({ default: false })
  @IsBoolean()
  public confirmed: boolean = false;

  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  @Property({ default: false })
  @IsBoolean()
  public suspended: boolean = false;

  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  @Property({ default: false })
  @IsBoolean()
  public twoFactor: boolean = false;

  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  @Property({
    columnType: 'int',
    default: 0,
  })
  @IsInt()
  public count: number = 0;

  @Field(() => String)
  @Property()
  @IsDate()
  public lastLogin: Date = new Date();

  @Field(() => String)
  @Property()
  @IsDate()
  public lastOnline: Date = new Date();
}
