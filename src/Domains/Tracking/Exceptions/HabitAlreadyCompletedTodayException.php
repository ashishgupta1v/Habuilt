<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Exceptions;

use DomainException;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;

final class HabitAlreadyCompletedTodayException extends DomainException
{
    public static function for(HabitId $habitId, string $date): self
    {
        return new self(
            "Habit [{$habitId}] has already been checked in on [{$date}].",
        );
    }
}
