<?php

declare(strict_types=1);

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HabitCheckInController;
use App\Http\Controllers\HabitProgressResetController;
use Illuminate\Support\Facades\Route;

Route::get('/', DashboardController::class)->name('dashboard');
Route::post('/habits/{habit}/check-ins', HabitCheckInController::class)->name('habits.check-ins.store');
Route::delete('/habits/check-ins', HabitProgressResetController::class)->name('habits.check-ins.clear');
