<?php

declare(strict_types=1);

namespace Habuilt\Domains\Economy\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent DB-shape model for the `rewards` table.
 *
 * @property string $id
 * @property string $name
 * @property int    $cost
 * @property bool   $is_active
 */
final class EloquentRewardModel extends Model
{
    protected $table      = 'rewards';
    protected $primaryKey = 'id';
    public    $incrementing = false;
    protected $keyType    = 'string';
    public    $timestamps = false;

    protected $fillable = [
        'id',
        'name',
        'cost',
        'is_active',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'cost'      => 'integer',
        'is_active' => 'boolean',
    ];
}
