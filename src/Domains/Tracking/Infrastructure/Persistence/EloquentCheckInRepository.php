<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Infrastructure\Persistence;

use DateTimeImmutable;
use DateTimeInterface;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\Contracts\Repositories\CheckInRepositoryInterface;
use Habuilt\Domains\Tracking\Infrastructure\Persistence\Eloquent\EloquentCheckInModel;
use Habuilt\Domains\Tracking\Models\CheckIn;
use Habuilt\Domains\Tracking\ValueObjects\CheckInId;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;

final class EloquentCheckInRepository implements CheckInRepositoryInterface
{
    public function findByHabitAndDate(HabitId $habitId, DateTimeImmutable $completedOn): ?CheckIn
    {
        $date = $completedOn->format('Y-m-d');

        $row = EloquentCheckInModel::query()
            ->where('habit_id', $habitId->value())
            ->whereDate('completed_at', $date)
            ->first();

        return $row !== null ? $this->toDomain($row) : null;
    }

    /**
     * @return list<CheckIn>
     */
    public function findForHabitInRange(HabitId $habitId, DateTimeImmutable $from, DateTimeImmutable $to): array
    {
        return EloquentCheckInModel::query()
            ->where('habit_id', $habitId->value())
            ->whereBetween('completed_at', [
                $from->format('Y-m-d H:i:s'),
                $to->format('Y-m-d H:i:s'),
            ])
            ->orderBy('completed_at')
            ->get()
            ->map(fn (EloquentCheckInModel $row) => $this->toDomain($row))
            ->values()
            ->all();
    }

    public function save(CheckIn $checkIn): void
    {
        EloquentCheckInModel::query()->updateOrCreate(
            ['id' => $checkIn->id->value()],
            [
                'habit_id'     => $checkIn->habitId->value(),
                'user_id'      => $checkIn->userId->value(),
                'completed_at' => $checkIn->completedAt->format('Y-m-d H:i:s'),
                'created_at'   => $checkIn->createdAt->format('Y-m-d H:i:s'),
            ],
        );
    }

    public function deleteById(CheckInId $checkInId): int
    {
        return EloquentCheckInModel::query()
            ->where('id', $checkInId->value())
            ->delete();
    }

    public function clearForUserInRange(UserId $userId, DateTimeImmutable $from, DateTimeImmutable $to): int
    {
        return EloquentCheckInModel::query()
            ->where('user_id', $userId->value())
            ->whereBetween('completed_at', [
                $from->format('Y-m-d H:i:s'),
                $to->format('Y-m-d H:i:s'),
            ])
            ->delete();
    }

    // ── Private mapper ────────────────────────────────────────────────────────

    private function toDomain(EloquentCheckInModel $row): CheckIn
    {
        return new CheckIn(
            id:          CheckInId::from($row->id),
            habitId:     HabitId::from($row->habit_id),
            userId:      UserId::from($row->user_id),
            completedAt: $this->toDateTimeImmutable($row->completed_at),
            createdAt:   $this->toDateTimeImmutable($row->created_at),
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
