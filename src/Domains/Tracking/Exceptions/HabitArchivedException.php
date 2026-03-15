<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Exceptions;

use DomainException;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;

final class HabitArchivedException extends DomainException
{
    public static function for(HabitId $habitId): self
    {
        return new self(
            "Habit [{$habitId}] has been archived and cannot be completed.",
        );
    }
}
