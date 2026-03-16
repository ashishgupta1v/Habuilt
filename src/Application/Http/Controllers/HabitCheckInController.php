<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Data\HabitData;
use App\Http\Requests\CompleteHabitRequest;
use App\Support\CurrentUserResolver;
use Habuilt\Domains\Tracking\Actions\RegisterHabitCompletionAction;
use Habuilt\Domains\Tracking\Exceptions\HabitAlreadyCompletedTodayException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Redirect;

final readonly class HabitCheckInController
{
    public function __construct(
        private RegisterHabitCompletionAction $registerHabitCompletion,
        private CurrentUserResolver $userResolver,
    ) {
    }

    public function __invoke(CompleteHabitRequest $request, string $habit): RedirectResponse
    {
        $request->merge(['habit_id' => strtoupper($habit)]);

        $data = HabitData::from($request);

        try {
            $result = $this->registerHabitCompletion->handle(
                $data->toDomain($this->userResolver->resolve($request)),
            );

            return Redirect::route('dashboard')
                ->with('success', sprintf('Habit completed. +%d points', $result->pointsAwarded->value()));
        } catch (HabitAlreadyCompletedTodayException $exception) {
            return Redirect::route('dashboard')->with('error', $exception->getMessage());
        }
    }
}
