<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Services\Product\ProductTables;
use App\Services\Review\SundayWeekSummary;
use App\Support\CurrentUserResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Household day, Sunday review, and the reward shop.
 * Every read and write uses the JWT subject. Pending pairings are not updated.
 */
final class AccountProductController
{
    public function __construct(
        private readonly ProductTables $tables,
        private readonly SundayWeekSummary $sunday,
    ) {
    }

    public function showHouseholdDay(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $this->tables->ensure();
        $date = $this->dayKey($request);
        $partnerId = $this->acceptedPartnerId($userId, trim((string) $request->query('partner_user_id', '')));
        if ($partnerId === null) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json($this->householdPayload($userId, $partnerId, $date));
    }

    public function saveHouseholdDay(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $this->tables->ensure();
        $partnerId = $this->acceptedPartnerId($userId, trim((string) $request->input('partner_user_id', '')));
        if ($partnerId === null) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $dayType = strtolower(trim((string) $request->input('day_type', '')));
        if (!in_array($dayType, ProductTables::DAY_TYPES, true)) {
            return response()->json(['error' => 'Invalid day type'], 422);
        }

        $date = $this->dayKey($request);
        $anchors = $this->cleanAnchors($request->input('anchors', []));
        $existing = DB::table('household_days')
            ->where('user_id', $userId)
            ->where('day_key', $date)
            ->first();

        $fields = [
            'day_type' => $dayType,
            'anchors' => json_encode(array_values($anchors)),
            'updated_at' => now(),
        ];

        if ($existing === null) {
            DB::table('household_days')->insert([
                'id' => (string) Str::uuid(),
                'user_id' => $userId,
                'day_key' => $date,
                'created_at' => now(),
                ...$fields,
            ]);
        } else {
            DB::table('household_days')->where('id', $existing->id)->update($fields);
        }

        return response()->json($this->householdPayload($userId, $partnerId, $date));
    }

    public function sundayReview(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $today = $this->dayKey($request);
        $weekStart = (new \DateTimeImmutable($today))->modify('monday this week')->format('Y-m-d');

        $checkIns = [];
        if (Schema::hasTable('habit_check_ins')) {
            $rows = DB::table('habit_check_ins')
                ->where('user_id', $userId)
                ->where('completed_on', '<=', $today)
                ->get(['habit_id', 'completed_on']);
            foreach ($rows as $row) {
                $checkIns[] = [
                    'habit_id' => (string) $row->habit_id,
                    'completed_on' => substr((string) $row->completed_on, 0, 10),
                ];
            }
        }

        $summary = $this->sunday->summarize($checkIns, $this->savedHabitIds($userId), $today);
        $summary['week_start'] = $summary['week_start'] ?: $weekStart;

        return response()->json($summary);
    }

    public function rewards(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $this->tables->ensure();

        return response()->json($this->rewardPayload($userId));
    }

