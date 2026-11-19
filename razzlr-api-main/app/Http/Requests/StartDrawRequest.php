<?php

namespace App\Http\Requests;
use App\Models\Raffle;

use Illuminate\Foundation\Http\FormRequest;

class StartDrawRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only allow if the authenticated user is the host of the raffle
        $raffle = Raffle::where('slug', $this->input('slug'))->first();
        return $raffle && $this->user() && $raffle->getAttribute('host_id') == $this->user()->id;
    }

    public function rules(): array
    {
        return [
           'slug' => 'required|exists:raffles,slug'
        ];
    }
}
