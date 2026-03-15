<?php

declare(strict_types=1);

namespace Habuilt\Domains\Identity\ValueObjects;

use Habuilt\Shared\Domain\ValueObjects\EntityId;

/**
 * Typed identifier for the User aggregate in the Identity domain.
 * Using a dedicated VO prevents passing a HabitId or CheckInId where
 * a UserId is expected — enforced by PHP's type system at compile-time.
 */
final readonly class UserId extends EntityId
{
}
