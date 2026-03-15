<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Models;

use DateTimeImmutable;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\ValueObjects\CheckInId;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;

final readonly class CheckIn
{
    public function __construct(
        public CheckInId $id,
        public HabitId $habitId,
        public UserId $userId,
        public DateTimeImmutable $completedAt,
        public DateTimeImmutable $createdAt,
    ) {
    }
}
