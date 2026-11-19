<?php
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\CreditWalletController;
use App\Http\Controllers\API\RaffleController;

Route::get('facebook-app-id', [AuthController::class, 'facebookAppId']);
Route::post('login-with-facebook', [AuthController::class, 'loginWithFacebook']);
Route::post('stripe-webhook', [CreditWalletController::class, 'webhook']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('user', [AuthController::class, 'me']);
    Route::post('create-raffle', [RaffleController::class, 'store']);
    Route::get('raffles-list', [RaffleController::class, 'raffles_list']);
    Route::post('raffle-by-slug', [RaffleController::class, 'raffle']);
    Route::get('list-credit-packages', [CreditWalletController::class, 'listCreditPackages']);
    Route::post('purchase-credits', [CreditWalletController::class, 'checkout']);
    Route::post('join-raffle', [RaffleController::class, 'joinRaffle']);
    Route::post('exit-raffle', [RaffleController::class, 'exitRaffle']);
    Route::post('raffle-reservation-status', [RaffleController::class, 'reservationStatus']);
    Route::post('toggle-raffle-lock', [RaffleController::class, 'toggleRaffleLock']);
    Route::post('start-draw', [RaffleController::class, 'startDraw']);
});
