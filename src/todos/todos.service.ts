import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateTodoDto,
  UpdateTodoDto,
  TodoQueryDto,
  Priority,
} from './dto/todo.dto.js';

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: Date | null;
  priority: Priority;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedTodos {
  data: Todo[];
  nextCursor: string | null;
  total: number;
}

function toTodo(row: {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}): Todo {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed,
    dueDate: row.dueDate ? new Date(row.dueDate) : null,
    priority: row.priority as Priority,
    ownerId: row.ownerId,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
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
      queryBuilder = queryBuilder.where((t) => t.id.gt(query.cursor!));
    }
    
    queryBuilder = queryBuilder
      .orderBy((t) => t.createdAt.desc())
      .limit(limit + 1);

    const rows = await queryBuilder.all();
    const data = rows.map(toTodo);
    
    const totalResult = await this.prisma.client.orm.public.Todo
      .where(where)
      .aggregate((a) => ({ total: a.count() }));
    const total = Number(totalResult.total);

    let nextCursor: string | null = null;
    if (data.length > limit) {
      nextCursor = data[limit - 1].id;
      data.length = limit;
    }

    return { data, nextCursor, total };
  }

  async findById(id: string): Promise<Todo> {
    const row = await this.prisma.client.orm.public.Todo.where({ id }).first();
    if (!row) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    return toTodo(row);
  }

  async create(ownerId: string | null, dto: CreateTodoDto): Promise<Todo> {
    const row = await this.prisma.client.orm.public.Todo.create({
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate ? dto.dueDate.toISOString() : null,
      priority: (dto.priority ?? Priority.MEDIUM) as Priority,
      ownerId,
    });
    return toTodo(row);
  }

  async update(id: string, dto: UpdateTodoDto): Promise<Todo> {
    const existing = await this.prisma.client.orm.public.Todo.where({ id }).first();
    if (!existing) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    const row = await this.prisma.client.orm.public.Todo
      .where({ id })
      .update({
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? dto.dueDate.toISOString() : null,
        priority: dto.priority as Priority,
        completed: dto.completed,
      });
    if (!row) {
      throw new NotFoundException(`Todo with id ${id} not found after update`);
    }
    return toTodo(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.client.orm.public.Todo.where({ id }).first();
    if (!existing) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    await this.prisma.client.orm.public.Todo.where({ id }).delete();
  }
}