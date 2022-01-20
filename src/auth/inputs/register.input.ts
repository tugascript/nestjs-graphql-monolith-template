import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

@InputType('RegisterInput')
export abstract class RegisterInput {
  @Field(() => String)
  @IsString()
  @Length(3, 100, {
    message: 'Name has to be between 3 and 50 characters.',
  })
  @Matches(/(^[\p{L}0-9'.\s]*$)/u, {
    message: 'Name can only contain letters, dots, numbers and spaces.',
  })
  public name!: string;

  @Field(() => String)
  @IsEmail()
  public email!: string;

  @Field(() => String)
  @IsString()
  @Length(8, 35)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password requires a lowercase letter, an uppercase letter, and a number or symbol',
  })
  public password1!: string;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  public password2!: string;
}
