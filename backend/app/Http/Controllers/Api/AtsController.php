<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AtsRequest;
use App\Models\AtsScore;
use App\Models\Resume;
use App\Services\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AtsController extends Controller
{
    public function __construct(private AIService $aiService) {}

    public function scan(AtsRequest $request): JsonResponse
    {
        /** @var Resume $resume */
        $resume = Resume::findOrFail($request->resume_id);

        if ($resume->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $rawText = $resume->raw_text ?? '';
        $result  = $this->aiService->calculateAts(
            $rawText,
            $request->job_title,
            $request->job_description
        );

        $atsScore = AtsScore::create([
            'user_id'         => $request->user()->id,
            'resume_id'       => $resume->id,
            'job_title'       => $request->job_title,
            'company_name'    => $request->company_name,
            'job_description' => $request->job_description,
            'score'           => $result['score'] ?? 0,
            'feedback'        => $result,
        ]);

        return response()->json([
            'message' => 'ATS scan completed successfully',
            'data'    => $this->formatAtsScore($atsScore),
        ], 201);
    }

    public function history(Request $request): JsonResponse
    {
        $history = $request->user()
            ->atsScores()
            ->with('resume:id,original_filename')
            ->latest()
            ->get()
            ->map(fn ($a) => $this->formatAtsScore($a));

        return response()->json(['data' => $history]);
    }

    public function show(Request $request, AtsScore $atsScore): JsonResponse
    {
        if ($atsScore->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'data' => $this->formatAtsScore($atsScore->load('resume:id,original_filename')),
        ]);
    }

    private function formatAtsScore(AtsScore $atsScore): array
    {
        return [
            'id'           => $atsScore->id,
            'resume_id'    => $atsScore->resume_id,
            'resume'       => $atsScore->resume
                ? ['id' => $atsScore->resume->id, 'original_filename' => $atsScore->resume->original_filename]
                : null,
            'job_title'    => $atsScore->job_title,
            'company_name' => $atsScore->company_name,
            'score'        => $atsScore->score,
            'feedback'     => $atsScore->feedback,
            'created_at'   => $atsScore->created_at,
        ];
    }
}
