<?php

declare(strict_types=1);

namespace Habuilt\Domains\Economy\Contracts\Repositories;

use Habuilt\Domains\Economy\Models\PointTransaction;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Shared\Domain\ValueObjects\PointValue;

interface PointTransactionRepositoryInterface
{
    public function save(PointTransaction $pointTransaction): void;

    /**
     * @return list<PointTransaction>
     */
    public function findLedgerForUser(UserId $userId): array;

    public function currentBalanceForUser(UserId $userId): PointValue;
}
