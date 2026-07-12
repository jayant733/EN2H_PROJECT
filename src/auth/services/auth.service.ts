import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { UserRepository } from '../../users/repositories/user.repository';
import { UserSessionRepository } from '../repositories/user-session.repository';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { User } from '../../users/entities/user.entity';
import { UserStatus } from '../../shared/enums/user-status.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: UserSessionRepository,
    private readonly cryptoUtil: CryptoUtil,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto): Promise<User> {
    const existing = await this.userRepository.findOneByEmail(dto.email);
    if (existing) {
      this.logger.warn(
        `Registration rejected: Email collision for ${dto.email}`,
      );
      throw new ConflictException(
        'A user record with this email address already exists.',
      );
    }

    const hashedPassword = await this.cryptoUtil.hashPassword(dto.password);
    const userEntity = this.userRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash: hashedPassword,
      role: dto.role,
      status: UserStatus.ACTIVE,
    });
    const user = await this.userRepository.save(userEntity);

    this.logger.log(`User registration successful: ${user.id} (${user.role})`);
    return user;
  }

  async login(
    dto: LoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const user = await this.userRepository.findOneByEmail(dto.email);

    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      // Mitigate user enumeration: waste matching CPU cycles if user is missing
      await this.cryptoUtil.hashPassword(dto.password);
      this.logger.warn(
        `Login failure: Missing or inactive user record for email [${dto.email}]`,
      );
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isMatch = await this.cryptoUtil.comparePassword(
      dto.password,
      user.passwordHash,
    );
    if (!isMatch) {
      this.logger.warn(
        `Login failure: Credential check failed for user ${user.id}`,
      );
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Generate tokens
    const { accessToken, refreshToken, expiresAt } =
      await this.issueTokenPair(user);

    // Save hashed session
    const hashedRefresh = this.hashToken(refreshToken);
    const session = this.sessionRepository.create({
      userId: user.id,
      refreshTokenHash: hashedRefresh,
      expiresAt,
      ipAddress,
      userAgent,
    });
    await this.sessionRepository.save(session);

    this.logger.log(
      `Session initialized: User ${user.id} logged in from ${ipAddress}`,
    );
    return { accessToken, refreshToken, user };
  }

  async refresh(
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string; email: string } | null = null;

    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(refreshToken, {
        secret: this.configService.get<string>('auth.jwtRefreshSecret'),
      });
    } catch {
      this.logger.warn(`Refresh failure: Token signature verification failed`);
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const hashedToken = this.hashToken(refreshToken);
    const user = await this.userRepository.findOneById(payload.sub);
    const session = await this.sessionRepository.findOneActive(
      payload.sub,
      hashedToken,
    );

    if (
      !user ||
      !session ||
      user.deletedAt ||
      user.status !== UserStatus.ACTIVE
    ) {
      this.logger.warn(
        `Refresh failure: Session not found or account inactive for user sub ${payload.sub}`,
      );
      throw new UnauthorizedException('Invalid refresh session credentials.');
    }

    // Refresh Token Rotation: Revoke previous token session
    session.revokedAt = new Date();
    await this.sessionRepository.save(session);

    // Issue new pair
    const tokens = await this.issueTokenPair(user);

    // Save new session
    const newHashedRefresh = this.hashToken(tokens.refreshToken);
    const newSession = this.sessionRepository.create({
      userId: user.id,
      refreshTokenHash: newHashedRefresh,
      expiresAt: tokens.expiresAt,
      ipAddress,
      userAgent,
    });
    await this.sessionRepository.save(newSession);

    this.logger.log(`Session rotated: User ${user.id} rotated refresh token`);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const decoded = this.jwtService.decode(refreshToken);
      const payload =
        typeof decoded === 'object' && decoded !== null
          ? (decoded as Record<string, unknown>)
          : null;
      if (payload && typeof payload.sub === 'string') {
        const session = await this.sessionRepository.findOneActive(
          payload.sub,
          hashedToken,
        );
        if (session) {
          session.revokedAt = new Date();
          await this.sessionRepository.save(session);
          this.logger.log(`Session terminated: Session ${session.id} revoked`);
        }
      }
    } catch {
      this.logger.warn('Logout session lookup failed');
    }
  }

  private async issueTokenPair(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const accessPayload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.configService.get<string>('auth.jwtSecret'),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: this.configService.get<string>('auth.jwtExpiresIn') as any,
    });

    const refreshPayload = { sub: user.id, email: user.email };
    const refreshSecret = this.configService.get<string>(
      'auth.jwtRefreshSecret',
    );
    const refreshExpiresIn =
      this.configService.get<string>('auth.jwtRefreshExpiresIn') || '7d';

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: refreshSecret,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: refreshExpiresIn as any,
    });

    // Calculate exact expiration Date matching jwtRefreshExpiresIn
    const expiresAt = new Date();
    // Default to 7 days
    expiresAt.setDate(expiresAt.getDate() + 7);

    return { accessToken, refreshToken, expiresAt };
  }
}
