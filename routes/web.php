<?php

declare(strict_types=1);

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => Inertia::render('Dashboard', [
	'appName' => config('app.name', 'Warrior Tracker (Habuilt)'),
	'today' => now()->toDateString(),
]));
