# Warrior Tracker (Habuilt) — VILT Rebuild

Warrior Tracker is being rebuilt as a production-grade application using Vue 3 + Inertia + Laravel 11 + Tailwind CSS, with strict Domain-Driven Design (DDD) and event-driven boundaries.

## Objective

Build a maintainable, highly typed, remote-team-friendly architecture that demonstrates Staff Engineer standards:

- Explicit bounded contexts
- Decoupled domain collaboration through events
- DTO-first request flow
- Action-based business logic
- Real-time UI synchronization (Reverb)

## Technology Stack

- Backend: Laravel 11, PHP 8.3
- Frontend: Vue 3, Inertia.js, Tailwind CSS
- Realtime: Laravel Reverb (WebSockets)
- Data Mapping / Validation: Spatie Laravel Data DTOs

## Bounded Contexts

### 1) Identity Domain

Responsible for authentication, authorization boundaries, account profile lifecycle, and user identity state.

### 2) Tracking Domain

Owns Habit and CheckIn behavior, including completion rules and domain events.

### 3) Economy Domain

Owns point accounting, ledger integrity, and reward redemption.

## Event-Driven Contract (Core)

When a habit is completed, Tracking publishes `HabitCompleted`.

Economy subscribes and records `PointTransaction` independently.

This preserves decoupling:

- Tracking does not know point formulas
- Economy does not mutate Tracking aggregates
- Collaboration happens through explicit domain events

## Enterprise Directory Blueprint

```text
src/
  Domains/
    Identity/
      Actions/
      Data/
      Events/
      Listeners/
      Models/
      Policies/
      ValueObjects/
    Tracking/
      Actions/
      Data/
      Events/
      Listeners/
      Models/
      ValueObjects/
    Economy/
      Actions/
      Data/
      Events/
      Listeners/
      Models/
      ValueObjects/
  Application/
    Http/
      Controllers/
      Middleware/
      Requests/
    Providers/
  Shared/
    Domain/
    Infrastructure/
    Support/

resources/
  js/
    Pages/
    Components/
    Composables/
    Layouts/
```

## Request-to-Domain Flow Standard

1. HTTP request enters controller.
2. Request is validated.
3. Validated payload is transformed into a Spatie Data DTO.
4. Controller invokes a single Action class.
5. Action executes domain behavior and emits domain events.
6. Listeners in other bounded contexts react asynchronously/synchronously as configured.

No controller should contain domain logic.

## Coding Standards

- `declare(strict_types=1);` in all PHP files
- Constructor property promotion for immutable dependencies
- `readonly` classes/value objects where possible
- No cross-domain model coupling
- Typed properties, explicit return types, and dedicated DTO contracts

## Realtime UX Direction

Dashboard is Inertia-first, fast, and zen-minimalist:

- Server-driven page props through Laravel + Inertia
- Vue components optimized for shallow rerenders
- Reverb channels synchronize check-ins and point changes between laptop and phone views

## Phase Plan

Task 1 (current):

- High-level architecture README
- Composer manifest aligned to domain-first namespace strategy

Upcoming:

- Laravel app bootstrap with domain service providers
- Initial aggregates/entities/actions/events for Identity, Tracking, Economy
- Inertia dashboard shell and realtime subscriptions
