<?php

namespace App\Http\Requests\Chat;

use App\Models\Conversation;
use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $conversation = $this->route('conversation');

        if (!$conversation instanceof Conversation) {
            $conversation = Conversation::find($conversation);
        }

        if (!$conversation) {
            return false;
        }

        return $conversation->isParticipant($this->user());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'message' => ['required_without:attachments', 'string', 'max:2000'],
            'attachments' => ['nullable', 'array', 'max:10'],
            'attachments.*' => ['string', 'url'],
            'type' => ['sometimes', 'in:text,image,file'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'message.required_without' => 'Message content or attachments are required.',
            'attachments.max' => 'You can attach up to 10 files.',
        ];
    }
}
