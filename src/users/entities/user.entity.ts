import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../../shared/enums/role.enum';
import { UserStatus } from '../../shared/enums/user-status.enum';
import { Service } from '../../services/entities/service.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { UserSession } from '../../auth/entities/user-session.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  @Index('idx_users_email_lower')
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ name: 'full_name' })
  fullName!: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  role!: UserRole;

  @Column({
    type: 'varchar',
    length: 30,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status!: UserStatus;

  @OneToMany(() => Service, (service) => service.vendor)
  services?: Service[];

  @OneToMany(() => Booking, (booking) => booking.client)
  bookings?: Booking[];

  @OneToMany(() => UserSession, (session) => session.user)
  sessions?: UserSession[];
}
