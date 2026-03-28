<?php

declare(strict_types=1);

namespace Tests\Unit\Tracking;

use DateTimeImmutable;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\Actions\RegisterHabitCompletionAction;
use Habuilt\Domains\Tracking\Contracts\Repositories\CheckInRepositoryInterface;
use Habuilt\Domains\Tracking\Contracts\Repositories\HabitRepositoryInterface;
use Habuilt\Domains\Tracking\Data\HabitCompletionData;
use Habuilt\Domains\Tracking\Events\HabitCompleted;
use Habuilt\Domains\Tracking\Exceptions\HabitAlreadyCompletedTodayException;
use Habuilt\Domains\Tracking\Exceptions\HabitArchivedException;
use Habuilt\Domains\Tracking\Models\CheckIn;
use Habuilt\Domains\Tracking\ValueObjects\CheckInId;
use Habuilt\Domains\Tracking\Models\Habit;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;
use Habuilt\Shared\Domain\Events\DomainEventDispatcherInterface;
use Habuilt\Shared\Domain\Events\DomainEventInterface;
use Habuilt\Shared\Domain\ValueObjects\PointValue;
use PHPUnit\Framework\TestCase;

final class RegisterHabitCompletionActionTest extends TestCase
{
    private const USER_ID = '01JQ7M2X4V8K3P6R9T1W5Y7ZAB';
    private const OTHER_USER_ID = '01JQ7M2X4V8K3P6R9T1W5Y7ZAC';
    private const HABIT_ID = '01JQ7M2X4V8K3P6R9T1W5Y7ZAD';

    public function test_it_registers_check_in_and_dispatches_habit_completed_event(): void
    {
        $habit = new Habit(
            id: HabitId::from(self::HABIT_ID),
            userId: UserId::from(self::USER_ID),
            name: 'Deep Work Marathon',
            pointsPerCheckIn: new PointValue(3),
            isArchived: false,
            createdAt: new DateTimeImmutable('2026-03-01 06:00:00'),
            updatedAt: new DateTimeImmutable('2026-03-01 06:00:00'),
        );

        $habitRepository = new InMemoryHabitRepository($habit);
        $checkInRepository = new InMemoryCheckInRepository();
        $dispatcher = new FakeDispatcher();

        $action = new RegisterHabitCompletionAction(
            $habitRepository,
            $checkInRepository,
            $dispatcher,
        );

        $result = $action->handle(new HabitCompletionData(
            habitId: HabitId::from(self::HABIT_ID),
            userId: UserId::from(self::USER_ID),
            completedAt: new DateTimeImmutable('2026-03-15 07:30:00'),
            source: 'test',
            notes: null,
        ));

        self::assertSame(self::HABIT_ID, $result->habitId->value());
        self::assertSame(self::USER_ID, $result->userId->value());
        self::assertSame(3, $result->pointsAwarded->value());
        self::assertCount(1, $checkInRepository->savedCheckIns);
        self::assertCount(1, $dispatcher->events);
        self::assertInstanceOf(HabitCompleted::class, $dispatcher->events[0]);
    }

    public function test_it_rejects_duplicate_check_in_for_same_habit_same_day(): void
    {
        $habit = new Habit(
            id: HabitId::from(self::HABIT_ID),
            userId: UserId::from(self::USER_ID),
            name: 'Deep Work Marathon',
            pointsPerCheckIn: new PointValue(3),
            isArchived: false,
            createdAt: new DateTimeImmutable('2026-03-01 06:00:00'),
            updatedAt: new DateTimeImmutable('2026-03-01 06:00:00'),
        );

        $habitRepository = new InMemoryHabitRepository($habit);
        $checkInRepository = new InMemoryCheckInRepository();
        $dispatcher = new FakeDispatcher();

        $checkInRepository->seedExisting(new CheckIn(
            id: \Habuilt\Domains\Tracking\ValueObjects\CheckInId::generate(),
            habitId: HabitId::from(self::HABIT_ID),
            userId: UserId::from(self::USER_ID),
            completedAt: new DateTimeImmutable('2026-03-15 06:00:00'),
            createdAt: new DateTimeImmutable('2026-03-15 06:00:00'),
        ));

        $action = new RegisterHabitCompletionAction(
            $habitRepository,
            $checkInRepository,
            $dispatcher,
        );

        $this->expectException(HabitAlreadyCompletedTodayException::class);

        $action->handle(new HabitCompletionData(
            habitId: HabitId::from(self::HABIT_ID),
            userId: UserId::from(self::USER_ID),
            completedAt: new DateTimeImmutable('2026-03-15 20:10:00'),
        ));

        self::assertCount(0, $dispatcher->events);
    }

