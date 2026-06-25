<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InterviewGenerateRequest;
use App\Http\Requests\SubmitAnswersRequest;
use App\Models\Interview;
use App\Models\Resume;
use App\Services\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    public function __construct(private AIService $aiService) {}

    /**
     * Generate a new mock interview session.
     */
    public function generate(InterviewGenerateRequest $request): JsonResponse
    {
        /** @var Resume $resume */
        $resume = Resume::findOrFail($request->resume_id);

        if ($resume->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $jobTitle       = $request->job_title;
        $jobDescription = $request->job_description ?? '';
        $rawText        = $resume->raw_text ?? '';

        $questions = $this->aiService->generateInterview($rawText, $jobTitle, $jobDescription);

        $interview = Interview::create([
            'user_id'         => $request->user()->id,
            'resume_id'       => $resume->id,
            'job_title'       => $jobTitle,
            'company_name'    => $request->company_name,
            'job_description' => $jobDescription,
            'questions'       => $questions,
            'status'          => 'pending',
        ]);

        return response()->json([
            'message' => 'Interview session created successfully',
            'data'    => $this->formatInterview($interview),
        ], 201);
    }

    /**
     * Submit answers and get AI evaluation.
     */
    public function submitAnswers(SubmitAnswersRequest $request, Interview $interview): JsonResponse
    {
        if ($interview->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($interview->status === 'completed') {
            return response()->json(['message' => 'This interview has already been completed'], 422);
        }

        $answers  = $request->answers;
        $feedback = $this->aiService->evaluateInterview(
            $interview->questions,
            $answers,
            $interview->job_title
        );

        $interview->update([
            'answers'  => $answers,
            'score'    => $feedback['overall_score'] ?? 0,
            'feedback' => $feedback,
            'status'   => 'completed',
        ]);

        return response()->json([
            'message' => 'Interview evaluated successfully',
            'data'    => $this->formatInterview($interview->fresh()),
        ]);
    }

    /**
     * List all interviews for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $interviews = $request->user()
            ->interviews()
            ->with('resume:id,original_filename')
            ->latest()
            ->get()
            ->map(fn ($i) => $this->formatInterview($i));

        return response()->json(['data' => $interviews]);
    }

    /**
     * Show a single interview.
     */
    public function show(Request $request, Interview $interview): JsonResponse
    {
        if ($interview->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'data' => $this->formatInterview($interview->load('resume:id,original_filename')),
        ]);
    }

    /**
     * Delete an interview.
     */
    public function destroy(Request $request, Interview $interview): JsonResponse
    {
        if ($interview->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $interview->delete();

        return response()->json(['message' => 'Interview deleted successfully']);
    }

    private function formatInterview(Interview $interview): array
    {
        return [
            'id'              => $interview->id,
            'resume_id'       => $interview->resume_id,
            'resume'          => $interview->resume
                ? ['id' => $interview->resume->id, 'original_filename' => $interview->resume->original_filename]
                : null,
            'job_title'       => $interview->job_title,
            'company_name'    => $interview->company_name,
            'job_description' => $interview->job_description,
            'questions'       => $interview->questions,
            'answers'         => $interview->answers,
            'score'           => $interview->score,
            'feedback'        => $interview->feedback,
            'status'          => $interview->status,
            'created_at'      => $interview->created_at,
            'updated_at'      => $interview->updated_at,
        ];
    }
}
