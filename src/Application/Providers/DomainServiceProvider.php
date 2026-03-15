<?php

declare(strict_types=1);

namespace Habuilt\Application\Providers;

use Habuilt\Domains\Economy\Contracts\Repositories\PointTransactionRepositoryInterface;
use Habuilt\Domains\Economy\Contracts\Repositories\RewardRepositoryInterface;
use Habuilt\Domains\Economy\Infrastructure\Persistence\EloquentPointTransactionRepository;
use Habuilt\Domains\Economy\Infrastructure\Persistence\EloquentRewardRepository;
use Habuilt\Domains\Economy\Listeners\CreditPointsOnHabitCompleted;
use Habuilt\Domains\Tracking\Contracts\Repositories\CheckInRepositoryInterface;
use Habuilt\Domains\Tracking\Contracts\Repositories\HabitRepositoryInterface;
use Habuilt\Domains\Tracking\Events\HabitCompleted;
use Habuilt\Domains\Tracking\Infrastructure\Persistence\EloquentCheckInRepository;
use Habuilt\Domains\Tracking\Infrastructure\Persistence\EloquentHabitRepository;
use Habuilt\Shared\Domain\Events\DomainEventDispatcherInterface;
use Habuilt\Shared\Infrastructure\Events\LaravelEventDispatcher;
use Illuminate\Contracts\Events\Dispatcher as LaravelDispatcher;
use Illuminate\Support\ServiceProvider;

/**
 * Single registration point for all domain infrastructure bindings.
 *
 * Registers:
 *   - Repository interface → Eloquent implementation (IoC bindings)
 *   - DomainEventDispatcherInterface → LaravelEventDispatcher adapter
 *   - Domain event → Listener mappings (via Laravel's event bus)
 *
 * Register this provider in bootstrap/providers.php:
 *
 *   return [
 *       // ...
 *       Habuilt\Application\Providers\DomainServiceProvider::class,
 *   ];
 */
final class DomainServiceProvider extends ServiceProvider
{
    /**
     * Domain event → Listener class map.
     * Add new cross-context subscriptions here.
     *
     * @var array<class-string, list<class-string>>
     */
    protected array $listen = [
        HabitCompleted::class => [
            CreditPointsOnHabitCompleted::class,
        ],
    ];

    // ── ServiceProvider API ───────────────────────────────────────────────────

    public function register(): void
    {
        $this->registerRepositories();
        $this->registerEventDispatcher();
    }

    public function boot(): void
    {
        $this->registerDomainListeners();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function registerRepositories(): void
    {
        // Tracking
        $this->app->bind(HabitRepositoryInterface::class, EloquentHabitRepository::class);
        $this->app->bind(CheckInRepositoryInterface::class, EloquentCheckInRepository::class);

        // Economy
        $this->app->bind(PointTransactionRepositoryInterface::class, EloquentPointTransactionRepository::class);
        $this->app->bind(RewardRepositoryInterface::class, EloquentRewardRepository::class);
    }

    private function registerEventDispatcher(): void
    {
        $this->app->bind(
            DomainEventDispatcherInterface::class,
            fn () => new LaravelEventDispatcher(
                $this->app->make(LaravelDispatcher::class),
            ),
        );
    }

    private function registerDomainListeners(): void
    {
        /** @var LaravelDispatcher $laravelDispatcher */
        $laravelDispatcher = $this->app->make(LaravelDispatcher::class);

        foreach ($this->listen as $event => $listeners) {
            foreach ($listeners as $listener) {
                $laravelDispatcher->listen($event, $listener);
            }
        }
    }
}
