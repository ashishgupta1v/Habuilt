<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent DB-shape model for the `check_ins` table.
 *
 * @property string $id          ULID
 * @property string $habit_id    ULID
 * @property string $user_id     ULID
 * @property string $completed_at  ISO-8601 date string
 * @property string $created_at
 */
final class EloquentCheckInModel extends Model
{
    protected $table      = 'check_ins';
    protected $primaryKey = 'id';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;

    protected $fillable = [
        'id',
        'habit_id',
        'user_id',
        'completed_at',
        'created_at',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'completed_at' => 'datetime',
        'created_at'   => 'datetime',
    ];
}
