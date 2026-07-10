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
import { Booking } from '../../bookings/entities/booking.entity';
import { ServiceStatus } from '../../shared/enums/service-status.enum';

@Entity('services')
@Check('chk_services_price', 'price > 0.00')
@Check('chk_services_duration', 'duration_minutes >= 15')
export class Service extends BaseEntity {
  @Column({ name: 'vendor_id' })
  @Index('idx_services_vendor_id')
  vendorId!: string;

  @ManyToOne(() => User, (user) => user.services, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vendor_id' })
  vendor!: User;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  // Use a string or number type for numeric. String is safer for precision math in JS/TS.
  @Column('numeric', { precision: 12, scale: 2 })
  price!: number;

  @Column('integer', { name: 'duration_minutes' })
  durationMinutes!: number;

  @Column()
  @Index('idx_services_category_status')
  category!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ServiceStatus.DRAFT,
  })
  status!: ServiceStatus;

  @OneToMany(() => Booking, (booking) => booking.service)
  bookings?: Booking[];
}
