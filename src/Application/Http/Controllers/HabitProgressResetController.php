<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\Ledger\SpaCheckInLedger;
use App\Support\CurrentUserResolver;
use DateTimeImmutable;
use Habuilt\Domains\Economy\Contracts\Repositories\PointTransactionRepositoryInterface;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\Actions\ClearHabitChecklistProgressAction;
use Habuilt\Shared\Support\Ulid;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

final readonly class HabitProgressResetController
{
    public function __construct(
        private SpaCheckInLedger $checkIns,
        private ClearHabitChecklistProgressAction $clearHabitChecklistProgress,
        private PointTransactionRepositoryInterface $pointTransactions,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $userId = trim((string) $request->attributes->get('auth_user_id', ''));
        if ($userId === '' || CurrentUserResolver::isGuestSubject($userId)) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $month = (int) $request->input('month');
        $year = (int) $request->input('year');
        if ($month < 1 || $month > 12 || $year < 2000 || $year > 2100) {
            return response()->json(['error' => 'Invalid progress reset payload'], 400);
        }

        $monthKey = sprintf('%04d-%02d', $year, $month);
        $clearedLedger = 0;
        if (Schema::hasTable('habit_check_ins')) {
            $clearedLedger = $this->checkIns->clearMonth($userId, $monthKey);
        }

        $clearedDomain = 0;
        $clearedPoints = 0;
        if (Ulid::isValid($userId) && Schema::hasTable('check_ins') && Schema::hasTable('point_transactions')) {
            $domainUser = UserId::from($userId);
            $monthStart = new DateTimeImmutable(sprintf('%04d-%02d-01 00:00:00', $year, $month));
            $monthEnd = $monthStart->modify('last day of this month')->setTime(23, 59, 59);
            $clearedDomain = $this->clearHabitChecklistProgress->handle($domainUser, $year, $month);
            $clearedPoints = $this->pointTransactions->clearLedgerForUserInRange($domainUser, $monthStart, $monthEnd);
        }

        return response()->json([
            'success' => true,
            'cleared_check_ins' => $clearedLedger,
            'cleared_domain_check_ins' => $clearedDomain,
            'cleared_point_transactions' => $clearedPoints,
        ]);
    }
}
