<?php

declare(strict_types=1);

namespace Habuilt\Shared\Infrastructure\Events;

use Habuilt\Shared\Domain\Events\DomainEventDispatcherInterface;
use Habuilt\Shared\Domain\Events\DomainEventInterface;
use Illuminate\Contracts\Events\Dispatcher as LaravelDispatcher;

/**
 * Infrastructure adapter that bridges the domain event port to
 * Laravel's built-in event bus.
 *
 * Domain code depends only on DomainEventDispatcherInterface.
 * This class lives in Infrastructure and is wired by the service provider.
 */
final readonly class LaravelEventDispatcher implements DomainEventDispatcherInterface
{
    public function __construct(
        private LaravelDispatcher $laravelDispatcher,
    ) {
    }

    public function dispatch(DomainEventInterface ...$events): void
    {
        foreach ($events as $event) {
            $this->laravelDispatcher->dispatch($event);
        }
    }
}
