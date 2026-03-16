<?php

declare(strict_types=1);

namespace Habuilt\Domains\Economy\Listeners;

use Habuilt\Domains\Economy\Contracts\Repositories\PointTransactionRepositoryInterface;
use Habuilt\Domains\Economy\Models\PointTransaction;
use Habuilt\Domains\Economy\ValueObjects\PointTransactionId;
use Habuilt\Domains\Tracking\Events\HabitCompleted;

final readonly class CreditPointsForCompletedHabit
{
    public function __construct(
        private PointTransactionRepositoryInterface $transactions,
    ) {
    }

    public function handle(HabitCompleted $event): void
    {
        $this->transactions->save(new PointTransaction(
            id: PointTransactionId::generate(),
            userId: $event->userId,
            amount: $event->pointsAwarded,
            reason: 'habit_check_in',
            referenceId: $event->checkInId,
            occurredAt: $event->occurredAt(),
        ));
    }
}
