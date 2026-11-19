<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

use App\Http\Requests\StoreRaffleRequest;
use App\Http\Requests\RaffleRequest;
use App\Http\Requests\JoinRaffleRequest;
use App\Http\Requests\ExitRaffleRequest;
use App\Http\Requests\RaffleReservationStatusRequest;
use App\Http\Requests\ToggleRaffleLockRequest;
use App\Http\Requests\StartDrawRequest;
use App\Http\Requests\RafflesListRequest;
use App\Traits\ApiResponse;
use App\Models\Raffle;
use App\Models\RaffleReservation;
use GuzzleHttp\Client;


class RaffleController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of the user's raffles.
     */
    public function raffles_list(RafflesListRequest $request): JsonResponse
    {
        $user = auth()->user();

        // Get IDs of raffles the user has joined
        $joinedRaffleIds = RaffleReservation::where('user_id', $user->id)->pluck('raffle_id')->toArray();

        /*
         * Query raffles:
         * - Hosted by user
         * - OR public
         * - OR private but user has joined
         */
        $rafflesQuery = Raffle::query()
            ->where(function ($query) use ($user, $joinedRaffleIds) {
                $query->where('host_id', $user->id)
                    ->orWhere('scope', 'public')
                    ->orWhere(function ($q) use ($joinedRaffleIds) {
                        $q->where('scope', 'private')
                          ->whereIn('id', $joinedRaffleIds);
                    });
            })
            ->orderByDesc('created_at')
            ->distinct();

        // Paginate results
        $perPage = request('per_page', 15);
        $raffles = $rafflesQuery->paginate($perPage);

        return $this->successResponse(
            [
                'raffles' => $raffles->items(),
                'pagination' => [
                    'current_page' => $raffles->currentPage(),
                    'last_page' => $raffles->lastPage(),
                    'per_page' => $raffles->perPage(),
                    'total' => $raffles->total(),
                ]
            ],
            'Raffles Fetched For Current User.'
        );
    }

    /**
     * Display raffle by slug.
     */
    public function raffle(RaffleRequest $request): JsonResponse
    {
        // Validate the slug
        $slug = $request->input('slug');
        $raffle = Raffle::where('slug', $slug)
            ->with(['host:id,name,avatar'])
            ->first();

        // Check if raffle exists
        if (!$raffle) {
            return $this->errorResponse('Raffle not found.', [], 404);
        }

        // Flatten host info into raffle
        $raffleArray = $raffle->toArray();
        if (isset($raffle->host)) {
            $raffleArray['host_id'] = $raffle->host->id;
            $raffleArray['host_name'] = $raffle->host->name;
            $raffleArray['host_avatar'] = $raffle->host->avatar;
        }

        return $this->successResponse(
            [ 'raffle' => $raffleArray],
            'Raffle details fetched successfully'
        );
    }
    /**
     * Create a new raffle
     */
    public function store(StoreRaffleRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $raffle = null;
        try {
            DB::transaction(function () use ($user, $data, &$raffle) {
                $user->lockForUpdate();
                $user->refresh();
                $balance = $user->credits_balance;
                $required = $data['spots_count'];
                $slug = (string) Str::uuid();

                if ($balance < $required) {
                    // Not enough credits: create draft raffle only
                    $raffle = $user->raffles()->create([
                        'title'            => $data['title'],
                        'description'      => $data['description'],
                        'scope'            => $data['scope'],
                        'raffle_image'     => $data['raffle_image'],
                        'spots_count'      => $data['spots_count'],                        
                        'ends_enabled'     => $data['ends_enabled'],
                        'auto_delete_days' => $data['auto_delete_days'],
                        'starts_at'        => $data['starts_at'],
                        'slug'             => $slug,
                        'type'             => $data['type'],
                        'status'           => 'draft',
                    ]);
                } else {
                    // Enough credits: create published raffle and deduct credits
                    $raffle = $user->raffles()->create([
                        'title'            => $data['title'],
                        'description'      => $data['description'],
                        'scope'            => $data['scope'],
                        'raffle_image'     => $data['raffle_image'],
                        'spots_count'      => $data['spots_count'],
                        'ends_enabled'     => $data['ends_enabled'],
                        'auto_delete_days' => $data['auto_delete_days'],
                        'starts_at'        => $data['starts_at'],
                        'slug'             => $slug,
                        'type'             => $data['type'],
                        'status'           => 'published',
                    ]);

                    $user->creditTransactions()->create([
                        'raffle_id' => $raffle->id,
                        'transaction_id' => (string) Str::uuid(),
                        'type'      => 'spend',
                        'credits'   => $data['spots_count'],
                        'payment_status' => 'paid'
                    ]);

                    $user->decrement('credits_balance', $data['spots_count']);
                    $user->refresh();
                }
            });
        } catch (\Exception $e) {
            DB::rollBack();
            if (config('app.debug')) {
                return $this->errorResponse($e->getMessage(), [], 500);
            } else {
                return $this->errorResponse('An unexpected error occurred.', [], 500);
            }
        }

        return $this->successResponse(
            ['raffle' => $raffle],
            $raffle->status === 'draft' ? 'Raffle created as draft due to insufficient credits.' : 'Raffle created successfully.',
            201
        );
    }

    /**
     * Join a raffle
     */
    public function joinRaffle(JoinRaffleRequest $request): JsonResponse
    {
        


        DB::beginTransaction();

        try {
            $user = auth()->user();
            $raffle = Raffle::where('slug', $request->slug)->lockForUpdate()->first();
            
            if ($raffle->is_locked) {
                DB::rollBack();
                return $this->errorResponse('Raffle is locked and cannot be joined.', [], 423);
            }
        
            // if ($raffle->host_id == $user->id) {
            //     DB::rollBack();
            //     return $this->errorResponse('Hosts cannot join their own raffles.', [], 403);
            // }

            // one user can join only once
            if (RaffleReservation::where('raffle_id', $raffle->id)->where('user_id', $user->id)->exists()) {
                DB::rollBack();
                return $this->errorResponse('You have already joined this raffle.', [], 409);
            }

            $requestedNumber = $request->requested_number;
            $totalSpots = $raffle->spots_count;
            $endsEnabled = $raffle->ends_enabled;

            // Validate number range
            if ($requestedNumber < 1 || $requestedNumber > $totalSpots) {
                DB::rollBack();
                return $this->errorResponse('Invalid number selected.', [], 422);
            }

            $reservedNumbers = [$requestedNumber];

            // If "Ends" is enabled and user selects first or last, reserve both
            if ($endsEnabled) {
                if ($requestedNumber == 1 || $requestedNumber == $totalSpots) {
                    $reservedNumbers = [1, $totalSpots];
                }
            }            

            // Check if numbers already reserved
            $alreadyTaken = RaffleReservation::where('raffle_id', $raffle->id)
                ->whereIn('spot_number', $reservedNumbers)
                ->pluck('spot_number')
                ->toArray();

            if (!empty($alreadyTaken)) {
                DB::rollBack();
                return $this->errorResponse('Some numbers are already reserved.', ['taken' => $alreadyTaken], 409);
            }

            foreach ($reservedNumbers as $number) {
                RaffleReservation::create([
                    'raffle_id' => $raffle->id,
                    'user_id' => $user->id,
                    'spot_number' => $number
                ]);
            }

            DB::commit();

            return $this->successResponse(
                ['numbers' => $reservedNumbers],
                'Raffle number(s) reserved successfully.',
                201
            );

        } catch (\Exception $e) {
            DB::rollBack();
            if (config('app.debug')) {
                return $this->errorResponse($e->getMessage(), [], 500);
            } else {
                return $this->errorResponse('An unexpected error occurred.', [], 500);
            }
        }
    }

    /**
     * Exit a raffle
     */
    public function exitRaffle(ExitRaffleRequest $request): JsonResponse
    {
        $user = $request->user();

        DB::beginTransaction();

        try {
            // lock raffle row to prevent race conditions
            $raffle = Raffle::where('slug', $request->slug)
                            ->lockForUpdate()
                            ->firstOrFail();

            // cannot exit if raffle fully locked
            if ($raffle->is_locked) {
                DB::rollBack();
                return $this->errorResponse(
                    'Raffle is locked and cannot exit spots.',
                    [],
                    423
                );
            }

            $requestedNumber = $request->requested_number;
            $totalSpots      = $raffle->spots_count;
            $endsEnabled     = $raffle->ends_enabled;

            // determine which spots to release
            $releaseNumbers = [$requestedNumber];

            if ($endsEnabled && ($requestedNumber == 1 || $requestedNumber == $totalSpots)) {
                $releaseNumbers = [1, $totalSpots];
            }

            // fetch this user's current reservations for those spots
            $reservations = RaffleReservation::where('raffle_id', $raffle->id)
                ->where('user_id', $user->id)
                ->whereIn('spot_number', $releaseNumbers)
                ->get();

            if ($reservations->isEmpty()) {
                DB::rollBack();
                return $this->errorResponse(
                    'You have no reservations to release.',
                    [],
                    404
                );
            }

            // delete spots
            foreach ($reservations as $reservation) {
                $reservation->delete();
            }

            DB::commit();

            return $this->successResponse(
                ['released_numbers' => $releaseNumbers],
                'Your spot(s) have been released.',
                200
            );

        } catch (\Exception $e) {
            DB::rollBack();
            if (config('app.debug')) {
                return $this->errorResponse($e->getMessage(), [], 500);
            }
            return $this->errorResponse(
                'An unexpected error occurred.',
                [],
                500
            );
        }
    }

    /**
     * Get reservation status for a raffle
     */
    public function reservationStatus(RaffleReservationStatusRequest $request): JsonResponse
    {
        // fetch raffle by slug
        $raffle = Raffle::where('slug', $request->slug)->firstOrFail();

        $totalSpots  = $raffle->spots_count;
        $endsEnabled = (bool)$raffle->ends_enabled;

        // get all booked spot numbers with user info
        $bookedReservations = RaffleReservation::where('raffle_id', $raffle->id)
            ->with('user:id,name,avatar')
            ->get();

        // Build associative array: spot_number => ['user_avatar' => ...]
        $booked = [];
        foreach ($bookedReservations as $reservation) {
            $booked[$reservation->spot_number] = [
            'user_avatar' => $reservation->user ? $reservation->user->avatar : null,
            'user_name' => $reservation->user ? $reservation->user->name : null,
            'spot_number' => $reservation->spot_number,
            ];
        }

        // compute vacant spots
        $allSpots = range(1, $totalSpots);
        $vacant   = array_values(array_diff($allSpots, $bookedReservations->pluck('spot_number')->toArray()));

        // return snapshot
        return $this->successResponse([
            'slug'            => $raffle->slug,
            'raffle_locked'   => $raffle->is_locked,
            'total_spots'     => $totalSpots,
            'ends_enabled'    => $endsEnabled,
            'booked_numbers'  => $booked,
            'vacant_numbers'  => $vacant,            
            'raffle' => [
                'slug' => $raffle->slug,
                'drawn_at' => $raffle->drawn_at,
                'drawn_number' => $raffle->drawn_number,
                'random_signature' => $raffle->random_signature,
            ]
        ], 'Raffle reservation status retrieved.', 200);
    }

    /**
     * Toggle raffle lock status
     */
    public function toggleRaffleLock(ToggleRaffleLockRequest $request): JsonResponse
    {
        $raffle = Raffle::where('slug', $request->slug)->first();

        if (!$raffle) {
            return $this->errorResponse('Raffle not found.', [], 404);
        }

        $user = $request->user();

        // Only host can toggle lock
        if ($raffle->host_id != $user->id) {
            return $this->errorResponse('Only the host can lock or unlock this raffle.', [], 403);
        }

        // Prevent lock/unlock if draw has started
        if ($raffle->drawn_at != null) {
            return $this->errorResponse('Cannot change lock status after draw has started.', [], 409);
        }

        // Toggle lock status
        $raffle->is_locked = !$raffle->is_locked;
        $raffle->save();

        return $this->successResponse(
            [
                'slug' => $raffle->slug,
                'is_locked' => $raffle->is_locked
            ],
            $raffle->is_locked ? 'Raffle locked successfully.' : 'Raffle unlocked successfully.',
            200
        );
    }

    /**
     * Start the draw for a raffle using random.org
     */
    public function startDraw(StartDrawRequest $request): JsonResponse
    {
        $raffle = Raffle::where('slug', $request->slug)->lockForUpdate()->first();
        if (!$raffle) {
            return $this->errorResponse('Raffle not found.', [], 404);
        }

        // Only host can start draw
        $user = $request->user();
        if ($raffle->host_id != $user->id) {
            return $this->errorResponse('Only the host can start the draw.', [], 403);
        }

        // Check if already drawn
        if ($raffle->drawn_at != null) {
            return $this->errorResponse('Draw has already started.', [], 409);
        }

        // Check if start time reached
        if (now()->lt($raffle->starts_at)) {
            return $this->errorResponse('Cannot start draw before the scheduled start time.', [], 422);
        }

        // Lock the raffle
        $raffle->is_locked = true;
        $raffle->save();

        // Prepare random.org API call
        $apiKey = config('services.randomorg.api_key');
        $client = new Client();
        $params = [
            'jsonrpc' => '2.0',
            'method' => 'generateSignedIntegers',
            'params' => [
                'apiKey' => $apiKey,
                'n' => 1,
                'min' => 1,
                'max' => $raffle->spots_count,
                'replacement' => true,
                'base' => 10
            ],
            'id' => uniqid()
        ];

        try {
            DB::beginTransaction();

            // Call random.org
            $response = $client->post('https://api.random.org/json-rpc/4/invoke', [
                'json' => $params,
                'timeout' => 10
            ]);
            $body = json_decode($response->getBody(), true);

            if (
                !isset($body['result']['random']['data'][0]) ||
                !isset($body['result']['signature'])
            ) {
                DB::rollBack();
                return $this->errorResponse('Failed to get random number from random.org.', ["data" => $body], 500);
            }

            $drawnNumber = $body['result']['random']['data'][0];
            $signature = $body['result']['signature'];

            // Save draw results
            $raffle->drawn_number = $drawnNumber;
            $raffle->random_signature = $signature;
            $raffle->drawn_at = now();
            $raffle->save();

            DB::commit();

            return $this->successResponse([
                'slug' => $raffle->slug,
                'drawn_number' => $drawnNumber,
                'random_signature' => $signature,
                'drawn_at' => $raffle->drawn_at,
            ], 'Draw started successfully.', 200);
        } catch (\Exception $e) {
            DB::rollBack();
            // Only the lock status should persist, so we re-save it outside the transaction if needed
            // (already saved above)
            return $this->errorResponse('Failed to start draw: ' . $e->getMessage(), [], 500);
        }
    }
}
