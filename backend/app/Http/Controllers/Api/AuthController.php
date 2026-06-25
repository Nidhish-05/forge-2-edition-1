<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => $request->password,
        ]);

        $token = $user->createToken('forge-sprint-token')->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully',
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();
        $user->tokens()->delete(); // revoke old tokens
        $token = $user->createToken('forge-sprint-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['resumes', 'atsScores', 'interviews']);

        $avgScore            = $user->atsScores->avg('score');
        $completedInterviews = $user->interviews->where('status', 'completed')->count();

        return response()->json([
            'user'  => $this->formatUser($user),
            'stats' => [
                'total_resumes'        => $user->resumes->count(),
                'total_ats_scans'      => $user->atsScores->count(),
                'average_ats_score'    => $avgScore ? round($avgScore, 1) : null,
                'total_interviews'     => $user->interviews->count(),
                'completed_interviews' => $completedInterviews,
            ],
        ]);
    }

    private function formatUser(User $user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'created_at' => $user->created_at,
        ];
    }
}
