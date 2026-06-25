<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AtsRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'resume_id'       => ['required', 'exists:resumes,id'],
            'job_title'       => ['required', 'string', 'max:255'],
            'company_name'    => ['nullable', 'string', 'max:255'],
            'job_description' => ['required', 'string', 'min:50'],
        ];
    }
}
