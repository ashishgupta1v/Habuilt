<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\CurrentUserResolver;
use DateTimeImmutable;
use Habuilt\Domains\Economy\Contracts\Repositories\PointTransactionRepositoryInterface;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\Contracts\Repositories\CheckInRepositoryInterface;
use Habuilt\Domains\Tracking\Contracts\Repositories\HabitRepositoryInterface;
use Habuilt\Domains\Tracking\Models\Habit;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;
use Habuilt\Shared\Domain\ValueObjects\PointValue;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

final readonly class DashboardController
{
    public function __construct(
        private HabitRepositoryInterface $habits,
        private CheckInRepositoryInterface $checkIns,
        private PointTransactionRepositoryInterface $pointTransactions,
        private CurrentUserResolver $userResolver,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $userId = $this->userResolver->resolve($request);

        $this->ensureDefaultHabits($userId);

        $today = new DateTimeImmutable('now');
        $monthStart = new DateTimeImmutable($today->format('Y-m-01 00:00:00'));
        $monthEnd = new DateTimeImmutable($today->format('Y-m-t 23:59:59'));
        $monthDays = (int) $today->format('t');

        $habitCards = array_map(
            fn (Habit $habit): array => $this->mapHabitForDashboard($habit, $monthStart, $monthEnd),
            $this->habits->findActiveByUser($userId),
        );

        return Inertia::render('Dashboard', [
            'appName' => (string) config('app.name', 'Warrior Tracker (Habuilt)'),
            'today' => $today->format('Y-m-d'),
            'month' => (int) $today->format('m'),
            'year' => (int) $today->format('Y'),
            'monthDays' => $monthDays,
            'currentDay' => (int) $today->format('j'),
            'userId' => $userId->value(),
            'wallet' => $this->walletFor($userId),
            'habits' => $habitCards,
            'legacyReferenceAvailable' => file_exists(base_path('index.html')),
        ]);
    }

    private function ensureDefaultHabits(UserId $userId): void
    {
        $existing = $this->habits->findActiveByUser($userId);

        if ($existing !== []) {
            return;
        }

        $now = new DateTimeImmutable('now');

        /** @var array<int, array{name:string,points:int}> $defaults */
        $defaults = (array) config('habuilt.default_habits', []);

        foreach ($defaults as $habit) {
            $this->habits->save(new Habit(
                id: HabitId::generate(),
                userId: $userId,
                name: $habit['name'],
                pointsPerCheckIn: new PointValue((int) $habit['points']),
                isArchived: false,
                createdAt: $now,
                updatedAt: $now,
            ));
        }
    }

    private function walletFor(UserId $userId): int
    {
        return array_reduce(
            $this->pointTransactions->findLedgerForUser($userId),
            static fn (int $carry, $transaction): int => $carry + $transaction->amount->value(),
            0,
        );
    }

    /**
     * @return array{id:string,name:string,points:int,completedToday:bool,completedDays:list<int>}
     */
    private function mapHabitForDashboard(
        Habit $habit,
        DateTimeImmutable $monthStart,
        DateTimeImmutable $monthEnd,
    ): array {
        $checkIns = $this->checkIns->findForHabitInRange($habit->id, $monthStart, $monthEnd);

        $completedDays = array_values(array_unique(array_map(
            static fn ($checkIn): int => (int) $checkIn->completedAt->format('j'),
            $checkIns,
        )));

        sort($completedDays);

        $todayDay = (int) (new DateTimeImmutable('now'))->format('j');

        return [
            'id' => $habit->id->value(),
            'name' => $habit->name,
            'points' => $habit->pointsPerCheckIn->value(),
            'completedToday' => in_array($todayDay, $completedDays, true),
            'completedDays' => $completedDays,
        ];
    }
}
