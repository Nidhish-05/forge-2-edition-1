<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Interview extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'resume_id',
        'job_title',
        'company_name',
        'job_description',
        'questions',
        'answers',
        'score',
        'feedback',
        'status',
    ];

    protected $casts = [
        'questions' => 'array',
        'answers' => 'array',
        'feedback' => 'array',
        'score' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function resume(): BelongsTo
    {
        return $this->belongsTo(Resume::class);
    }
}
