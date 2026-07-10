# Enterprise SaaS Backend Architecture Skeleton

A production-ready NestJS, TypeScript, TypeORM, and PostgreSQL backend skeleton, structured to support enterprise-grade SaaS systems. This foundation enforces the **Single Responsibility Principle (SRP)**, **Dependency Injection**, **Modular Architecture**, and **Strict Type Safety**.

---

## Technical Stack
- **Framework**: [NestJS](https://nestjs.com/) (Modular architecture, IoC container)
- **Language**: [TypeScript](https://www.typescript.org/) (Strict compilation configurations)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (SaaS persistent layer)
- **ORM**: [TypeORM](https://typeorm.io/) (Data Source pattern, explicit migration files)
- **Security**: [Helmet](https://helmetjs.github.io/) (Secure HTTP headers), CORS
- **Documentation**: [Swagger](https://swagger.io/) (Self-documenting API spec)
- **Validation**: [Joi](https://joi.dev/) (Runtime environment validation)
- **Containerization**: [Docker & Docker Compose](https://www.docker.com/)

---

## Architectural Principles

1. **SOLID Compliance**:
   - **Single Responsibility (SRP)**: Controllers translate HTTP requests and validate input; services execute business domain logic; repositories manage persistence.
   - **Dependency Inversion (DIP)**: Controllers and services depend on abstractions (interfaces) rather than concrete implementations.
2. **Modular Encapsulation**: Domain features (`bookings`, `users`, `auth`) are self-contained. Communication between modules is explicit via exported/imported services.
3. **Fail-Fast Environment Validation**: Validates the `.env` file at application startup using Joi schemas. If crucial variables are missing or misconfigured, the container crashes immediately.
4. **Programmatic Migrations**: Schema synchronization is strictly disabled (`synchronize: false`). All schema modifications are versioned via TypeORM CLI migrations.
5. **Separation of Stateful and Stateless Reusables**:
   - `common/` is reserved for stateless components (filters, interceptors, decorators, utilities).
   - `shared/` is reserved for stateful reusable adapters (external connectors, mailers, caches).

---

## Directory Structure

```
src/
├── main.ts                     # Bootstrap sequence (Helmet, CORS, Validation, Swagger)
├── app.module.ts               # Roots imports, Joi configuration, TypeORM module injection
├── config/                     # Type-safe configuration namespace definitions
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── auth.config.ts
│   ├── swagger.config.ts
│   └── validation.schema.ts
├── database/                   # Migrations, seeders, and programmatic DataSource configuration
│   ├── data-source.ts          # TypeORM CLI DataSource configuration
│   └── migrations/
├── common/                     # Stateless shared components
│   ├── filters/                # Global exception translation
│   ├── interceptors/           # Response formatting, profiling
│   ├── guards/                 # Stateless API security filters
│   ├── decorators/             # Custom metadata bindings
│   ├── exceptions/             # Standard domain exceptions
│   ├── constants/              # Global application constants
│   ├── enums/                  # Global type-safe definitions
│   ├── utils/                  # Cryptography, string/math libraries
│   └── pipes/                  # Request payload transformation/sanitization
├── shared/                     # Stateful infrastructure adapters (Redis, Mail, Stripe, S3)
│   ├── providers/
│   └── services/
├── health/                     # Liveness and readiness endpoints
│   ├── health.controller.ts
│   ├── health.module.ts
│   └── health.service.ts
├── auth/                       # Domain: Authentication, tokens, logins
├── users/                      # Domain: User management
├── services/                   # Domain: Vendor/Platform services
└── bookings/                   # Domain: Reservation management
```

### Feature Module Substructure
Every feature module (`auth/`, `users/`, `services/`, `bookings/`) contains the following directories:
- `controllers/` – HTTP routing layer
- `services/` – Pure domain and business logic
- `dto/` – Data Transfer Objects with validation annotations
- `entities/` – Database entity models (TypeORM mappings)
- `repositories/` – Database query wrappers
- `interfaces/` – Domain contracts and type definitions
- `decorators/` – Feature-scoped controller annotations
- `guards/` – Feature-scoped routing security filters
- `strategies/` – Passport security strategies
- `validators/` – Complex custom parameter validation rules
- `constants/` – Feature-scoped constants
- `types/` – Feature-scoped types

---

## How to Run

### Prerequisite Environment
Create a `.env` file from the example:
```bash
cp .env.example .env
```

### Option 1: Local Development
1. Start PostgreSQL (locally or inside a container).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (with watch-mode):
   ```bash
   npm run start:dev
   ```
4. Access endpoints:
   - Health Check: `GET http://localhost:3000/api/v1/health`
   - Interactive API Specs: `http://localhost:3000/api/docs`

### Option 2: Docker Compose (Production Target)
To build and run the NestJS application along with PostgreSQL container:
```bash
docker-compose up --build
```
This boots PostgreSQL first, verifies its health status, and then launches the NestJS application.

---

## Future Implementation Roadmap

1. **Authentication Layer**:
   - Implement login/register endpoints inside `auth/controllers/`.
   - Setup Passport strategies (JWT, Local, OAuth) inside `auth/strategies/`.
   - Setup JWT validation guard in `auth/guards/`.
2. **Domain Entity Setup**:
   - Declare TypeORM entity classes inside `users/entities/`, `bookings/entities/`, etc.
   - Generate schema migrations:
     ```bash
     npx typeorm migration:generate src/database/migrations/InitSchema -d dist/src/database/data-source.js
     ```
3. **Business Logic Integration**:
   - Implement transactional services inside `bookings/services/`.
   - Build domain repositories inside `bookings/repositories/` to isolate queries from NestJS Services.
4. **Global Exception Mapping & Response Normalization**:
   - Register custom global Exception Filters in `common/filters/` to translate SQL/TypeORM errors into normalized HTTP statuses.
   - Implement Response Interceptors in `common/interceptors/` to normalize all successful payloads.
