import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ServiceRepository } from './repositories/service.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  providers: [ServiceRepository],
  exports: [ServiceRepository],
})
export class ServicesModule {}
