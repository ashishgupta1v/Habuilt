<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Contracts\Repositories;

use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\Models\Habit;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;

interface HabitRepositoryInterface
{
    public function findById(HabitId $habitId): ?Habit;

    /**
     * @return list<Habit>
     */
    public function findActiveByUser(UserId $userId): array;

    public function save(Habit $habit): void;
}
