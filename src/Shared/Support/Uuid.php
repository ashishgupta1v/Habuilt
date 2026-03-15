<?php

declare(strict_types=1);

namespace Habuilt\Shared\Support;

/**
 * Cryptographically-safe UUID v4 generator.
 * Pure static utility — not a service, never instantiated.
 */
final class Uuid
{
    private function __construct()
    {
        // Intentionally uncallable.
    }

    public static function generate(): string
    {
        $bytes    = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);  // version 4
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);  // variant RFC 4122

        /** @phpstan-ignore-next-line */
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }
}
