<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Data;

use DateTimeImmutable;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;

final readonly class HabitCompletionData
{
    public function __construct(
        public HabitId $habitId,
        public UserId $userId,
        public DateTimeImmutable $completedAt,
        public ?string $source = null,
        public ?string $notes = null,
    ) {
    }
}
