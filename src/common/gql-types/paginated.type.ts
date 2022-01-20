import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('PageInfo')
abstract class PageInfoType {
  @Field(() => String)
  public endCursor: string;

  @Field(() => Boolean)
  public hasNextPage: boolean;
}

// NOTE: Remember that it has to be an edge type class
export function Paginated<T>(classRef: Type<T>): any {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => Int)
    public totalCount: number;

    @Field(() => [classRef])
    public edges: T[];

    @Field(() => PageInfoType)
    public pageInfo: PageInfoType;
  }
  return PaginatedType;
}
