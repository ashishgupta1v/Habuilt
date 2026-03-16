<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Infrastructure\Persistence;

use DateTimeImmutable;
use DateTimeInterface;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\Contracts\Repositories\HabitRepositoryInterface;
use Habuilt\Domains\Tracking\Infrastructure\Persistence\Eloquent\EloquentHabitModel;
use Habuilt\Domains\Tracking\Models\Habit;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;
use Habuilt\Shared\Domain\ValueObjects\PointValue;

final class EloquentHabitRepository implements HabitRepositoryInterface
{
    public function findById(HabitId $habitId): ?Habit
    {
        $row = EloquentHabitModel::query()->find($habitId->value());

        return $row !== null ? $this->toDomain($row) : null;
    }

    /**
     * @return list<Habit>
     */
    public function findActiveByUser(UserId $userId): array
    {
        return EloquentHabitModel::query()
            ->where('user_id', $userId->value())
            ->where('is_archived', false)
            ->get()
            ->map(fn (EloquentHabitModel $row) => $this->toDomain($row))
            ->values()
            ->all();
    }

    public function save(Habit $habit): void
    {
        EloquentHabitModel::query()->updateOrCreate(
            ['id' => $habit->id->value()],
            [
                'user_id'             => $habit->userId->value(),
                'name'                => $habit->name,
                'points_per_check_in' => $habit->pointsPerCheckIn->value(),
                'is_archived'         => $habit->isArchived,
                'created_at'          => $habit->createdAt->format('Y-m-d H:i:s'),
                'updated_at'          => $habit->updatedAt->format('Y-m-d H:i:s'),
            ],
        );
    }

    // ── Private mapper ────────────────────────────────────────────────────────

    private function toDomain(EloquentHabitModel $row): Habit
    {
        return new Habit(
            id:              HabitId::from($row->id),
            userId:          UserId::from($row->user_id),
            name:            $row->name,
            pointsPerCheckIn: new PointValue((int) $row->points_per_check_in),
            isArchived:      (bool) $row->is_archived,
            createdAt:       $this->toDateTimeImmutable($row->created_at),
            updatedAt:       $this->toDateTimeImmutable($row->updated_at),
        );
    }

    private function toDateTimeImmutable(mixed $value): DateTimeImmutable
    {
        if ($value instanceof DateTimeInterface) {
            return DateTimeImmutable::createFromInterface($value);
        }

        return new DateTimeImmutable((string) $value);
    }
}
