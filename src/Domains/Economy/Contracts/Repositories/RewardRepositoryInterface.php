<?php

declare(strict_types=1);

namespace Habuilt\Domains\Economy\Contracts\Repositories;

use Habuilt\Domains\Economy\Models\Reward;
use Habuilt\Domains\Economy\ValueObjects\RewardId;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Shared\Domain\ValueObjects\PointValue;

interface RewardRepositoryInterface
{
    public function findById(RewardId $rewardId): ?Reward;

    /**
     * @return list<Reward>
     */
    public function findRedeemableByUser(UserId $userId, PointValue $currentBalance): array;
}
