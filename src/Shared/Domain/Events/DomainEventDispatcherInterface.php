<?php

declare(strict_types=1);

namespace Habuilt\Shared\Domain\Events;

interface DomainEventDispatcherInterface
{
    /**
     * Dispatch one or more domain events.
     * Implementations may use a synchronous in-process bus,
     * Laravel's event system, or a queued broadcaster.
     */
    public function dispatch(DomainEventInterface ...$events): void;
}
