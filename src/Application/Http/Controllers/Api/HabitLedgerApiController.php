<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class HabitLedgerApiController
{
    /**
     * Get check-ins for a user (optionally filtered by month).
     */
    public function getCheckIns(Request $request): JsonResponse
    {
        $userId = (string) $request->input('user_id');
        if ($userId === '') {
            return response()->json(['error' => 'user_id required'], 400);
        }

        $query = DB::table('habit_check_ins')->where('user_id', $userId);

        if ($request->has('month_key') && $request->input('month_key') !== '') {
            $query->where('month_key', (string) $request->input('month_key'));
        }

        $records = $query->orderBy('day', 'asc')->get();

        return response()->json($records);
    }

    /**
     * Record/upsert a habit check-in.
     */
    public function recordCheckIn(Request $request): JsonResponse
    {
        $userId = (string) $request->input('user_id');
        $habitId = (string) $request->input('habit_id');
        $monthKey = (string) $request->input('month_key');
        $day = (int) $request->input('day');

        if ($userId === '' || $habitId === '' || $monthKey === '' || $day < 1 || $day > 31) {
            return response()->json(['error' => 'Invalid check-in payload'], 400);
        }

        $completedOn = (string) ($request->input('completed_on') ?: sprintf('%s-%02d', $monthKey, $day));
        $points = (int) ($request->input('points') ?: 1);
        $habitName = (string) $request->input('habit_name', '');
        $canonicalKey = $request->input('canonical_key');
        $source = (string) $request->input('source', 'web');

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
            'habit_name', 'points', 'canonical_key', 'source', 'updated_at'
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Remove a habit check-in.
     */
    public function removeCheckIn(Request $request): JsonResponse
    {
        $userId = (string) $request->input('user_id');
        $habitId = (string) $request->input('habit_id');
        $monthKey = (string) $request->input('month_key');
        $day = (int) $request->input('day');

        if ($userId === '' || $habitId === '' || $monthKey === '' || $day < 1) {
            return response()->json(['error' => 'Invalid check-in removal payload'], 400);
        }

        DB::table('habit_check_ins')
            ->where('user_id', $userId)
            ->where('habit_id', $habitId)
            ->where('month_key', $monthKey)
            ->where('day', $day)
            ->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Get user settings.
     */
    public function getUserSettings(Request $request): JsonResponse
    {
        $userId = (string) $request->input('user_id');
        if ($userId === '') {
            return response()->json(null);
        }

        $record = DB::table('user_settings')->where('user_id', $userId)->first();
        if (!$record) {
            return response()->json(null);
        }

        $data = (array) $record;
        foreach (['progressive_settings', 'custom_habits', 'rewards', 'reward_ledger', 'weekly_reviews', 'enhanced_state'] as $jsonCol) {
            if (isset($data[$jsonCol]) && is_string($data[$jsonCol])) {
                $data[$jsonCol] = json_decode($data[$jsonCol], true);
            }
        }

        return response()->json($data);
    }

    /**
     * Save user settings.
     */
    public function saveUserSettings(Request $request): JsonResponse
    {
        $userId = (string) $request->input('user_id');
        if ($userId === '') {
            return response()->json(['error' => 'user_id required'], 400);
        }

        $payload = [
            'user_id' => $userId,
            'progressive_settings' => json_encode($request->input('progressive_settings', (object) [])),
            'custom_habits' => json_encode($request->input('custom_habits', [])),
            'rewards' => json_encode($request->input('rewards', [])),
            'reward_ledger' => json_encode($request->input('reward_ledger', [])),
            'weekly_reviews' => json_encode($request->input('weekly_reviews', (object) [])),
            'enhanced_state' => json_encode($request->input('enhanced_state', (object) [])),
            'day_type' => (string) $request->input('day_type', 'home'),
            'dark_mode' => (bool) $request->input('dark_mode', true),
            'updated_at' => now(),
        ];

        DB::table('user_settings')->upsert($payload, ['user_id'], [
            'progressive_settings', 'custom_habits', 'rewards', 'reward_ledger',
            'weekly_reviews', 'enhanced_state', 'day_type', 'dark_mode', 'updated_at'
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Get user custom protocols.
     */
    public function getUserProtocols(Request $request): JsonResponse
    {
        $userId = (string) $request->input('user_id');
        if ($userId === '') {
            return response()->json([]);
        }

        $protocols = DB::table('user_protocols')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        $result = [];
        foreach ($protocols as $p) {
            $row = (array) $p;
            if (isset($row['slots']) && is_string($row['slots'])) {
                $row['slots'] = json_decode($row['slots'], true);
            }
            if (isset($row['habits']) && is_string($row['habits'])) {
                $row['habits'] = json_decode($row['habits'], true);
            }
            $result[] = $row;
        }

        return response()->json($result);
    }

    /**
     * Save/upsert custom user protocol.
     */
    public function saveUserProtocol(Request $request): JsonResponse
    {
        $userId = (string) $request->input('user_id');
        $id = (string) ($request->input('id') ?: Str::uuid());

        if ($userId === '') {
            return response()->json(['error' => 'user_id required'], 400);
        }

        DB::table('user_protocols')->upsert([
            'id' => $id,
            'user_id' => $userId,
            'name' => (string) $request->input('name', 'Custom Protocol'),
            'archetype' => (string) $request->input('archetype', 'custom'),
            'description' => $request->input('description'),
            'wake_time' => (string) $request->input('wake_time', '05:00'),
            'sleep_time' => (string) $request->input('sleep_time', '22:00'),
            'work_start' => (string) $request->input('work_start', '08:30'),
            'work_end' => (string) $request->input('work_end', '18:30'),
            'is_active' => (bool) $request->input('is_active', true),
            'slots' => json_encode($request->input('slots', [])),
            'habits' => json_encode($request->input('habits', [])),
            'updated_at' => now(),
            'created_at' => now(),
        ], ['id'], [
            'name', 'archetype', 'description', 'wake_time', 'sleep_time',
            'work_start', 'work_end', 'is_active', 'slots', 'habits', 'updated_at'
        ]);

        return response()->json(['success' => true, 'id' => $id]);
    }

    /**
     * Delete custom user protocol.
     */
    public function deleteUserProtocol(string $id): JsonResponse
    {
        DB::table('user_protocols')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    /**
     * Get user biomarkers.
     */
    public function getUserBiomarkers(Request $request): JsonResponse
    {
        $userId = (string) $request->input('user_id');
        if ($userId === '') {
            return response()->json([]);
        }

        $query = DB::table('user_biomarkers')->where('user_id', $userId);
        if ($request->boolean('latest')) {
            $latest = $query->orderBy('log_date', 'desc')->first();
            return response()->json($latest);
        }

        return response()->json($query->orderBy('log_date', 'desc')->limit(30)->get());
    }

    /**
     * Save user biomarker.
     */
    public function saveUserBiomarker(Request $request): JsonResponse
    {
        $userId = (string) $request->input('user_id');
        $logDate = (string) $request->input('log_date');

        if ($userId === '' || $logDate === '') {
            return response()->json(['error' => 'user_id and log_date required'], 400);
        }

        DB::table('user_biomarkers')->upsert([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'log_date' => $logDate,
            'stiffness_minutes' => (int) $request->input('stiffness_minutes', 0),
            'hydration_ml' => (int) $request->input('hydration_ml', 0),
            'energy_level' => $request->input('energy_level'),
            'sleep_hours' => $request->input('sleep_hours', 0),
            'notes' => $request->input('notes'),
            'updated_at' => now(),
            'created_at' => now(),
        ], ['user_id', 'log_date'], [
            'stiffness_minutes', 'hydration_ml', 'energy_level', 'sleep_hours', 'notes', 'updated_at'
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Get partner connections.
     */
    public function getPartnerConnections(Request $request): JsonResponse
    {
        $userId = (string) $request->input('user_id');
        if ($userId === '') {
            return response()->json([]);
        }

        $records = DB::table('partner_connections')
            ->where('user_id', $userId)
            ->orWhere('partner_user_id', $userId)
            ->get();

        return response()->json($records);
    }

    /**
     * Save partner connection.
     */
    public function savePartnerConnection(Request $request): JsonResponse
    {
        $inviteCode = (string) $request->input('invite_code');
        if ($inviteCode === '') {
            return response()->json(['error' => 'invite_code required'], 400);
        }

        DB::table('partner_connections')->upsert([
            'id' => (string) Str::uuid(),
            'user_id' => (string) $request->input('user_id'),
            'partner_user_id' => $request->input('partner_user_id'),
            'invite_code' => $inviteCode,
            'status' => (string) $request->input('status', 'pending'),
            'alias' => $request->input('alias'),
            'permissions' => json_encode($request->input('permissions', (object) [])),
            'updated_at' => now(),
            'created_at' => now(),
        ], ['invite_code'], [
            'partner_user_id', 'status', 'alias', 'permissions', 'updated_at'
        ]);

        return response()->json(['success' => true]);
    }
}
