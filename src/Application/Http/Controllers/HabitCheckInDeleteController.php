<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\Ledger\SpaCheckInLedger;
use App\Support\CurrentUserResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final readonly class HabitCheckInDeleteController
{
    public function __construct(
        private SpaCheckInLedger $checkIns,
    ) {
    }

    public function __invoke(Request $request, string $habit): JsonResponse
    {
        $userId = trim((string) $request->attributes->get('auth_user_id', ''));
        if ($userId === '' || CurrentUserResolver::isGuestSubject($userId)) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $habitId = trim($habit);
        $when = $this->resolveWhen($request);
        if ($habitId === '' || $when === null) {
            return response()->json(['error' => 'Invalid check-in removal payload'], 400);
        }

        $this->checkIns->remove($userId, $habitId, $when['month_key'], $when['day']);

        return response()->json(['success' => true]);
    }

    /**
     * @return array{month_key: string, day: int}|null
     */
    private function resolveWhen(Request $request): ?array
    {
        $completedOn = (string) ($request->input('completed_on') ?: '');
        if ($completedOn !== '') {
            $timestamp = strtotime($completedOn);
            if ($timestamp === false) {
                return null;
            }

            return [
                'month_key' => date('Y-m', $timestamp),
                'day' => (int) date('j', $timestamp),
            ];
        }

        $year = (int) $request->input('year');
        $month = (int) $request->input('month');
        $day = (int) $request->input('day');
        if ($year < 2000 || $year > 2100 || $month < 1 || $month > 12 || $day < 1 || $day > 31) {
            return null;
        }

        return [
            'month_key' => sprintf('%04d-%02d', $year, $month),
            'day' => $day,
        ];
    }
}
