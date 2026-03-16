<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\CurrentUserResolver;
use Habuilt\Domains\Economy\Contracts\Repositories\PointTransactionRepositoryInterface;
use Habuilt\Domains\Identity\ValueObjects\UserId;
use Illuminate\Http\Request;
use Inertia\Middleware;

final class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function __construct(
        private readonly PointTransactionRepositoryInterface $pointTransactions,
        private readonly CurrentUserResolver $userResolver,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $resolvedUserId = $this->userResolver->resolve($request);
        $authUser = $request->user();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $authUser ? [
                    'id' => (string) $authUser->getAuthIdentifier(),
                    'name' => $authUser->name ?? null,
                    'points' => $this->walletForAuthIdentifier($authUser->getAuthIdentifier()),
                ] : null,
            ],
            'wallet' => $this->walletFor($resolvedUserId),
            'context' => [
                'userId' => $resolvedUserId->value(),
            ],
            'flash' => [
                'success' => fn (): mixed => $request->session()->get('success'),
                'error' => fn (): mixed => $request->session()->get('error'),
            ],
        ]);
    }

    private function walletForAuthIdentifier(mixed $identifier): ?int
    {
        if ($identifier === null) {
            return null;
        }

        $value = strtoupper(trim((string) $identifier));

        if ($value === '') {
            return null;
        }

        try {
            return $this->walletFor(UserId::from($value));
        } catch (\Throwable) {
            return null;
        }
    }

    private function walletFor(UserId $userId): int
    {
        return array_reduce(
            $this->pointTransactions->findLedgerForUser($userId),
            static fn (int $carry, $transaction): int => $carry + $transaction->amount->value(),
            0,
        );
    }
}
