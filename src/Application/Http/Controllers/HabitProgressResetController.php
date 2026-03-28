<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ClearHabitProgressRequest;
use App\Support\CurrentUserResolver;
use DateTimeImmutable;
use Habuilt\Domains\Economy\Contracts\Repositories\PointTransactionRepositoryInterface;
use Habuilt\Domains\Tracking\Actions\ClearHabitChecklistProgressAction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Redirect;

final readonly class HabitProgressResetController
{
    public function __construct(
        private ClearHabitChecklistProgressAction $clearHabitChecklistProgress,
        private PointTransactionRepositoryInterface $pointTransactions,
        private CurrentUserResolver $userResolver,
    ) {
    }

    public function __invoke(ClearHabitProgressRequest $request): RedirectResponse
    {
        $userId = $this->userResolver->resolve($request);
        $month = (int) $request->integer('month');
        $year = (int) $request->integer('year');
        $monthStart = new DateTimeImmutable(sprintf('%04d-%02d-01 00:00:00', $year, $month));
        $monthEnd = $monthStart->modify('last day of this month')->setTime(23, 59, 59);

        $clearedHabitEntries = $this->clearHabitChecklistProgress->handle($userId, $year, $month);
        $clearedPointEntries = $this->pointTransactions->clearLedgerForUserInRange($userId, $monthStart, $monthEnd);

        return Redirect::route('dashboard')->with(
            'success',
            sprintf(
                'Cleared progress: %d habit check-ins and %d point transactions removed.',
                $clearedHabitEntries,
                $clearedPointEntries,
            ),
        );
    }
}
