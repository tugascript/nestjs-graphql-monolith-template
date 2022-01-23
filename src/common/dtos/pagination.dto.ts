import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsBase64, IsInt, IsString, Max, Min } from 'class-validator';

@ArgsType()
export class PaginationDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsBase64()
  public after?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(50)
  public first = 10;
}
