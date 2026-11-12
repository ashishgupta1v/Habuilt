<?php

declare(strict_types=1);

namespace App\Services\Ledger;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Authenticated write path for browser and API habit completions.
 * The point value is the one saved on the caller's habit or protocol.
 * A missing price is 1. Client-supplied points are ignored.
 */
final class SpaCheckInLedger
{
    public const DEFAULT_POINTS = 1;

    public const MAX_STORED_POINTS = 100;

    public function isOnSavedList(string $userId, string $habitId): bool
    {
        if ($userId === '' || $habitId === '' || !Schema::hasTable('user_settings')) {
            return false;
        }

        $settings = DB::table('user_settings')->where('user_id', $userId)->first();
        if ($settings === null) {
            return false;
        }

        return $this->pointsFromList($settings->custom_habits ?? null, $habitId) !== null;
    }

    public function resolvePoints(string $userId, string $habitId): int
    {
        $stored = $this->storedHabitPoints($userId, $habitId);
        if ($stored === null) {
            return self::DEFAULT_POINTS;
        }

        return max(self::DEFAULT_POINTS, min(self::MAX_STORED_POINTS, $stored));
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
            'habit_name', 'canonical_key', 'source', 'updated_at',
        ]);
    }

    /**
     * Insert a kept day that is not already stored.
     * An existing row, including its points, is left unchanged.
     */
    public function insertMissing(
        string $userId,
        string $habitId,
        string $monthKey,
        int $day,
        string $completedOn,
        int $points,
        string $habitName = '',
        string $source = 'guest-import',
    ): bool {
        $exists = DB::table('habit_check_ins')
            ->where('user_id', $userId)
            ->where('habit_id', $habitId)
            ->where('month_key', $monthKey)
            ->where('day', $day)
            ->exists();
        if ($exists) {
            return false;
        }

        try {
            DB::table('habit_check_ins')->insert([
                'id' => (string) Str::uuid(),
                'user_id' => $userId,
                'habit_id' => $habitId,
                'habit_name' => $habitName,
                'month_key' => $monthKey,
                'day' => $day,
                'completed_on' => $completedOn,
                'points' => $points,
                'canonical_key' => null,
                'source' => $source,
                'updated_at' => now(),
                'created_at' => now(),
            ]);
        } catch (\Throwable) {
            return false;
        }

        return true;
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
        if ($userId === '' || $habitId === '') {
            return null;
        }

        if (Schema::hasTable('user_settings')) {
            $settings = DB::table('user_settings')->where('user_id', $userId)->first();
            $fromSettings = $this->pointsFromList($settings->custom_habits ?? null, $habitId);
            if ($fromSettings !== null) {
                return $fromSettings;
            }
        }

        if (Schema::hasTable('user_protocols')) {
            $protocols = DB::table('user_protocols')->where('user_id', $userId)->get(['habits', 'slots']);
            foreach ($protocols as $protocol) {
                $fromHabits = $this->pointsFromList($protocol->habits ?? null, $habitId);
                if ($fromHabits !== null) {
                    return $fromHabits;
                }
                $fromSlots = $this->pointsFromList($protocol->slots ?? null, $habitId);
                if ($fromSlots !== null) {
                    return $fromSlots;
                }
            }
        }

        if (Schema::hasTable('habits')) {
            $row = DB::table('habits')
                ->where('user_id', $userId)
                ->get(['id', 'points_per_check_in'])
                ->first(fn (object $habit): bool => $this->sameId((string) $habit->id, $habitId));
            if ($row !== null && isset($row->points_per_check_in)) {
                return (int) $row->points_per_check_in;
            }
        }

        return null;
    }

    private function pointsFromList(mixed $value, string $habitId): ?int
    {
        $decoded = is_string($value) ? json_decode($value, true) : $value;
        if (!is_array($decoded)) {
            return null;
        }

        foreach ($decoded as $item) {
            if (!is_array($item)) {
                continue;
            }
            $id = (string) ($item['id'] ?? $item['habit_id'] ?? '');
            if (!$this->sameId($id, $habitId)) {
                continue;
            }
            if (!array_key_exists('points', $item) && !array_key_exists('points_per_check_in', $item)) {
                return self::DEFAULT_POINTS;
            }

            return (int) ($item['points'] ?? $item['points_per_check_in']);
        }

        return null;
    }

    private function sameId(string $left, string $right): bool
    {
        return $left !== '' && strtolower($left) === strtolower($right);
    }
}
