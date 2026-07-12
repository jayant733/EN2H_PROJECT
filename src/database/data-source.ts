import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables specifically for CLI command execution
dotenv.config();

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production' || env === 'staging';

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
      }),
  synchronize: false, // Strict: never synchronize schema in production for data safety
  logging: env === 'development',
  entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  extra: {
    timezone: 'UTC',
  },
});
