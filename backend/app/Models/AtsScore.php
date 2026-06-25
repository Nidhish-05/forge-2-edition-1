<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AtsScore extends Model
{
    use HasFactory;

    protected $table = 'ats_scores';

    protected $fillable = [
        'user_id',
        'resume_id',
        'job_title',
        'company_name',
        'job_description',
        'score',
        'feedback',
    ];

    protected $casts = [
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
