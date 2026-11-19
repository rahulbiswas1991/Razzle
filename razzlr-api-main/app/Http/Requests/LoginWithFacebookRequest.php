<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginWithFacebookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'access_token' => 'required|string',
        ];
    }

    public function messages(): array
    {
        return [
            'access_token.required' => 'An access token is required.',
            'access_token.string'   => 'Access token must be a string.',
        ];
    }
}
