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
import { NAME_REGEX, POINT_SLUG_REGEX } from '../../common/constants/regex';
import { LocalBaseEntity } from '../../common/entities/base.entity';
import { OnlineStatusEnum } from '../enums/online-status.enum';
import { ownerMiddleware } from '../middleware/owner.middleware';

@ObjectType('User')
@Entity({ tableName: 'users' })
export class UserEntity extends LocalBaseEntity {
  @Field(() => String)
  @Property({ columnType: 'varchar(100)' })
  @IsString()
  @Length(3, 100, {
    message: 'Name has to be between 3 and 50 characters.',
  })
  @Matches(NAME_REGEX, {
    message: 'Name can only contain letters, dots, numbers and spaces.',
  })
  public name!: string;

  @Field(() => String)
  @Property({ columnType: 'varchar(120)', unique: true })
  @IsString()
  @Length(6, 110)
  @Matches(POINT_SLUG_REGEX)
  public username!: string;

  @Field(() => String, { nullable: true, middleware: [ownerMiddleware] })
  @Property({ columnType: 'varchar(255)', unique: true })
  @IsEmail()
  public email!: string;

  @Field(() => String, { nullable: true })
  @Property({ columnType: 'varchar(255)', nullable: true })
  @IsOptional()
  @IsUrl()
  public picture?: string;

  @Property()
  @IsString()
  public password!: string;

  @Enum({
    items: () => OnlineStatusEnum,
    default: OnlineStatusEnum.ONLINE,
    columnType: 'varchar(14)',
  })
  @IsEnum(OnlineStatusEnum)
  public defaultStatus: OnlineStatusEnum = OnlineStatusEnum.ONLINE;

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
