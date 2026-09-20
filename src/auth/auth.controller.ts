import { Controller, Post, Body, HttpCode, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { AuthResponse } from './auth.service.js';
import { JwtGuard } from './guards/jwt.guard.js';
import { User } from '../common/decorators/user.decorator.js';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this authService.register(dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponse> {
    return this authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Logout (revoke refresh token)' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(@Req() req: any, @Body() dto: RefreshTokenDto): Promise<{ message: string }> {
    const userId = req.user.sub;
    await this authService.logout(userId, dto.refreshToken);
    return { message: 'Logged out' };
  }

  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Logout all devices' })
  @ApiResponse({ status: 200, description: 'All tokens revoked' })
  async logoutAll(@Req() req: any): Promise<{ message: string }> {
    const userId = req.user.sub;
    await this authService.logoutAll(userId);
    return { message: 'All tokens revoked' };
  }
}