<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Services\Ledger\SpaCheckInLedger;
use App\Support\BrowserRefreshCookie;
use App\Support\CurrentUserResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

final class HabitLedgerApiController
{
    public function __construct(
        private readonly SpaCheckInLedger $checkIns,
    ) {
    }

    /**
     * Get check-ins for the signed-in user (optionally filtered by month).
     */
    public function getCheckIns(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $query = DB::table('habit_check_ins')->where('user_id', $userId);

        if ($request->has('month_key') && $request->input('month_key') !== '') {
            $query->where('month_key', (string) $request->input('month_key'));
        }

        $records = $query->orderBy('day', 'asc')->get();

        return response()->json($records);
    }

    /**
     * Record/upsert a habit check-in for the signed-in user.
     */
    public function recordCheckIn(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $habitId = (string) $request->input('habit_id');
        $monthKey = (string) $request->input('month_key');
        $day = (int) $request->input('day');

        if ($habitId === '' || $monthKey === '' || $day < 1 || $day > 31) {
            return response()->json(['error' => 'Invalid check-in payload'], 400);
        }

        $completedOn = (string) ($request->input('completed_on') ?: sprintf('%s-%02d', $monthKey, $day));
        $points = $this->checkIns->resolvePoints($userId, $habitId);
        $habitName = (string) $request->input('habit_name', '');
        $canonicalKey = $request->input('canonical_key');
        $source = (string) $request->input('source', 'web');

        $this->checkIns->record(
            $userId,
            $habitId,
            $monthKey,
            $day,
            $completedOn,
            $points,
            $habitName,
            is_string($canonicalKey) ? $canonicalKey : null,
            $source,
        );

        return response()->json(['success' => true]);
    }

    /**
     * Remove a habit check-in owned by the signed-in user.
     */
    public function removeCheckIn(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $habitId = (string) $request->input('habit_id');
        $monthKey = (string) $request->input('month_key');
        $day = (int) $request->input('day');

        if ($habitId === '' || $monthKey === '' || $day < 1) {
            return response()->json(['error' => 'Invalid check-in removal payload'], 400);
        }

        $this->checkIns->remove($userId, $habitId, $monthKey, $day);

        return response()->json(['success' => true]);
    }

