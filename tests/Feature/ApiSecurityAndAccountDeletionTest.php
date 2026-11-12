<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class ApiSecurityAndAccountDeletionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Keep the suite off the real Supabase ledger. The ledger test sets its own connection.
        config(['database.habuilt_ledger_url' => '']);

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

        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS habit_check_ins_composite_uniq ON habit_check_ins (user_id, habit_id, month_key, day)');
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
            ->assertJsonPath('user_id', $carolId)
            ->assertJsonPath('app_data_deleted', true)
            ->assertJsonPath('auth_user_deleted', false)
            ->assertJsonPath('auth_user_deletion', 'skipped');

        // Verify all records purged
        $this->assertEquals(0, DB::table('habit_check_ins')->where('user_id', $carolId)->count());
        $this->assertEquals(0, DB::table('user_settings')->where('user_id', $carolId)->count());
    }

    public function test_account_deletion_clears_caller_rows_on_app_and_ledger_connections(): void
    {
        config([
            'database.habuilt_ledger_url' => 'sqlite://ledger-test',
            'database.connections.supabase_ledger' => [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
                'foreign_key_constraints' => true,
            ],
        ]);
        DB::purge('supabase_ledger');
        DB::statement('CREATE TABLE IF NOT EXISTS user_monthly_states (
            user_id TEXT NOT NULL,
            month_key TEXT NOT NULL,
            state_data TEXT,
            updated_at TIMESTAMP
        )');

        foreach ([
            'CREATE TABLE habit_check_ins (
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
            )',
            'CREATE TABLE user_settings (
                user_id TEXT PRIMARY KEY,
                day_type TEXT,
                dark_mode BOOLEAN,
                updated_at TIMESTAMP
            )',
            'CREATE TABLE user_protocols (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            )',
            'CREATE TABLE user_biomarkers (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                log_date DATE NOT NULL,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            )',
            'CREATE TABLE partner_connections (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                partner_user_id TEXT,
                invite_code TEXT UNIQUE,
                status TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            )',
            'CREATE TABLE user_monthly_states (
                user_id TEXT NOT NULL,
                month_key TEXT NOT NULL,
                state_data TEXT,
                updated_at TIMESTAMP
            )',
        ] as $sql) {
            DB::connection('supabase_ledger')->statement($sql);
        }

        $callerId = 'usr_caller_'.uniqid();
        $otherId = 'usr_other_'.uniqid();
        $now = now();

        $seed = function (?string $connection) use ($callerId, $otherId, $now): void {
            $db = DB::connection($connection);
            $suffix = $connection ?? 'app';
            foreach ([$callerId => 'water', $otherId => 'read'] as $userId => $habitId) {
                $db->table('habit_check_ins')->insert([
                    'id' => $suffix.'-'.$habitId,
                    'user_id' => $userId,
                    'habit_id' => $habitId,
                    'month_key' => '2026-11',
                    'day' => 2,
                    'completed_on' => '2026-11-02',
                    'points' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $db->table('user_settings')->insert([
                    'user_id' => $userId,
                    'day_type' => 'home',
                    'updated_at' => $now,
                ]);
                $db->table('user_protocols')->insert([
                    'id' => $suffix.'-protocol-'.$habitId,
                    'user_id' => $userId,
                    'name' => 'Protocol',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $db->table('user_biomarkers')->insert([
                    'id' => $suffix.'-bio-'.$habitId,
                    'user_id' => $userId,
                    'log_date' => '2026-11-02',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $db->table('user_monthly_states')->insert([
                    'user_id' => $userId,
                    'month_key' => '2026-11',
                    'state_data' => '{}',
                    'updated_at' => $now,
                ]);
            }
            $db->table('partner_connections')->insert([
                'id' => $suffix.'-caller-partner',
                'user_id' => $callerId,
                'partner_user_id' => null,
                'invite_code' => $suffix.'-caller',
                'status' => 'pending',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $db->table('partner_connections')->insert([
                'id' => $suffix.'-other-partner',
                'user_id' => $otherId,
                'partner_user_id' => 'usr_someone_else',
                'invite_code' => $suffix.'-other',
                'status' => 'pending',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        };

        $seed(null);
        $seed('supabase_ledger');

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($callerId))
            ->deleteJson('/api/user-account')
            ->assertStatus(200)
            ->assertJsonPath('app_data_deleted', true);

        foreach ([null, 'supabase_ledger'] as $connection) {
            $db = DB::connection($connection);
            $this->assertSame(0, $db->table('habit_check_ins')->where('user_id', $callerId)->count());
            $this->assertSame(0, $db->table('user_settings')->where('user_id', $callerId)->count());
            $this->assertSame(0, $db->table('user_protocols')->where('user_id', $callerId)->count());
            $this->assertSame(0, $db->table('user_biomarkers')->where('user_id', $callerId)->count());
            $this->assertSame(0, $db->table('user_monthly_states')->where('user_id', $callerId)->count());
            $this->assertSame(0, $db->table('partner_connections')->where('user_id', $callerId)->count());
            $this->assertSame(1, $db->table('habit_check_ins')->where('user_id', $otherId)->count());
            $this->assertSame(1, $db->table('user_settings')->where('user_id', $otherId)->count());
            $this->assertSame(1, $db->table('user_protocols')->where('user_id', $otherId)->count());
            $this->assertSame(1, $db->table('user_biomarkers')->where('user_id', $otherId)->count());
            $this->assertSame(1, $db->table('user_monthly_states')->where('user_id', $otherId)->count());
            $this->assertSame(1, $db->table('partner_connections')->where('user_id', $otherId)->count());
        }
    }

    public function test_account_export_returns_only_the_caller_rows_from_both_connections(): void
    {
        config([
            'database.habuilt_ledger_url' => 'sqlite://ledger-export',
            'database.connections.supabase_ledger' => [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
                'foreign_key_constraints' => true,
            ],
        ]);
        DB::purge('supabase_ledger');
        DB::statement('CREATE TABLE IF NOT EXISTS user_monthly_states (
            user_id TEXT NOT NULL,
            month_key TEXT NOT NULL,
            state_data TEXT,
            updated_at TIMESTAMP
        )');
        DB::connection('supabase_ledger')->statement('CREATE TABLE habit_check_ins (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            habit_id TEXT NOT NULL,
            month_key TEXT NOT NULL,
            day INTEGER NOT NULL,
            completed_on DATE NOT NULL,
            points INTEGER NOT NULL DEFAULT 1
        )');
        DB::connection('supabase_ledger')->statement('CREATE TABLE user_settings (user_id TEXT PRIMARY KEY, day_type TEXT)');
        DB::connection('supabase_ledger')->statement('CREATE TABLE user_protocols (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT)');
        DB::connection('supabase_ledger')->statement('CREATE TABLE user_biomarkers (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, log_date DATE NOT NULL)');
        DB::connection('supabase_ledger')->statement('CREATE TABLE user_monthly_states (user_id TEXT NOT NULL, month_key TEXT NOT NULL, state_data TEXT)');
        foreach ([null, 'supabase_ledger'] as $connection) {
            $db = DB::connection($connection);
            $db->statement('CREATE TABLE IF NOT EXISTS household_days (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                day_key TEXT NOT NULL,
                day_type TEXT,
                anchors TEXT
            )');
            $db->statement('CREATE TABLE IF NOT EXISTS user_reward_items (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT,
                cost_points INTEGER NOT NULL
            )');
            $db->statement('CREATE TABLE IF NOT EXISTS user_reward_redemptions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                reward_id TEXT NOT NULL,
                cost_points INTEGER NOT NULL
            )');
        }

        $this->getJson('/api/account-export')->assertStatus(401);

        $callerId = 'usr_export_'.uniqid();
        $otherId = 'usr_hidden_'.uniqid();
        foreach ([null, 'supabase_ledger'] as $connection) {
            $db = DB::connection($connection);
            $suffix = $connection ?? 'app';
            $db->table('habit_check_ins')->insert([
                'id' => $suffix.'-caller',
                'user_id' => $callerId,
                'habit_id' => 'water',
                'month_key' => '2026-11',
                'day' => 2,
                'completed_on' => '2026-11-02',
                'points' => 1,
            ]);
            $db->table('habit_check_ins')->insert([
                'id' => $suffix.'-other',
                'user_id' => $otherId,
                'habit_id' => 'read',
                'month_key' => '2026-11',
                'day' => 2,
                'completed_on' => '2026-11-02',
                'points' => 1,
            ]);
            $db->table('user_settings')->insert(['user_id' => $callerId, 'day_type' => 'home']);
            $db->table('user_settings')->insert(['user_id' => $otherId, 'day_type' => 'office']);
            $db->table('user_monthly_states')->insert([
                'user_id' => $callerId,
                'month_key' => '2026-11',
                'state_data' => '{"owner":"caller"}',
            ]);
            $db->table('user_monthly_states')->insert([
                'user_id' => $otherId,
                'month_key' => '2026-11',
                'state_data' => '{"owner":"other"}',
            ]);
            $db->table('user_protocols')->insert([
                'id' => $suffix.'-protocol-caller',
                'user_id' => $callerId,
                'name' => 'Caller protocol',
            ]);
            $db->table('user_protocols')->insert([
                'id' => $suffix.'-protocol-other',
                'user_id' => $otherId,
                'name' => 'Hidden protocol',
            ]);
            $db->table('user_biomarkers')->insert([
                'id' => $suffix.'-bio-caller',
                'user_id' => $callerId,
                'log_date' => '2026-11-02',
            ]);
            $db->table('user_biomarkers')->insert([
                'id' => $suffix.'-bio-other',
                'user_id' => $otherId,
                'log_date' => '2026-11-02',
            ]);
            $db->table('household_days')->insert([
                'id' => $suffix.'-day-caller',
                'user_id' => $callerId,
                'day_key' => '2026-11-02',
                'day_type' => 'home',
                'anchors' => '[]',
            ]);
            $db->table('household_days')->insert([
                'id' => $suffix.'-day-other',
                'user_id' => $otherId,
                'day_key' => '2026-11-02',
                'day_type' => 'office',
                'anchors' => '[]',
            ]);
            $db->table('user_reward_items')->insert([
                'id' => $suffix.'-reward-caller',
                'user_id' => $callerId,
                'name' => 'Caller reward',
                'cost_points' => 2,
            ]);
            $db->table('user_reward_items')->insert([
                'id' => $suffix.'-reward-other',
                'user_id' => $otherId,
                'name' => 'Hidden reward',
                'cost_points' => 9,
            ]);
            $db->table('user_reward_redemptions')->insert([
                'id' => $suffix.'-redeem-caller',
                'user_id' => $callerId,
                'reward_id' => $suffix.'-reward-caller',
                'cost_points' => 2,
            ]);
            $db->table('user_reward_redemptions')->insert([
                'id' => $suffix.'-redeem-other',
                'user_id' => $otherId,
                'reward_id' => $suffix.'-reward-other',
                'cost_points' => 9,
            ]);
        }

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($callerId))
            ->getJson('/api/account-export?user_id='.$otherId)
            ->assertStatus(403);

        $export = $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($callerId))
            ->getJson('/api/account-export')
            ->assertStatus(200)
            ->assertJsonPath('user_id', $callerId);

        $body = $export->json();
        foreach (['app', 'ledger'] as $store) {
            $checkIns = $body[$store]['habit_check_ins'];
            $this->assertCount(1, $checkIns);
            $this->assertSame($callerId, $checkIns[0]['user_id']);
            $this->assertSame($callerId, $body[$store]['user_settings']['user_id']);
            $this->assertCount(1, $body[$store]['user_monthly_states']);
            $this->assertSame($callerId, $body[$store]['user_monthly_states'][0]['user_id']);
            $this->assertCount(1, $body[$store]['user_protocols']);
            $this->assertSame($callerId, $body[$store]['user_protocols'][0]['user_id']);
            $this->assertSame('Caller protocol', $body[$store]['user_protocols'][0]['name']);
            $this->assertCount(1, $body[$store]['user_biomarkers']);
            $this->assertSame($callerId, $body[$store]['user_biomarkers'][0]['user_id']);
            $this->assertArrayHasKey('household_days', $body[$store]);
            $this->assertArrayHasKey('user_reward_items', $body[$store]);
            $this->assertArrayHasKey('user_reward_redemptions', $body[$store]);
            $this->assertCount(1, $body[$store]['household_days']);
            $this->assertSame($callerId, $body[$store]['household_days'][0]['user_id']);
            $this->assertCount(1, $body[$store]['user_reward_items']);
            $this->assertSame('Caller reward', $body[$store]['user_reward_items'][0]['name']);
            $this->assertCount(1, $body[$store]['user_reward_redemptions']);
            $this->assertSame($callerId, $body[$store]['user_reward_redemptions'][0]['user_id']);
            $this->assertStringNotContainsString($otherId, json_encode($body[$store]));
            $this->assertStringNotContainsString('Hidden protocol', json_encode($body[$store]));
            $this->assertStringNotContainsString('Hidden reward', json_encode($body[$store]));
        }
    }

    public function test_forged_signature_is_rejected_when_jwt_secret_is_configured(): void
    {
        $token = $this->createMockJwt('usr_alice');
        $parts = explode('.', $token);
        $signature = $parts[2];
        // Flip the first character. The last base64 character can change without
        // changing the decoded bytes, which would leave a valid signature.
        $parts[2] = $signature === ''
            ? 'unsigned'
            : ($signature[0] === 'A' ? 'B' : 'A').substr($signature, 1);

        $response = $this->withHeader('Authorization', 'Bearer '.implode('.', $parts))
            ->getJson('/api/user-settings?user_id=usr_alice');

        $response->assertStatus(401)
            ->assertJsonPath('error', 'Unauthenticated: Invalid cryptographic signature');
    }

    public function test_well_formed_token_is_rejected_when_jwt_secret_is_empty(): void
    {
        $token = $this->createMockJwt('usr_alice');
        config(['services.supabase.jwt_secret' => '']);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/user-settings?user_id=usr_alice');

        $response->assertStatus(401)
            ->assertJsonPath('error', 'Unauthenticated: JWT verification is not configured');
    }

    public function test_user_cannot_delete_or_overwrite_another_users_protocol(): void
    {
        $bobProtocolId = 'protocol-bob-1';
        DB::table('user_protocols')->insert([
            'id' => $bobProtocolId,
            'user_id' => 'usr_bob',
            'name' => 'Bob Protocol',
            'archetype' => 'custom',
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $aliceToken = $this->createMockJwt('usr_alice');

        $delete = $this->withHeader('Authorization', "Bearer {$aliceToken}")
            ->deleteJson('/api/user-protocols/'.$bobProtocolId);

        $delete->assertStatus(403);
        $this->assertSame('Bob Protocol', DB::table('user_protocols')->where('id', $bobProtocolId)->value('name'));

        $overwrite = $this->withHeader('Authorization', "Bearer {$aliceToken}")
            ->postJson('/api/user-protocols', [
                'id' => $bobProtocolId,
                'user_id' => 'usr_alice',
                'name' => 'Stolen Protocol',
            ]);

        $overwrite->assertStatus(403);
        $this->assertSame('Bob Protocol', DB::table('user_protocols')->where('id', $bobProtocolId)->value('name'));
        $this->assertSame('usr_bob', DB::table('user_protocols')->where('id', $bobProtocolId)->value('user_id'));
    }

    public function test_user_can_save_and_delete_their_own_protocol(): void
    {
        $aliceToken = $this->createMockJwt('usr_alice');

        $save = $this->withHeader('Authorization', "Bearer {$aliceToken}")
            ->postJson('/api/user-protocols', [
                'user_id' => 'usr_alice',
                'name' => 'Alice Protocol',
            ]);

        $save->assertStatus(200)->assertJsonPath('success', true);
        $id = (string) $save->json('id');
        $this->assertNotSame('', $id);
        $this->assertSame('usr_alice', DB::table('user_protocols')->where('id', $id)->value('user_id'));

        $delete = $this->withHeader('Authorization', "Bearer {$aliceToken}")
            ->deleteJson('/api/user-protocols/'.$id);

        $delete->assertStatus(200)->assertJsonPath('success', true);
        $this->assertEquals(0, DB::table('user_protocols')->where('id', $id)->count());
    }

    public function test_biomarker_and_partner_writes_cannot_adopt_another_users_row(): void
    {
        DB::table('user_biomarkers')->insert([
            'id' => 'marker-bob',
            'user_id' => 'usr_bob',
            'log_date' => '2026-11-01',
            'notes' => 'bob-note',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('partner_connections')->insert([
            'id' => 'pair-bob',
            'user_id' => 'usr_bob',
            'partner_user_id' => 'usr_dave',
            'invite_code' => 'BOB-INVITE',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $aliceToken = $this->createMockJwt('usr_alice');

        $this->withHeader('Authorization', "Bearer {$aliceToken}")
            ->postJson('/api/user-biomarkers', [
                'id' => 'marker-bob',
                'user_id' => 'usr_alice',
                'log_date' => '2026-11-02',
                'notes' => 'hijack',
            ])
            ->assertStatus(403);

        $this->assertSame('bob-note', DB::table('user_biomarkers')->where('id', 'marker-bob')->value('notes'));

        $this->withHeader('Authorization', "Bearer {$aliceToken}")
            ->postJson('/api/partner-connections', [
                'id' => 'pair-bob',
                'user_id' => 'usr_alice',
                'invite_code' => 'BOB-INVITE',
                'status' => 'accepted',
                'partner_user_id' => 'usr_alice',
            ])
            ->assertStatus(403);

        $this->assertSame('pending', DB::table('partner_connections')->where('id', 'pair-bob')->value('status'));
        $this->assertSame('usr_bob', DB::table('partner_connections')->where('id', 'pair-bob')->value('user_id'));
    }

    public function test_account_deletion_removes_both_ledgers_without_touching_other_users(): void
    {
        $carolId = 'usr_carol_both_'.uniqid();
        $bobId = 'usr_bob_both_'.uniqid();
        $daveId = 'usr_dave_both_'.uniqid();

        DB::statement('CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT,
            points_per_check_in INTEGER NOT NULL,
            is_archived INTEGER DEFAULT 0,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )');
        DB::statement('CREATE TABLE IF NOT EXISTS check_ins (
            id TEXT PRIMARY KEY,
            habit_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            completed_at TIMESTAMP,
            created_at TIMESTAMP
        )');
        DB::statement('CREATE TABLE IF NOT EXISTS point_transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            amount INTEGER NOT NULL,
            reason TEXT,
            reference_id TEXT,
            occurred_at TIMESTAMP
        )');
        DB::statement('CREATE TABLE IF NOT EXISTS rewards (
            id TEXT PRIMARY KEY,
            name TEXT,
            cost INTEGER,
            is_active INTEGER DEFAULT 1
        )');

        DB::table('habit_check_ins')->insert([
            'id' => 'spa-carol',
            'user_id' => $carolId,
            'habit_id' => 'water',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('habit_check_ins')->insert([
            'id' => 'spa-bob',
            'user_id' => $bobId,
            'habit_id' => 'read',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('user_protocols')->insert([
            'id' => 'proto-carol',
            'user_id' => $carolId,
            'name' => 'Carol',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('user_protocols')->insert([
            'id' => 'proto-bob',
            'user_id' => $bobId,
            'name' => 'Bob',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('user_settings')->insert([
            'user_id' => $carolId,
            'rewards' => '[{"item":"tea"}]',
            'updated_at' => now(),
        ]);
        DB::table('habits')->insert([
            'id' => '01JQ7M2X4V8K3P6R9T1W5Y7ZAC',
            'user_id' => $carolId,
            'name' => 'Carol domain habit',
            'points_per_check_in' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('habits')->insert([
            'id' => '01JQ7M2X4V8K3P6R9T1W5Y7ZAD',
            'user_id' => $bobId,
            'name' => 'Bob domain habit',
            'points_per_check_in' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('check_ins')->insert([
            'id' => '01JQ7M2X4V8K3P6R9T1W5Y7ZAE',
            'habit_id' => '01JQ7M2X4V8K3P6R9T1W5Y7ZAC',
            'user_id' => $carolId,
            'completed_at' => '2026-11-02 08:00:00',
            'created_at' => '2026-11-02 08:00:00',
        ]);
        DB::table('check_ins')->insert([
            'id' => '01JQ7M2X4V8K3P6R9T1W5Y7ZAF',
            'habit_id' => '01JQ7M2X4V8K3P6R9T1W5Y7ZAD',
            'user_id' => $bobId,
            'completed_at' => '2026-11-02 08:00:00',
            'created_at' => '2026-11-02 08:00:00',
        ]);
        DB::table('point_transactions')->insert([
            'id' => '01JQ7M2X4V8K3P6R9T1W5Y7ZAG',
            'user_id' => $carolId,
            'amount' => 2,
            'reason' => 'check-in',
            'reference_id' => '01JQ7M2X4V8K3P6R9T1W5Y7ZAE',
            'occurred_at' => '2026-11-02 08:00:00',
        ]);
        DB::table('point_transactions')->insert([
            'id' => '01JQ7M2X4V8K3P6R9T1W5Y7ZAH',
            'user_id' => $bobId,
            'amount' => 2,
            'reason' => 'check-in',
            'reference_id' => '01JQ7M2X4V8K3P6R9T1W5Y7ZAF',
            'occurred_at' => '2026-11-02 08:00:00',
        ]);
        DB::table('rewards')->insert([
            'id' => 'catalog-reward',
            'name' => 'Shared catalog reward',
            'cost' => 10,
            'is_active' => 1,
        ]);
        DB::table('partner_connections')->insert([
            'id' => 'pair-carol-owner',
            'user_id' => $carolId,
            'partner_user_id' => $bobId,
            'invite_code' => 'CAROL-'.$carolId,
            'status' => 'accepted',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('partner_connections')->insert([
            'id' => 'pair-carol-partner',
            'user_id' => $bobId,
            'partner_user_id' => $carolId,
            'invite_code' => 'BOB-'.$carolId,
            'status' => 'accepted',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('partner_connections')->insert([
            'id' => 'pair-bob-dave',
            'user_id' => $bobId,
            'partner_user_id' => $daveId,
            'invite_code' => 'DAVE-'.$daveId,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($carolId))
            ->deleteJson('/api/user-account', ['user_id' => $carolId]);

        $response->assertStatus(200)
            ->assertJsonPath('auth_user_deleted', false)
            ->assertJsonPath('auth_user_deletion', 'skipped');

        $this->assertEquals(0, DB::table('habit_check_ins')->where('user_id', $carolId)->count());
        $this->assertEquals(0, DB::table('user_protocols')->where('user_id', $carolId)->count());
        $this->assertEquals(0, DB::table('user_settings')->where('user_id', $carolId)->count());
        $this->assertEquals(0, DB::table('habits')->where('user_id', $carolId)->count());
        $this->assertEquals(0, DB::table('check_ins')->where('user_id', $carolId)->count());
        $this->assertEquals(0, DB::table('point_transactions')->where('user_id', $carolId)->count());
        $this->assertEquals(0, DB::table('partner_connections')->where('user_id', $carolId)->orWhere('partner_user_id', $carolId)->count());

        $this->assertEquals(1, DB::table('habit_check_ins')->where('user_id', $bobId)->count());
        $this->assertSame('Bob', DB::table('user_protocols')->where('id', 'proto-bob')->value('name'));
        $this->assertEquals(1, DB::table('habits')->where('user_id', $bobId)->count());
        $this->assertEquals(1, DB::table('check_ins')->where('user_id', $bobId)->count());
        $this->assertEquals(1, DB::table('point_transactions')->where('user_id', $bobId)->count());
        $this->assertSame('pending', DB::table('partner_connections')->where('id', 'pair-bob-dave')->value('status'));
        $this->assertSame('Shared catalog reward', DB::table('rewards')->where('id', 'catalog-reward')->value('name'));
    }

    public function test_legacy_habit_route_requires_jwt_and_stores_uuid_owner(): void
    {
        $uuid = '11111111-2222-4333-8444-555555555555';

        $this->postJson('/habits/morning-water/check-ins', [
            'completed_on' => '2026-11-02',
            'user_id' => $uuid,
        ])->assertStatus(401);

        $this->withHeader('X-User-Id', $uuid)
            ->postJson('/habits/morning-water/check-ins', [
                'completed_on' => '2026-11-02',
            ])
            ->assertStatus(401);

        $this->assertEquals(0, DB::table('habit_check_ins')->count());

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($uuid))
            ->postJson('/habits/morning-water/check-ins', [
                'completed_on' => '2026-11-02',
                'user_id' => 'someone-else',
                'points' => 9000,
            ])
            ->assertStatus(403);

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($uuid))
            ->withHeader('X-User-Id', '01JQ7M2X4V8K3P6R9T1W5Y7ZAB')
            ->postJson('/habits/morning-water/check-ins', [
                'completed_on' => '2026-11-02',
                'points' => 9000,
            ])
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $row = DB::table('habit_check_ins')->where('habit_id', 'morning-water')->first();
        $this->assertNotNull($row);
        $this->assertSame($uuid, $row->user_id);
        $this->assertSame(1, (int) $row->points);
    }

    public function test_zoeticoach_proxy_skips_when_server_credential_is_empty(): void
    {
        Http::fake();
        config([
            'services.zoeticoach.api_key' => '',
            'services.zoeticoach.api_url' => '',
        ]);

        $this->postJson('/api/zoeticoach/events', ['habit_id' => 'water'])->assertStatus(401);

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_alice'))
            ->postJson('/api/zoeticoach/events', [
                'external_participant_id' => 'usr_bob',
                'habit_id' => 'water',
            ])
            ->assertStatus(200)
            ->assertJsonPath('skipped', true)
            ->assertJsonPath('disabled', true);

        Http::assertNothingSent();
    }

    public function test_zoeticoach_proxy_forwards_only_the_authenticated_subject(): void
    {
        config([
            'services.zoeticoach.api_key' => 'test-only-zoeti-key',
            'services.zoeticoach.api_url' => 'https://zoeticoach.test',
        ]);
        Http::fake([
            'https://zoeticoach.test/*' => Http::response(['data' => ['event_id' => 'evt_test']], 200),
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_alice'))
            ->postJson('/api/zoeticoach/events', [
                'external_participant_id' => 'usr_bob',
                'habit_id' => 'water',
                'event_value' => 'Water',
                'points' => 4000,
            ])
            ->assertStatus(200)
            ->assertJsonPath('skipped', false);

        Http::assertSent(function ($request): bool {
            $body = $request->data();

            return $request->url() === 'https://zoeticoach.test/api/v3/habit-cloud/events'
                && ($body['external_participant_id'] ?? null) === 'usr_alice'
                && ($body['payload']['points'] ?? null) === 100
                && $request->hasHeader('Authorization', 'Bearer test-only-zoeti-key');
        });
    }

    public function test_zoeticoach_proxy_omits_points_when_the_client_does_not_send_them(): void
    {
        config([
            'services.zoeticoach.api_key' => 'test-only-zoeti-key',
            'services.zoeticoach.api_url' => 'https://zoeticoach.test',
        ]);
        Http::fake([
            'https://zoeticoach.test/*' => Http::response(['data' => ['event_id' => 'evt_test']], 200),
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_alice'))
            ->postJson('/api/zoeticoach/events', [
                'habit_id' => 'water',
                'event_value' => 'Water',
            ])
            ->assertStatus(200)
            ->assertJsonPath('skipped', false);

        Http::assertSent(function ($request): bool {
            $body = $request->data();

            return $request->url() === 'https://zoeticoach.test/api/v3/habit-cloud/events'
                && !array_key_exists('points', $body['payload'] ?? []);
        });
    }

    public function test_auth_user_deletion_uses_service_role_only_when_configured(): void
    {
        config([
            'services.supabase.url' => 'https://project.test',
            'services.supabase.service_role_key' => 'test-service-role',
        ]);
        Http::fake([
            'https://project.test/auth/v1/admin/users/*' => Http::response('', 200),
        ]);

        $userId = '11111111-2222-4333-8444-555555555555';
        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($userId))
            ->deleteJson('/api/user-account')
            ->assertStatus(200)
            ->assertJsonPath('app_data_deleted', true)
            ->assertJsonPath('auth_user_deleted', true)
            ->assertJsonPath('auth_user_deletion', 'deleted');

        Http::assertSent(function ($request) use ($userId): bool {
            return $request->method() === 'DELETE'
                && $request->url() === 'https://project.test/auth/v1/admin/users/'.$userId
                && $request->hasHeader('Authorization', 'Bearer test-service-role');
        });
    }

    public function test_stored_habit_points_override_client_points(): void
    {
        DB::statement('CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT,
            points_per_check_in INTEGER NOT NULL,
            is_archived INTEGER DEFAULT 0,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )');

        $userId = '01JQ7M2X4V8K3P6R9T1W5Y7ZAC';
        $habitId = '01JQ7M2X4V8K3P6R9T1W5Y7ZAD';
        DB::table('habits')->insert([
            'id' => $habitId,
            'user_id' => $userId,
            'name' => 'Hydrate',
            'points_per_check_in' => 3,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('user_settings')->insert([
            'user_id' => $userId,
            'custom_habits' => json_encode([['id' => $habitId, 'name' => 'Hydrate', 'points' => 4]]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($userId))
            ->postJson('/api/habits/check-ins', [
                'habit_id' => $habitId,
                'month_key' => '2026-11',
                'day' => 2,
                'completed_on' => '2026-11-02',
                'points' => 100,
            ])
            ->assertStatus(200);

        $this->assertSame(4, (int) DB::table('habit_check_ins')->where('user_id', $userId)->value('points'));

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($userId))
            ->postJson('/api/habits/check-ins', [
                'habit_id' => 'not-saved',
                'month_key' => '2026-11',
                'day' => 3,
                'completed_on' => '2026-11-03',
                'points' => 1,
            ])
            ->assertStatus(422);
        $this->assertSame(0, DB::table('habit_check_ins')->where('habit_id', 'not-saved')->count());
    }

    public function test_client_points_cannot_raise_a_saved_habit_price(): void
    {
        $userId = 'usr_price_'.uniqid();
        DB::table('user_settings')->insert([
            'user_id' => $userId,
            'custom_habits' => json_encode([
                ['id' => 'stretch', 'name' => 'Stretch', 'points' => 2],
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($userId))
            ->postJson('/api/habits/check-ins', [
                'habit_id' => 'stretch',
                'month_key' => '2026-11',
                'day' => 3,
                'completed_on' => '2026-11-03',
                'points' => 100,
            ])
            ->assertStatus(200);

        $this->assertSame(2, (int) DB::table('habit_check_ins')->where('user_id', $userId)->value('points'));
    }

    public function test_alg_none_token_is_rejected_even_with_a_matching_hmac(): void
    {
        $header = $this->base64UrlEncode((string) json_encode(['alg' => 'none', 'typ' => 'JWT']));
        $payload = $this->base64UrlEncode((string) json_encode([
            'sub' => 'usr_alice',
            'exp' => time() + 3600,
        ]));
        $signature = $this->base64UrlEncode(hash_hmac(
            'sha256',
            $header.'.'.$payload,
            (string) config('services.supabase.jwt_secret'),
            true,
        ));

        $this->withHeader('Authorization', 'Bearer '.$header.'.'.$payload.'.'.$signature)
            ->getJson('/api/user-settings')
            ->assertStatus(401)
            ->assertJsonPath('error', 'Unauthenticated: Unsupported token algorithm');
    }

    public function test_legacy_one_row_accepted_connection_can_read_the_partner_projection(): void
    {
        DB::table('habit_check_ins')->insert([
            'id' => 'bob-checkin',
            'user_id' => 'usr_bob',
            'habit_id' => 'walk',
            'habit_name' => 'Walk',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => 4,
            'canonical_key' => 'walk',
            'source' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('habit_check_ins')->insert([
            'id' => 'alice-checkin',
            'user_id' => 'usr_alice',
            'habit_id' => 'read',
            'habit_name' => 'Read',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => 2,
            'canonical_key' => 'read',
            'source' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('habit_check_ins')->insert([
            'id' => 'dave-checkin',
            'user_id' => 'usr_dave',
            'habit_id' => 'secret',
            'habit_name' => 'Secret',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => 9,
            'canonical_key' => 'secret',
            'source' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('partner_connections')->insert([
            'id' => 'legacy-one-row',
            'user_id' => 'usr_alice',
            'partner_user_id' => 'usr_bob',
            'invite_code' => 'LEGACY-PAIR',
            'status' => 'accepted',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson('/api/partner-metrics?partner_user_id=usr_bob&month_key=2026-11')
            ->assertStatus(401);

        $alice = $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_alice'));
        $kept = $alice->getJson('/api/partner-metrics?partner_user_id=usr_bob&month_key=2026-11&date=2026-11-02');
        $kept->assertStatus(200)
            ->assertJsonPath('date', '2026-11-02')
            ->assertJsonPath('status', 'kept')
            ->assertJsonMissingPath('check_ins');
        $keptBody = $kept->getContent();
        $this->assertStringNotContainsString('Walk', $keptBody);
        $this->assertStringNotContainsString('habit_id', $keptBody);
        $this->assertStringNotContainsString('walk', $keptBody);

        $alice->getJson('/api/partner-metrics?partner_user_id=usr_bob&date=2026-11-03')
            ->assertStatus(200)
            ->assertJsonPath('status', 'not_yet');

        $bobView = $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_bob'))
            ->getJson('/api/partner-metrics?partner_user_id=usr_alice&month_key=2026-11&date=2026-11-02');
        $bobView->assertStatus(200)
            ->assertJsonPath('status', 'kept')
            ->assertJsonMissingPath('check_ins');
        $this->assertStringNotContainsString('Read', $bobView->getContent());
        $this->assertStringNotContainsString('read', $bobView->getContent());

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_carol'))
            ->getJson('/api/partner-metrics?partner_user_id=usr_bob&month_key=2026-11')
            ->assertStatus(403);

        $alice->getJson('/api/partner-metrics?partner_user_id=usr_dave&month_key=2026-11')
            ->assertStatus(403);
        $alice->getJson('/api/habits/check-ins?user_id=usr_bob&month_key=2026-11')
            ->assertStatus(403);
        $alice->getJson('/api/habits/check-ins?user_id=usr_dave&month_key=2026-11')
            ->assertStatus(403);
    }

    public function test_pending_or_self_minted_connection_does_not_grant_partner_metrics(): void
    {
        DB::table('habit_check_ins')->insert([
            'id' => 'bob-checkin',
            'user_id' => 'usr_bob',
            'habit_id' => 'walk',
            'habit_name' => 'Walk',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => 4,
            'canonical_key' => 'walk',
            'source' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('partner_connections')->insert([
            'id' => 'pending-both',
            'user_id' => 'usr_alice',
            'partner_user_id' => 'usr_bob',
            'invite_code' => 'STILL-PENDING',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $alice = $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_alice'));
        $alice->getJson('/api/partner-metrics?partner_user_id=usr_bob&month_key=2026-11')
            ->assertStatus(403);

        $alice->postJson('/api/partner-connections', [
            'invite_code' => 'MINT-ALICE',
            'status' => 'accepted',
            'partner_user_id' => 'usr_bob',
        ])->assertStatus(200);

        $minted = DB::table('partner_connections')->where('invite_code', 'MINT-ALICE')->first();
        $this->assertNotNull($minted);
        $this->assertSame('usr_alice', $minted->user_id);
        $this->assertNull($minted->partner_user_id);
        $this->assertSame('pending', $minted->status);

        $alice->getJson('/api/partner-metrics?partner_user_id=usr_bob&month_key=2026-11')
            ->assertStatus(403);
    }

    public function test_accept_invite_pairs_the_caller_without_adopting_the_host_row(): void
    {
        DB::table('partner_connections')->insert([
            'id' => 'host-invite',
            'user_id' => 'usr_bob',
            'partner_user_id' => null,
            'invite_code' => 'HAB-JOIN',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_bob'))
            ->postJson('/api/partner-connections/accept', ['invite_code' => 'HAB-JOIN'])
            ->assertStatus(422);

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_alice'))
            ->postJson('/api/partner-connections/accept', [
                'invite_code' => 'hab-join',
                'alias' => 'Bob',
            ])
            ->assertStatus(200)
            ->assertJsonPath('connection.partner_user_id', 'usr_bob')
            ->assertJsonPath('connection.user_id', 'usr_alice');

        $this->assertSame('usr_bob', DB::table('partner_connections')->where('id', 'host-invite')->value('user_id'));
        $this->assertSame('usr_alice', DB::table('partner_connections')->where('id', 'host-invite')->value('partner_user_id'));
        $this->assertSame('connected', DB::table('partner_connections')->where('id', 'host-invite')->value('status'));
        $this->assertSame(1, DB::table('partner_connections')->where('user_id', 'usr_alice')->where('partner_user_id', 'usr_bob')->count());
    }
}
