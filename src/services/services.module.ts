import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ServiceRepository } from './repositories/service.repository';
import { ServicesController } from './controllers/services.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  controllers: [ServicesController],
  providers: [ServiceRepository],
  exports: [ServiceRepository],
})
export class ServicesModule {}
