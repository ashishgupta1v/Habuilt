<?php

declare(strict_types=1);

namespace Habuilt\Domains\Tracking\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent DB-shape model for the `habits` table.
 *
 * This class belongs to the Infrastructure layer and must never be
 * imported by the Domain layer. Repositories translate between this
 * model and the Habit domain entity.
 *
 * @property string $id            ULID, database primary key
 * @property string $user_id       ULID of the owning user
 * @property string $name
 * @property int    $points_per_check_in
 * @property bool   $is_archived
 * @property string $created_at
 * @property string $updated_at
 */
final class EloquentHabitModel extends Model
{
    protected $table      = 'habits';
    protected $primaryKey = 'id';
    public    $incrementing = false;
    protected $keyType    = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'name',
        'points_per_check_in',
        'is_archived',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'is_archived'          => 'boolean',
        'points_per_check_in'  => 'integer',
    ];
}
