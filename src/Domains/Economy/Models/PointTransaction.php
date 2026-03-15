<?php

declare(strict_types=1);

namespace Habuilt\Domains\Economy\Models;

use DateTimeImmutable;
use Habuilt\Domains\Economy\ValueObjects\PointTransactionId;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Domains\Tracking\ValueObjects\CheckInId;
use Habuilt\Shared\Domain\ValueObjects\PointValue;

final readonly class PointTransaction
{
    public function __construct(
        public PointTransactionId $id,
        public UserId $userId,
        public PointValue $amount,
        public string $reason,
        public CheckInId $referenceId,
        public DateTimeImmutable $occurredAt,
    ) {
    }
}
