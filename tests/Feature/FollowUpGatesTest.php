<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

final class FollowUpGatesTest extends TestCase
{
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
        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS habit_check_ins_composite_uniq ON habit_check_ins (user_id, habit_id, month_key, day)');
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

    public function test_guest_import_inserts_missing_days_without_rewriting_points(): void
    {
        $userId = 'usr_guest_import_'.uniqid();
        $otherId = 'usr_other_import_'.uniqid();
        $stamp = '2026-11-01 08:00:00';

        DB::table('user_settings')->insert([
            'user_id' => $userId,
            'custom_habits' => '[]',
            'rewards' => '[{"id":"rew-1","item":"Tea"}]',
            'weekly_reviews' => '{}',
            'created_at' => $stamp,
            'updated_at' => $stamp,
        ]);
        DB::table('habit_check_ins')->insert([
            'id' => 'check-'.$userId,
            'user_id' => $userId,
            'habit_id' => 'f-1',
            'habit_name' => 'Morning walk',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => 9,
            'source' => 'web',
            'created_at' => $stamp,
            'updated_at' => $stamp,
        ]);

        $asUser = fn (string $id) => $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($id));
        $payload = [
            'custom_habits' => [[
                'id' => 'f-1',
                'name' => 'Morning walk',
                'points' => 4,
                'startTime' => '07:15',
                'completed_days' => [2, 3],
            ]],
            'weekly_reviews' => [
                'reviewDate' => 'Nov 8, 2026',
                'checks' => [],
                'reflections' => ['wins' => 'Kept the morning'],
                'listSaved' => true,
            ],
            'kept_days' => [
                ['habit_id' => 'f-1', 'month_key' => '2026-11', 'day' => 2, 'completed_on' => '2026-11-02', 'points' => 99, 'habit_name' => 'Should not reprice'],
                ['habit_id' => 'f-1', 'month_key' => '2026-11', 'day' => 3, 'completed_on' => '2026-11-03', 'points' => 99],
            ],
            'rewards' => [['id' => 'rew-replaced']],
        ];

        $asUser($otherId)->postJson('/api/guest-import', [
            ...$payload,
            'expected_updated_at' => null,
        ])->assertOk();

        $this->assertSame(9, (int) DB::table('habit_check_ins')->where('id', 'check-'.$userId)->value('points'));
        $this->assertSame('[]', (string) DB::table('user_settings')->where('user_id', $userId)->value('custom_habits'));
        $this->assertSame(0, DB::table('habit_check_ins')->where('user_id', $userId)->where('day', 3)->count());

        $asUser($userId)->postJson('/api/guest-import', [
            ...$payload,
            'expected_updated_at' => '2026-10-01 00:00:00',
        ])->assertStatus(409);

        $this->assertSame(9, (int) DB::table('habit_check_ins')->where('id', 'check-'.$userId)->value('points'));
        $this->assertSame(0, DB::table('habit_check_ins')->where('user_id', $userId)->where('day', 3)->count());
        $this->assertNotTrue(json_decode((string) DB::table('user_settings')->where('user_id', $userId)->value('weekly_reviews'), true)['listSaved'] ?? false);

        $imported = $asUser($userId)->postJson('/api/guest-import', [
            ...$payload,
            'expected_updated_at' => $stamp,
        ]);
        $imported->assertOk()->assertJsonPath('success', true)->assertJsonPath('imported', true);

        $this->assertSame(9, (int) DB::table('habit_check_ins')->where('user_id', $userId)->where('day', 2)->value('points'));
        $this->assertSame(4, (int) DB::table('habit_check_ins')->where('user_id', $userId)->where('day', 3)->value('points'));
        $storedHabits = json_decode((string) DB::table('user_settings')->where('user_id', $userId)->value('custom_habits'), true);
        $this->assertSame('f-1', $storedHabits[0]['id']);
        $this->assertSame(4, $storedHabits[0]['points']);
        $this->assertArrayNotHasKey('completed_days', $storedHabits[0]);
        $this->assertTrue(json_decode((string) DB::table('user_settings')->where('user_id', $userId)->value('weekly_reviews'), true)['listSaved'] === true);
        $this->assertSame(
            '[{"id":"rew-1","item":"Tea"}]',
            (string) DB::table('user_settings')->where('user_id', $userId)->value('rewards'),
        );

