import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  BeforeInsert,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { User } from '../../users/entities/user.entity';

@Entity('user_sessions')
@Index('idx_user_sessions_active', ['userId'], {
  where: 'revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP',
})
export class UserSession {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'refresh_token_hash' })
  refreshTokenHash!: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ name: 'ip_address' })
  ipAddress!: string;

  @Column({ name: 'user_agent' })
  userAgent!: string;

  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revokedAt?: Date | null;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
