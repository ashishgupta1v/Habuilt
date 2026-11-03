<?php

declare(strict_types=1);

namespace App\Services\Review;

use DateInterval;
use DateTimeImmutable;

/**
 * Counts a Sunday review from real check-ins.
 * A slot is completed only when a check-in exists. Missing schedule rows are not invented.
 */
final class SundayWeekSummary
{
    /**
     * @param array<int, array{habit_id?: string, completed_on?: string}> $checkIns
     * @param array<int, string> $habitIds
     * @return array{week_start: string, week_end: string, completed_slots: int, missed_slots: int, streak: int, share_text: string}
     */
    public function summarize(array $checkIns, array $habitIds, string $today): array
    {
        $todayDate = new DateTimeImmutable($today);
        $weekStart = $todayDate->modify('monday this week');
        $dates = [];
        for ($cursor = $weekStart; $cursor <= $todayDate; $cursor = $cursor->add(new DateInterval('P1D'))) {
            $dates[] = $cursor->format('Y-m-d');
        }

        $done = [];
        $daysWithCheckIn = [];
        foreach ($checkIns as $row) {
            $date = substr((string) ($row['completed_on'] ?? ''), 0, 10);
            $habitId = trim((string) ($row['habit_id'] ?? ''));
            if ($date === '' || $habitId === '') {
                continue;
            }
            $daysWithCheckIn[$date] = true;
            if ($date >= $dates[0] && $date <= $today) {
                $done[$habitId.'|'.$date] = true;
            }
        }

        $habitIds = array_values(array_unique(array_filter(array_map(
            static fn (mixed $id): string => trim((string) $id),
            $habitIds,
        ))));

        $completed = 0;
        $missed = 0;
        if ($habitIds === []) {
            $completed = count($done);
        } else {
            $known = array_fill_keys($habitIds, true);
            foreach ($dates as $date) {
                foreach ($habitIds as $habitId) {
                    if (isset($done[$habitId.'|'.$date])) {
                        $completed++;
                    } else {
                        $missed++;
                    }
                }
            }
            foreach (array_keys($done) as $key) {
                $habitId = explode('|', $key, 2)[0];
                if (!isset($known[$habitId])) {
                    $completed++;
                }
            }
        }

        $streak = 0;
        $cursor = isset($daysWithCheckIn[$today]) ? $todayDate : $todayDate->sub(new DateInterval('P1D'));
        while (isset($daysWithCheckIn[$cursor->format('Y-m-d')])) {
            $streak++;
            $cursor = $cursor->sub(new DateInterval('P1D'));
            if ($streak > 3660) {
                break;
            }
        }

        $share = "Sunday review\nCompleted: {$completed}\nMissed: {$missed}\nStreak: {$streak} days";

        return [
            'week_start' => $dates[0],
            'week_end' => $today,
            'completed_slots' => $completed,
            'missed_slots' => $missed,
            'streak' => $streak,
            'share_text' => $share,
        ];
    }
}
