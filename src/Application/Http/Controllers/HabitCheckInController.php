<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\Ledger\SpaCheckInLedger;
use App\Support\CurrentUserResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Authenticated completion on the SPA ledger.
 * Browser traffic uses this same table as /api/habits/check-ins.
 * The acting user is the JWT subject, which may be a Supabase UUID.
 */
final readonly class HabitCheckInController
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
        if ($habitId === '' || strlen($habitId) > 128) {
            return response()->json(['error' => 'Invalid check-in payload'], 400);
        }

        $completedOn = (string) ($request->input('completed_on') ?: $request->input('completed_at') ?: '');
        if ($completedOn === '') {
            $year = (int) $request->input('year');
            $month = (int) $request->input('month');
            $day = (int) $request->input('day');
            if ($year >= 2000 && $month >= 1 && $month <= 12 && $day >= 1 && $day <= 31) {
                $completedOn = sprintf('%04d-%02d-%02d', $year, $month, $day);
            }
        }

        $timestamp = $completedOn !== '' ? strtotime($completedOn) : false;
        if ($timestamp === false) {
            return response()->json(['error' => 'Invalid check-in payload'], 400);
        }

        $day = (int) date('j', $timestamp);
        $monthKey = date('Y-m', $timestamp);
        $completedOn = date('Y-m-d', $timestamp);
        $points = $this->checkIns->resolvePoints($userId, $habitId, $request->input('points'), $request->exists('points'));

        $this->checkIns->record(
            $userId,
            $habitId,
            $monthKey,
            $day,
            $completedOn,
            $points,
            (string) $request->input('habit_name', ''),
            null,
            substr((string) $request->input('source', 'web'), 0, 32),
        );

        return response()->json(['success' => true]);
    }
}
