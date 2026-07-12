import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  findOneById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  findOneByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  create(user: Partial<User>): User {
    return this.repository.create(user);
  }

  save(user: Partial<User>): Promise<User> {
    return this.repository.save(user);
  }
}
