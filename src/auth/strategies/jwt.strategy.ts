import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { JwtPayload } from '../jwt-payload.interface.js';
import appConfig from '../../config/app.config.js';
import type { AppConfig } from '../../config/app.config.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(appConfig.KEY)
    private readonly config: AppConfig,
  ) {
    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
    };
    super(opts);
  }

  async validate(payload: JwtPayload): Promise<{ userId: string }> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return { userId: payload.sub };
  }
}
