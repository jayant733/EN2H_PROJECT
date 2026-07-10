import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSession } from './entities/user-session.entity';
import { UserSessionRepository } from './repositories/user-session.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserSession])],
  providers: [UserSessionRepository],
  exports: [UserSessionRepository],
})
export class AuthModule {}
