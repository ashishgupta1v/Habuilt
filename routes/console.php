<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Artisan;

Artisan::command('warrior:ping', function (): void {
    $this->info('Warrior Tracker console kernel is up.');
})->purpose('Sanity check command for bootstrap readiness.');
