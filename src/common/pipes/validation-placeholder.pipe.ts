import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ValidationPlaceholderPipe implements PipeTransform {
  transform(value: unknown): unknown {
    // Placeholder pipe returns value unchanged
    return value;
  }
}
