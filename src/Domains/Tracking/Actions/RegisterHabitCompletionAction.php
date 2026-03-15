<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Actions;

use DateTimeImmutable;
use Habuilt\Domains\Tracking\Contracts\Repositories\CheckInRepositoryInterface;
use Habuilt\Domains\Tracking\Contracts\Repositories\HabitRepositoryInterface;
use Habuilt\Domains\Tracking\Data\HabitCompletionData;
use Habuilt\Domains\Tracking\Data\HabitCompletionResultData;
use Habuilt\Domains\Tracking\Exceptions\HabitAlreadyCompletedTodayException;
use Habuilt\Domains\Tracking\Models\CheckIn;
use Habuilt\Domains\Tracking\ValueObjects\CheckInId;
use Habuilt\Shared\Domain\Events\DomainEventDispatcherInterface;
use RuntimeException;

/**
 * Orchestrates a single habit check-in from start to finish.
 *
 * Responsibilities:
 *   1. Resolve the Habit aggregate by ID.
 *   2. Guard against duplicate check-ins on the same calendar day.
 *   3. Delegate domain-rule validation to Habit::complete().
 *   4. Persist the resulting CheckIn.
 *   5. Dispatch the HabitCompleted domain event for cross-context listeners.
 *   6. Return a typed result DTO to the caller.
 *
 * This class must remain free of HTTP, queue, or view concerns.
 */
final readonly class RegisterHabitCompletionAction
{
    public function __construct(
        private HabitRepositoryInterface $habits,
        private CheckInRepositoryInterface $checkIns,
        private DomainEventDispatcherInterface $dispatcher,
    ) {
    }

    /**
     * @throws RuntimeException                         when the habit does not exist.
     * @throws HabitAlreadyCompletedTodayException      on duplicate check-in within same day.
     * @throws \Habuilt\Domains\Tracking\Exceptions\HabitNotOwnedByUserException
     * @throws \Habuilt\Domains\Tracking\Exceptions\HabitArchivedException
     */
    public function handle(HabitCompletionData $data): HabitCompletionResultData
    {
        // ── 1. Load aggregate ─────────────────────────────────────────────────────
        $habit = $this->habits->findById($data->habitId)
            ?? throw new RuntimeException(
                "Habit [{$data->habitId}] not found.",
            );

        // ── 2. Idempotency guard — one check-in per habit per calendar day ────
        $dayBoundary = DateTimeImmutable::createFromFormat(
            'Y-m-d H:i:s',
            $data->completedAt->format('Y-m-d') . ' 00:00:00',
        );

        if ($this->checkIns->findByHabitAndDate($data->habitId, $dayBoundary) !== null) {
            throw HabitAlreadyCompletedTodayException::for(
                $data->habitId,
                $data->completedAt->format('Y-m-d'),
            );
        }

        // ── 3. Domain rule enforcement + event creation (inside Habit) ────────
        $checkInId = CheckInId::generate();
        $event     = $habit->complete(
            userId:      $data->userId,
            completedAt: $data->completedAt,
            checkInId:   $checkInId,
        );

        // ── 4. Persist the check-in ───────────────────────────────────────────
        $this->checkIns->save(new CheckIn(
            id:          $checkInId,
            habitId:     $data->habitId,
            userId:      $data->userId,
            completedAt: $data->completedAt,
            createdAt:   new DateTimeImmutable(),
        ));

        // ── 5. Broadcast domain event (Economy will listen) ─────────────────
        $this->dispatcher->dispatch($event);

        // ── 6. Return typed result ──────────────────────────────────────────
        return new HabitCompletionResultData(
            checkInId:    $checkInId,
            habitId:      $data->habitId,
            userId:       $data->userId,
            completedAt:  $data->completedAt,
            pointsAwarded: $event->pointsAwarded,
        );
    }
}
