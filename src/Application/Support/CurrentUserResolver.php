<?php

declare(strict_types=1);

namespace App\Support;

use Habuilt\Domains\Identity\ValueObjects\UserId;
use Habuilt\Shared\Support\Ulid;
use Illuminate\Http\Request;

/**
 * Resolves the acting user from the verified JWT subject only.
 * X-User-Id, body user_id, and the demo ULID are not authorization sources.
 */
final readonly class CurrentUserResolver
{
    public function authenticatedSubject(Request $request): ?string
    {
        $subject = $request->attributes->get('auth_user_id');
        if (!is_string($subject)) {
            return null;
        }

        $subject = trim($subject);
        if ($subject === '' || self::isGuestSubject($subject)) {
            return null;
        }

        return $subject;
    }

    /**
     * Domain owner id when the subject is a ULID.
     * Supabase subjects are UUIDs; those stay on the SPA ledger and are not
     * forced through the ULID domain tables.
     */
    public function resolve(Request $request): ?UserId
    {
        $subject = $this->authenticatedSubject($request);
        if ($subject === null || !Ulid::isValid($subject)) {
            return null;
        }

        return UserId::from($subject);
    }

    public static function isGuestSubject(string $subject): bool
    {
        $value = strtolower(trim($subject));

        return $value === 'guest' || str_starts_with($value, 'guest');
    }
}
