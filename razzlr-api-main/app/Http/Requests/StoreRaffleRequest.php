<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRaffleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() != null;
    }

    public function rules(): array
    {
        return [
            'title'            => 'required|string|max:255',
            'description'      => 'required|string',
            'scope'            => 'required|in:public,private',
            'spots_count'      => 'required|integer|min:10',
            'ends_enabled'     => [
                'required',
                'boolean',
                function ($attribute, $value, $fail) {
                    if ($this->input('type') === 'open' && $value) {
                        $fail('Ends cannot be enabled for "Open" type raffles.');
                    }
                },
            ],
            'auto_delete_days' => 'required|integer|between:3,30',
            'starts_at'        => 'required|date|after_or_equal:now',
            'type'            => 'required|in:fixed,open',
            'raffle_image'     => [
                'required',
                'string',
                'regex:/^data:image\/(jpeg|png|jpg|gif|webp);base64,[A-Za-z0-9+\/=]+$/'
            ],
        ];
    }
}
