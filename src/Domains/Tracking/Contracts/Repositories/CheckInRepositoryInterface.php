<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Contracts\Repositories;

use DateTimeImmutable;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\Models\CheckIn;
use Habuilt\Domains\Tracking\ValueObjects\CheckInId;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;

interface CheckInRepositoryInterface
{
    public function findByHabitAndDate(HabitId $habitId, DateTimeImmutable $completedOn): ?CheckIn;

    /**
     * @return list<CheckIn>
     */
    public function findForHabitInRange(HabitId $habitId, DateTimeImmutable $from, DateTimeImmutable $to): array;

    public function save(CheckIn $checkIn): void;

    public function deleteById(CheckInId $checkInId): int;

    public function clearForUserInRange(UserId $userId, DateTimeImmutable $from, DateTimeImmutable $to): int;
}
