<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\RemoveHabitCheckInRequest;
use App\Support\CurrentUserResolver;
use Habuilt\Domains\Tracking\Actions\RemoveHabitCompletionAction;
use Habuilt\Domains\Tracking\ValueObjects\HabitId;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Redirect;

final readonly class HabitCheckInDeleteController
{
    public function __construct(
        private RemoveHabitCompletionAction $removeHabitCompletion,
        private CurrentUserResolver $userResolver,
    ) {
    }

    public function __invoke(RemoveHabitCheckInRequest $request, string $habit): RedirectResponse
    {
        $userId = $this->userResolver->resolve($request);

        $removed = $this->removeHabitCompletion->handle(
            HabitId::from(strtoupper($habit)),
            $userId,
            (int) $request->integer('year'),
            (int) $request->integer('month'),
            (int) $request->integer('day'),
        );

        if ($removed) {
            return Redirect::route('dashboard')->with('success', 'Habit check-in removed.');
        }

        return Redirect::route('dashboard');
    }
}
