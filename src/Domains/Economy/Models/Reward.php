<?php

declare(strict_types=1);

namespace Habuilt\Domains\Economy\Models;

use Habuilt\Domains\Economy\ValueObjects\RewardId;
use Habuilt\Shared\Domain\ValueObjects\PointValue;

final readonly class Reward
{
    public function __construct(
        public RewardId $id,
        public string $name,
        public PointValue $cost,
        public bool $isActive,
    ) {
    }
}
