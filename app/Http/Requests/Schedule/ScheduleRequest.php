<?php

namespace App\Http\Requests\Schedule;

use Illuminate\Foundation\Http\FormRequest;

class ScheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'schedules' => ['required', 'array'],
            'schedules.*.day' => ['required', 'in:saturday,sunday,monday,tuesday,wednesday,thursday,friday'],
            'schedules.*.from_time' => ['required', 'date_format:H:i'],
            'schedules.*.to_time' => ['required', 'date_format:H:i', 'after:schedules.*.from_time'],
            'schedules.*.is_active' => ['sometimes', 'boolean'],
        ];
    }
}
