import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../users/repositories/user.repository';
import { UserStatus } from '../../shared/enums/user-status.enum';
import { User } from '../../users/entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    const secret = configService.get<string>('auth.jwtSecret');
    if (!secret) {
      throw new Error('JWT_SECRET configuration is missing');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOneById(payload.sub);

    if (!user) {
      throw new UnauthorizedException(
        'Authentication token belongs to an unresolvable user record.',
      );
    }

    // Check soft delete status
    if (user.deletedAt) {
      throw new UnauthorizedException(
        'Authentication token belongs to a deleted user account.',
      );
    }

    // Check active status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Authentication token belongs to an inactive or suspended account.',
      );
    }

    return user;
  }
}
