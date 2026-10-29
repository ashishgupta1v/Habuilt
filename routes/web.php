<?php

declare(strict_types=1);

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HabitCheckInController;
use App\Http\Controllers\HabitCheckInDeleteController;
use App\Http\Controllers\HabitProgressResetController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Core Dashboard & Auth
Route::get('/', DashboardController::class)->name('dashboard');
Route::get('/auth', static fn () => Inertia::render('Auth'))->name('auth');
Route::get('/login', static fn () => Inertia::render('Auth'))->name('login');
Route::get('/landing', static fn () => Inertia::render('Auth'))->name('landing');
Route::get('/auth/callback', DashboardController::class)->name('auth.callback');

// Legal & Compliance Routes (GDPR, CCPA & App Store Review Compliance)
Route::get('/privacy', static fn () => Inertia::render('Privacy'))->name('privacy');
Route::get('/terms', static fn () => Inertia::render('Terms'))->name('terms');
Route::get('/disclaimer', static fn () => Inertia::render('Disclaimer'))->name('disclaimer');

// Legacy & Direct Habit Mutations
Route::post('/habits/{habit}/check-ins', HabitCheckInController::class)->name('habits.check-ins.store');
Route::delete('/habits/{habit}/check-ins', HabitCheckInDeleteController::class)->name('habits.check-ins.delete');
Route::delete('/habits/check-ins', HabitProgressResetController::class)->name('habits.check-ins.clear');
