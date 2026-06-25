<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobApplicationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $applications = $request->user()
            ->jobApplications()
            ->with('resume:id,original_filename')
            ->latest()
            ->get();

        return response()->json(['data' => $applications]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resume_id'       => ['nullable', 'exists:resumes,id'],
            'job_title'       => ['required', 'string', 'max:255'],
            'company_name'    => ['nullable', 'string', 'max:255'],
            'job_description' => ['nullable', 'string'],
            'status'          => ['nullable', 'string', 'in:applied,ats_scanned,interviewing,offered,rejected'],
            'score'           => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $application = $request->user()->jobApplications()->create($validated);

        return response()->json([
            'message' => 'Job application created successfully',
            'data'    => $application->load('resume:id,original_filename'),
        ], 201);
    }

    public function update(Request $request, JobApplication $jobApplication): JsonResponse
    {
        if ($jobApplication->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'resume_id'       => ['nullable', 'exists:resumes,id'],
            'job_title'       => ['sometimes', 'required', 'string', 'max:255'],
            'company_name'    => ['nullable', 'string', 'max:255'],
            'job_description' => ['nullable', 'string'],
            'status'          => ['sometimes', 'required', 'string', 'in:applied,ats_scanned,interviewing,offered,rejected'],
            'score'           => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $jobApplication->update($validated);

        return response()->json([
            'message' => 'Job application updated successfully',
            'data'    => $jobApplication->load('resume:id,original_filename'),
        ]);
    }

    public function destroy(Request $request, JobApplication $jobApplication): JsonResponse
    {
        if ($jobApplication->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $jobApplication->delete();

        return response()->json(['message' => 'Job application deleted successfully']);
    }
}
