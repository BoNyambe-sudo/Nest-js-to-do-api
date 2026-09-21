import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateTodoDto,
  UpdateTodoDto,
  TodoQueryDto,
  Priority,
} from './dto/todo.dto.js';

export interface PaginatedTodos {
  data: Array<{
    id: string;
    title: string;
    description: string | null;
    completed: boolean;
    dueDate: Date | null;
    priority: Priority;
    ownerId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  nextCursor: string | null;
  total: number;
}

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: TodoQueryDto, userId?: string): Promise<PaginatedTodos> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const where: Record<string, unknown> = {};

    if (query.completed !== undefined) {
      where.completed = query.completed;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.ownerId) {
      where.ownerId = query.ownerId;
    } else if (userId && !query.ownerId) {
      where.ownerId = userId;
    }
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    let queryBuilder = this.prisma.client.orm.public.Todo.where(where);
    
    if (query.cursor) {
      queryBuilder = queryBuilder.where({ id: { gt: query.cursor } });
    }
    
    queryBuilder = queryBuilder
      .orderBy({ createdAt: 'desc' })
      .limit(limit + 1);

    const data = await queryBuilder.all();
    
    const total = await this.prisma.client.orm.public.Todo
      .where(where)
      .count();

    let nextCursor: string | null = null;
    if (data.length > limit) {
      nextCursor = data[limit - 1].id;
      data.length = limit;
    }

    return { data, nextCursor, total };
  }

  async findById(id: string): Promise<{
    id: string;
    title: string;
    description: string | null;
    completed: boolean;
    dueDate: Date | null;
    priority: Priority;
    ownerId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const todo = await this.prisma.client.orm.public.Todo.where({ id }).first();
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    return todo;
  }

  async create(ownerId: string | null, dto: CreateTodoDto): Promise<{
    id: string;
    title: string;
    description: string | null;
    completed: boolean;
    dueDate: Date | null;
    priority: Priority;
    ownerId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    return this.prisma.client.orm.public.Todo.create({
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate,
      priority: (dto.priority ?? Priority.MEDIUM) as Priority,
      ownerId,
    });
  }

  async update(id: string, dto: UpdateTodoDto): Promise<{
    id: string;
    title: string;
    description: string | null;
    completed: boolean;
    dueDate: Date | null;
    priority: Priority;
    ownerId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const existing = await this.prisma.client.orm.public.Todo.where({ id }).first();
    if (!existing) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    return this.prisma.client.orm.public.Todo
      .where({ id })
      .update({
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate,
        priority: dto.priority as Priority,
        completed: dto.completed,
      });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.client.orm.public.Todo.where({ id }).first();
    if (!existing) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    await this.prisma.client.orm.public.Todo.where({ id }).delete();
  }
}