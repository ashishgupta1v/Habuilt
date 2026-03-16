<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('check_ins', function (Blueprint $table): void {
            $table->char('id', 26)->primary();
            $table->char('habit_id', 26)->index();
            $table->char('user_id', 26)->index();
            $table->dateTime('completed_at');
            $table->dateTime('created_at');

            $table->index(['habit_id', 'completed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('check_ins');
    }
};
