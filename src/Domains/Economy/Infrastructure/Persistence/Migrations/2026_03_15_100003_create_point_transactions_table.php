<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('point_transactions', function (Blueprint $table): void {
            $table->char('id', 26)->primary();
            $table->char('user_id', 26)->index();
            $table->unsignedInteger('amount');
            $table->string('reason');
            $table->char('reference_id', 26)->index();
            $table->dateTime('occurred_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_transactions');
    }
};
