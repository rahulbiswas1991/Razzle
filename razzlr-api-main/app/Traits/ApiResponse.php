<?php

namespace App\Traits;

use Illuminate\Http\Response as HttpResponse;

trait ApiResponse
{
    protected function successResponse($data, string $message = null, int $code = HttpResponse::HTTP_OK)
    {
        $payload = ['success' => true, 'data' => $data];
        if ($message) { $payload['message'] = $message; }
        return response()->json($payload, $code);
    }

    protected function errorResponse(string $message, array $errors = [], int $code = HttpResponse::HTTP_BAD_REQUEST)
    {
        $payload = ['message' => $message];
        if (!empty($errors)) { $payload['errors'] = $errors; }
        return response()->json($payload, $code);
    }

    protected function validationErrorResponse($validator)
    {
        return $this->errorResponse(
            'Validation failed.',
            $validator->errors()->messages(),
            HttpResponse::HTTP_UNPROCESSABLE_ENTITY
        );
    }
}