import { Dictionary } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import slugify from 'slugify';
import { v4 as uuidV4 } from 'uuid';
import { IEdge, IPaginated } from './interfaces/paginated.interface';

@Injectable()
export class CommonService {
  //-------------------- Cursor Pagination --------------------
  private readonly buff = Buffer;

  /**
   * Paginate
   *
   * Takes an entity array and returns the paginated type of that entity array
   * It uses cursor pagination as recomended in https://graphql.org/learn/pagination/
   */
  public paginate<T>(
    instances: T[],
    totalCount: number,
    cursor: keyof T,
    first: number,
    innerCursor?: string,
  ): IPaginated<T> {
    const pages: IPaginated<T> = {
      totalCount,
      edges: [],
      pageInfo: {
        endCursor: '',
        hasNextPage: false,
      },
    };

    const len = instances.length;
    if (len > 0) {
      for (let i = 0; i < len; i++) {
        pages.edges.push(this.createEdge(instances[i], cursor, innerCursor));
      }
      pages.pageInfo.endCursor = pages.edges[pages.edges.length - 1].cursor;
      pages.pageInfo.hasNextPage = totalCount > first;
    }

    return pages;
  }

  /**
   * Create Edge
   *
   * Takes an instance, the cursor key and a innerCursor,
   * and generates a GraphQL edge
   */
  private createEdge<T>(
    instance: T,
    cursor: keyof T,
    innerCursor?: string,
  ): IEdge<T> {
    try {
      return {
        node: instance,
        cursor: this.encodeCursor(
          innerCursor ? instance[cursor][innerCursor] : instance[cursor],
        ),
      };
    } catch (_) {
      throw new InternalServerErrorException('The given cursor is invalid');
    }
  }

  /**
   * Encode Cursor
   *
   * Takes a date, string or number and returns the base 64
   * representation of it
   */
  private encodeCursor(val: Date | string | number): string {
    let str: string;

    if (val instanceof Date) {
      str = val.getTime().toString();
    } else if (typeof val === 'number' || typeof val === 'bigint') {
      str = val.toString();
    } else {
      str = val;
    }

    return this.buff.from(str, 'utf-8').toString('base64');
  }

  /**
   * Decode Cursor
   *
   * Takes a base64 cursor and returns the string or number value
   */
  public decodeCursor(cursor: string, isNum = false): string | number {
    const str = this.buff.from(cursor, 'base64').toString('utf-8');

    if (isNum) {
      const num = parseInt(str, 10);

      if (isNaN(num))
        throw new BadRequestException(
          'Cursor does not reference a valid number',
        );

      return num;
    }

    return str;
  }

  //-------------------- String Formating --------------------

  /**
   * Format Title
   *
   * Takes a string trims it and capitalizes every word
   */
  public formatTitle(title: string): string {
    return title
      .trim()
      .replace(/\s\s+/g, ' ')
      .replace(/\w\S*/g, (w) => w.replace(/^\w/, (l) => l.toUpperCase()));
  }

  /**
   * Generate Point Slug
   *
   * Takes a string and generates a slug with dots as word separators
   */
  public generatePointSlug(str: string): string {
    return slugify(str, { lower: true, replacement: '.' });
  }

  /**
   * Generate Slug
   *
   * Takes a string and generates a slug with a unique identifier at the end
   */
  public generateSlug(str: string): string {
    return slugify(`${str} ${uuidV4().substring(0, 6)}`, { lower: true });
  }

  //-------------------- Field Validation --------------------

  /**
   * Validates Point Slug
   *
   * Validates if input is a valid slug seperated by dots
   */
  public validatePointSlug(slug: string): void {
    const regex = /^[a-z0-9]+(?:\.[a-z0-9]+)*$/;

    if (!regex.test(slug))
      throw new BadRequestException('Please use a valid point slug');
  }

  /**
   * Validate JWT
   *
   * Validates if input is a valid Json Web Token
   */
  public validateJWT(token: string): void {
    const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

    if (!jwtRegex.test(token))
      throw new BadRequestException('Please use a valid token');
  }

  /**
   * Validate Email
   *
   * Validates if an email is valid
   */
  public validateEmail(email: string): void {
    const mailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    if (!mailRegex.test(email))
      throw new BadRequestException('Please use a valid email');
  }

  //-------------------- Entity Validations --------------------

  /**
   * Check Existence
   *
   * Checks if a findOne query did't return null or undefined
   */
  public checkExistence<T>(name: string, entity?: T | null): void {
    if (!entity) throw new NotFoundException(`${name} not found`);
  }

  /**
   * Validate Entity
   *
   * Validates an entity with the class-validator library
   */
  public async validateEntity(entity: Dictionary<any>): Promise<void> {
    const errors = await validate(entity);

    if (errors.length > 0)
      throw new BadRequestException('Entity validation failed');
  }

  /**
   * Save Entity To Data Base
   *
   * Persists a entity or multiple entities into the db
   */
  public async saveEntityToDataBase<T>(
    repository: EntityRepository<T>,
    entity: T | T[],
    flush = true,
  ): Promise<void> {
    if (flush) {
      try {
        await repository.persistAndFlush(entity);
        return;
      } catch (error) {
        throw new InternalServerErrorException(error.message);
      }
    }

    repository.persist(entity);
  }

  /**
   * Throw Duplicate Error
   *
   * Checks is an error is of the code 23505, PostgreSQL's duplicate value error,
   * and throws a conflic exception
   */
  public throwDuplicateError(error: Record<string, any>, message?: string) {
    if (error.code === '23505')
      throw new ConflictException(message ?? 'Duplicated value in database');
    throw new BadRequestException(error.message);
  }
}
