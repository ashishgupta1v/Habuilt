<?php

declare(strict_types=1);

namespace Tests\Unit\Review;

use App\Services\Review\SundayWeekSummary;
use PHPUnit\Framework\TestCase;

final class SundayWeekSummaryTest extends TestCase
{
    public function test_counts_only_real_check_ins_and_does_not_miss_future_days(): void
    {
        $summary = (new SundayWeekSummary())->summarize([
            ['habit_id' => 'a', 'completed_on' => '2026-11-01'],
            ['habit_id' => 'a', 'completed_on' => '2026-11-02'],
            ['habit_id' => 'a', 'completed_on' => '2026-11-03'],
            ['habit_id' => 'b', 'completed_on' => '2026-11-04'],
        ], ['a', 'b'], '2026-11-04');

        self::assertSame('2026-11-02', $summary['week_start']);
        self::assertSame(3, $summary['completed_slots']);
        self::assertSame(3, $summary['missed_slots']);
        self::assertSame(4, $summary['streak']);
        self::assertSame('Week of 2-4 Nov', $summary['title']);
        self::assertSame(
            "Week of 2-4 Nov\nCompleted: 3\nMissed: 3\nStreak: 4 days",
            $summary['share_text'],
        );
    }

    public function test_a_miss_counts_only_on_a_scheduled_day_and_archive_leaves_the_denominator(): void
    {
        $summary = (new SundayWeekSummary())->summarize([
            ['habit_id' => 'weekday', 'completed_on' => '2026-11-07'],
            ['habit_id' => 'paused', 'completed_on' => '2026-11-02'],
        ], [
            ['id' => 'weekday', 'name' => 'Desk', 'schedule' => 'weekdays'],
            ['id' => 'paused', 'name' => 'Old stretch', 'schedule' => 'weekdays', 'archived' => true],
        ], '2026-11-07');

        self::assertSame(5, $summary['missed_slots']);
        self::assertSame(0, $summary['completed_slots']);
        self::assertSame('Week of 2-7 Nov', $summary['title']);
        self::assertStringNotContainsString('Desk', $summary['share_text']);
        self::assertStringNotContainsString('Old stretch', $summary['share_text']);
    }

    public function test_without_a_saved_schedule_missed_slots_stay_zero(): void
    {
        $summary = (new SundayWeekSummary())->summarize([
            ['habit_id' => 'a', 'completed_on' => '2026-11-03'],
            ['habit_id' => 'a', 'completed_on' => '2026-11-03'],
            ['habit_id' => 'b', 'completed_on' => '2026-11-09'],
        ], [], '2026-11-04');

        self::assertSame(1, $summary['completed_slots']);
        self::assertSame(0, $summary['missed_slots']);
        self::assertSame(1, $summary['streak']);
    }
}
