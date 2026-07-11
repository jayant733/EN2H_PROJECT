import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CryptoUtil {
  private readonly saltRounds: number;

  constructor(private readonly configService: ConfigService) {
    this.saltRounds =
      this.configService.get<number>('auth.bcryptSaltRounds') || 12;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
