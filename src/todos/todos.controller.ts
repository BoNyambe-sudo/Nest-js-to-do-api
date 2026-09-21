import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { TodosService, PaginatedTodos } from './todos.service.js';
import { CreateTodoDto, UpdateTodoDto, TodoQueryDto, Todo } from './dto/todo.dto.js';
import { JwtGuard } from '../auth/guards/jwt.guard.js';
import { User } from '../common/decorators/user.decorator.js';

@Controller('todos')
@ApiTags('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  @UseGuards(JwtGuard)
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'completed', required: false, type: Boolean })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'ownerId', required: false, type: String })
  @ApiOperation({ summary: 'List todos with cursor pagination' })
  @ApiResponse({ status: 200, description: 'Paginated todos' })
  async findAll(
    @Query() query: TodoQueryDto,
    @User('userId') userId: string,
  ): Promise<PaginatedTodos> {
    return this.todosService.findAll(query, userId);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get a todo by id' })
  @ApiResponse({ status: 200, description: 'Todo found' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async findById(@Param('id') id: string): Promise<Todo> {
    return this.todosService.findById(id);
  }

  @Post()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiResponse({ status: 201, description: 'Todo created' })
  async create(
    @Body() dto: CreateTodoDto,
    @User('userId') userId: string,
  ): Promise<Todo> {
    return this.todosService.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update a todo' })
  @ApiResponse({ status: 200, description: 'Todo updated' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
  ): Promise<Todo> {
    return this.todosService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiResponse({ status: 204, description: 'Todo deleted' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.todosService.delete(id);
  }
}
