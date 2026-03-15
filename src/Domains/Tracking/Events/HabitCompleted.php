<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Events;

use DateTimeImmutable;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\ValueObjects\CheckInId;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;
use Habuilt\Shared\Domain\Events\DomainEventInterface;
use Habuilt\Shared\Domain\ValueObjects\PointValue;
use Habuilt\Shared\Support\Uuid;

/**
 * Published by the Tracking domain whenever a user successfully completes
 * a habit check-in. All state needed for downstream listeners is embedded
 * directly in the event — no repository calls required in listeners.
 */
final readonly class HabitCompleted implements DomainEventInterface
{
    /**
     * Private: always construct through the named constructor so that
     * event IDs are generated consistently and never externally faked.
     */
    private function __construct(
        private string $eventId,
        public CheckInId $checkInId,
        public HabitId $habitId,
        public UserId $userId,
        public PointValue $pointsAwarded,
        private DateTimeImmutable $occurredAt,
    ) {
    }

    /**
     * Named constructor called by the Habit entity after domain-rule validation.
     * Generates a cryptographically-safe UUID v4 as the event identifier.
     */
    public static function record(
        CheckInId $checkInId,
        HabitId $habitId,
        UserId $userId,
        PointValue $pointsAwarded,
        DateTimeImmutable $occurredAt,
    ): self {
        return new self(
            eventId:       Uuid::generate(),
            checkInId:     $checkInId,
            habitId:       $habitId,
            userId:        $userId,
            pointsAwarded: $pointsAwarded,
            occurredAt:    $occurredAt,
        );
    }

    // ── DomainEventInterface ──────────────────────────────────────────────────

    public function eventId(): string
    {
        return $this->eventId;
    }

    public function occurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }
}
