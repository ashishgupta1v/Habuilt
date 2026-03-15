<?php

declare(strict_types=1);

namespace Habuilt\Shared\Domain\Events;

use DateTimeImmutable;

interface DomainEventInterface
{
    /** Unique identifier for this specific event occurrence. */
    public function eventId(): string;

    /** Wall-clock instant at which the domain fact occurred. */
    public function occurredAt(): DateTimeImmutable;
}
