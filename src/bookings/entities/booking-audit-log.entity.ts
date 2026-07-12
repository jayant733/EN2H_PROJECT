import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  BeforeInsert,
  CreateDateColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { Booking } from './booking.entity';
import { User } from '../../users/entities/user.entity';

@Entity('booking_audit_logs')
export class BookingAuditLog {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'booking_id' })
  bookingId!: string;

  @ManyToOne(() => Booking, (booking) => booking.auditLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ name: 'changed_by', nullable: true })
  changedById?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedBy?: User | null;

  @Column({
    type: 'varchar',
    name: 'previous_status',
    length: 20,
    nullable: true,
  })
  previousStatus?: string | null;

  @Column({ type: 'varchar', name: 'new_status', length: 20 })
  newStatus!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string | null;

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
