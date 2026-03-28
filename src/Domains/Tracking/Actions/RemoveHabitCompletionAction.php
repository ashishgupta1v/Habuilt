<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Actions;

use DateTimeImmutable;
use Habuilt\Domains\Economy\Contracts\Repositories\PointTransactionRepositoryInterface;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\Contracts\Repositories\CheckInRepositoryInterface;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;

final readonly class RemoveHabitCompletionAction
{
    public function __construct(
        private CheckInRepositoryInterface $checkIns,
        private PointTransactionRepositoryInterface $pointTransactions,
    ) {
    }

    public function handle(HabitId $habitId, UserId $userId, int $year, int $month, int $day): bool
    {
        $completedOn = new DateTimeImmutable(sprintf('%04d-%02d-%02d 12:00:00', $year, $month, $day));
        $existing = $this->checkIns->findByHabitAndDate($habitId, $completedOn);

        if ($existing === null || ! $existing->userId->equals($userId)) {
            return false;
        }

        $this->checkIns->deleteById($existing->id);
        $this->pointTransactions->removeByReferenceId($existing->id);

        return true;
    }
}
