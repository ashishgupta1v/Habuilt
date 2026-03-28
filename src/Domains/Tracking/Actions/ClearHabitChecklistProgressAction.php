<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Actions;

use DateTimeImmutable;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\Contracts\Repositories\CheckInRepositoryInterface;

final readonly class ClearHabitChecklistProgressAction
{
    public function __construct(
        private CheckInRepositoryInterface $checkIns,
    ) {
    }

    public function handle(UserId $userId, int $year, int $month): int
    {
        $monthStart = new DateTimeImmutable(sprintf('%04d-%02d-01 00:00:00', $year, $month));
        $monthEnd = $monthStart->modify('last day of this month')->setTime(23, 59, 59);

        return $this->checkIns->clearForUserInRange($userId, $monthStart, $monthEnd);
    }
}
