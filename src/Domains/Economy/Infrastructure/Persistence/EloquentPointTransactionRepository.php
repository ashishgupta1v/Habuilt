<?php

declare(strict_types=1);

namespace Habuilt\Domains\Economy\Infrastructure\Persistence;

use DateTimeImmutable;
use Habuilt\Domains\Economy\Contracts\Repositories\PointTransactionRepositoryInterface;
use Habuilt\Domains\Economy\Infrastructure\Persistence\Eloquent\EloquentPointTransactionModel;
use Habuilt\Domains\Economy\Models\PointTransaction;
use Habuilt\Domains\Economy\ValueObjects\PointTransactionId;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\ValueObjects\CheckInId;
use Habuilt\Shared\Domain\ValueObjects\PointValue;

final class EloquentPointTransactionRepository implements PointTransactionRepositoryInterface
{
    public function save(PointTransaction $pointTransaction): void
    {
        EloquentPointTransactionModel::query()->updateOrCreate(
            ['id' => $pointTransaction->id->value()],
            [
                'user_id'      => $pointTransaction->userId->value(),
                'amount'       => $pointTransaction->amount->value(),
                'reason'       => $pointTransaction->reason,
                'reference_id' => $pointTransaction->referenceId->value(),
                'occurred_at'  => $pointTransaction->occurredAt->format('Y-m-d H:i:s'),
            ],
        );
    }

    /**
     * @return list<PointTransaction>
     */
    public function findLedgerForUser(UserId $userId): array
    {
        return EloquentPointTransactionModel::query()
            ->where('user_id', $userId->value())
            ->orderBy('occurred_at', 'desc')
            ->get()
            ->map(fn (EloquentPointTransactionModel $row) => $this->toDomain($row))
            ->values()
            ->all();
    }

    public function currentBalanceForUser(UserId $userId): PointValue
    {
        $total = (int) EloquentPointTransactionModel::query()
            ->where('user_id', $userId->value())
            ->sum('amount');

        // Balance of zero is not representable by PointValue (min = 1).
        // New accounts with no transactions get a floor of 1 here; callers
        // must treat this as "no redeemable balance" by checking ledger count.
        return new PointValue(max(1, $total));
    }

    // ── Private mapper ────────────────────────────────────────────────────────

    private function toDomain(EloquentPointTransactionModel $row): PointTransaction
    {
        return new PointTransaction(
            id:          PointTransactionId::from($row->id),
            userId:      UserId::from($row->user_id),
            amount:      new PointValue((int) $row->amount),
            reason:      $row->reason,
            referenceId: CheckInId::from($row->reference_id),
            occurredAt:  new DateTimeImmutable($row->occurred_at),
        );
    }
}
