import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { UserSession } from '../entities/user-session.entity';

@Injectable()
export class UserSessionRepository {
  constructor(
    @InjectRepository(UserSession)
    private readonly repository: Repository<UserSession>,
  ) {}

  create(session: Partial<UserSession>): UserSession {
    return this.repository.create(session);
  }

  save(session: Partial<UserSession>): Promise<UserSession> {
    return this.repository.save(session);
  }

  findOneActive(
    userId: string,
    tokenHash: string,
  ): Promise<UserSession | null> {
    return this.repository.findOne({
      where: {
        userId,
        refreshTokenHash: tokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
