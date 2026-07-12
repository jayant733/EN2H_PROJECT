import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { UserSessionRepository } from '../repositories/user-session.repository';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../shared/enums/role.enum';
import { UserStatus } from '../../shared/enums/user-status.enum';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { User } from '../../users/entities/user.entity';
import { UserSession } from '../entities/user-session.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Pick<UserRepository, 'findOneByEmail' | 'findOneById' | 'save'>>;
  let sessionRepository: jest.Mocked<Pick<UserSessionRepository, 'save' | 'findOneActive'>>;
  let cryptoUtil: jest.Mocked<Pick<CryptoUtil, 'hashPassword' | 'comparePassword'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync' | 'verifyAsync' | 'decode'>>;

  beforeEach(async () => {
    const mockUserRepository = { findOneByEmail: jest.fn(), findOneById: jest.fn(), save: jest.fn() };
    const mockSessionRepository = { save: jest.fn(), findOneActive: jest.fn() };
    const mockCryptoUtil = { hashPassword: jest.fn(), comparePassword: jest.fn() };
    const mockJwtService = { signAsync: jest.fn(), verifyAsync: jest.fn(), decode: jest.fn() };
    const mockConfigService = {
      get: jest.fn((k) => (k === 'auth.bcryptSaltRounds' ? 12 : k === 'auth.jwtSecret' ? 'jwt_secret' : k === 'auth.jwtExpiresIn' ? '15m' : k === 'auth.jwtRefreshSecret' ? 'refresh_secret' : k === 'auth.jwtRefreshExpiresIn' ? '7d' : null)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: UserSessionRepository, useValue: mockSessionRepository },
        { provide: CryptoUtil, useValue: mockCryptoUtil },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    sessionRepository = module.get(UserSessionRepository);
    cryptoUtil = module.get(CryptoUtil);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const dto: RegisterDto = { email: 'test@example.com', fullName: 'Test User', password: 'Password123!', role: UserRole.CLIENT };
      userRepository.findOneByEmail.mockResolvedValue(null);
      cryptoUtil.hashPassword.mockResolvedValue('hashed_password');
      userRepository.save.mockResolvedValue({ id: 'user_id', email: dto.email, fullName: dto.fullName, passwordHash: 'hashed_password', role: dto.role, status: UserStatus.ACTIVE } as User);

      const result = await service.register(dto);
      expect(result).toHaveProperty('id', 'user_id');
      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(dto.email);
      expect(cryptoUtil.hashPassword).toHaveBeenCalledWith(dto.password);
    });

    it('should throw ConflictException on email collision', async () => {
      const dto: RegisterDto = { email: 'test@example.com', fullName: 'Test User', password: 'Password123!', role: UserRole.CLIENT };
      userRepository.findOneByEmail.mockResolvedValue({ id: 'existing_user_id' } as User);
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully and return tokens', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'Password123!' };
      const user = { id: 'user_id', email: dto.email, passwordHash: 'hashed_password', status: UserStatus.ACTIVE } as User;
      userRepository.findOneByEmail.mockResolvedValue(user);
      cryptoUtil.comparePassword.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValueOnce('access_token').mockResolvedValueOnce('refresh_token');

      const result = await service.login(dto, '127.0.0.1', 'Mozilla');
      expect(result).toHaveProperty('accessToken', 'access_token');
      expect(result).toHaveProperty('refreshToken', 'refresh_token');
      expect(cryptoUtil.comparePassword).toHaveBeenCalledWith(dto.password, 'hashed_password');
      expect(sessionRepository.save).toHaveBeenCalled();
    });

    it('should fail login if user is missing and waste CPU cycles', async () => {
      const dto: LoginDto = { email: 'missing@example.com', password: 'Password123!' };
      userRepository.findOneByEmail.mockResolvedValue(null);
      cryptoUtil.hashPassword.mockResolvedValue('dummy_hash');

      await expect(service.login(dto, '127.0.0.1', 'Mozilla')).rejects.toThrow(UnauthorizedException);
      expect(cryptoUtil.hashPassword).toHaveBeenCalledWith(dto.password);
    });

    it('should fail login on invalid password', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'WrongPassword!' };
      const user = { id: 'user_id', email: dto.email, passwordHash: 'hashed_password', status: UserStatus.ACTIVE } as User;
      userRepository.findOneByEmail.mockResolvedValue(user);
      cryptoUtil.comparePassword.mockResolvedValue(false);

      await expect(service.login(dto, '127.0.0.1', 'Mozilla')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should rotate tokens successfully', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user_id', email: 'test@example.com' });
      userRepository.findOneById.mockResolvedValue({ id: 'user_id', status: UserStatus.ACTIVE } as User);
      sessionRepository.findOneActive.mockResolvedValue({ id: 'session_id' } as unknown as UserSession);
      jwtService.signAsync.mockResolvedValueOnce('new_access_token').mockResolvedValueOnce('new_refresh_token');

      const result = await service.refresh('old_refresh_token', '127.0.0.1', 'Mozilla');
      expect(result).toEqual({ accessToken: 'new_access_token', refreshToken: 'new_refresh_token' });
      expect(sessionRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should fail refresh if token signature is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid signature'));
      await expect(service.refresh('bad_token', '127.0.0.1', 'Mozilla')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke active session on logout', async () => {
      jwtService.decode.mockReturnValue({ sub: 'user_id' });
      const mockSession = { id: 'session_id', revokedAt: null };
      sessionRepository.findOneActive.mockResolvedValue(mockSession as unknown as UserSession);

      await service.logout('refresh_token');
      expect(mockSession.revokedAt).toBeInstanceOf(Date);
      expect(sessionRepository.save).toHaveBeenCalledWith(mockSession);
    });
  });
});