    /**
     * Get user settings.
     */
    public function getUserSettings(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
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
     * Save the habit definition and the personal Sunday review.
     * Omitted columns stay as they are. updated_at is the server clock.
     */
    public function saveUserSettings(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $writesHabits = $request->exists('custom_habits');
        $writesReviews = $request->exists('weekly_reviews');
        if ($writesHabits && !is_array($request->input('custom_habits'))) {
            return response()->json(['error' => 'custom_habits must be a list'], 422);
        }
        if ($writesReviews && !is_array($request->input('weekly_reviews'))) {
            return response()->json(['error' => 'weekly_reviews must be an object'], 422);
        }

        $existing = DB::table('user_settings')->where('user_id', $userId)->first();
        if (!$writesHabits && !$writesReviews) {
            return response()->json([
                'success' => true,
                'updated_at' => $existing->updated_at ?? null,
            ]);
        }

        $incomingHabits = $writesHabits ? $this->habitDefinitions($request->input('custom_habits')) : null;
        $incomingReview = $writesReviews ? $this->personalReviewDocument($request->input('weekly_reviews')) : null;
        $deliberate = is_array($incomingReview) && ($incomingReview['listSaved'] ?? false) === true;

        // An unmarked empty list is the old wiped row, not a deliberate blank checklist.
        if ($writesHabits && $incomingHabits === [] && !$deliberate) {
            $writesHabits = false;
        }
        if ($writesReviews && $this->reviewIsUnmarkedBlank($incomingReview)) {
            $writesReviews = false;
        }
        if (!$writesHabits && !$writesReviews) {
            return response()->json([
                'success' => true,
                'updated_at' => $existing->updated_at ?? null,
            ]);
        }

        if ($writesReviews) {
            $incomingReview['listSaved'] = true;
            if (($incomingReview['reflections'] ?? []) === []) {
                $incomingReview['reflections'] = new \stdClass();
            }
        }

        $expected = $request->exists('expected_updated_at') ? $request->input('expected_updated_at') : null;
        if (!$this->updatedAtMatches($existing->updated_at ?? null, $expected)) {
            Log::warning('Dropped settings retry because updated_at moved');

            return $this->settingsConflict($existing);
        }

        $update = ['updated_at' => now()];
        if ($writesHabits) {
            $update['custom_habits'] = json_encode(array_values($incomingHabits), JSON_UNESCAPED_UNICODE);
        }
        if ($writesReviews) {
            $update['weekly_reviews'] = json_encode($incomingReview, JSON_UNESCAPED_UNICODE);
        }

        if ($existing === null) {
            $update['user_id'] = $userId;
            $update['created_at'] = $update['updated_at'];
            try {
                DB::table('user_settings')->insert($update);
            } catch (\Throwable) {
                $current = DB::table('user_settings')->where('user_id', $userId)->first();
                Log::warning('Dropped settings retry because updated_at moved');

                return $this->settingsConflict($current);
            }
        } else {
            $query = DB::table('user_settings')->where('user_id', $userId);
            if ($existing->updated_at === null) {
                $query->whereNull('updated_at');
            } else {
                $query->where('updated_at', $existing->updated_at);
            }
            $wrote = $query->update($update);
            if ($wrote !== 1) {
                $current = DB::table('user_settings')->where('user_id', $userId)->first();
                if (!$current || !$this->updatedAtMatches($current->updated_at, $existing->updated_at)) {
                    Log::warning('Dropped settings retry because updated_at moved');

                    return $this->settingsConflict($current);
                }
                DB::table('user_settings')->where('user_id', $userId)->update($update);
            }
        }

        $storedAt = DB::table('user_settings')->where('user_id', $userId)->value('updated_at');

        return response()->json([
            'success' => true,
            'updated_at' => $storedAt,
        ]);
    }

    /**
     * Import this phone's guest definitions and missing kept days once.
     * A saved account list is left unchanged. Existing check-in points stay put.
     */
    public function importGuest(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        if ($request->exists('custom_habits') && !is_array($request->input('custom_habits'))) {
            return response()->json(['error' => 'custom_habits must be a list'], 422);
        }
        if ($request->exists('weekly_reviews') && !is_array($request->input('weekly_reviews'))) {
            return response()->json(['error' => 'weekly_reviews must be an object'], 422);
        }

        $keptDays = $this->guestKeptDays($request->input('kept_days'));
        $result = ['kind' => 'skipped', 'updated_at' => null, 'row' => null];

        DB::transaction(function () use ($request, $userId, $keptDays, &$result): void {
            $existing = DB::table('user_settings')->where('user_id', $userId)->first();
            $storedReview = $this->decodeStoredReview($existing);
            if (($storedReview['listSaved'] ?? false) === true) {
                $result = [
                    'kind' => 'skipped',
                    'updated_at' => $existing->updated_at ?? null,
                    'row' => null,
                ];

                return;
            }

            $writesHabits = $request->exists('custom_habits');
            $writesReviews = $request->exists('weekly_reviews');
            $incomingHabits = $writesHabits ? $this->habitDefinitions($request->input('custom_habits')) : null;
            $incomingReview = $writesReviews ? $this->personalReviewDocument($request->input('weekly_reviews')) : null;
            $deliberate = is_array($incomingReview) && ($incomingReview['listSaved'] ?? false) === true;
            if ($writesHabits && $incomingHabits === [] && !$deliberate) {
                $writesHabits = false;
            }
            if ($writesReviews && $this->reviewIsUnmarkedBlank($incomingReview)) {
                $writesReviews = false;
            }
            if (!$writesHabits && !$writesReviews) {
                $result = [
                    'kind' => 'skipped',
                    'updated_at' => $existing->updated_at ?? null,
                    'row' => null,
                ];

                return;
            }
            if ($writesReviews) {
                $incomingReview['listSaved'] = true;
                if (($incomingReview['reflections'] ?? []) === []) {
                    $incomingReview['reflections'] = new \stdClass();
                }
            }

            $expected = $request->exists('expected_updated_at') ? $request->input('expected_updated_at') : null;
            if (!$this->updatedAtMatches($existing->updated_at ?? null, $expected)) {
                Log::warning('Dropped guest import because updated_at moved');
                $result = ['kind' => 'conflict', 'updated_at' => null, 'row' => $existing];

                return;
            }

            $update = ['updated_at' => now()];
            if ($writesHabits) {
                $update['custom_habits'] = json_encode(array_values($incomingHabits ?? []), JSON_UNESCAPED_UNICODE);
            }
            if ($writesReviews) {
                $update['weekly_reviews'] = json_encode($incomingReview, JSON_UNESCAPED_UNICODE);
            }

            if ($existing === null) {
                $update['user_id'] = $userId;
                $update['created_at'] = $update['updated_at'];
                try {
                    DB::table('user_settings')->insert($update);
                } catch (\Throwable) {
                    $current = DB::table('user_settings')->where('user_id', $userId)->first();
                    Log::warning('Dropped guest import because updated_at moved');
                    $result = ['kind' => 'conflict', 'updated_at' => null, 'row' => $current];

                    return;
                }
            } else {
                $query = DB::table('user_settings')->where('user_id', $userId);
                if ($existing->updated_at === null) {
                    $query->whereNull('updated_at');
                } else {
                    $query->where('updated_at', $existing->updated_at);
                }
                $wrote = $query->update($update);
                if ($wrote !== 1) {
                    $current = DB::table('user_settings')->where('user_id', $userId)->first();
                    if (!$current || !$this->updatedAtMatches($current->updated_at, $existing->updated_at)) {
                        Log::warning('Dropped guest import because updated_at moved');
                        $result = ['kind' => 'conflict', 'updated_at' => null, 'row' => $current];

                        return;
                    }
                    DB::table('user_settings')->where('user_id', $userId)->update($update);
                }
            }

            foreach ($keptDays as $day) {
                $points = $this->checkIns->resolvePoints($userId, $day['habit_id']);
                $this->checkIns->insertMissing(
                    $userId,
                    $day['habit_id'],
                    $day['month_key'],
                    $day['day'],
                    $day['completed_on'],
                    $points,
                    $this->habitNameFromList($incomingHabits, $day['habit_id']),
                    'guest-import',
                );
            }

            $result = [
                'kind' => 'imported',
                'updated_at' => DB::table('user_settings')->where('user_id', $userId)->value('updated_at'),
                'row' => null,
            ];
        });

        if ($result['kind'] === 'conflict') {
            return $this->settingsConflict($result['row'] ?? null);
        }
        if ($result['kind'] !== 'imported') {
            return response()->json([
                'success' => true,
                'imported' => false,
                'reason' => 'list-saved',
                'updated_at' => $result['updated_at'] ?? null,
            ]);
        }

        return response()->json([
            'success' => true,
            'imported' => true,
            'updated_at' => $result['updated_at'] ?? null,
        ]);
    }

    /**
     * Get user custom protocols.
     */
    public function getUserProtocols(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
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
     * Save/upsert a protocol owned by the signed-in user.
     * An id that already belongs to someone else is rejected.
     */
    public function saveUserProtocol(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $id = trim((string) $request->input('id', ''));
        if ($id === '') {
            $id = (string) Str::uuid();
        } else {
            $existing = DB::table('user_protocols')->where('id', $id)->first();
            if ($existing !== null && (string) $existing->user_id !== $userId) {
                return response()->json(['error' => 'Forbidden'], 403);
            }
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
            'work_start', 'work_end', 'is_active', 'slots', 'habits', 'updated_at',
        ]);

        return response()->json(['success' => true, 'id' => $id]);
    }

    /**
     * Delete a protocol only when it belongs to the signed-in user.
     */
    public function deleteUserProtocol(Request $request, string $id): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $existing = DB::table('user_protocols')->where('id', $id)->first();
        if ($existing === null) {
            return response()->json(['error' => 'Not found'], 404);
        }
        if ((string) $existing->user_id !== $userId) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        DB::table('user_protocols')->where('id', $id)->where('user_id', $userId)->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Get user biomarkers.
     */
    public function getUserBiomarkers(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $query = DB::table('user_biomarkers')->where('user_id', $userId);
        if ($request->boolean('latest')) {
            $latest = $query->orderBy('log_date', 'desc')->first();

            return response()->json($latest);
        }

        return response()->json($query->orderBy('log_date', 'desc')->limit(30)->get());
    }

    /**
     * Save a biomarker for the signed-in user.
     * A client id that belongs to someone else is rejected.
     */
    public function saveUserBiomarker(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $logDate = (string) $request->input('log_date');
        if ($logDate === '') {
            return response()->json(['error' => 'user_id and log_date required'], 400);
        }

        $requestedId = trim((string) $request->input('id', ''));
        if ($requestedId !== '') {
            $existing = DB::table('user_biomarkers')->where('id', $requestedId)->first();
            if ($existing !== null && (string) $existing->user_id !== $userId) {
                return response()->json(['error' => 'Forbidden'], 403);
            }
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
            'stiffness_minutes', 'hydration_ml', 'energy_level', 'sleep_hours', 'notes', 'updated_at',
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Get partner connections where the signed-in user is a party.
     */
    public function getPartnerConnections(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $records = DB::table('partner_connections')
            ->where(function ($query) use ($userId): void {
                $query->where('user_id', $userId)
                    ->orWhere('partner_user_id', $userId);
            })
            ->get();

        return response()->json($records);
    }

    /**
     * Save a partner connection without adopting another user's row.
     */
    public function savePartnerConnection(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $inviteCode = (string) $request->input('invite_code');
        if ($inviteCode === '') {
            return response()->json(['error' => 'invite_code required'], 400);
        }

        $requestedId = trim((string) $request->input('id', ''));
        if ($requestedId !== '') {
            $byId = DB::table('partner_connections')->where('id', $requestedId)->first();
            if ($byId !== null && !$this->userIsParty($byId, $userId)) {
                return response()->json(['error' => 'Forbidden'], 403);
            }
        }

        $existing = DB::table('partner_connections')->where('invite_code', $inviteCode)->first();
        if ($existing !== null && !$this->userIsParty($existing, $userId)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // Callers may refresh their own invite. They cannot attach another person
        // or mark the row accepted; acceptPartnerInvite is the only consent path.
        $fields = [
            'alias' => $request->input('alias'),
            'permissions' => json_encode($request->input('permissions', (object) [])),
            'updated_at' => now(),
        ];

        if ($existing !== null) {
            DB::table('partner_connections')->where('id', $existing->id)->update($fields);

            return response()->json(['success' => true]);
        }

        DB::table('partner_connections')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'invite_code' => $inviteCode,
            'partner_user_id' => null,
            'status' => 'pending',
            'created_at' => now(),
            ...$fields,
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Today's kept / not-yet status for an accepted pairing.
     * Pending invites and strangers are refused. Habit rows are not returned.
     */
    public function getPartnerMetrics(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $partnerUserId = trim((string) $request->query('partner_user_id', ''));
        if (
            $partnerUserId === ''
            || $partnerUserId === $userId
            || CurrentUserResolver::isGuestSubject($partnerUserId)
        ) {
            return response()->json(['error' => 'Invalid partner metrics request'], 400);
        }

        if (!$this->partnerOwnsLink($partnerUserId, $userId)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $date = trim((string) $request->query('date', ''));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $date = now()->toDateString();
        }

        $kept = false;
        if (Schema::hasTable('habit_check_ins')) {
            $kept = DB::table('habit_check_ins')
                ->where('user_id', $partnerUserId)
                ->whereRaw('substr(cast(completed_on as text), 1, 10) = ?', [$date])
                ->exists();
        }

        return response()->json([
            'date' => $date,
            'status' => $kept ? 'kept' : 'not_yet',
        ]);
    }

    /**
     * Accept another person's invite without letting the client read their check-ins.
     */
    public function acceptPartnerInvite(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $inviteCode = strtoupper(trim((string) $request->input('invite_code', '')));
        if ($inviteCode === '') {
            return response()->json(['error' => 'invite_code required'], 400);
        }

        $existing = DB::table('partner_connections')
            ->whereRaw('upper(invite_code) = ?', [$inviteCode])
            ->first();
        if ($existing === null) {
            return response()->json(['error' => 'Invite code was not found.'], 404);
        }
        if ((string) $existing->user_id === $userId) {
            return response()->json(['error' => 'You cannot pair with your own invite code.'], 422);
        }

        $currentPartner = trim((string) ($existing->partner_user_id ?? ''));
        $status = strtolower((string) ($existing->status ?? ''));
        if ($currentPartner !== '' && $currentPartner !== $userId && in_array($status, ['connected', 'accepted'], true)) {
            return response()->json(['error' => 'That invite is already paired.'], 409);
        }

        $alias = trim((string) $request->input('alias', ''));
        $reciprocalCode = 'PAIRED-'.$inviteCode;
        $reciprocal = DB::table('partner_connections')->where('invite_code', $reciprocalCode)->first();
        if ($reciprocal !== null && !$this->userIsParty($reciprocal, $userId)) {
            return response()->json(['error' => 'That invite is already paired.'], 409);
        }

        DB::transaction(function () use ($existing, $userId, $alias, $reciprocalCode, $reciprocal): void {
            DB::table('partner_connections')->where('id', $existing->id)->update([
                'partner_user_id' => $userId,
                'status' => 'connected',
                'updated_at' => now(),
            ]);

            $fields = [
                'user_id' => $userId,
                'partner_user_id' => (string) $existing->user_id,
                'status' => 'connected',
                'alias' => $alias !== '' ? $alias : 'Partner',
                'updated_at' => now(),
            ];

            if ($reciprocal === null) {
                DB::table('partner_connections')->insert([
                    'id' => (string) Str::uuid(),
                    'invite_code' => $reciprocalCode,
                    'permissions' => json_encode((object) []),
                    'created_at' => now(),
                    ...$fields,
                ]);
            } else {
                DB::table('partner_connections')->where('id', $reciprocal->id)->update($fields);
            }
        });

        return response()->json([
            'success' => true,
            'connection' => [
                'user_id' => $userId,
                'partner_user_id' => (string) $existing->user_id,
                'invite_code' => $inviteCode,
                'status' => 'connected',
                'alias' => $alias !== '' ? $alias : 'Partner',
                'updated_at' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Mark every connection where the caller is a party as revoked.
     */
    public function revokePartnerConnections(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $updated = 0;
        if (Schema::hasTable('partner_connections')) {
            $updated = DB::table('partner_connections')
                ->where(function ($query) use ($userId): void {
                    $query->where('user_id', $userId)
                        ->orWhere('partner_user_id', $userId);
                })
                ->update([
                    'status' => 'revoked',
                    'updated_at' => now(),
                ]);
        }

        return response()->json(['success' => true, 'updated' => $updated]);
    }

    /**
     * Delete the caller's rows in the app database and, when configured,
     * the same caller's SPA rows on the Supabase ledger. Auth deletion runs
     * only when a server service-role key is configured.
     */
    public function deleteUserAccount(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        DB::transaction(function () use ($userId): void {
            $this->deleteSpaRows($userId);
            $this->deleteDomainRows($userId);
        });

        $this->deleteLedgerRows($userId);

        $auth = $this->deleteSupabaseAuthUser($userId);

        return BrowserRefreshCookie::forget(response()->json([
            'success' => true,
            'user_id' => $userId,
            'app_data_deleted' => true,
            'auth_user_deleted' => $auth['auth_user_deleted'],
            'auth_user_deletion' => $auth['auth_user_deletion'],
            'auth_user_deletion_reason' => $auth['auth_user_deletion_reason'],
            'message' => $auth['auth_user_deleted']
                ? 'App data and the Supabase Auth user were deleted.'
                : 'App data was deleted. '.$auth['auth_user_deletion_reason'],
        ]));
    }

    /**
     * Remove one user's SPA rows. Partner rows are included only when this user is a party.
     */
    private function deleteSpaRows(string $userId, ?string $connection = null): void
    {
        $connectionName = $connection ?? (string) config('database.default');
        $schema = Schema::connection($connectionName);
        $db = DB::connection($connectionName);

        foreach (['habit_check_ins', 'user_settings', 'user_protocols', 'user_biomarkers', 'user_monthly_states', 'household_days', 'user_reward_items', 'user_reward_redemptions'] as $table) {
            if ($schema->hasTable($table)) {
                $db->table($table)->where('user_id', $userId)->delete();
            }
        }

        if ($schema->hasTable('partner_connections')) {
            $db->table('partner_connections')
                ->where(function ($query) use ($userId): void {
                    $query->where('user_id', $userId)
                        ->orWhere('partner_user_id', $userId);
                })
                ->delete();
        }
    }

    /**
     * Delete the caller's SPA rows on the Supabase ledger without changing
     * the application database connection.
     */
    private function deleteLedgerRows(string $userId): void
    {
        if (!$this->openLedgerConnection()) {
            return;
        }

        DB::connection('supabase_ledger')->transaction(function () use ($userId): void {
            $this->deleteSpaRows($userId, 'supabase_ledger');
        });
    }

    /**
     * Download the signed-in user's SPA rows from the app database and, when configured, the ledger.
     */
    public function exportAccount(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        return response()->json([
            'user_id' => $userId,
            'exported_at' => now()->toIso8601String(),
            'app' => $this->exportOwnedRows($userId),
            'ledger' => $this->openLedgerConnection()
                ? $this->exportOwnedRows($userId, 'supabase_ledger')
                : null,
        ]);
    }

    /**
     * @return array{habit_check_ins: array<int, mixed>, user_settings: mixed, user_protocols: array<int, mixed>, user_biomarkers: array<int, mixed>, user_monthly_states: array<int, mixed>, household_days: array<int, mixed>, user_reward_items: array<int, mixed>, user_reward_redemptions: array<int, mixed>}
     */
    private function exportOwnedRows(string $userId, ?string $connection = null): array
    {
        $connectionName = $connection ?? (string) config('database.default');
        $schema = Schema::connection($connectionName);
        $db = DB::connection($connectionName);
        $rows = static function (string $table) use ($schema, $db, $userId): array {
            if (!$schema->hasTable($table)) {
                return [];
            }

            return array_map(
                static fn (object $row): array => (array) $row,
                $db->table($table)->where('user_id', $userId)->get()->all(),
            );
        };

        $settings = null;
        if ($schema->hasTable('user_settings')) {
            $record = $db->table('user_settings')->where('user_id', $userId)->first();
            $settings = $record === null ? null : (array) $record;
        }

        return [
            'habit_check_ins' => $rows('habit_check_ins'),
            'user_settings' => $settings,
            'user_protocols' => $rows('user_protocols'),
            'user_biomarkers' => $rows('user_biomarkers'),
            'user_monthly_states' => $rows('user_monthly_states'),
            'household_days' => $rows('household_days'),
            'user_reward_items' => $rows('user_reward_items'),
            'user_reward_redemptions' => $rows('user_reward_redemptions'),
        ];
    }

    private function openLedgerConnection(): bool
    {
        $url = trim((string) config('database.habuilt_ledger_url', ''));
        if ($url === '') {
            return false;
        }

        if (!is_array(config('database.connections.supabase_ledger'))) {
            $base = config('database.connections.pgsql');
            if (!is_array($base)) {
                $base = ['driver' => 'pgsql'];
            }

            config([
                'database.connections.supabase_ledger' => array_merge($base, [
                    'driver' => 'pgsql',
                    'url' => $url,
                ]),
            ]);
            DB::purge('supabase_ledger');
        }

        return true;
    }

    private function deleteDomainRows(string $userId): void
    {
        $habitIds = [];
        if (Schema::hasTable('habits')) {
            $habitIds = DB::table('habits')->where('user_id', $userId)->pluck('id')->all();
        }

        if (Schema::hasTable('check_ins')) {
            DB::table('check_ins')->where('user_id', $userId)->delete();
            if ($habitIds !== []) {
                DB::table('check_ins')->whereIn('habit_id', $habitIds)->delete();
            }
        }

        if (Schema::hasTable('point_transactions')) {
            DB::table('point_transactions')->where('user_id', $userId)->delete();
        }

        if (Schema::hasTable('habits') && $habitIds !== []) {
            DB::table('habits')->where('user_id', $userId)->delete();
        }
    }

    /**
     * @return array{auth_user_deleted: bool, auth_user_deletion: string, auth_user_deletion_reason: string}
     */
    private function deleteSupabaseAuthUser(string $userId): array
    {
        $key = trim((string) config('services.supabase.service_role_key', ''));
        $url = rtrim(trim((string) config('services.supabase.url', '')), '/');

        if ($key === '' || $url === '') {
            return [
                'auth_user_deleted' => false,
                'auth_user_deletion' => 'skipped',
                'auth_user_deletion_reason' => 'Supabase Auth user deletion was skipped because the server key is not configured.',
            ];
        }

        try {
            $response = Http::timeout(8)
                ->withHeaders([
                    'apikey' => $key,
                    'Authorization' => 'Bearer '.$key,
                ])
                ->delete($url.'/auth/v1/admin/users/'.rawurlencode($userId));
        } catch (\Throwable) {
            return [
                'auth_user_deleted' => false,
                'auth_user_deletion' => 'failed',
                'auth_user_deletion_reason' => 'Supabase Auth user deletion could not be reached.',
            ];
        }

        if ($response->successful() || $response->status() === 404) {
            return [
                'auth_user_deleted' => true,
                'auth_user_deletion' => 'deleted',
                'auth_user_deletion_reason' => '',
            ];
        }

        return [
            'auth_user_deleted' => false,
            'auth_user_deletion' => 'failed',
            'auth_user_deletion_reason' => 'Supabase Auth user deletion was rejected.',
        ];
    }

    private function userIsParty(object $row, string $userId): bool
    {
        return (string) ($row->user_id ?? '') === $userId
            || (string) ($row->partner_user_id ?? '') === $userId;
    }

    private function partnerOwnsLink(string $partnerUserId, string $userId): bool
    {
        if (!Schema::hasTable('partner_connections')) {
            return false;
        }

        if (CurrentUserResolver::isGuestSubject($partnerUserId) || CurrentUserResolver::isGuestSubject($userId)) {
            return false;
        }

        return DB::table('partner_connections')
            ->where(function ($query) use ($partnerUserId, $userId): void {
                $query->where(function ($forward) use ($partnerUserId, $userId): void {
                    $forward->where('user_id', $partnerUserId)
                        ->where('partner_user_id', $userId);
                })->orWhere(function ($legacy) use ($partnerUserId, $userId): void {
                    $legacy->where('user_id', $userId)
                        ->where('partner_user_id', $partnerUserId);
                });
            })
            ->whereRaw('lower(status) in (?, ?)', ['connected', 'accepted'])
            ->exists();
    }

    /**
     * @return array<int, array{habit_id: string, month_key: string, day: int, completed_on: string}>
     */
    private function guestKeptDays(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }

        $days = [];
        foreach ($value as $row) {
            if (!is_array($row)) {
                continue;
            }
            $habitId = trim((string) ($row['habit_id'] ?? ''));
            $monthKey = trim((string) ($row['month_key'] ?? ''));
            $day = (int) ($row['day'] ?? 0);
            if ($habitId === '' || !preg_match('/^\d{4}-\d{2}$/', $monthKey) || $day < 1 || $day > 31) {
                continue;
            }
            $completed = trim((string) ($row['completed_on'] ?? ''));
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $completed)) {
                $completed = sprintf('%s-%02d', $monthKey, $day);
            }
            $days[] = [
                'habit_id' => $habitId,
                'month_key' => $monthKey,
                'day' => $day,
                'completed_on' => $completed,
            ];
        }

        return $days;
    }

    /**
     * @param array<int, array<string, mixed>>|null $habits
     */
    private function habitNameFromList(?array $habits, string $habitId): string
    {
        foreach ($habits ?? [] as $habit) {
            if ((string) ($habit['id'] ?? '') === $habitId) {
                return (string) ($habit['name'] ?? '');
            }
        }

        return '';
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeStoredReview(?object $row): array
    {
        if ($row === null) {
            return [];
        }
        $decoded = $this->decodeJsonColumn($row->weekly_reviews ?? null, []);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * @param array<int, mixed> $habits
     * @return array<int, array<string, mixed>>
     */
    private function habitDefinitions(array $habits): array
    {
        $drop = [
            'completed_days',
            'completedDays',
            'coupleChecks',
            'coupleReflections',
            'couple_checks',
            'couple_reflections',
        ];
        $definitions = [];
        foreach ($habits as $habit) {
            if (!is_array($habit)) {
                continue;
            }
            $id = $habit['id'] ?? null;
            if ($id === null || $id === '') {
                continue;
            }
            foreach ($drop as $key) {
                unset($habit[$key]);
            }
            if (array_key_exists('points', $habit) && is_numeric($habit['points'])) {
                $points = $habit['points'] + 0;
                $habit['points'] = (float) $points === (float) (int) $points ? (int) $points : $points;
            }
            $definitions[] = $habit;
        }

        return $definitions;
    }

    /**
     * @param array<string, mixed> $review
     * @return array<string, mixed>
     */
    private function personalReviewDocument(array $review): array
    {
        $reflections = $review['reflections'] ?? [];
        if (!is_array($reflections) || array_is_list($reflections)) {
            $reflections = [];
        }
        $checks = $review['checks'] ?? [];
        if (!is_array($checks) || !array_is_list($checks)) {
            $checks = [];
        }

        return [
            'reviewDate' => is_string($review['reviewDate'] ?? null) ? $review['reviewDate'] : '',
            'checks' => array_values($checks),
            'reflections' => $reflections,
            'listSaved' => ($review['listSaved'] ?? false) === true,
        ];
    }

    /**
     * @param array<string, mixed>|null $review
     */
    private function reviewIsUnmarkedBlank(?array $review): bool
    {
        if ($review === null || ($review['listSaved'] ?? false) === true) {
            return $review === null;
        }
        $date = trim((string) ($review['reviewDate'] ?? ''));
        $checks = $review['checks'] ?? [];
        $hasCheck = is_array($checks) && $checks !== [];
        $hasReflection = false;
        $reflections = $review['reflections'] ?? [];
        if (is_array($reflections)) {
            foreach ($reflections as $value) {
                if (is_string($value) && trim($value) !== '') {
                    $hasReflection = true;
                    break;
                }
            }
        }

        return $date === '' && !$hasCheck && !$hasReflection;
    }

    private function updatedAtMatches(mixed $stored, mixed $expected): bool
    {
        if ($this->rawUpdatedAt($stored) === $this->rawUpdatedAt($expected)) {
            return true;
        }
        $left = $this->updatedAtToken($stored);
        $right = $this->updatedAtToken($expected);

        return $left !== '' && $left === $right;
    }

    private function rawUpdatedAt(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        return trim((string) $value);
    }

    private function updatedAtToken(mixed $value): string
    {
        $raw = $this->rawUpdatedAt($value);
        if ($raw === '') {
            return '';
        }
        try {
            return Carbon::parse($raw)->format('Y-m-d H:i:s');
        } catch (\Throwable) {
            return '';
        }
    }

    private function settingsConflict(?object $row): JsonResponse
    {
        $habits = [];
        $reviews = new \stdClass();
        if ($row !== null) {
            $decodedHabits = $this->decodeJsonColumn($row->custom_habits ?? null, []);
            $habits = is_array($decodedHabits) ? $decodedHabits : [];
            $decodedReviews = $this->decodeJsonColumn($row->weekly_reviews ?? null, new \stdClass());
            if (is_array($decodedReviews) && $decodedReviews !== [] && !array_is_list($decodedReviews)) {
                $reviews = $decodedReviews;
            } elseif ($decodedReviews instanceof \stdClass) {
                $reviews = $decodedReviews;
            }
        }

        return response()->json([
            'success' => false,
            'conflict' => true,
            'updated_at' => $row->updated_at ?? null,
            'custom_habits' => $habits,
            'weekly_reviews' => $reviews,
        ], 409);
    }

    private function decodeJsonColumn(mixed $value, mixed $fallback): mixed
    {
        if (is_array($value) || $value instanceof \stdClass) {
            return $value;
        }
        if (!is_string($value) || $value === '') {
            return $fallback;
        }
        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : $fallback;
    }

    private function actor(Request $request): string|JsonResponse
    {
        $userId = trim((string) $request->attributes->get('auth_user_id', ''));
        if ($userId === '' || CurrentUserResolver::isGuestSubject($userId)) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        return $userId;
    }
}
