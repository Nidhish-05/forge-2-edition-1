<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAnswersRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'answers'               => ['required', 'array'],
            'answers.*.question_id' => ['required', 'integer'],
            'answers.*.answer'      => ['required', 'string'],
        ];
    }
}
