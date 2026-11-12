<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class OfflineSyncReliabilityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        DB::statement('CREATE TABLE IF NOT EXISTS habit_check_ins (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            habit_id TEXT NOT NULL,
            habit_name TEXT,
            month_key TEXT NOT NULL,
            day INTEGER NOT NULL,
            completed_on DATE NOT NULL,
            points INTEGER NOT NULL DEFAULT 1,
            canonical_key TEXT,
            source TEXT DEFAULT "web",
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )');

        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS habit_check_ins_composite_uniq ON habit_check_ins (user_id, habit_id, month_key, day)');

        DB::statement('CREATE TABLE IF NOT EXISTS user_settings (
            user_id TEXT PRIMARY KEY,
            custom_habits TEXT DEFAULT "[]",
            weekly_reviews TEXT DEFAULT "{}",
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )');

        DB::table('habit_check_ins')->delete();
    }

    private function saveHabit(string $userId, string $habitId): void
    {
        DB::table('user_settings')->updateOrInsert(
            ['user_id' => $userId],
            [
                'custom_habits' => json_encode([['id' => $habitId, 'name' => 'Saved habit']]),
                'weekly_reviews' => json_encode(['listSaved' => true]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }

    public function test_health_check_returns_operational_status(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'healthy',
                'server' => 'Hostinger KVM 2',
            ]);
    }

    public function test_sync_upserts_habit_checkins_idempotently(): void
    {
        $userId = 'sync_user_101';
        $this->saveHabit($userId, 'hydrate');
        $token = $this->createMockJwt($userId);

        $payload = [
            'user_id' => $userId,
            'habit_id' => 'hydrate',
            'habit_name' => 'Morning Hydration',
            'month_key' => '2026-10',
            'day' => 29,
            'completed_on' => '2026-10-29',
            'points' => 10,
            'canonical_key' => 'morning_hydration',
            'source' => 'offline_sync',
        ];

        // 1. Initial Sync Push
        $response1 = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->postJson('/api/habits/check-ins', $payload);

        $response1->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertEquals(1, DB::table('habit_check_ins')->where('user_id', $userId)->count());

        // 2. Duplicate Sync Push (simulating client retry or reconnect replay)
        $response2 = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->postJson('/api/habits/check-ins', array_merge($payload, ['points' => 15]));

        $response2->assertStatus(200)
            ->assertJson(['success' => true]);

        // Total count should still be 1 (upserted, not duplicated).
        // A replay cannot raise the stored point value.
        $this->assertEquals(1, DB::table('habit_check_ins')->where('user_id', $userId)->count());
        $this->assertEquals(1, DB::table('habit_check_ins')->where('user_id', $userId)->first()->points);
    }

    public function test_sync_deletion_removes_exact_checkin(): void
    {
        $userId = 'sync_user_102';
        $token = $this->createMockJwt($userId);
        
        DB::table('habit_check_ins')->insert([
            'id' => 'rec_del_1',
            'user_id' => $userId,
            'habit_id' => 'meditate',
            'habit_name' => 'Box Breathing',
            'month_key' => '2026-10',
            'day' => 29,
            'completed_on' => '2026-10-29',
            'points' => 10,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->deleteJson('/api/habits/check-ins', [
            'user_id' => $userId,
            'habit_id' => 'meditate',
            'month_key' => '2026-10',
            'day' => 29,
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertEquals(0, DB::table('habit_check_ins')->where('user_id', $userId)->count());
    }

    public function test_sync_rejects_malformed_payload(): void
    {
        $userId = 'sync_user_103';
        $token = $this->createMockJwt($userId);

        // Missing habit_id and month_key
        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->postJson('/api/habits/check-ins', [
            'user_id' => $userId,
            'day' => 45, // Invalid day
        ]);

        $response->assertStatus(400)
            ->assertJson(['error' => 'Invalid check-in payload']);
    }

    public function test_sync_rejects_check_in_without_a_signed_jwt(): void
    {
        $response = $this->postJson('/api/habits/check-ins', [
            'user_id' => 'sync_user_101',
            'habit_id' => 'hydrate',
            'month_key' => '2026-10',
            'day' => 29,
            'completed_on' => '2026-10-29',
            'points' => 10,
        ]);

        $response->assertStatus(401);
        $this->assertEquals(0, DB::table('habit_check_ins')->count());
    }

    public function test_sync_ignores_client_supplied_points(): void
    {
        $userId = 'sync_user_104';
        $this->saveHabit($userId, 'hydrate');
        $token = $this->createMockJwt($userId);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/habits/check-ins', [
                'user_id' => $userId,
                'habit_id' => 'hydrate',
                'month_key' => '2026-10',
                'day' => 2,
                'completed_on' => '2026-10-02',
                'points' => 5000,
            ]);

        $response->assertStatus(200);
        $this->assertSame(1, (int) DB::table('habit_check_ins')->where('user_id', $userId)->value('points'));
    }
}
