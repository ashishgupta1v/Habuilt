<?php

declare(strict_types=1);

namespace Habuilt\Shared\Domain\ValueObjects;

use InvalidArgumentException;
use Stringable;
use UnderflowException;

/**
 * Immutable monetary-style value object for habit points.
 *
 * Invariant: value is always a strictly positive integer (≥ 1).
 * Any arithmetic that would violate this invariant throws immediately.
 */
final readonly class PointValue implements Stringable
{
    public function __construct(private int $value)
    {
        if ($value < 1) {
            throw new InvalidArgumentException(
                "PointValue must be strictly positive; received {$value}.",
            );
        }
    }

    // ── Accessors ────────────────────────────────────────────────────────────

    public function value(): int
    {
        return $this->value;
    }

    // ── Arithmetic ───────────────────────────────────────────────────────────

    /** Returns a NEW PointValue — both operands remain unchanged. */
    public function add(self $other): self
    {
        return new self($this->value + $other->value);
    }

    /**
     * Returns a NEW PointValue with the other amount subtracted.
     *
     * @throws UnderflowException when the result would fall below 1.
     */
    public function subtract(self $other): self
    {
        $result = $this->value - $other->value;

        if ($result < 1) {
            throw new UnderflowException(
                "Subtraction would produce a non-positive PointValue ({$result}).",
            );
        }

        return new self($result);
    }

    // ── Comparison ───────────────────────────────────────────────────────────

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function isGreaterThan(self $other): bool
    {
        return $this->value > $other->value;
    }

    public function isGreaterThanOrEqual(self $other): bool
    {
        return $this->value >= $other->value;
    }

    // ── Presentation ─────────────────────────────────────────────────────────

    public function __toString(): string
    {
        return (string) $this->value;
    }
}
