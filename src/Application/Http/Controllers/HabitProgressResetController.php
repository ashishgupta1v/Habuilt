<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ClearHabitProgressRequest;
use App\Support\CurrentUserResolver;
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

        $clearedHabitEntries = $this->clearHabitChecklistProgress->handle($userId, $year, $month);
        $clearedPointEntries = $this->pointTransactions->clearLedgerForUser($userId);

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
