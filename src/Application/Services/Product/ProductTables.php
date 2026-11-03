<?php

declare(strict_types=1);

namespace App\Services\Product;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tables for the shared household day and the server-side reward shop.
 * The application database stays the default connection.
 */
final class ProductTables
{
    public const ANCHORS = [
        'evening-check' => 'Evening check',
        'morning-start' => 'Morning start',
        'midday-pause' => 'Midday pause',
    ];

    public const DAY_TYPES = [
        'home',
        'office',
        'office-mon',
        'office-mid',
        'office-fri',
        'half-day',
        'holiday',
    ];

    public function ensure(): void
    {
        if (!Schema::hasTable('household_days')) {
            Schema::create('household_days', function (Blueprint $table): void {
                $table->string('id')->primary();
                $table->string('user_id');
                $table->string('day_key', 10);
                $table->string('day_type', 32);
                $table->text('anchors');
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();
                $table->unique(['user_id', 'day_key']);
            });
        }

        if (!Schema::hasTable('user_reward_items')) {
            Schema::create('user_reward_items', function (Blueprint $table): void {
                $table->string('id')->primary();
                $table->string('user_id')->index();
                $table->string('name');
                $table->unsignedInteger('cost_points');
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();
            });
        }

        if (!Schema::hasTable('user_reward_redemptions')) {
            Schema::create('user_reward_redemptions', function (Blueprint $table): void {
                $table->string('id')->primary();
                $table->string('user_id')->index();
                $table->string('reward_id')->index();
                $table->unsignedInteger('cost_points');
                $table->timestamp('redeemed_at')->nullable();
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();
            });
        }
    }
}
