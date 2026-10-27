<?php

declare(strict_types=1);

use App\Http\Controllers\Api\HabitLedgerApiController;
use Illuminate\Support\Facades\Route;

// Healthcheck
Route::get('/health', fn () => response()->json(['status' => 'healthy', 'server' => 'Hostinger KVM 2', 'db' => 'pgsql', 'time' => now()]));

// Habit Check-ins Ledger
Route::get('/habits/check-ins', [HabitLedgerApiController::class, 'getCheckIns']);
Route::post('/habits/check-ins', [HabitLedgerApiController::class, 'recordCheckIn']);
Route::delete('/habits/check-ins', [HabitLedgerApiController::class, 'removeCheckIn']);

// User Settings & Progressive Tiers
Route::get('/user-settings', [HabitLedgerApiController::class, 'getUserSettings']);
Route::post('/user-settings', [HabitLedgerApiController::class, 'saveUserSettings']);

// User Protocols
Route::get('/user-protocols', [HabitLedgerApiController::class, 'getUserProtocols']);
Route::post('/user-protocols', [HabitLedgerApiController::class, 'saveUserProtocol']);
Route::delete('/user-protocols/{id}', [HabitLedgerApiController::class, 'deleteUserProtocol']);

// Biomarkers & Wellness Logs
Route::get('/user-biomarkers', [HabitLedgerApiController::class, 'getUserBiomarkers']);
Route::post('/user-biomarkers', [HabitLedgerApiController::class, 'saveUserBiomarker']);

// Universal Partner Pairing
Route::get('/partner-connections', [HabitLedgerApiController::class, 'getPartnerConnections']);
Route::post('/partner-connections', [HabitLedgerApiController::class, 'savePartnerConnection']);
