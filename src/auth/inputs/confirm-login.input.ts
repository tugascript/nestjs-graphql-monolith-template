import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNumberString, Length } from 'class-validator';

@InputType('ConfirmLoginInput')
export abstract class ConfirmLoginInput {
  @Field(() => String)
  @IsEmail()
  public email: string;

  @Field(() => String)
  @IsNumberString()
  @Length(6)
  public accessCode: string;
}
