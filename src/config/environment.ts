export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test' | 'staging';
  PORT: number;
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  LOG_LEVEL: 'error' | 'warn' | 'log' | 'debug' | 'verbose';
  CORS_ORIGIN: string;
}
