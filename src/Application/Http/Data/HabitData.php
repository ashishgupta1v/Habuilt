<?php

declare(strict_types=1);

namespace App\Http\Data;

use DateTimeImmutable;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\Data\HabitCompletionData;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;

final class HabitData extends Data
{
    public function __construct(
        #[MapInputName('habit_id')]
        public string $habitId,
        #[MapInputName('completed_at')]
        public string|\DateTimeInterface|null $completedAt = null,
        public ?int $day = null,
        public ?int $month = null,
        public ?int $year = null,
        public ?string $source = null,
        public ?string $notes = null,
    ) {
    }

    public function toDomain(UserId $userId): HabitCompletionData
    {
        $completedAt = $this->resolveCompletedAt();

        return new HabitCompletionData(
            habitId: HabitId::from(strtoupper($this->habitId)),
            userId: $userId,
            completedAt: $completedAt,
            source: $this->source,
            notes: $this->notes,
        );
    }

    private function resolveCompletedAt(): DateTimeImmutable
    {
        if ($this->completedAt instanceof \DateTimeInterface) {
            return DateTimeImmutable::createFromInterface($this->completedAt);
        }

        if (is_string($this->completedAt) && trim($this->completedAt) !== '') {
            return new DateTimeImmutable($this->completedAt);
        }

        if ($this->day !== null) {
            $now = new DateTimeImmutable('now');

            $year = $this->year ?? (int) $now->format('Y');
            $month = $this->month ?? (int) $now->format('m');
            $day = $this->day;

            return new DateTimeImmutable(sprintf('%04d-%02d-%02d 12:00:00', $year, $month, $day));
        }

        return new DateTimeImmutable('now');
    }
}
