<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Data;

use DateTimeImmutable;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\ValueObjects\CheckInId;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;
use Habuilt\Shared\Domain\ValueObjects\PointValue;

final readonly class HabitCompletionResultData
{
    public function __construct(
        public CheckInId $checkInId,
        public HabitId $habitId,
        public UserId $userId,
        public DateTimeImmutable $completedAt,
        public PointValue $pointsAwarded,
    ) {
    }
}
