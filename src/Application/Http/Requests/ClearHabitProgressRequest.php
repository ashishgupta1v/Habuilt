<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class ClearHabitProgressRequest extends FormRequest
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
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer', 'between:2000,2100'],
            'user_id' => ['nullable', 'string', 'size:26', 'regex:/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/'],
            'source' => ['nullable', 'string', 'max:50'],
        ];
    }
}
