<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class HouseholdSundayRewardTest extends TestCase
{
    private string $today = '2026-11-04';

    protected function setUp(): void
    {
        parent::setUp();

        config(['database.habuilt_ledger_url' => '']);

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
    }

    public function test_stranger_cannot_read_a_household_day(): void
    {
        $this->connect('pair-accepted', 'usr_alice', 'usr_bob', 'connected');

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_carol'))
            ->getJson('/api/household-day?date='.$this->today.'&partner_user_id=usr_alice')
            ->assertStatus(403)
            ->assertJsonPath('error', 'Forbidden');
    }

    public function test_pending_partner_row_grants_nothing_and_is_not_modified(): void
    {
        DB::table('partner_connections')->insert([
            'id' => 'pending-row',
            'user_id' => 'usr_alice',
            'partner_user_id' => null,
            'invite_code' => 'PENDING-CODE',
            'status' => 'pending',
            'alias' => 'Waiting',
            'permissions' => '{}',
            'created_at' => '2026-10-01 00:00:00',
            'updated_at' => '2026-10-01 00:00:00',
        ]);
        $before = (array) DB::table('partner_connections')->where('id', 'pending-row')->first();

        $token = $this->createMockJwt('usr_bob');
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/household-day?date='.$this->today)
            ->assertStatus(403);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/household-day', [
                'date' => $this->today,
                'day_type' => 'home',
                'anchors' => ['evening-check'],
                'partner_user_id' => 'usr_alice',
            ])
            ->assertStatus(403);

        $after = (array) DB::table('partner_connections')->where('id', 'pending-row')->first();
        $this->assertSame($before, $after);
        $this->assertSame('pending', $after['status']);
        $this->assertSame(0, DB::table('household_days')->count());
    }

    public function test_accepted_pair_sees_today_status_only(): void
    {
        $this->connect('pair-live', 'usr_alice', 'usr_bob', 'connected');
        DB::table('habit_check_ins')->insert([
            'id' => 'alice-private',
            'user_id' => 'usr_alice',
            'habit_id' => 'private-habit',
            'habit_name' => 'PRIVATE_HABIT_NAME',
            'month_key' => '2026-11',
            'day' => 4,
            'completed_on' => $this->today,
            'points' => 9,
            'source' => 'web',
            'created_at' => $this->today,
            'updated_at' => $this->today,
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_alice'))
            ->postJson('/api/household-day', [
                'date' => $this->today,
                'day_type' => 'home',
                'anchors' => ['evening-check', 'not-a-real-anchor'],
            ])->assertOk();

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_bob'))
            ->postJson('/api/household-day', [
                'date' => $this->today,
                'day_type' => 'office',
                'anchors' => ['evening-check'],
            ])->assertOk();

        $response = $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_alice'))
            ->getJson('/api/household-day?date='.$this->today);
        $response->assertOk()
            ->assertJsonPath('date', $this->today)
            ->assertJsonPath('you.status', 'kept')
            ->assertJsonPath('you.day_type', 'home')
            ->assertJsonPath('partner.status', 'not_yet')
            ->assertJsonPath('partner.day_type', 'office')
            ->assertJsonPath('shared_anchors.0.key', 'evening-check')
            ->assertJsonPath('shared_anchors.0.label', 'Evening check');

        $body = $response->getContent();
        $this->assertStringNotContainsString('PRIVATE_HABIT_NAME', $body);
        $this->assertStringNotContainsString('private-habit', $body);
        $this->assertStringNotContainsString('habit_check_ins', $body);
        $this->assertStringNotContainsString('"points"', $body);
        $this->assertCount(1, $response->json('shared_anchors'));
    }

    public function test_sunday_review_uses_the_callers_check_ins(): void
    {
        DB::table('user_protocols')->insert([
            'id' => 'proto-alice',
            'user_id' => 'usr_alice',
            'name' => 'Week',
            'habits' => json_encode([
                ['id' => 'a', 'name' => 'Morning start'],
                ['id' => 'b', 'name' => 'Evening check'],
            ]),
            'created_at' => $this->today,
            'updated_at' => $this->today,
        ]);
        foreach ([
            ['id' => 'c1', 'habit_id' => 'a', 'completed_on' => '2026-11-01', 'day' => 1],
            ['id' => 'c2', 'habit_id' => 'a', 'completed_on' => '2026-11-02', 'day' => 2],
            ['id' => 'c3', 'habit_id' => 'a', 'completed_on' => '2026-11-03', 'day' => 3],
            ['id' => 'c4', 'habit_id' => 'b', 'completed_on' => '2026-11-04', 'day' => 4],
        ] as $row) {
            DB::table('habit_check_ins')->insert([
                'id' => $row['id'],
                'user_id' => 'usr_alice',
                'habit_id' => $row['habit_id'],
                'habit_name' => 'Slot',
                'month_key' => '2026-11',
                'day' => $row['day'],
                'completed_on' => $row['completed_on'],
                'points' => 1,
                'source' => 'web',
                'created_at' => $row['completed_on'],
                'updated_at' => $row['completed_on'],
            ]);
        }
        DB::table('habit_check_ins')->insert([
            'id' => 'bob-row',
            'user_id' => 'usr_bob',
            'habit_id' => 'a',
            'habit_name' => 'Other person',
            'month_key' => '2026-11',
            'day' => 4,
            'completed_on' => $this->today,
            'points' => 5,
            'source' => 'web',
            'created_at' => $this->today,
            'updated_at' => $this->today,
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_alice'))
            ->getJson('/api/sunday-review?date='.$this->today)
            ->assertOk()
            ->assertJsonPath('completed_slots', 3)
            ->assertJsonPath('missed_slots', 3)
            ->assertJsonPath('streak', 4)
            ->assertJsonPath('share_text', "Sunday review\nCompleted: 3\nMissed: 3\nStreak: 4 days");
    }

    public function test_reward_overspend_returns_422_and_balance_ignores_client_input(): void
    {
        $this->givePoints('usr_alice', 3);
        $token = 'Bearer '.$this->createMockJwt('usr_alice');

        $saved = $this->withHeader('Authorization', $token)
            ->postJson('/api/rewards', [
                'balance' => 9999,
                'rewards' => [
                    ['id' => 'tea', 'name' => 'Tea', 'cost' => 10],
                ],
            ]);
        $saved->assertOk()
            ->assertJsonPath('balance', 3)
            ->assertJsonPath('earned', 3)
            ->assertJsonPath('rewards.0.cost_points', 10);

        $this->withHeader('Authorization', $token)
            ->postJson('/api/rewards/tea/redeem')
            ->assertStatus(422)
            ->assertJsonPath('error', 'Not enough points');

        $this->assertSame(0, DB::table('user_reward_redemptions')->count());
        $this->assertSame(3, (int) DB::table('habit_check_ins')->where('user_id', 'usr_alice')->sum('points'));
    }

    public function test_user_cannot_redeem_against_another_users_balance(): void
    {
        $this->givePoints('usr_alice', 50);
        $this->givePoints('usr_bob', 100);
        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_bob'))
            ->postJson('/api/rewards', [
                'rewards' => [
                    ['id' => 'bob-book', 'name' => 'Book', 'cost' => 40],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('balance', 100);

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_alice'))
            ->postJson('/api/rewards/bob-book/redeem')
            ->assertStatus(403);

        $this->assertSame(0, DB::table('user_reward_redemptions')->count());
        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_bob'))
            ->getJson('/api/rewards')
            ->assertOk()
            ->assertJsonPath('balance', 100);
        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt('usr_alice'))
            ->getJson('/api/rewards')
            ->assertOk()
            ->assertJsonPath('balance', 50);
    }

    private function connect(string $id, string $userId, string $partnerId, string $status): void
    {
        DB::table('partner_connections')->insert([
            'id' => $id,
            'user_id' => $userId,
            'partner_user_id' => $partnerId,
            'invite_code' => $id.'-code',
            'status' => $status,
            'alias' => 'Partner',
            'permissions' => '{}',
            'created_at' => '2026-11-01 00:00:00',
            'updated_at' => '2026-11-01 00:00:00',
        ]);
    }

    private function givePoints(string $userId, int $points): void
    {
        DB::table('habit_check_ins')->insert([
            'id' => $userId.'-points',
            'user_id' => $userId,
            'habit_id' => 'walk',
            'habit_name' => 'Walk',
            'month_key' => '2026-11',
            'day' => 4,
            'completed_on' => $this->today,
            'points' => $points,
            'source' => 'web',
            'created_at' => $this->today,
            'updated_at' => $this->today,
        ]);
    }
}
