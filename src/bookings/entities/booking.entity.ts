import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { BookingAuditLog } from './booking-audit-log.entity';

@Entity('bookings')
@Check(
  'chk_bookings_status',
  "status IN ('pending', 'confirmed', 'completed', 'cancelled')",
)
@Check('chk_bookings_time_order', 'scheduled_at < end_time')
export class Booking extends BaseEntity {
  @Column({ name: 'client_id' })
  @Index('idx_bookings_client_id')
  clientId!: string;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client!: User;

  @Column({ name: 'service_id' })
  @Index('idx_bookings_service_id')
  serviceId!: string;

  @ManyToOne(() => Service, (service) => service.bookings, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'service_id' })
  service!: Service;

  @Column({ type: 'timestamptz', name: 'scheduled_at' })
  scheduledAt!: Date;

  @Column({ type: 'timestamptz', name: 'end_time' })
  @Index('idx_bookings_schedule')
  endTime!: Date;

  @Column('numeric', { name: 'price_at_booking', precision: 12, scale: 2 })
  priceAtBooking!: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: BookingStatus.PENDING,
  })
  status!: BookingStatus;

  @Column('text', { nullable: true })
  notes?: string | null;

  @Column({ name: 'idempotency_key', unique: true, type: 'uuid' })
  idempotencyKey!: string;

  @OneToMany(() => BookingAuditLog, (log) => log.booking)
  auditLogs?: BookingAuditLog[];
}
