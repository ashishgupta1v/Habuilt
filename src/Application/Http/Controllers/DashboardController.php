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
    private const PAST_MONTH_LIMIT = 12;
    private const FUTURE_MONTH_LIMIT = 6;

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
        $currentMonthStart = new DateTimeImmutable($today->format('Y-m-01 00:00:00'));
        $minMonthStart = $currentMonthStart->modify(sprintf('-%d months', self::PAST_MONTH_LIMIT));
        $maxMonthStart = $currentMonthStart->modify(sprintf('+%d months', self::FUTURE_MONTH_LIMIT));

        $requestedMonth = $request->integer('month');
        $requestedYear = $request->integer('year');

        $selectedMonthStart = $this->resolveSelectedMonthStart(
            $requestedYear,
            $requestedMonth,
            $currentMonthStart,
            $minMonthStart,
            $maxMonthStart,
        );

        $selectedMonthEnd = $selectedMonthStart->modify('last day of this month')->setTime(23, 59, 59);
        $monthDays = (int) $selectedMonthStart->format('t');
        $isCurrentMonth = $selectedMonthStart->format('Y-m') === $currentMonthStart->format('Y-m');
        $isFutureMonth = $selectedMonthStart > $currentMonthStart;

        $currentDay = $isCurrentMonth
            ? (int) $today->format('j')
            : ($isFutureMonth ? 1 : $monthDays);

        $habitCards = array_map(
            fn (Habit $habit): array => $this->mapHabitForDashboard($habit, $selectedMonthStart, $selectedMonthEnd, $currentDay),
            $this->habits->findActiveByUser($userId),
        );

        $previousMonth = $selectedMonthStart->modify('-1 month');
        $nextMonth = $selectedMonthStart->modify('+1 month');

        return Inertia::render('Dashboard', [
            'appName' => (string) config('app.name', 'Warrior Tracker (Habuilt)'),
            'today' => $today->format('Y-m-d'),
            'month' => (int) $selectedMonthStart->format('m'),
            'year' => (int) $selectedMonthStart->format('Y'),
            'monthDays' => $monthDays,
            'currentDay' => $currentDay,
            'isCurrentMonth' => $isCurrentMonth,
            'isFutureMonth' => $isFutureMonth,
            'canNavigatePrevMonth' => $selectedMonthStart > $minMonthStart,
            'canNavigateNextMonth' => $selectedMonthStart < $maxMonthStart,
            'previousMonth' => [
                'month' => (int) $previousMonth->format('m'),
                'year' => (int) $previousMonth->format('Y'),
            ],
            'nextMonth' => [
                'month' => (int) $nextMonth->format('m'),
                'year' => (int) $nextMonth->format('Y'),
            ],
            'userId' => $userId->value(),
            'wallet' => $this->walletCarryForwardToMonth($userId, $selectedMonthEnd),
            'habits' => $habitCards,
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

    private function walletCarryForwardToMonth(UserId $userId, DateTimeImmutable $selectedMonthEnd): int
    {
        $ledgerStart = new DateTimeImmutable('2000-01-01 00:00:00');

        return array_reduce(
            $this->pointTransactions->findLedgerForUserInRange($userId, $ledgerStart, $selectedMonthEnd),
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
        int $currentDay,
    ): array {
        $checkIns = $this->checkIns->findForHabitInRange($habit->id, $monthStart, $monthEnd);

        $completedDays = array_values(array_unique(array_map(
            static fn ($checkIn): int => (int) $checkIn->completedAt->format('j'),
            $checkIns,
        )));

        sort($completedDays);

        return [
            'id' => $habit->id->value(),
            'name' => $habit->name,
            'points' => $habit->pointsPerCheckIn->value(),
            'completedToday' => in_array($currentDay, $completedDays, true),
            'completedDays' => $completedDays,
        ];
    }

    private function resolveSelectedMonthStart(
        int $year,
        int $month,
        DateTimeImmutable $currentMonthStart,
        DateTimeImmutable $minMonthStart,
        DateTimeImmutable $maxMonthStart,
    ): DateTimeImmutable {
        if ($month < 1 || $month > 12 || $year < 2000 || $year > 2100) {
            return $currentMonthStart;
        }

        $selected = new DateTimeImmutable(sprintf('%04d-%02d-01 00:00:00', $year, $month));

        if ($selected < $minMonthStart) {
            return $minMonthStart;
        }

        if ($selected > $maxMonthStart) {
            return $maxMonthStart;
        }

        return $selected;
    }
}
