<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
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
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'unique:users,phone'],
            'role' => ['required', 'in:customer,store_owner,driver'],
            'governorate_id' => ['required', 'exists:governorates,id'],
            'area_id' => ['required', 'exists:areas,id'],
        ];

        // Password required for all users
        $rules['password'] = ['required', 'string', 'min:6', 'confirmed'];

        // Driver specific fields
        if ($this->input('role') === 'driver') {
            $rules['password'] = ['required', 'string', 'min:6', 'confirmed'];
        }

        // Store owner specific fields
        if ($this->input('role') === 'store_owner') {
            $rules['password'] = ['required', 'string', 'min:6', 'confirmed'];
            $rules['category_id'] = ['required', 'exists:categories,id'];
            $rules['store_name'] = ['required', 'string', 'max:255'];
            $rules['store_description'] = ['required', 'string', 'max:1000'];
            $rules['address_details'] = ['required', 'string', 'max:1000'];
            $rules['store_phone'] = ['nullable', 'string']; // Optional, will use user phone if not provided
            $rules['store_image'] = ['required', 'image', 'max:2048'];
            $rules['latitude'] = ['nullable', 'numeric', 'between:-90,90'];
            $rules['longitude'] = ['nullable', 'numeric', 'between:-180,180'];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.unique' => 'This phone number is already registered.',
            'password.min' => 'Password must be at least 6 characters.',
        ];
    }
}
