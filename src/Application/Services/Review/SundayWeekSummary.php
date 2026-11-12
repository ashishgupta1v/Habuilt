<?php

declare(strict_types=1);

namespace App\Services\Review;

use DateInterval;
use DateTimeImmutable;

/**
 * Counts a week from real check-ins.
 * A miss counts only on a day the habit is scheduled. An archived habit leaves the denominator.
 * Check-in rows are not deleted here.
 */
final class SundayWeekSummary
{
    /**
     * @param array<int, array{habit_id?: string, completed_on?: string}> $checkIns
     * @param array<int, string|array<string, mixed>> $habitIds
     * @return array{title: string, week_start: string, week_end: string, completed_slots: int, missed_slots: int, streak: int, share_text: string}
     */
    public function summarize(array $checkIns, array $habitIds, string $today): array
    {
        $todayDate = new DateTimeImmutable($today);
        $weekStart = $todayDate->modify('monday this week');
        $dates = [];
        for ($cursor = $weekStart; $cursor <= $todayDate; $cursor = $cursor->add(new DateInterval('P1D'))) {
            $dates[] = $cursor->format('Y-m-d');
        }

        $entries = $this->habitEntries($habitIds);
        $active = [];
        $paused = [];
        foreach ($entries as $entry) {
            if ($entry['archived']) {
                $paused[$entry['id']] = true;
                continue;
            }
            $active[$entry['id']] = $entry['definition'];
        }

        $done = [];
        $daysWithCheckIn = [];
        foreach ($checkIns as $row) {
            $date = substr((string) ($row['completed_on'] ?? ''), 0, 10);
            $habitId = trim((string) ($row['habit_id'] ?? ''));
            if ($date === '' || $habitId === '' || isset($paused[$habitId])) {
                continue;
            }
            $daysWithCheckIn[$date] = true;
            if ($dates !== [] && $date >= $dates[0] && $date <= $today) {
                $done[$habitId.'|'.$date] = true;
            }
        }

        $completed = 0;
        $missed = 0;
        if ($active === []) {
            $completed = count($done);
        } else {
            foreach ($dates as $date) {
                $dateObject = new DateTimeImmutable($date);
                foreach ($active as $habitId => $definition) {
                    if (!$this->scheduledOn($definition, $dateObject)) {
                        continue;
                    }
                    if (isset($done[$habitId.'|'.$date])) {
                        $completed++;
                    } else {
                        $missed++;
                    }
                }
            }
            foreach (array_keys($done) as $key) {
                $habitId = explode('|', $key, 2)[0];
                if (!isset($active[$habitId])) {
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

        $title = $this->weekTitle($dates[0] ?? $today, $today);
        $share = "{$title}\nCompleted: {$completed}\nMissed: {$missed}\nStreak: {$streak} days";

        return [
            'title' => $title,
            'week_start' => $dates[0] ?? $today,
            'week_end' => $today,
            'completed_slots' => $completed,
            'missed_slots' => $missed,
            'streak' => $streak,
            'share_text' => $share,
        ];
    }

    /**
     * @param array<string, mixed> $habit
     */
    public function scheduledOn(array $habit, DateTimeImmutable $date): bool
    {
        $dow = (int) $date->format('w');
        $scheduleType = $habit['scheduleType'] ?? $habit['schedule'] ?? null;
        $daysOfWeek = $this->numberList($habit['daysOfWeek'] ?? null);
        $customDays = $this->numberList($habit['customDays'] ?? null);
        if ($customDays === [] && $scheduleType === 'custom') {
            $customDays = $this->numberList($habit['days'] ?? null);
        }
        $days = $this->numberList($habit['days'] ?? null);

        if ($daysOfWeek !== []) {
            return in_array($dow, $daysOfWeek, true);
        }
        if ($scheduleType === 'weekdays') {
            return $dow >= 1 && $dow <= 5;
        }
        if ($scheduleType === 'weekends') {
            return $dow === 0 || $dow === 6;
        }
        if ($scheduleType === 'custom' && $customDays !== []) {
            $customDow = $dow === 0 ? 7 : $dow;

            return in_array($customDow, $customDays, true) || in_array($dow, $customDays, true);
        }
        if (!isset($habit['scheduleType']) && !isset($habit['daysOfWeek']) && $days !== []) {
            return in_array($dow, $days, true);
        }

        return true;
    }

    /**
     * @param array<int, string|array<string, mixed>> $habits
     * @return array<int, array{id: string, archived: bool, definition: array<string, mixed>}>
     */
    private function habitEntries(array $habits): array
    {
        $entries = [];
        foreach ($habits as $habit) {
            if (is_string($habit) || is_int($habit)) {
                $id = trim((string) $habit);
                if ($id === '') {
                    continue;
                }
                $entries[] = ['id' => $id, 'archived' => false, 'definition' => ['id' => $id]];
                continue;
            }
            if (!is_array($habit)) {
                continue;
            }
            $id = trim((string) ($habit['id'] ?? $habit['habit_id'] ?? ''));
            if ($id === '') {
                continue;
            }
            $entries[] = [
                'id' => $id,
                'archived' => ($habit['archived'] ?? false) === true,
                'definition' => $habit,
            ];
        }

        return $entries;
    }

    /**
     * @return array<int, int>
     */
    private function numberList(mixed $value): array
    {
        if (!is_array($value) || $value === []) {
            return [];
        }
        $numbers = [];
        foreach ($value as $item) {
            if (is_int($item) || (is_string($item) && is_numeric($item))) {
                $numbers[] = (int) $item;
            }
        }

        return $numbers;
    }

    private function weekTitle(string $start, string $end): string
    {
        try {
            $startDate = new DateTimeImmutable($start);
            $endDate = new DateTimeImmutable($end);
        } catch (\Throwable) {
            return 'This week';
        }
        if ($startDate->format('Y-m-d') === $endDate->format('Y-m-d')) {
            return 'Week of '.$startDate->format('j M');
        }
        if ($startDate->format('M Y') === $endDate->format('M Y')) {
            return 'Week of '.$startDate->format('j').'-'.$endDate->format('j M');
        }

        return 'Week of '.$startDate->format('j M').'-'.$endDate->format('j M');
    }
}
