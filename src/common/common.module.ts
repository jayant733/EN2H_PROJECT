import { Module, Global } from '@nestjs/common';
import { CryptoUtil } from './utils/crypto.util';

@Global()
@Module({
  providers: [CryptoUtil],
  exports: [CryptoUtil],
})
export class CommonModule {}
