<?php

declare(strict_types=1);

namespace App\Support;

use Habuilt\Domains\Identity\ValueObjects\UserId;
use Illuminate\Http\Request;

final readonly class CurrentUserResolver
{
    private const FALLBACK_USER_ID = '01JQ7M2X4V8K3P6R9T1W5Y7ZAB';

    public function resolve(Request $request): UserId
    {
        $candidates = [
            $request->user()?->getAuthIdentifier(),
            $request->header('X-User-Id'),
            $request->input('user_id'),
            config('habuilt.demo_user_id'),
            self::FALLBACK_USER_ID,
        ];

        foreach ($candidates as $candidate) {
            if ($candidate === null) {
                continue;
            }

            $value = strtoupper(trim((string) $candidate));

            if ($value === '') {
                continue;
            }

            try {
                return UserId::from($value);
            } catch (\Throwable) {
                continue;
            }
        }

        return UserId::from(self::FALLBACK_USER_ID);
    }
}