        $again = $asUser($userId)->postJson('/api/guest-import', [
            'custom_habits' => [[
                'id' => 'f-1',
                'name' => 'Replaced walk',
                'points' => 1,
            ]],
            'weekly_reviews' => ['reviewDate' => '', 'checks' => [], 'reflections' => [], 'listSaved' => true],
            'kept_days' => [
                ['habit_id' => 'f-1', 'month_key' => '2026-11', 'day' => 2, 'completed_on' => '2026-11-02', 'points' => 1],
                ['habit_id' => 'f-1', 'month_key' => '2026-11', 'day' => 4, 'completed_on' => '2026-11-04', 'points' => 8],
            ],
            'expected_updated_at' => $imported->json('updated_at'),
        ]);
        $again->assertOk()->assertJsonPath('imported', false);

        $this->assertSame(9, (int) DB::table('habit_check_ins')->where('user_id', $userId)->where('day', 2)->value('points'));
        $this->assertSame(4, (int) DB::table('habit_check_ins')->where('user_id', $userId)->where('day', 3)->value('points'));
        $this->assertSame(0, DB::table('habit_check_ins')->where('user_id', $userId)->where('day', 4)->count());
        $keptName = json_decode((string) DB::table('user_settings')->where('user_id', $userId)->value('custom_habits'), true)[0]['name'];
        $this->assertSame('Morning walk', $keptName);
    }

    public function test_failed_partner_accept_does_not_grant_connected(): void
    {
        $caller = 'usr_pair_caller_'.uniqid();
        $host = 'usr_pair_host_'.uniqid();
        DB::table('partner_connections')->insert([
            'id' => 'invite-'.$host,
            'user_id' => $host,
            'partner_user_id' => null,
            'invite_code' => 'HAB-HOST',
            'status' => 'pending',
            'alias' => 'Host',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($caller))
            ->postJson('/api/partner-connections/accept', ['invite_code' => 'HAB-MISSING'])
            ->assertStatus(404);

        $this->assertSame(0, DB::table('partner_connections')->where('user_id', $caller)->where('status', 'connected')->count());
        $this->assertSame('pending', DB::table('partner_connections')->where('id', 'invite-'.$host)->value('status'));
        $this->assertSame($host, DB::table('partner_connections')->where('id', 'invite-'.$host)->value('user_id'));
    }

    public function test_account_export_is_the_existing_export_for_the_caller_only(): void
    {
        $userId = 'usr_export_'.uniqid();
        $otherId = 'usr_export_other_'.uniqid();
        DB::table('habit_check_ins')->insert([
            'id' => 'export-'.$userId,
            'user_id' => $userId,
            'habit_id' => 'f-1',
            'habit_name' => 'Morning walk',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => 4,
            'source' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $own = $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($userId))
            ->getJson('/api/account-export');
        $own->assertOk();
        $own->assertJsonPath('user_id', $userId);
        $this->assertNotEmpty($own->json('exported_at'));
        $this->assertSame('export-'.$userId, $own->json('app.habit_check_ins.0.id'));

        $other = $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($otherId))
            ->getJson('/api/account-export');
        $other->assertOk();
        $other->assertJsonPath('user_id', $otherId);
        $this->assertSame([], $other->json('app.habit_check_ins'));
        $this->assertNotSame($userId, $other->json('user_id'));
    }

    public function test_guest_import_runs_when_there_is_no_settings_row_and_does_not_reprice(): void
    {
        $userId = 'usr_missing_row_'.uniqid();
        $stamp = '2026-11-01 08:00:00';
        DB::table('habit_check_ins')->insert([
            'id' => 'old-'.$userId,
            'user_id' => $userId,
            'habit_id' => 'f-1',
            'habit_name' => 'Morning walk',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => 9,
            'source' => 'web',
            'created_at' => $stamp,
            'updated_at' => $stamp,
        ]);

        $asUser = fn () => $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($userId));
        $missing = $asUser()->get('/api/user-settings');
        $missing->assertOk();
        $this->assertSame('null', $missing->getContent());

        $payload = [
            'custom_habits' => [[
                'id' => 'f-1',
                'name' => 'Morning walk',
                'points' => 4,
                'startTime' => '07:15',
            ]],
            'weekly_reviews' => [
                'reviewDate' => 'Nov 8, 2026',
                'checks' => [],
                'reflections' => ['wins' => 'Kept the morning'],
                'listSaved' => true,
            ],
            'kept_days' => [
                ['habit_id' => 'f-1', 'month_key' => '2026-11', 'day' => 2, 'completed_on' => '2026-11-02', 'points' => 99],
                ['habit_id' => 'f-1', 'month_key' => '2026-11', 'day' => 3, 'completed_on' => '2026-11-03', 'points' => 99],
            ],
        ];

        $logMessages = [];
        Log::listen(function ($event) use (&$logMessages): void {
            $logMessages[] = (string) ($event->message ?? '');
        });
        $asUser()->postJson('/api/guest-import', [
            ...$payload,
            'expected_updated_at' => '1999-01-01 00:00:00',
        ])->assertStatus(409);
        $logged = implode("\n", $logMessages);
        $this->assertStringContainsString('there was no settings row', $logged);
        $this->assertStringNotContainsString('Morning walk', $logged);
        $this->assertStringNotContainsString('Kept the morning', $logged);
        $this->assertStringNotContainsString('updated_at moved', $logged);
        $this->assertSame(0, DB::table('user_settings')->where('user_id', $userId)->count());
        $this->assertSame(9, (int) DB::table('habit_check_ins')->where('id', 'old-'.$userId)->value('points'));

        $imported = $asUser()->postJson('/api/guest-import', [
            ...$payload,
            'expected_updated_at' => null,
        ]);
        $imported->assertOk()->assertJsonPath('imported', true);
        $this->assertSame(9, (int) DB::table('habit_check_ins')->where('user_id', $userId)->where('day', 2)->value('points'));
        $this->assertSame(4, (int) DB::table('habit_check_ins')->where('user_id', $userId)->where('day', 3)->value('points'));
        $this->assertTrue(json_decode((string) DB::table('user_settings')->where('user_id', $userId)->value('weekly_reviews'), true)['listSaved'] === true);

        $again = $asUser()->postJson('/api/guest-import', [
            ...$payload,
            'kept_days' => [
                ['habit_id' => 'f-1', 'month_key' => '2026-11', 'day' => 2, 'completed_on' => '2026-11-02', 'points' => 1],
                ['habit_id' => 'f-1', 'month_key' => '2026-11', 'day' => 4, 'completed_on' => '2026-11-04', 'points' => 8],
            ],
            'expected_updated_at' => $imported->json('updated_at'),
        ]);
        $again->assertOk()->assertJsonPath('imported', false);
        $this->assertSame(9, (int) DB::table('habit_check_ins')->where('user_id', $userId)->where('day', 2)->value('points'));
        $this->assertSame(4, (int) DB::table('habit_check_ins')->where('user_id', $userId)->where('day', 3)->value('points'));
        $this->assertSame(0, DB::table('habit_check_ins')->where('user_id', $userId)->where('day', 4)->count());
    }

    public function test_protocol_save_without_habits_does_not_blank_stored_habits(): void
    {
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

        $userId = 'usr_protocol_'.uniqid();
        $stored = json_encode([['id' => 'f-1', 'name' => 'Morning walk', 'points' => 4]], JSON_UNESCAPED_UNICODE);
        DB::table('user_protocols')->insert([
            'id' => 'proto-'.$userId,
            'user_id' => $userId,
            'name' => 'Founder',
            'archetype' => 'founder',
            'is_active' => 0,
            'slots' => '[{"id":"slot-1"}]',
            'habits' => $stored,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($userId))
            ->postJson('/api/user-protocols', [
                'id' => 'proto-'.$userId,
                'is_active' => true,
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $row = DB::table('user_protocols')->where('id', 'proto-'.$userId)->first();
        $this->assertSame($stored, (string) $row->habits);
        $this->assertSame('Founder', $row->name);
        $this->assertSame('[{"id":"slot-1"}]', (string) $row->slots);
        $this->assertTrue((bool) $row->is_active);
    }

    public function test_unknown_habit_is_rejected_and_opening_the_app_does_not_reprice(): void
    {
        DB::statement('CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT,
            points_per_check_in INTEGER NOT NULL,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )');

        $userId = 'usr_points_'.uniqid();
        $stamp = '2026-11-01 08:00:00';
        DB::table('user_settings')->insert([
            'user_id' => $userId,
            'custom_habits' => json_encode([['id' => 'f-1', 'name' => 'Walk', 'points' => 4]]),
            'weekly_reviews' => json_encode(['listSaved' => true]),
            'created_at' => $stamp,
            'updated_at' => $stamp,
        ]);
        DB::table('habits')->insert([
            'id' => 'f-1',
            'user_id' => $userId,
            'name' => 'Legacy walk',
            'points_per_check_in' => 9,
            'created_at' => $stamp,
            'updated_at' => $stamp,
        ]);
        DB::table('habit_check_ins')->insert([
            'id' => 'kept-'.$userId,
            'user_id' => $userId,
            'habit_id' => 'f-1',
            'habit_name' => 'Walk',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => 1,
            'source' => 'web',
            'created_at' => $stamp,
            'updated_at' => $stamp,
        ]);

        $asUser = fn () => $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($userId));
        $asUser()->getJson('/api/user-settings')->assertOk();
        $asUser()->getJson('/api/habits/check-ins?month_key=2026-11')->assertOk();
        $this->assertSame(1, (int) DB::table('habit_check_ins')->where('id', 'kept-'.$userId)->value('points'));

        $asUser()->postJson('/api/habits/check-ins', [
            'habit_id' => 'not-on-the-list',
            'month_key' => '2026-11',
            'day' => 4,
            'completed_on' => '2026-11-04',
            'points' => 1,
        ])->assertStatus(422)->assertJsonPath('error', 'Unknown habit');
        $this->assertSame(0, DB::table('habit_check_ins')->where('habit_id', 'not-on-the-list')->count());

        $asUser()->postJson('/api/habits/check-ins', [
            'habit_id' => 'f-1',
            'month_key' => '2026-11',
            'day' => 8,
            'completed_on' => '2026-11-08',
            'points' => 100,
        ])->assertOk();
        $this->assertSame(4, (int) DB::table('habit_check_ins')->where('user_id', $userId)->where('day', 8)->value('points'));
        $this->assertSame(1, (int) DB::table('habit_check_ins')->where('id', 'kept-'.$userId)->value('points'));

        $asUser()->postJson('/api/habits/check-ins', [
            'habit_id' => 'f-1',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => 100,
        ])->assertOk();
        $this->assertSame(1, (int) DB::table('habit_check_ins')->where('id', 'kept-'.$userId)->value('points'));
    }

    public function test_sunday_review_uses_the_saved_list_schedule_and_skips_archive(): void
    {
        DB::statement('CREATE TABLE IF NOT EXISTS user_protocols (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT,
            habits TEXT,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )');
        $userId = 'usr_review_'.uniqid();
        DB::table('user_settings')->insert([
            'user_id' => $userId,
            'custom_habits' => json_encode([
                ['id' => 'weekday', 'name' => 'Desk', 'schedule' => 'weekdays'],
                ['id' => 'paused', 'name' => 'Old stretch', 'schedule' => 'weekdays', 'archived' => true],
            ]),
            'weekly_reviews' => json_encode(['listSaved' => true, 'reflections' => ['wins' => 'personal note']]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('user_protocols')->insert([
            'id' => 'proto-review-'.$userId,
            'user_id' => $userId,
            'name' => 'Not the list',
            'habits' => json_encode([['id' => 'protocol-only', 'name' => 'Protocol only']]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('habit_check_ins')->insert([
            'id' => 'paused-'.$userId,
            'user_id' => $userId,
            'habit_id' => 'paused',
            'habit_name' => 'Old stretch',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => 3,
            'source' => 'web',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $review = $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($userId))
            ->getJson('/api/sunday-review?date=2026-11-07');
        $review->assertOk()
            ->assertJsonPath('missed_slots', 5)
            ->assertJsonPath('completed_slots', 0)
            ->assertJsonPath('title', 'Week of 2-7 Nov');
        $this->assertStringNotContainsString('Desk', $review->getContent());
        $this->assertStringNotContainsString('Old stretch', $review->getContent());
        $this->assertStringNotContainsString('Protocol only', $review->getContent());
        $this->assertSame(3, (int) DB::table('habit_check_ins')->where('id', 'paused-'.$userId)->value('points'));
    }
}
