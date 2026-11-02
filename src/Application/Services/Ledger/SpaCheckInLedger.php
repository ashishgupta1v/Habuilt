<?php

declare(strict_types=1);

namespace App\Services\Ledger;

use Habuilt\Shared\Support\Ulid;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Authenticated write path for browser and API habit completions.
 * Points come from the caller's stored habit row when one exists.
 * Otherwise a client-supplied value is clamped to a small range.
 */
final class SpaCheckInLedger
{
    public const MAX_CLIENT_POINTS = 100;

    public function resolvePoints(string $userId, string $habitId, mixed $clientPoints, bool $pointsProvided): int
    {
        $stored = $this->storedHabitPoints($userId, $habitId);
        if ($stored !== null) {
            return max(0, min(self::MAX_CLIENT_POINTS, $stored));
        }

        $points = ($pointsProvided && is_numeric($clientPoints)) ? (int) $clientPoints : 1;
        if ($points < 0) {
            $points = 0;
        }
        if ($points > self::MAX_CLIENT_POINTS) {
            $points = self::MAX_CLIENT_POINTS;
        }

        return $points;
    }

    public function record(
        string $userId,
        string $habitId,
        string $monthKey,
        int $day,
        string $completedOn,
        int $points,
        string $habitName = '',
        ?string $canonicalKey = null,
        string $source = 'web',
    ): void {
        DB::table('habit_check_ins')->upsert([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'habit_id' => $habitId,
            'habit_name' => $habitName,
            'month_key' => $monthKey,
            'day' => $day,
            'completed_on' => $completedOn,
            'points' => $points,
            'canonical_key' => $canonicalKey,
            'source' => $source,
            'updated_at' => now(),
            'created_at' => now(),
        ], ['user_id', 'habit_id', 'month_key', 'day'], [
            'habit_name', 'points', 'canonical_key', 'source', 'updated_at',
        ]);
    }

    public function remove(string $userId, string $habitId, string $monthKey, int $day): void
    {
        DB::table('habit_check_ins')
            ->where('user_id', $userId)
            ->where('habit_id', $habitId)
            ->where('month_key', $monthKey)
            ->where('day', $day)
            ->delete();
    }

    public function clearMonth(string $userId, string $monthKey): int
    {
        return DB::table('habit_check_ins')
            ->where('user_id', $userId)
            ->where('month_key', $monthKey)
            ->delete();
    }

    private function storedHabitPoints(string $userId, string $habitId): ?int
    {
        if (!Ulid::isValid($userId) || !Ulid::isValid($habitId) || !Schema::hasTable('habits')) {
            return null;
        }

        $row = DB::table('habits')
            ->where('id', strtoupper($habitId))
            ->where('user_id', strtoupper($userId))
            ->first();

        if ($row === null || !isset($row->points_per_check_in)) {
            return null;
        }

        return (int) $row->points_per_check_in;
    }
}
