<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class SavedHabitListTest extends TestCase
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

    public function test_saved_habit_list_and_personal_review_round_trip(): void
    {
        $userId = 'usr_habits_'.uniqid();
        $otherId = 'usr_other_'.uniqid();
        $stamp = '2026-11-01 08:00:00';
        $protocolId = 'protocol-'.$userId;

        DB::table('user_settings')->insert([
            'user_id' => $userId,
            'progressive_settings' => '{"phase":"keep"}',
            'custom_habits' => '[]',
            'rewards' => '[{"id":"rew-1","item":"Tea"}]',
            'reward_ledger' => '[{"id":"led-1"}]',
            'weekly_reviews' => '{}',
            'enhanced_state' => '{"kept":true}',
            'day_type' => 'home',
            'dark_mode' => 1,
            'created_at' => $stamp,
            'updated_at' => $stamp,
        ]);
        DB::table('habit_check_ins')->insert([
            'id' => 'check-'.$userId,
            'user_id' => $userId,
            'habit_id' => 'legacy-habit',
            'habit_name' => 'Legacy',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => 9,
            'source' => 'web',
            'created_at' => $stamp,
            'updated_at' => $stamp,
        ]);
        DB::table('user_protocols')->insert([
            'id' => $protocolId,
            'user_id' => $userId,
            'name' => 'Untouched protocol',
            'archetype' => 'custom',
            'is_active' => 1,
            'habits' => '[{"id":"p-1","name":"Protocol habit"}]',
            'created_at' => $stamp,
            'updated_at' => $stamp,
        ]);

        $token = $this->createMockJwt($userId);
        $asUser = fn () => $this->withHeader('Authorization', 'Bearer '.$token);

        $unmarked = $asUser()->getJson('/api/user-settings');
        $unmarked->assertOk();
        $this->assertNotTrue(data_get($unmarked->json(), 'weekly_reviews.listSaved'));
        $this->assertSame([], $unmarked->json('custom_habits'));

        $asUser()->postJson('/api/user-settings', [
            'custom_habits' => [],
            'weekly_reviews' => [],
            'expected_updated_at' => $unmarked->json('updated_at'),
        ])->assertOk();

        $stillUnmarked = $asUser()->getJson('/api/user-settings');
        $stillUnmarked->assertOk();
        $this->assertNotTrue(data_get($stillUnmarked->json(), 'weekly_reviews.listSaved'));
        $this->assertSame([], $stillUnmarked->json('custom_habits'));
        $this->assertSame($unmarked->json('updated_at'), $stillUnmarked->json('updated_at'));

        $saved = $asUser()->postJson('/api/user-settings', [
            'custom_habits' => [[
                'id' => 'f-1',
                'name' => '05:40 Mobility',
                'points' => 4,
                'category' => 'fitness',
                'hint' => 'Easy pace',
                'time' => '05:40',
                'timeSlot' => 'morning',
                'schedule' => 'weekdays',
                'scheduleType' => 'weekdays',
                'days' => [1, 2, 3, 4, 5],
                'completed_days' => [2, 3],
            ], [
                'id' => 'c-keep',
                'name' => 'Custom walk',
                'points' => 2,
                'category' => 'fitness',
                'hint' => 'Outside',
            ]],
            'weekly_reviews' => [
                'reviewDate' => 'Nov 8, 2026',
                'checks' => [[
                    'text' => 'I reviewed missed days and found one clear trigger.',
                    'done' => true,
                ]],
                'reflections' => ['wins' => 'Kept the morning', 'misses' => ''],
                'coupleChecks' => [['text' => 'Do not store', 'done' => true]],
                'coupleReflections' => ['wins' => 'Do not store'],
                'listSaved' => true,
            ],
            'expected_updated_at' => $stillUnmarked->json('updated_at'),
            'rewards' => [['id' => 'rew-replaced']],
            'day_type' => 'office',
            'dark_mode' => false,
        ]);
        $saved->assertOk()->assertJsonPath('success', true);

        $reloaded = $asUser()->getJson('/api/user-settings');
        $reloaded->assertOk();
        $reloaded->assertJsonPath('custom_habits.0.id', 'f-1');
        $reloaded->assertJsonPath('custom_habits.0.name', '05:40 Mobility');
        $reloaded->assertJsonPath('custom_habits.0.points', 4);
        $reloaded->assertJsonPath('custom_habits.0.time', '05:40');
        $reloaded->assertJsonPath('custom_habits.0.schedule', 'weekdays');
        $reloaded->assertJsonPath('custom_habits.1.id', 'c-keep');
        $reloaded->assertJsonPath('weekly_reviews.reviewDate', 'Nov 8, 2026');
        $reloaded->assertJsonPath('weekly_reviews.checks.0.done', true);
        $reloaded->assertJsonPath('weekly_reviews.reflections.wins', 'Kept the morning');
        $reloaded->assertJsonPath('weekly_reviews.listSaved', true);
        $this->assertArrayNotHasKey('completed_days', $reloaded->json('custom_habits.0'));
        $this->assertArrayNotHasKey('coupleChecks', $reloaded->json('weekly_reviews'));
        $this->assertArrayNotHasKey('coupleReflections', $reloaded->json('weekly_reviews'));
        $this->assertSame('home', DB::table('user_settings')->where('user_id', $userId)->value('day_type'));
        $this->assertSame(
            [['id' => 'rew-1', 'item' => 'Tea']],
            json_decode((string) DB::table('user_settings')->where('user_id', $userId)->value('rewards'), true),
        );
        $this->assertSame(
            '{"phase":"keep"}',
            DB::table('user_settings')->where('user_id', $userId)->value('progressive_settings'),
        );
        $this->assertSame(
            '[{"id":"p-1","name":"Protocol habit"}]',
            DB::table('user_protocols')->where('id', $protocolId)->value('habits'),
        );
        $this->assertSame(9, (int) DB::table('habit_check_ins')->where('id', 'check-'.$userId)->value('points'));

        $asUser()->postJson('/api/user-settings', [
            'day_type' => 'office',
            'rewards' => [['id' => 'rew-new']],
            'reward_ledger' => [],
            'progressive_settings' => ['phase' => 'changed'],
            'enhanced_state' => ['kept' => false],
            'dark_mode' => false,
        ])->assertOk();

        $afterOmit = $asUser()->getJson('/api/user-settings');
        $afterOmit->assertJsonPath('custom_habits.0.name', '05:40 Mobility');
        $afterOmit->assertJsonPath('weekly_reviews.reflections.wins', 'Kept the morning');
        $afterOmit->assertJsonPath('weekly_reviews.listSaved', true);
        $this->assertSame('home', DB::table('user_settings')->where('user_id', $userId)->value('day_type'));
        $this->assertSame(
            [['id' => 'rew-1', 'item' => 'Tea']],
            json_decode((string) DB::table('user_settings')->where('user_id', $userId)->value('rewards'), true),
        );
        $this->assertSame(9, (int) DB::table('habit_check_ins')->where('id', 'check-'.$userId)->value('points'));

        $asUser()->postJson('/api/habits/check-ins', [
            'habit_id' => 'f-1',
            'habit_name' => '05:40 Mobility',
            'month_key' => '2026-11',
            'day' => 8,
            'completed_on' => '2026-11-08',
            'points' => 100,
        ])->assertOk();
        $this->assertSame(4, (int) DB::table('habit_check_ins')->where('user_id', $userId)->where('habit_id', 'f-1')->value('points'));
        $this->assertSame(9, (int) DB::table('habit_check_ins')->where('id', 'check-'.$userId)->value('points'));

        $currentStamp = $afterOmit->json('updated_at');
        $asUser()->postJson('/api/user-settings', [
            'custom_habits' => [[
                'id' => 'f-1',
                'name' => 'Replaced name',
                'points' => 1,
            ]],
            'weekly_reviews' => [
                'reviewDate' => 'Nov 9, 2026',
                'checks' => [],
                'reflections' => ['wins' => 'Newer review'],
                'listSaved' => true,
            ],
            'expected_updated_at' => '1999-01-01 00:00:00',
        ])->assertStatus(409);

        $afterStale = $asUser()->getJson('/api/user-settings');
        $afterStale->assertJsonPath('custom_habits.0.name', '05:40 Mobility');
        $afterStale->assertJsonPath('weekly_reviews.reflections.wins', 'Kept the morning');
        $this->assertSame($currentStamp, $afterStale->json('updated_at'));

        $other = $this->withHeader('Authorization', 'Bearer '.$this->createMockJwt($otherId));
        $other->getJson('/api/user-settings?user_id='.$userId)->assertStatus(403);
        $other->postJson('/api/user-settings', [
            'user_id' => $userId,
            'custom_habits' => [[
                'id' => 'f-1',
                'name' => 'Stolen',
                'points' => 1,
            ]],
            'weekly_reviews' => [
                'reviewDate' => '',
                'checks' => [],
                'reflections' => ['wins' => 'Stolen'],
                'listSaved' => true,
            ],
            'expected_updated_at' => $currentStamp,
        ])->assertStatus(403);
        $this->assertStringNotContainsString('05:40 Mobility', (string) $other->getJson('/api/user-settings')->getContent());
        $this->assertSame('05:40 Mobility', $asUser()->getJson('/api/user-settings')->json('custom_habits.0.name'));

        $emptyStamp = $asUser()->getJson('/api/user-settings')->json('updated_at');
        $asUser()->postJson('/api/user-settings', [
            'custom_habits' => [],
            'weekly_reviews' => [
                'reviewDate' => 'Nov 10, 2026',
                'checks' => [],
                'reflections' => ['wins' => 'Cleared on purpose'],
                'listSaved' => true,
            ],
            'expected_updated_at' => $emptyStamp,
        ])->assertOk();

        $deliberate = $asUser()->getJson('/api/user-settings');
        $deliberate->assertJsonPath('custom_habits', []);
        $deliberate->assertJsonPath('weekly_reviews.listSaved', true);
        $deliberate->assertJsonPath('weekly_reviews.reflections.wins', 'Cleared on purpose');
        $this->assertSame('home', DB::table('user_settings')->where('user_id', $userId)->value('day_type'));
        $this->assertSame(9, (int) DB::table('habit_check_ins')->where('id', 'check-'.$userId)->value('points'));
        $this->assertSame('Untouched protocol', DB::table('user_protocols')->where('id', $protocolId)->value('name'));
    }
}
