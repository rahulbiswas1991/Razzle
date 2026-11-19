<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use App\Models\CreditPackage;
use App\Models\CreditTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Stripe\Stripe;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Webhook;
use App\Http\Requests\CreditsCheckoutRequest;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage; 

class CreditWalletController extends Controller
{
    use ApiResponse;

    /**
     * List all available credit packages.
     */
    public function listCreditPackages(): JsonResponse
    {
        $packages = CreditPackage::all();
        return $this->successResponse(
            ['credit_packages' => $packages],
            'Credit packages retrieved.'
        );
    }

    /**
     * Create a Stripe Checkout Session and a pending credit transaction.
     */
    public function checkout(CreditsCheckoutRequest $request): JsonResponse
    {
        $data    = $request->validated();
        $user    = $request->user();
        $package = CreditPackage::findOrFail($data['package_id']);

        DB::beginTransaction();

        try {
            
            $tx = $user->creditTransactions()->create([
                'type'               => 'purchase',
                'credits'            => $package->credits,
                'transaction_id' => (string) Str::uuid(),
            ]);

            Stripe::setApiKey(config('services.stripe.secret'));

            $session = StripeSession::create([
                'payment_method_types' => ['card'],
                'mode'                 => 'payment',
                'line_items'           => [[
                    'price_data' => [
                        'currency'     => strtolower($package->currency),
                        'unit_amount'  => $package->price_cents,
                        'product_data' => ['name' => $package->name],
                    ],
                    'quantity' => 1,
                ]],
                'metadata' => [
                    'credits' => $package->credits,
                    'transaction_id' => $tx->transaction_id,
                ],
                'client_reference_id' => (string) $tx->transaction_id,
                'success_url'         => config('services.stripe.success_url'). '&transaction_id=' . $tx->transaction_id,
                'cancel_url'          => config('services.stripe.cancel_url'). '&transaction_id=' . $tx->transaction_id
            ]);

            $tx->update(['stripe_session_id' => $session->id]);

            DB::commit();

            return $this->successResponse(
                ['checkout_url' => $session->url],
                'Checkout session created.',
                201
            );
        } catch (\Throwable $e) {

            DB::rollBack();

            $error = [];
            if (config('app.debug')) {
                $error['error'] = $e->getMessage();
            }

            return $this->errorResponse(
                'Failed to create checkout session. Please try again later.',
                $error,
                500
            );
        }

    }

    /**
     * Handle Stripe webhooks to finalize transactions.
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload   = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        Storage::disk('local')->append('stripe-webhook-logs.txt', "Raw payload:\n{$payload}");
        Storage::disk('local')->append('stripe-webhook-logs.txt', "Signature header: {$sigHeader}");

        $endpointSecret = config('services.stripe.webhook_secret');
        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
            Storage::disk('local')->append('stripe-webhook-logs.txt', "Signature verified, event type: {$event->type}");
        } catch (\Exception $e) {
            Storage::disk('local')->append('stripe-webhook-logs.txt', "Signature verification failed: {$e->getMessage()}");
            return $this->errorResponse('Invalid signature', [], 400);
        }

        if ($event->type == 'checkout.session.completed') {
            $session = $event->data->object;
            Storage::disk('local')->append('stripe-webhook-logs.txt', "Processing checkout.session.completed, session ID: {$session->id}");

            $tx = CreditTransaction::where('transaction_id', $session->metadata->transaction_id)
                                   ->where('stripe_session_id', $session->id)
                                   ->first();
            Storage::disk('local')->append('stripe-webhook-logs.txt',
                $tx
                    ? "Found transaction ID {$tx->transaction_id} with status {$tx->payment_status}"
                    : "No matching transaction for metadata.transaction_id={$session->metadata->transaction_id}"
            );

            if ($tx && $tx->payment_status == 'unpaid') {
                DB::transaction(function () use ($tx, $session) {
                    $tx->update([
                        'payment_status'           => 'paid',
                        'stripe_payment_intent_id' => $session->payment_intent,
                    ]);
                    Storage::disk('local')->append('stripe-webhook-logs.txt',
                        "Transaction {$tx->transaction_id} marked paid, intent {$session->payment_intent}"
                    );

                    $oldBalance = $tx->user->credits_balance;
                    $tx->user->increment('credits_balance', $tx->credits);
                    $newBalance = $tx->user->credits_balance;
                    Storage::disk('local')->append('stripe-webhook-logs.txt',
                        "Credited user {$tx->user_id}: +{$tx->credits} ({$oldBalance}→{$newBalance})"
                    );
                });
            }
        }

        Storage::disk('local')->append('stripe-webhook-logs.txt', "Responding 200 to Stripe\n\n");
        return $this->successResponse(['received' => true]);
    }

}