    public function saveRewards(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $this->tables->ensure();
        $incoming = $request->input('rewards', []);
        if (!is_array($incoming)) {
            return response()->json(['error' => 'Invalid reward catalog'], 422);
        }

        $clean = [];
        foreach ($incoming as $reward) {
            if (!is_array($reward)) {
                continue;
            }
            $name = trim((string) ($reward['name'] ?? $reward['item'] ?? ''));
            $cost = (int) ($reward['cost_points'] ?? $reward['cost'] ?? 0);
            if ($name === '' || $cost < 1 || $cost > 100000) {
                continue;
            }
            $id = trim((string) ($reward['id'] ?? ''));
            if ($id === '' || $this->rewardOwnedBySomeoneElse($id, $userId)) {
                $id = (string) Str::uuid();
            }
            $clean[] = [
                'id' => $id,
                'name' => mb_substr($name, 0, 80),
                'cost_points' => $cost,
            ];
        }

        DB::transaction(function () use ($userId, $clean): void {
            DB::table('user_reward_items')->where('user_id', $userId)->delete();
            foreach ($clean as $reward) {
                DB::table('user_reward_items')->insert([
                    'id' => $reward['id'],
                    'user_id' => $userId,
                    'name' => $reward['name'],
                    'cost_points' => $reward['cost_points'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });

        return response()->json($this->rewardPayload($userId));
    }

    public function redeemReward(Request $request, string $id): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId instanceof JsonResponse) {
            return $userId;
        }

        $this->tables->ensure();
        $reward = DB::table('user_reward_items')->where('id', $id)->first();
        if ($reward === null) {
            return response()->json(['error' => 'Reward not found'], 404);
        }
        if ((string) $reward->user_id !== $userId) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $created = false;
        DB::transaction(function () use ($userId, $id, &$created): void {
            $driver = DB::connection()->getDriverName();
            if ($driver === 'pgsql') {
                DB::statement(
                    'SELECT pg_advisory_xact_lock(hashtext(?), hashtext(?))',
                    ['habuilt-redeem', $userId],
                );
            }

            $this->lockCallerRows('habit_check_ins', $userId, 'points', $driver);
            $this->lockCallerRows('user_reward_redemptions', $userId, 'cost_points', $driver);

            $rewardQuery = DB::table('user_reward_items')->where('id', $id);
            if ($driver !== 'sqlite') {
                $rewardQuery->lockForUpdate();
            }
            $locked = $rewardQuery->first();
            if ($locked === null || (string) $locked->user_id !== $userId) {
                return;
            }

            $cost = (int) $locked->cost_points;
            if ($cost > $this->balanceFor($userId)) {
                return;
            }

            DB::table('user_reward_redemptions')->insert([
                'id' => (string) Str::uuid(),
                'user_id' => $userId,
                'reward_id' => (string) $locked->id,
                'cost_points' => $cost,
                'redeemed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $created = true;
        });

        if (!$created) {
            return response()->json([
                'error' => 'Not enough points',
                'balance' => $this->balanceFor($userId),
            ], 422);
        }

        return response()->json($this->rewardPayload($userId));
    }

    /**
     * @return array{date: string, you: array{status: string, day_type: string|null}, partner: array{status: string, day_type: string|null}, shared_anchors: array<int, array{key: string, label: string}>}
     */
    private function householdPayload(string $userId, string $partnerId, string $date): array
    {
        $mine = $this->dayRow($userId, $date);
        $theirs = $this->dayRow($partnerId, $date);
        $shared = array_values(array_intersect($mine['anchors'], $theirs['anchors']));
        $anchors = $this->anchorLabels($shared);

        return [
            'date' => $date,
            'you' => [
                'status' => $this->dayStatus($userId, $date),
                'day_type' => $mine['day_type'],
            ],
            'partner' => [
                'status' => $this->dayStatus($partnerId, $date),
                'day_type' => $theirs['day_type'],
            ],
            'your_anchors' => $this->anchorLabels($mine['anchors']),
            'shared_anchors' => $anchors,
        ];
    }

    /**
     * @return array{day_type: string|null, anchors: array<int, string>}
     */
    private function dayRow(string $userId, string $date): array
    {
        $row = DB::table('household_days')
            ->where('user_id', $userId)
            ->where('day_key', $date)
            ->first();
        if ($row === null) {
            return ['day_type' => null, 'anchors' => []];
        }

        $decoded = json_decode((string) ($row->anchors ?? '[]'), true);

        return [
            'day_type' => (string) $row->day_type,
            'anchors' => is_array($decoded) ? $this->cleanAnchors($decoded) : [],
        ];
    }

    private function dayStatus(string $userId, string $date): string
    {
        if (!Schema::hasTable('habit_check_ins')) {
            return 'not_yet';
        }

        $kept = DB::table('habit_check_ins')
            ->where('user_id', $userId)
            ->whereRaw('substr(cast(completed_on as text), 1, 10) = ?', [$date])
            ->exists();

        return $kept ? 'kept' : 'not_yet';
    }

    /**
     * @param array<int, string> $keys
     * @return array<int, array{key: string, label: string}>
     */
    private function anchorLabels(array $keys): array
    {
        $labels = [];
        foreach (ProductTables::ANCHORS as $key => $label) {
            if (in_array($key, $keys, true)) {
                $labels[] = ['key' => $key, 'label' => $label];
            }
        }

        return $labels;
    }

    /**
     * @param mixed $value
     * @return array<int, string>
     */
    private function cleanAnchors(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }
        $allowed = array_keys(ProductTables::ANCHORS);
        $clean = [];
        foreach ($value as $anchor) {
            $key = strtolower(trim((string) $anchor));
            if (in_array($key, $allowed, true)) {
                $clean[$key] = $key;
            }
        }

        return array_values($clean);
    }

    private function acceptedPartnerId(string $userId, string $requestedPartnerId): ?string
    {
        if (!Schema::hasTable('partner_connections')) {
            return null;
        }
        if (CurrentUserResolver::isGuestSubject($userId)) {
            return null;
        }

        $query = DB::table('partner_connections')
            ->where(function ($parties) use ($userId): void {
                $parties->where('user_id', $userId)
                    ->orWhere('partner_user_id', $userId);
            })
            ->whereRaw('lower(status) in (?, ?)', ['connected', 'accepted'])
            ->orderByDesc('updated_at');

        if ($requestedPartnerId !== '') {
            if ($requestedPartnerId === $userId || CurrentUserResolver::isGuestSubject($requestedPartnerId)) {
                return null;
            }
            $query->where(function ($match) use ($userId, $requestedPartnerId): void {
                $match->where(function ($forward) use ($userId, $requestedPartnerId): void {
                    $forward->where('user_id', $userId)->where('partner_user_id', $requestedPartnerId);
                })->orWhere(function ($reverse) use ($userId, $requestedPartnerId): void {
                    $reverse->where('user_id', $requestedPartnerId)->where('partner_user_id', $userId);
                });
            });
        }

        $row = $query->first();
        if ($row === null) {
            return null;
        }

        $owner = (string) $row->user_id;
        $partner = trim((string) ($row->partner_user_id ?? ''));
        $other = $owner === $userId ? $partner : $owner;
        if ($other === '' || $other === $userId || CurrentUserResolver::isGuestSubject($other)) {
            return null;
        }

        return $other;
    }

    /**
     * @return array<int, string>
     */
    private function savedHabitIds(string $userId): array
    {
        $ids = [];
        if (Schema::hasTable('user_settings')) {
            $settings = DB::table('user_settings')->where('user_id', $userId)->first();
            $ids = array_merge($ids, $this->idsFromJson($settings->custom_habits ?? '[]'));
        }
        if (Schema::hasTable('user_protocols')) {
            $protocols = DB::table('user_protocols')->where('user_id', $userId)->get();
            foreach ($protocols as $protocol) {
                $ids = array_merge($ids, $this->idsFromJson($protocol->habits ?? '[]'));
                $ids = array_merge($ids, $this->idsFromJson($protocol->slots ?? '[]'));
            }
        }

        return array_values(array_unique(array_filter($ids)));
    }

    /**
     * @return array<int, string>
     */
    private function idsFromJson(mixed $value): array
    {
        $decoded = is_string($value) ? json_decode($value, true) : $value;
        if (!is_array($decoded)) {
            return [];
        }
        $ids = [];
        foreach ($decoded as $item) {
            if (is_string($item) && trim($item) !== '') {
                $ids[] = trim($item);
                continue;
            }
            if (is_array($item)) {
                $id = trim((string) ($item['id'] ?? $item['habit_id'] ?? ''));
                if ($id !== '') {
                    $ids[] = $id;
                }
            }
        }

        return $ids;
    }

    /**
     * @return array{balance: int, earned: int, spent: int, rewards: array<int, array{id: string, name: string, cost_points: int}>, redemptions: array<int, array{id: string, reward_id: string, cost_points: int, redeemed_at: string|null}>}
     */
    private function rewardPayload(string $userId): array
    {
        $earned = $this->earnedFor($userId);
        $spent = $this->spentFor($userId);
        $rewards = DB::table('user_reward_items')
            ->where('user_id', $userId)
            ->orderBy('name')
            ->get()
            ->map(static fn (object $row): array => [
                'id' => (string) $row->id,
                'name' => (string) $row->name,
                'cost_points' => (int) $row->cost_points,
            ])
            ->all();
        $redemptions = DB::table('user_reward_redemptions')
            ->where('user_id', $userId)
            ->orderByDesc('redeemed_at')
            ->get()
            ->map(static fn (object $row): array => [
                'id' => (string) $row->id,
                'reward_id' => (string) $row->reward_id,
                'cost_points' => (int) $row->cost_points,
                'redeemed_at' => $row->redeemed_at === null ? null : (string) $row->redeemed_at,
            ])
            ->all();

        return [
            'balance' => max(0, $earned - $spent),
            'earned' => $earned,
            'spent' => $spent,
            'rewards' => $rewards,
            'redemptions' => $redemptions,
        ];
    }

    private function lockCallerRows(string $table, string $userId, string $column, string $driver): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        $query = DB::table($table)->where('user_id', $userId)->select($column);
        if ($driver !== 'sqlite') {
            $query->lockForUpdate();
        }
        $query->get();
    }

    private function balanceFor(string $userId): int
    {
        return max(0, $this->earnedFor($userId) - $this->spentFor($userId));
    }

    private function earnedFor(string $userId): int
    {
        if (!Schema::hasTable('habit_check_ins')) {
            return 0;
        }

        return (int) DB::table('habit_check_ins')->where('user_id', $userId)->sum('points');
    }

    private function spentFor(string $userId): int
    {
        if (!Schema::hasTable('user_reward_redemptions')) {
            return 0;
        }

        return (int) DB::table('user_reward_redemptions')->where('user_id', $userId)->sum('cost_points');
    }

    private function rewardOwnedBySomeoneElse(string $id, string $userId): bool
    {
        $row = DB::table('user_reward_items')->where('id', $id)->first();

        return $row !== null && (string) $row->user_id !== $userId;
    }

    private function dayKey(Request $request): string
    {
        $candidate = trim((string) ($request->input('date') ?: $request->query('date', '')));
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $candidate) === 1) {
            $parsed = \DateTimeImmutable::createFromFormat('Y-m-d', $candidate);
            if ($parsed instanceof \DateTimeImmutable && $parsed->format('Y-m-d') === $candidate) {
                return $candidate;
            }
        }

        return now()->toDateString();
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
