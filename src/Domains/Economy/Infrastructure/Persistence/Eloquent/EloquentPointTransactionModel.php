<?php

declare(strict_types=1);

namespace Habuilt\Domains\Economy\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent DB-shape model for the `point_transactions` table.
 *
 * @property string $id            ULID
 * @property string $user_id       ULID
 * @property int    $amount        credit amount (always positive)
 * @property string $reason
 * @property string $reference_id  CheckIn ULID that caused this credit
 * @property string $occurred_at
 */
final class EloquentPointTransactionModel extends Model
{
    protected $table      = 'point_transactions';
    protected $primaryKey = 'id';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;

    protected $fillable = [
        'id',
        'user_id',
        'amount',
        'reason',
        'reference_id',
        'occurred_at',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'amount'      => 'integer',
        'occurred_at' => 'datetime',
    ];
}
