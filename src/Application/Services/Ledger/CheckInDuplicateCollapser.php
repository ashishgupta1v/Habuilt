<?php

declare(strict_types=1);

namespace App\Services\Ledger;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class CheckInConstraintConflict extends \RuntimeException
{
    public function __construct(public readonly int $conflictingGroups)
    {
        parent::__construct(
            'Refusing unique check-in constraint because '.$conflictingGroups.' duplicate group(s) disagree on points or status.'
        );
    }
}

/**
 * Collapses exact duplicate habit_check_ins groups before the unique index is added.
 * Groups that disagree on points, or on status when that column exists, are left untouched.
 */
final class CheckInDuplicateCollapser
{
    /**
     * @return array{collapsed_groups: int, conflicting_groups: int, aborted: bool}
     */
    public function collapse(): array
    {
        if (!Schema::hasTable('habit_check_ins')) {
            return [
                'collapsed_groups' => 0,
                'conflicting_groups' => 0,
                'aborted' => false,
            ];
        }

        $columns = Schema::getColumnListing('habit_check_ins');
        $hasStatus = in_array('status', $columns, true);
        $hasUpdatedAt = in_array('updated_at', $columns, true);
        $hasId = in_array('id', $columns, true);

        $groups = DB::table('habit_check_ins')
            ->select('user_id', 'habit_id', 'month_key', 'day')
            ->groupBy('user_id', 'habit_id', 'month_key', 'day')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        if ($groups->isEmpty()) {
            return [
                'collapsed_groups' => 0,
                'conflicting_groups' => 0,
                'aborted' => false,
            ];
        }

        if (!$hasId) {
            return [
                'collapsed_groups' => 0,
                'conflicting_groups' => $groups->count(),
                'aborted' => true,
            ];
        }

        $plans = [];
        $conflicts = 0;

        foreach ($groups as $group) {
            $rows = DB::table('habit_check_ins')
                ->where('user_id', $group->user_id)
                ->where('habit_id', $group->habit_id)
                ->where('month_key', $group->month_key)
                ->where('day', $group->day)
                ->get()
                ->all();

            if ($this->groupConflicts($rows, $hasStatus)) {
                $conflicts++;
                continue;
            }

            $plans[] = $this->idsToDelete($rows, $hasUpdatedAt);
        }

        if ($conflicts > 0) {
            return [
                'collapsed_groups' => 0,
                'conflicting_groups' => $conflicts,
                'aborted' => true,
            ];
        }

        $collapsed = 0;
        foreach ($plans as $deleteIds) {
            if ($deleteIds === []) {
                continue;
            }
            DB::table('habit_check_ins')->whereIn('id', $deleteIds)->delete();
            $collapsed++;
        }

        return [
            'collapsed_groups' => $collapsed,
            'conflicting_groups' => 0,
            'aborted' => false,
        ];
    }

    /**
     * @param list<object> $rows
     */
    private function groupConflicts(array $rows, bool $hasStatus): bool
    {
        $points = [];
        $statuses = [];

        foreach ($rows as $row) {
            if (!property_exists($row, 'points')) {
                return true;
            }
            $points[] = (int) $row->points;
            if ($hasStatus) {
                $statuses[] = $row->status === null ? '' : (string) $row->status;
            }
        }

        if (count(array_unique($points)) > 1) {
            return true;
        }

        return $hasStatus && count(array_unique($statuses)) > 1;
    }

    /**
     * @param list<object> $rows
     * @return list<string>
     */
    private function idsToDelete(array $rows, bool $hasUpdatedAt): array
    {
        usort($rows, function (object $left, object $right) use ($hasUpdatedAt): int {
            $leftTime = ($hasUpdatedAt && isset($left->updated_at)) ? strtotime((string) $left->updated_at) : 0;
            $rightTime = ($hasUpdatedAt && isset($right->updated_at)) ? strtotime((string) $right->updated_at) : 0;
            $leftTime = $leftTime === false ? 0 : $leftTime;
            $rightTime = $rightTime === false ? 0 : $rightTime;

            if ($leftTime !== $rightTime) {
                return $rightTime <=> $leftTime;
            }

            return strcmp((string) $right->id, (string) $left->id);
        });

        $deleteIds = [];
        foreach (array_slice($rows, 1) as $row) {
            $deleteIds[] = (string) $row->id;
        }

        return $deleteIds;
    }
}
