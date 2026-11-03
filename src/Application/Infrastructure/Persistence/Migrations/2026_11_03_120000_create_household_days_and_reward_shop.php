<?php

declare(strict_types=1);

use App\Services\Product\ProductTables;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        (new ProductTables())->ensure();
    }

    public function down(): void
    {
        Schema::dropIfExists('user_reward_redemptions');
        Schema::dropIfExists('user_reward_items');
        Schema::dropIfExists('household_days');
    }
};