    public function test_it_rejects_completion_for_archived_habit(): void
    {
        $habit = new Habit(
            id: HabitId::from(self::HABIT_ID),
            userId: UserId::from(self::USER_ID),
            name: 'Archived Habit',
            pointsPerCheckIn: new PointValue(2),
            isArchived: true,
            createdAt: new DateTimeImmutable('2026-03-01 06:00:00'),
            updatedAt: new DateTimeImmutable('2026-03-01 06:00:00'),
        );

        $action = new RegisterHabitCompletionAction(
            new InMemoryHabitRepository($habit),
            new InMemoryCheckInRepository(),
            new FakeDispatcher(),
        );

        $this->expectException(HabitArchivedException::class);

        $action->handle(new HabitCompletionData(
            habitId: HabitId::from(self::HABIT_ID),
            userId: UserId::from(self::USER_ID),
            completedAt: new DateTimeImmutable('2026-03-15 09:00:00'),
        ));
    }
}

final class InMemoryHabitRepository implements HabitRepositoryInterface
{
    public function __construct(private readonly Habit $habit)
    {
    }

    public function findById(HabitId $habitId): ?Habit
    {
        return $this->habit->id->equals($habitId) ? $this->habit : null;
    }

    public function findActiveByUser(UserId $userId): array
    {
        if ($this->habit->userId->equals($userId) && ! $this->habit->isArchived) {
            return [$this->habit];
        }

        return [];
    }

    public function save(Habit $habit): void
    {
        // Not needed for these tests.
    }
}

final class InMemoryCheckInRepository implements CheckInRepositoryInterface
{
    /** @var list<CheckIn> */
    public array $savedCheckIns = [];

    /** @var list<CheckIn> */
    private array $seeded = [];

    public function seedExisting(CheckIn $checkIn): void
    {
        $this->seeded[] = $checkIn;
    }

    public function findByHabitAndDate(HabitId $habitId, DateTimeImmutable $completedOn): ?CheckIn
    {
        $targetDay = $completedOn->format('Y-m-d');

        foreach (array_merge($this->seeded, $this->savedCheckIns) as $checkIn) {
            if ($checkIn->habitId->equals($habitId) && $checkIn->completedAt->format('Y-m-d') === $targetDay) {
                return $checkIn;
            }
        }

        return null;
    }

    public function findForHabitInRange(HabitId $habitId, DateTimeImmutable $from, DateTimeImmutable $to): array
    {
        return array_values(array_filter(
            array_merge($this->seeded, $this->savedCheckIns),
            static fn (CheckIn $checkIn): bool => $checkIn->habitId->equals($habitId)
                && $checkIn->completedAt >= $from
                && $checkIn->completedAt <= $to,
        ));
    }

    public function save(CheckIn $checkIn): void
    {
        $this->savedCheckIns[] = $checkIn;
    }

    public function deleteById(CheckInId $checkInId): int
    {
        $removed = 0;

        $this->seeded = array_values(array_filter(
            $this->seeded,
            static function (CheckIn $checkIn) use ($checkInId, &$removed): bool {
                if ($checkIn->id->equals($checkInId)) {
                    $removed += 1;

                    return false;
                }

                return true;
            },
        ));

        $this->savedCheckIns = array_values(array_filter(
            $this->savedCheckIns,
            static function (CheckIn $checkIn) use ($checkInId, &$removed): bool {
                if ($checkIn->id->equals($checkInId)) {
                    $removed += 1;

                    return false;
                }

                return true;
            },
        ));

        return $removed;
    }

    public function clearForUserInRange(UserId $userId, DateTimeImmutable $from, DateTimeImmutable $to): int
    {
        $all = array_merge($this->seeded, $this->savedCheckIns);
        $kept = [];
        $removed = 0;

        foreach ($all as $checkIn) {
            $matchesUser = $checkIn->userId->equals($userId);
            $isInRange = $checkIn->completedAt >= $from && $checkIn->completedAt <= $to;

            if ($matchesUser && $isInRange) {
                $removed += 1;
                continue;
            }

            $kept[] = $checkIn;
        }

        $this->seeded = $kept;
        $this->savedCheckIns = [];

        return $removed;
    }
}

final class FakeDispatcher implements DomainEventDispatcherInterface
{
    /** @var list<DomainEventInterface> */
    public array $events = [];

    public function dispatch(DomainEventInterface ...$events): void
    {
        foreach ($events as $event) {
            $this->events[] = $event;
        }
    }
}
