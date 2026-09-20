import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { TodosService, PaginatedTodos } from './todos.service.js';
import {
  CreateTodoDto,
  UpdateTodoDto,
  TodoQueryDto,
  Priority,
} from './dto/todo.dto.js';
import { Todo, Priority as PrismaPriority } from '@prisma/client';

const mockPrismaService = {
  todo: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
};

describe('TodosService', () => {
  let service: TodosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TodosService>(TodosService);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated todos', async () => {
      const todos: Todo[] = [
        {
          id: '1',
          title: 'Todo 1',
          description: null,
          completed: false,
          dueDate: null,
          priority: PrismaPriority.MEDIUM,
          ownerId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrismaService.$transaction.mockResolvedValue([todos, 1]);

      const result: PaginatedTodos = await service.findAll({}, undefined);
      expect(result.data).toEqual(todos);
      expect(result.total).toBe(1);
      expect(result.nextCursor).toBeNull();
    });

    it('should return nextCursor when more results exist', async () => {
      const todos: Todo[] = [
        {
          id: '1',
          title: 'Todo 1',
          description: null,
          completed: false,
          dueDate: null,
          priority: PrismaPriority.MEDIUM,
          ownerId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Todo 2',
          description: null,
          completed: false,
          dueDate: null,
          priority: PrismaPriority.MEDIUM,
          ownerId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrismaService.$transaction.mockResolvedValue([todos, 3]);

      const result: PaginatedTodos = await service.findAll(
        { limit: 1 },
        undefined,
      );
      expect(result.data.length).toBe(1);
      expect(result.nextCursor).toBe('1');
    });

    it('should filter by completed', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);
      await service.findAll({ completed: true }, undefined);
      expect(mockPrismaService.todo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ completed: true }),
        }),
      );
    });

    it('should filter by userId when authenticated', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);
      await service.findAll({}, 'user-1');
      expect(mockPrismaService.todo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: 'user-1' }),
        }),
      );
    });

    it('should search by q', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);
      await service.findAll({ q: 'search' }, undefined);
      expect(mockPrismaService.todo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'search', mode: 'insensitive' } },
              { description: { contains: 'search', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return todo if found', async () => {
      const todo: Todo = {
        id: '1',
        title: 'Todo 1',
        description: null,
        completed: false,
        dueDate: null,
        priority: PrismaPriority.MEDIUM,
        ownerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.todo.findUnique.mockResolvedValue(todo);
      const result = await service.findById('1');
      expect(result).toEqual(todo);
    });

    it('should throw if not found', async () => {
      mockPrismaService.todo.findUnique.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a todo', async () => {
      const dto: CreateTodoDto = {
        title: 'New Todo',
        description: 'Description',
        priority: Priority.HIGH,
      };
      const todo: Todo = {
        id: '1',
        title: 'New Todo',
        description: 'Description',
        completed: false,
        dueDate: null,
        priority: PrismaPriority.HIGH,
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.todo.create.mockResolvedValue(todo);
      const result = await service.create('user-1', dto);
      expect(result).toEqual(todo);
      expect(mockPrismaService.todo.create).toHaveBeenCalledWith({
        data: {
          title: 'New Todo',
          description: 'Description',
          dueDate: undefined,
          priority: PrismaPriority.HIGH,
          ownerId: 'user-1',
        },
      });
    });
  });

  describe('update', () => {
    it('should update a todo', async () => {
      const existing: Todo = {
        id: '1',
        title: 'Old',
        description: null,
        completed: false,
        dueDate: null,
        priority: PrismaPriority.MEDIUM,
        ownerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated: Todo = {
        ...existing,
        title: 'New',
        completed: true,
      };
      mockPrismaService.todo.findUnique.mockResolvedValue(existing);
      mockPrismaService.todo.update.mockResolvedValue(updated);
      const result = await service.update('1', {
        title: 'New',
        completed: true,
      } as UpdateTodoDto);
      expect(result).toEqual(updated);
    });

    it('should throw if todo not found', async () => {
      mockPrismaService.todo.findUnique.mockResolvedValue(null);
      await expect(
        service.update('nonexistent', {} as UpdateTodoDto),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a todo', async () => {
      const existing: Todo = {
        id: '1',
        title: 'Old',
        description: null,
        completed: false,
        dueDate: null,
        priority: PrismaPriority.MEDIUM,
        ownerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.todo.findUnique.mockResolvedValue(existing);
      mockPrismaService.todo.delete.mockResolvedValue(existing);
      await service.delete('1');
      expect(mockPrismaService.todo.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw if todo not found', async () => {
      mockPrismaService.todo.findUnique.mockResolvedValue(null);
      await expect(service.delete('nonexistent')).rejects.toThrow();
    });
  });
});
