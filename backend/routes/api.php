<?php

use App\Http\Controllers\Api\AtsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\InterviewController;
use App\Http\Controllers\Api\ResumeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Forge Sprint
|--------------------------------------------------------------------------
|
| All routes here are prefixed with /api/v1 (configured in bootstrap/app.php).
|
*/

// ── Public Auth Routes ────────────────────────────────────────────────────────
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

// ── Protected Routes ──────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Resumes
    Route::get('/resumes',            [ResumeController::class, 'index']);
    Route::post('/resumes/upload',    [ResumeController::class, 'upload']);
    Route::get('/resumes/{resume}',   [ResumeController::class, 'show']);
    Route::delete('/resumes/{resume}',[ResumeController::class, 'destroy']);

    // ATS Scoring
    Route::post('/ats/scan',        [AtsController::class, 'scan']);
    Route::get('/ats/history',      [AtsController::class, 'history']);
    Route::get('/ats/{atsScore}',   [AtsController::class, 'show']);

    // Mock Interviews
    Route::get('/interviews',                              [InterviewController::class, 'index']);
    Route::post('/interviews/generate',                    [InterviewController::class, 'generate']);
    Route::get('/interviews/{interview}',                  [InterviewController::class, 'show']);
    Route::post('/interviews/{interview}/submit',          [InterviewController::class, 'submitAnswers']);
    Route::delete('/interviews/{interview}',               [InterviewController::class, 'destroy']);
});
