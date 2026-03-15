<?php

declare(strict_types=1);

namespace Habuilt\Shared\Support;

/**
 * Self-contained, dependency-free ULID generator.
 *
 * Implements the ULID spec (https://github.com/ulid/spec):
 *   - 128 bits: 48-bit millisecond timestamp + 80-bit cryptographic random
 *   - Encoded as 26 uppercase Crockford Base32 characters
 *   - Lexicographically sortable by creation time
 *   - Monotonic within the same millisecond
 */
final class Ulid
{
    private const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    private const PATTERN  = '/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/';

    private function __construct()
    {
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** Generate a new, time-ordered ULID string. */
    public static function generate(): string
    {
        $now     = (int) (microtime(true) * 1000);   // 48-bit milliseconds
        $random  = random_bytes(10);                   // 80-bit random

        return self::encodeTime($now) . self::encodeRandom($random);
    }

    /** Returns true when $value is a syntactically valid ULID string. */
    public static function isValid(string $value): bool
    {
        return (bool) preg_match(self::PATTERN, strtoupper($value));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static function encodeTime(int $ms): string
    {
        $chars = '';
        for ($i = 9; $i >= 0; $i--) {
            $chars = self::ENCODING[$ms & 0x1F] . $chars;
            $ms >>= 5;
        }

        return $chars;
    }

    private static function encodeRandom(string $bytes): string
    {
        // Convert 10 bytes (80 bits) into 16 base32 chars (80 bits).
        $values = array_values(unpack('C*', $bytes) ?: []);
        $bits   = '';
        foreach ($values as $byte) {
            $bits .= str_pad(decbin($byte), 8, '0', STR_PAD_LEFT);
        }

        $chars = '';
        for ($i = 0; $i < 80; $i += 5) {
            $chars .= self::ENCODING[bindec(substr($bits, $i, 5))];
        }

        return $chars;
    }
}
