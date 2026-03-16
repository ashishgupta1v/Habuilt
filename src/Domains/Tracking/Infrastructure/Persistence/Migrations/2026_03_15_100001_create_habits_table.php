<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('habits', function (Blueprint $table): void {
            $table->char('id', 26)->primary();
            $table->char('user_id', 26)->index();
            $table->string('name');
            $table->unsignedSmallInteger('points_per_check_in');
            $table->boolean('is_archived')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'is_archived']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('habits');
    }
};
