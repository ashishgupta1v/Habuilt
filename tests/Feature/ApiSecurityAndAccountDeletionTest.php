<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class ApiSecurityAndAccountDeletionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Ensure sqlite in-memory tables exist for testing
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

        DB::statement('CREATE TABLE IF NOT EXISTS user_settings (
            user_id TEXT PRIMARY KEY,
            progressive_settings TEXT DEFAULT "{}",
            custom_habits TEXT DEFAULT "[]",
            rewards TEXT DEFAULT "[]",
            reward_ledger TEXT DEFAULT "[]",
            weekly_reviews TEXT DEFAULT "{}",
            enhanced_state TEXT DEFAULT "{}",
            day_type TEXT DEFAULT "home",
            dark_mode BOOLEAN DEFAULT 1,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )');

        DB::statement('CREATE TABLE IF NOT EXISTS user_protocols (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT,
            archetype TEXT,
            description TEXT,
            wake_time TEXT,
            sleep_time TEXT,
            work_start TEXT,
            work_end TEXT,
            is_active BOOLEAN DEFAULT 1,
            slots TEXT,
            habits TEXT,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )');

        DB::statement('CREATE TABLE IF NOT EXISTS user_biomarkers (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            log_date DATE NOT NULL,
            stiffness_minutes INTEGER DEFAULT 0,
            hydration_ml INTEGER DEFAULT 0,
            energy_level TEXT,
            sleep_hours REAL DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )');

        DB::statement('CREATE TABLE IF NOT EXISTS partner_connections (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            partner_user_id TEXT,
            invite_code TEXT UNIQUE,
            status TEXT DEFAULT "pending",
            alias TEXT,
            permissions TEXT,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )');
    }

    private function createMockJwt(string $userId, int $ttl = 3600): string
    {
        $header = rtrim(strtr(base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'])), '+/', '-_'), '=');
        $payload = rtrim(strtr(base64_encode(json_encode([
            'sub' => $userId,
            'exp' => time() + $ttl,
            'aud' => 'authenticated',
            'role' => 'authenticated',
        ])), '+/', '-_'), '=');
        $sig = rtrim(strtr(base64_encode(hash('sha256', "{$header}.{$payload}", true)), '+/', '-_'), '=');

        return "{$header}.{$payload}.{$sig}";
    }

    public function test_health_endpoint_remains_public(): void
    {
        $response = $this->getJson('/api/health');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'healthy');
    }

    public function test_protected_endpoint_rejects_unauthenticated_request(): void
    {
        $response = $this->getJson('/api/habits/check-ins?user_id=usr_alice');
        $response->assertStatus(401)
            ->assertJsonPath('error', 'Unauthenticated: Bearer authorization token required');
    }

    public function test_protected_endpoint_blocks_idor_cross_user_access(): void
    {
        $aliceToken = $this->createMockJwt('usr_alice');

        // Alice attempts to read Bob's check-ins
        $response = $this->withHeader('Authorization', "Bearer {$aliceToken}")
            ->getJson('/api/habits/check-ins?user_id=usr_bob');

        $response->assertStatus(403)
            ->assertJsonPath('error', 'Forbidden: Cannot access or mutate another user\'s records');
    }

    public function test_authenticated_user_can_access_own_settings(): void
    {
        $aliceToken = $this->createMockJwt('usr_alice');

        $response = $this->withHeader('Authorization', "Bearer {$aliceToken}")
            ->getJson('/api/user-settings?user_id=usr_alice');

        $response->assertStatus(200);
    }

    public function test_account_deletion_purges_all_user_data_atomically(): void
    {
        $carolId = 'usr_carol_' . uniqid();
        $carolToken = $this->createMockJwt($carolId);

        // Seed data for Carol
        DB::table('habit_check_ins')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $carolId,
            'habit_id' => 'habit_morning_water',
            'month_key' => '2026-10',
            'day' => 15,
            'completed_on' => '2026-10-15',
            'points' => 1,
            'source' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('user_settings')->insert([
            'user_id' => $carolId,
            'day_type' => 'home',
            'updated_at' => now(),
        ]);

        // Verify data exists
        $this->assertEquals(1, DB::table('habit_check_ins')->where('user_id', $carolId)->count());
        $this->assertEquals(1, DB::table('user_settings')->where('user_id', $carolId)->count());

        // Perform Account Deletion
        $deleteResponse = $this->withHeader('Authorization', "Bearer {$carolToken}")
            ->deleteJson('/api/user-account', ['user_id' => $carolId]);

        $deleteResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('user_id', $carolId);

        // Verify all records purged
        $this->assertEquals(0, DB::table('habit_check_ins')->where('user_id', $carolId)->count());
        $this->assertEquals(0, DB::table('user_settings')->where('user_id', $carolId)->count());
    }
}
