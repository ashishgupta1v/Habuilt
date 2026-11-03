<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Services\Ledger\SpaCheckInLedger;
use App\Support\CurrentUserResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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
        $points = $this->checkIns->resolvePoints(
            $userId,
            $habitId,
            $request->input('points'),
            $request->exists('points'),
        );
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
     * Save user settings.
     */
    public function saveUserSettings(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
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
            'weekly_reviews', 'enhanced_state', 'day_type', 'dark_mode', 'updated_at',
        ]);

        return response()->json(['success' => true]);
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
     * Limited partner progress for an accepted pairing.
     * One accepted row is enough, in either direction. Pending invites are not.
     * This does not return the partner's full ledger and is the only cross-user read.
     */
    public function getPartnerMetrics(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $partnerUserId = trim((string) $request->query('partner_user_id', ''));
        $monthKey = trim((string) $request->query('month_key', ''));
        if (
            $partnerUserId === ''
            || $monthKey === ''
            || $partnerUserId === $userId
            || CurrentUserResolver::isGuestSubject($partnerUserId)
        ) {
            return response()->json(['error' => 'Invalid partner metrics request'], 400);
        }

        if (!$this->partnerOwnsLink($partnerUserId, $userId)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $rows = DB::table('habit_check_ins')
            ->where('user_id', $partnerUserId)
            ->where('month_key', $monthKey)
            ->orderBy('day')
            ->get(['habit_id', 'habit_name', 'points', 'day', 'completed_on', 'canonical_key']);

        return response()->json([
            'partner_user_id' => $partnerUserId,
            'month_key' => $monthKey,
            'check_ins' => $rows,
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

        return response()->json([
            'success' => true,
            'user_id' => $userId,
            'app_data_deleted' => true,
            'auth_user_deleted' => $auth['auth_user_deleted'],
            'auth_user_deletion' => $auth['auth_user_deletion'],
            'auth_user_deletion_reason' => $auth['auth_user_deletion_reason'],
            'message' => $auth['auth_user_deleted']
                ? 'App data and the Supabase Auth user were deleted.'
                : 'App data was deleted. '.$auth['auth_user_deletion_reason'],
        ]);
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
     * @return array{habit_check_ins: array<int, mixed>, user_settings: mixed, user_protocols: array<int, mixed>, user_biomarkers: array<int, mixed>, user_monthly_states: array<int, mixed>}
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

    private function actor(Request $request): string|JsonResponse
    {
        $userId = trim((string) $request->attributes->get('auth_user_id', ''));
        if ($userId === '' || CurrentUserResolver::isGuestSubject($userId)) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        return $userId;
    }
}
