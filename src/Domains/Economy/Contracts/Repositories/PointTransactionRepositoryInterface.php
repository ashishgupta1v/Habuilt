<?php

declare(strict_types=1);

namespace Habuilt\Domains\Economy\Contracts\Repositories;

use DateTimeImmutable;
use Habuilt\Domains\Economy\Models\PointTransaction;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\ValueObjects\CheckInId;
use Habuilt\Shared\Domain\ValueObjects\PointValue;

interface PointTransactionRepositoryInterface
{
    public function save(PointTransaction $pointTransaction): void;

    /**
     * @return list<PointTransaction>
     */
    public function findLedgerForUser(UserId $userId): array;

    /**
     * @return list<PointTransaction>
     */
    public function findLedgerForUserInRange(UserId $userId, DateTimeImmutable $from, DateTimeImmutable $to): array;

    public function currentBalanceForUser(UserId $userId): PointValue;

    public function clearLedgerForUser(UserId $userId): int;

    public function clearLedgerForUserInRange(UserId $userId, DateTimeImmutable $from, DateTimeImmutable $to): int;

    public function removeByReferenceId(CheckInId $referenceId): int;
}
