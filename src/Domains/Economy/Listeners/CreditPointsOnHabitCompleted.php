<?php

declare(strict_types=1);

namespace Habuilt\Domains\Economy\Listeners;

use Habuilt\Domains\Economy\Contracts\Repositories\PointTransactionRepositoryInterface;
use Habuilt\Domains\Economy\Models\PointTransaction;
use Habuilt\Domains\Economy\ValueObjects\PointTransactionId;
use Habuilt\Domains\Tracking\Events\HabitCompleted;

/**
 * Economy listener that reacts to HabitCompleted published by the Tracking
 * domain. Writes a credit PointTransaction to the user's ledger.
 *
 * This class must NOT call back into the Tracking domain —
 * data flows one way via the domain event contract.
 */
final readonly class CreditPointsOnHabitCompleted
{
    public function __construct(
        private PointTransactionRepositoryInterface $transactions,
    ) {
    }

    /**
     * Laravel event system calls this method automatically when the
     * HabitCompleted event is dispatched.
     */
    public function handle(HabitCompleted $event): void
    {
        $this->transactions->save(new PointTransaction(
            id:          PointTransactionId::generate(),
            userId:      $event->userId,
            amount:      $event->pointsAwarded,
            reason:      'habit_check_in',
            referenceId: $event->checkInId,
            occurredAt:  $event->occurredAt(),
        ));
    }
}
