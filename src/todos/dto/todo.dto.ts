import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDate,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

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

export class CreateTodoDto {
  @ApiProperty({ description: 'Todo title', example: 'Buy groceries' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Todo description',
    example: 'Milk, eggs, bread',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  description?: string;

  @ApiPropertyOptional({
    description: 'Due date',
    example: '2026-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({ enum: Priority, default: Priority.MEDIUM })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}

export class UpdateTodoDto {
  @ApiPropertyOptional({ description: 'Todo title' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Todo description' })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  description?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({ enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Mark completed' })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class TodoQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of results',
    default: 20,
  })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Cursor for pagination (todo id)' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Filter by completed status' })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({ enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Search by title/description' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by owner id' })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
