import { CanActivate, Injectable } from '@nestjs/common';

@Injectable()
export class AuthPlaceholderGuard implements CanActivate {
  canActivate(): boolean {
    // Placeholder guard: returns true by default. Unused parameter omitted to comply with strict ESLint rules.
    return true;
  }
}
