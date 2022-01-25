import { ArgsType, Field } from '@nestjs/graphql';
import { IsString, Matches } from 'class-validator';
import { POINT_SLUG_REGEX } from '../../common/constants/regex';

@ArgsType()
export abstract class GetUserDto {
  @Field(() => String)
  @IsString()
  @Matches(POINT_SLUG_REGEX, {
    message: 'Username must be valid',
  })
  public username!: string;
}
