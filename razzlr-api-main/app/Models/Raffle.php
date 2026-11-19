<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Raffle extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'host_id',
        'title',
        'description',
        'scope',
        'raffle_image',
        'spots_count',        
        'ends_enabled',
        'auto_delete_days',
        'slug',
        'is_locked',
        'starts_at',
        'drawn_at',
        'drawn_number',
        'random_signature',
        'status',
        'type',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'id',
        'host_id',
        'random_signature',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'spots_count'      => 'integer',
            'ends_enabled'     => 'boolean',
            'auto_delete_days' => 'integer',
            'is_locked'        => 'boolean',
            'starts_at'        => 'datetime',
            'drawn_at'         => 'datetime',
            'status'           => 'string',
            'type'             => 'string',
        ];
    }

    /**
     * The default attributes for the model.
     */
    protected $attributes = [
        'scope'            => 'public',
        'ends_enabled'     => false,
        'auto_delete_days' => 30,
        'is_locked'        => false,
        'status'           => 'draft',
        'type'             => 'fixed',
    ];

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(RaffleReservation::class);
    }

    public function creditTransactions(): HasMany
    {
        return $this->hasMany(CreditTransaction::class);
    }
}