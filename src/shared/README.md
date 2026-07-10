# Common vs. Shared Module Guidelines

This document outlines the architectural distinction between the `common/` and `shared/` directory patterns in this codebase.

## 1. Common Module (`src/common/`)
The `common` directory is reserved for **stateless utilities and framework hooks**. Nothing in `common` should maintain state, manage connection pools, or contain business-specific domain rules.

### What goes here:
- **Filters**: Custom exception filters (e.g., global HTTP exceptions, database constraints translation).
- **Interceptors**: Global response wrappers, logging interceptors, timing metrics.
- **Guards**: Global permission guards, API key validators (stateless).
- **Decorators**: Custom parameter decorators (e.g., `@CurrentUser()`, `@Public()`).
- **Exceptions**: Custom HTTP exceptions (e.g., `InvalidBookingException`).
- **Constants/Enums**: Shared constants or TypeScript enums (e.g., `UserRoles`).
- **Utils**: Stateless functions (e.g., string manipulation, cryptographic helpers, math helpers).
- **Pipes**: Custom input validation or transformation pipes.

---

## 2. Shared Module (`src/shared/`)
The `shared` directory is reserved for **stateful services, connection managers, and external resource wrappers**. These classes typically manage network connections, keep long-running configurations, or wrap external software development kits (SDKs).

### What goes here:
- **Database/Cache Connectors**: Redis client wrapper, DynamoDB client wrapper.
- **Third-Party Service Connectors**: SendGrid mail client, Stripe payments client, Twilio SMS client, AWS S3 storage client.
- **Shared Providers**: Heavy service classes that maintain connection configurations or runtime cache states.

---

## Direct Comparison

| Aspect | `src/common/` | `src/shared/` |
|---|---|---|
| **State** | Stateless | Stateful (manages connections, cache, or clients) |
| **Instantiated** | Instantiated per request or imported as raw functions | Instantiated once (Singleton) or as configured providers |
| **Dependencies** | Rarely has dependencies other than NestJS core decorators | Frequently depends on configuration values (`ConfigService`) and third-party SDKs |
| **Purpose** | Utilities, helpers, boilerplates | Adapters to infrastructure, external networks |
