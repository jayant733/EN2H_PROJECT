import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const env = configService.get<string>('env') || 'development';
        const isProduction = env === 'production' || env === 'staging';

        return {
          type: 'postgres',
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
          synchronize: false, // Strict: never synchronize in production for schema safety
          logging: configService.get<boolean>('database.logging'),
          autoLoadEntities: true,

          // Environment-aware SSL configuration
          ssl: isProduction ? { rejectUnauthorized: false } : false,

          // Connection pool resilience parameters
          retryAttempts: 10,
          retryDelay: 3000,

          // Enforce UTC timezone on postgres connection session level
          extra: {
            timezone: 'UTC',
          },
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
