<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

use App\Traits\ApiResponse;
use App\Models\User;
use App\Http\Requests\LoginWithFacebookRequest;

class AuthController extends Controller
{
    use ApiResponse;
    
    /**
     * Display the Facebook App ID.
     */
    public function facebookAppId(): JsonResponse
    {
        $appId = config('services.facebook.client_id');
        if (!$appId) {
            return $this->errorResponse(
                'Facebook App ID is not configured.',
                [],
                500
            );
        }

        return $this->successResponse(
            ['app_id' => $appId],
            'Facebook App ID retrieved.'
        );
    }

    /**
     * Handle login with Facebook.
     */
    public function loginWithFacebook(LoginWithFacebookRequest $request): JsonResponse
    {

        $fbResponse = Http::get(
            config('services.facebook.graph_base_url') . '/me',
            [
                'fields'       => 'id,name,email,picture.type(large)',
                'access_token' => $request->access_token,
            ]
        );

        if ($fbResponse->failed()) {
            return $this->errorResponse(
                'Invalid Facebook token.',
                [],
                401
            );
        }


        $fb = $fbResponse->json();

        $validator = Validator::make($fb, [
            'id'                => 'required|string',
            'name'              => 'required|string',
            'email'             => 'email',
            'picture.data.url'  => 'nullable|url',
        ], [            
            'email.email'       => 'A valid email address is required from Facebook.',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator);
        }

        $user = User::updateOrCreate(
            ['facebook_id' => $fb['id']],
            [
                'name'               => $fb['name'],
                'email'              => $fb['email'] ?? null,
                'email_verified_at'  => Carbon::now(),
                'avatar'             => $fb['picture']['data']['url'],
                'facebook_token'     => $request->access_token,
                'password'           => bcrypt(Str::random(32)),
            ]
        );

        if ($user->wasRecentlyCreated || $user->wasChanged('email')) {
            $user->markEmailAsVerified();
        }

        $token     = $user->createToken('api-token')->plainTextToken;
        $expiresAt = Carbon::now()->addDays(config('sanctum.expiration'));

        return $this->successResponse([
            'token'       => $token,
            'token_type'  => 'Bearer',
            'expires_at'  => $expiresAt->toDateTimeString(),
            'user'        => $user,
        ], 'Logged in successfully.');
    }

    /**
     * Get the authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        return $this->successResponse([
            'user' => $user
        ], 'User fetched successfully.');
    }

}
