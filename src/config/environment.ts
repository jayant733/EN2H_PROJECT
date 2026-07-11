export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  database: string;
  logging: boolean;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  bcryptSaltRounds: number;
}

export interface LoggingConfig {
  level: string;
}

export interface CorsConfig {
  origin: string;
}

export interface EnvironmentConfig {
  env: string;
  port: number;
  database: DatabaseConfig;
  auth: AuthConfig;
  logging: LoggingConfig;
  cors: CorsConfig;
}
