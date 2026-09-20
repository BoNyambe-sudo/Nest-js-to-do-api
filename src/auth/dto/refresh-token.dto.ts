import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'abc123refresh',
  })
  @IsString()
  refreshToken: string;
}
