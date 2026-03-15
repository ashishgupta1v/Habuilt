<?php

declare(strict_types=1);

namespace Habuilt\Shared\Domain\ValueObjects;

use InvalidArgumentException;
use Habuilt\Shared\Support\Ulid;
use Stringable;

/**
 * Abstract base for all entity identifiers.
 *
 * Invariants:
 *  - encapsulates a Crockford Base32 ULID string (26 chars, uppercase)
 *  - two IDs of *different concrete types* can never be compared equal
 *    because PHP typed properties prevent cross-type assignment at runtime
 *  - immutable: readonly class, no setters
 */
abstract readonly class EntityId implements Stringable
{
    final protected function __construct(private string $value)
    {
        if (! Ulid::isValid($value)) {
            throw new InvalidArgumentException(
                static::class . " received an invalid ULID: [{$value}].",
            );
        }
    }

    // ── Named constructors ────────────────────────────────────────────────────

    /** Generate a new, time-ordered ULID-based identifier. */
    public static function generate(): static
    {
        return new static(Ulid::generate());
    }

    /**
     * Re-hydrate an identifier from a persisted string value.
     *
     * @throws InvalidArgumentException for non-ULID strings.
     */
    public static function from(string $value): static
    {
        return new static(strtoupper($value));
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function value(): string
    {
        return $this->value;
    }

    // ── Equality ──────────────────────────────────────────────────────────────

    /**
     * Structural equality: same concrete type AND same value.
     */
    public function equals(self $other): bool
    {
        return static::class === $other::class
            && $this->value === $other->value;
    }

    // ── Presentation ─────────────────────────────────────────────────────────

    public function __toString(): string
    {
        return $this->value;
    }
}
