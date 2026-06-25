<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resume;
use App\Services\AIService;
use App\Services\ResumeParserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ResumeController extends Controller
{
    public function __construct(
        private ResumeParserService $parserService,
        private AIService $aiService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $resumes = $request->user()
            ->resumes()
            ->latest()
            ->get()
            ->map(fn ($r) => $this->formatResume($r));

        return response()->json(['data' => $resumes]);
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'resume' => ['required', 'file', 'mimes:pdf,doc,docx,txt', 'max:10240'], // 10MB
        ]);

        $file = $request->file('resume');

        // Extract raw text
        $rawText = $this->parserService->extractText($file);

        // Store the file
        $path = $file->store('resumes/' . $request->user()->id, 'local');

        // Parse structured content via AI
        $parsedContent = $this->aiService->parseResume($rawText);

        $resume = $request->user()->resumes()->create([
            'original_filename' => $file->getClientOriginalName(),
            'file_path'         => $path,
            'mime_type'         => $file->getMimeType(),
            'raw_text'          => $rawText,
            'parsed_content'    => $parsedContent,
        ]);

        return response()->json([
            'message' => 'Resume uploaded and parsed successfully',
            'data'    => $this->formatResume($resume),
        ], 201);
    }

    public function show(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('view', $resume);

        return response()->json(['data' => $this->formatResume($resume)]);
    }

    public function destroy(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('delete', $resume);

        Storage::disk('local')->delete($resume->file_path);
        $resume->delete();

        return response()->json(['message' => 'Resume deleted successfully']);
    }

    private function formatResume(Resume $resume): array
    {
        return [
            'id'                => $resume->id,
            'original_filename' => $resume->original_filename,
            'mime_type'         => $resume->mime_type,
            'parsed_content'    => $resume->parsed_content,
            'created_at'        => $resume->created_at,
            'updated_at'        => $resume->updated_at,
        ];
    }
}
