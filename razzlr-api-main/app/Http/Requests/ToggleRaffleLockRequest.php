<?php

namespace App\Http\Requests;
use App\Models\Raffle;

use Illuminate\Foundation\Http\FormRequest;

class ToggleRaffleLockRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // only allow the host of the raffle to access this request where the raffle is not drawn yet
        $raffle = Raffle::where('slug', $this->input('slug'))->first();
        return $raffle
            && $raffle->getAttribute('host_id') == $this->user()->id
            && $raffle->drawn_at == null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'slug' => 'required|exists:raffles,slug'
        ];
    }
}
