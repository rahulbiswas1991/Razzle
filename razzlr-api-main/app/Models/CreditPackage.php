<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CreditPackage extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name', 'credits', 'price_cents', 'currency',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'credits'     => 'integer',
            'price_cents' => 'integer',
        ];
    }
}