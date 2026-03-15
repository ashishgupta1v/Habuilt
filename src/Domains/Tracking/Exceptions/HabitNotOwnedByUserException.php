<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Exceptions;

use DomainException;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;

final class HabitNotOwnedByUserException extends DomainException
{
    public static function for(HabitId $habitId, UserId $userId): self
    {
        return new self(
            "Habit [{$habitId}] is not owned by user [{$userId}].",
        );
    }
}
