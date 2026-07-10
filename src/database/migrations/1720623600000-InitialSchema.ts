import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1720623600000 implements MigrationInterface {
  name = 'InitialSchema1720623600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enable btree_gist extension for range and uuid checks
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);

    // 2. Users Table
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending_verification',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ,
        version INTEGER NOT NULL DEFAULT 1,
        CONSTRAINT chk_users_role CHECK (role IN ('client', 'vendor', 'admin')),
        CONSTRAINT chk_users_status CHECK (status IN ('pending_verification', 'active', 'suspended')),
        CONSTRAINT chk_users_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}$')
      );
    `);

    // 3. Services Table
    await queryRunner.query(`
      CREATE TABLE services (
        id UUID PRIMARY KEY,
        vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC(12,2) NOT NULL,
        duration_minutes INTEGER NOT NULL,
        category VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ,
        version INTEGER NOT NULL DEFAULT 1,
        CONSTRAINT chk_services_price CHECK (price > 0.00),
        CONSTRAINT chk_services_duration CHECK (duration_minutes >= 15),
        CONSTRAINT chk_services_status CHECK (status IN ('draft', 'active', 'archived'))
      );
    `);

    // 4. Bookings Table
    await queryRunner.query(`
      CREATE TABLE bookings (
        id UUID PRIMARY KEY,
        client_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
        scheduled_at TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        price_at_booking NUMERIC(12,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        notes TEXT,
        idempotency_key UUID UNIQUE NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT chk_bookings_status CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
        CONSTRAINT chk_bookings_time_order CHECK (scheduled_at < end_time)
      );
    `);

    // 5. Overlap Constraint (Exclusion)
    await queryRunner.query(`
      ALTER TABLE bookings ADD CONSTRAINT exclude_overlapping_bookings 
      EXCLUDE USING gist (
        service_id WITH =,
        tstzrange(scheduled_at, end_time) WITH &&
      ) WHERE (status IN ('pending', 'confirmed'));
    `);

    // 6. Booking Audit Logs Table
    await queryRunner.query(`
      CREATE TABLE booking_audit_logs (
        id UUID PRIMARY KEY,
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        changed_by UUID NOT NULL REFERENCES users(id),
        previous_status VARCHAR(20),
        new_status VARCHAR(20) NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. User Sessions Table
    await queryRunner.query(`
      CREATE TABLE user_sessions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        ip_address VARCHAR(255) NOT NULL,
        user_agent VARCHAR(255) NOT NULL,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Indexes
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_users_email_lower ON users(LOWER(email));`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_services_vendor_id ON services(vendor_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_services_category_status ON services(category, status);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_services_search_vector ON services USING gin(to_tsvector('english', title || ' ' || description));`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bookings_client_id ON bookings(client_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bookings_service_id ON bookings(service_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bookings_schedule ON bookings(scheduled_at, end_time);`,
    );
    await queryRunner.query(`
      CREATE INDEX idx_user_sessions_active ON user_sessions(user_id) 
      WHERE revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_sessions_active;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bookings_schedule;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bookings_service_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bookings_client_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_services_search_vector;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_services_category_status;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_services_vendor_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email_lower;`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_sessions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS booking_audit_logs;`);
    await queryRunner.query(
      `ALTER TABLE bookings DROP CONSTRAINT IF EXISTS exclude_overlapping_bookings;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS bookings;`);
    await queryRunner.query(`DROP TABLE IF EXISTS services;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS btree_gist;`);
  }
}
