<?php

namespace App\Http\Requests\Chat;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StartConversationRequest extends FormRequest
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
            'user_id' => ['required', 'exists:users,id', 'different:' . $this->user()->id],
        ];
    }

    /**
     * Validate that the target user exists and is valid for chat.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $targetUser = User::find($this->user_id);

            if (!$targetUser) {
                $validator->errors()->add('user_id', 'User not found.');
            }
        });
    }
}
