<?php

declare(strict_types=1);

namespace Habuilt\Domains\Economy\Infrastructure\Persistence;

use Habuilt\Domains\Economy\Contracts\Repositories\RewardRepositoryInterface;
use Habuilt\Domains\Economy\Infrastructure\Persistence\Eloquent\EloquentRewardModel;
use Habuilt\Domains\Economy\Models\Reward;
use Habuilt\Domains\Economy\ValueObjects\RewardId;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Shared\Domain\ValueObjects\PointValue;

final class EloquentRewardRepository implements RewardRepositoryInterface
{
    public function findById(RewardId $rewardId): ?Reward
    {
        $row = EloquentRewardModel::query()->find($rewardId->value());

        return $row !== null ? $this->toDomain($row) : null;
    }

    /**
     * Returns all active rewards whose cost is within the user's current balance.
     * UserId is accepted for future per-user reward catalogues (e.g. unlocks).
     *
     * @return list<Reward>
     */
    public function findRedeemableByUser(UserId $userId, PointValue $currentBalance): array
    {
        return EloquentRewardModel::query()
            ->where('is_active', true)
            ->where('cost', '<=', $currentBalance->value())
            ->orderBy('cost', 'asc')
            ->get()
            ->map(fn (EloquentRewardModel $row) => $this->toDomain($row))
            ->values()
            ->all();
    }

    // ── Private mapper ────────────────────────────────────────────────────────

    private function toDomain(EloquentRewardModel $row): Reward
    {
        return new Reward(
            id:       RewardId::from($row->id),
            name:     $row->name,
            cost:     new PointValue((int) $row->cost),
            isActive: (bool) $row->is_active,
        );
    }
}
