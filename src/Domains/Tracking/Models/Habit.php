<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Models;

use DateTimeImmutable;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\Events\HabitCompleted;
use Habuilt\Domains\Tracking\Exceptions\HabitArchivedException;
use Habuilt\Domains\Tracking\Exceptions\HabitNotOwnedByUserException;
use Habuilt\Domains\Tracking\ValueObjects\CheckInId;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;
use Habuilt\Shared\Domain\ValueObjects\PointValue;

/**
 * The Habit entity is the aggregate root of the Tracking domain.
 *
 * Immutable by default (readonly class). All business rules protecting
 * a check-in are encoded here — not in actions or controllers.
 * The entity does NOT persist itself: persistence is the repository's job.
 */
final readonly class Habit
{
    public function __construct(
        public HabitId $id,
        public UserId $userId,
        public string $name,
        public PointValue $pointsPerCheckIn,
        public bool $isArchived,
        public DateTimeImmutable $createdAt,
        public DateTimeImmutable $updatedAt,
    ) {
    }

    // ── Query methods ─────────────────────────────────────────────────────────

    public function isOwnedBy(UserId $userId): bool
    {
        return $this->userId->equals($userId);
    }

    public function isActive(): bool
    {
        return ! $this->isArchived;
    }

    // ── Behavior ──────────────────────────────────────────────────────────────

    /**
     * Enforce ownership and active-status invariants, then emit a
     * HabitCompleted domain event. The caller is responsible for:
     *   1. Persisting the resulting CheckIn.
     *   2. Dispatching the returned event through the domain bus.
     *
     * @throws HabitNotOwnedByUserException when userId does not match.
     * @throws HabitArchivedException       when the habit has been archived.
     */
    public function complete(
        UserId $userId,
        DateTimeImmutable $completedAt,
        ?CheckInId $checkInId = null,
    ): HabitCompleted {
        if (! $this->isOwnedBy($userId)) {
            throw HabitNotOwnedByUserException::for($this->id, $userId);
        }

        if ($this->isArchived) {
            throw HabitArchivedException::for($this->id);
        }

        return HabitCompleted::record(
            checkInId:     $checkInId ?? CheckInId::generate(),
            habitId:       $this->id,
            userId:        $userId,
            pointsAwarded: $this->pointsPerCheckIn,
            occurredAt:    $completedAt,
        );
    }
}
