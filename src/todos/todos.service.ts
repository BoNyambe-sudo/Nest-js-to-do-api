import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Todo, Priority as PrismaPriority } from '@prisma/client';
import {
  CreateTodoDto,
  UpdateTodoDto,
  TodoQueryDto,
  Priority,
} from './dto/todo.dto.js';

export interface PaginatedTodos {
  data: Todo[];
  nextCursor: string | null;
  total: number;
}

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: TodoQueryDto, userId?: string): Promise<PaginatedTodos> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const where: Prisma.TodoWhereInput = {};

    if (query.completed !== undefined) {
      where.completed = query.completed;
    }
    if (query.priority) {
      where.priority = query.priority as PrismaPriority;
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

    const [data, total] = await this.prisma.$transaction([
      this.prisma.todo.findMany({
        where,
        take: limit + 1,
        ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.todo.count({ where }),
    ]);

    let nextCursor: string | null = null;
    if (data.length > limit) {
      nextCursor = data[limit - 1].id;
      data.length = limit;
    }

    return { data, nextCursor, total };
  }

  async findById(id: string): Promise<Todo> {
    const todo = await this.prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    return todo;
  }

  async create(ownerId: string | null, dto: CreateTodoDto): Promise<Todo> {
    return this.prisma.todo.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate,
        priority: (dto.priority ?? Priority.MEDIUM) as PrismaPriority,
        ownerId,
      },
    });
  }

  async update(id: string, dto: UpdateTodoDto): Promise<Todo> {
    const existing = await this.prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    return this.prisma.todo.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate,
        priority: dto.priority as PrismaPriority,
        completed: dto.completed,
      },
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    await this.prisma.todo.delete({ where: { id } });
  }
}
