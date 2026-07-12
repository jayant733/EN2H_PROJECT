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
  "status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')",
)
export class Booking extends BaseEntity {
  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  @Index('idx_bookings_client_id')
  clientId?: string | null;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'client_id' })
  client?: User | null;

  @Column({ name: 'service_id' })
  @Index('idx_bookings_service_id')
  serviceId!: string;

  @ManyToOne(() => Service, (service) => service.bookings, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'service_id' })
  service!: Service;

  @Column({ name: 'customer_name' })
  customerName!: string;

  @Column({ name: 'customer_email' })
  customerEmail!: string;

  @Column({ name: 'customer_phone' })
  customerPhone!: string;

  @Column({ type: 'date', name: 'booking_date' })
  @Index('idx_bookings_date')
  bookingDate!: string;

  @Column({ type: 'time', name: 'booking_time' })
  @Index('idx_bookings_time')
  bookingTime!: string;

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

  @Column({ name: 'idempotency_key', unique: true, type: 'uuid', nullable: true })
  idempotencyKey?: string | null;

  @OneToMany(() => BookingAuditLog, (log) => log.booking)
  auditLogs?: BookingAuditLog[];
}
