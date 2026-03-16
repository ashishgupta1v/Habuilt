<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class CompleteHabitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'habit_id' => ['required', 'string', 'size:26', 'regex:/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/'],
            'completed_at' => ['nullable', 'date'],
            'day' => ['nullable', 'integer', 'between:1,31'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'year' => ['nullable', 'integer', 'between:2000,2100'],
            'source' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'habit_id' => strtoupper((string) ($this->route('habit') ?? $this->input('habit_id'))),
        ]);
    }
}
