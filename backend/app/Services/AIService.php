<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIService
{
    private bool $hasApiKey;
    private string $apiKey;
    private string $geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key', '');
        $this->hasApiKey = ! empty($this->apiKey);
    }

    // -------------------------------------------------------------------------
    // Parse Resume
    // -------------------------------------------------------------------------
    public function parseResume(string $text): array
    {
        if ($this->hasApiKey) {
            return $this->geminiParseResume($text);
        }
        return $this->simulateParseResume($text);
    }

    private function geminiParseResume(string $text): array
    {
        $prompt = <<<PROMPT
Analyze this resume text and extract structured information. Return ONLY valid JSON with this exact schema:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number or null",
  "location": "city, country or null",
  "summary": "professional summary or null",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Jan 2020 - Dec 2022",
      "description": "Key responsibilities"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "B.Sc Computer Science",
      "year": "2020"
    }
  ],
  "certifications": ["cert1", "cert2"]
}

Resume Text:
{$text}
PROMPT;

        $response = $this->callGemini($prompt);
        return $this->parseJsonResponse($response, $this->simulateParseResume($text));
    }

    private function simulateParseResume(string $text): array
    {
        // Extract name (heuristic: first line or capitalized phrase)
        $lines = array_filter(array_map('trim', explode("\n", $text)));
        $name = $this->extractName(array_values($lines));

        // Extract email
        preg_match('/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/', $text, $emailMatches);
        $email = $emailMatches[0] ?? null;

        // Extract phone
        preg_match('/(?:\+\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/', $text, $phoneMatches);
        $phone = $phoneMatches[0] ?? null;

        // Extract skills - common tech skills
        $skillKeywords = [
            'PHP', 'Laravel', 'Python', 'Django', 'JavaScript', 'TypeScript', 'React', 'Vue',
            'Angular', 'Node.js', 'Express', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
            'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'Linux', 'REST', 'GraphQL',
            'Java', 'Spring', 'Go', 'Rust', 'C++', 'C#', '.NET', 'Swift', 'Kotlin',
            'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap', 'Webpack', 'Vite',
            'TDD', 'CI/CD', 'Agile', 'Scrum', 'Jira', 'Figma', 'Photoshop',
            'Machine Learning', 'TensorFlow', 'PyTorch', 'Data Analysis', 'SQL',
            'Excel', 'PowerPoint', 'Word', 'Communication', 'Leadership', 'Teamwork',
        ];

        $foundSkills = [];
        foreach ($skillKeywords as $skill) {
            if (stripos($text, $skill) !== false) {
                $foundSkills[] = $skill;
            }
        }

        // Extract experience sections
        $experience = $this->extractExperience($text);

        // Extract education sections
        $education = $this->extractEducation($text);

        return [
            'name'           => $name,
            'email'          => $email,
            'phone'          => $phone,
            'location'       => $this->extractLocation($text),
            'summary'        => $this->extractSummary($text),
            'skills'         => $foundSkills,
            'experience'     => $experience,
            'education'      => $education,
            'certifications' => $this->extractCertifications($text),
        ];
    }

    private function extractName(array $lines): ?string
    {
        foreach (array_slice($lines, 0, 5) as $line) {
            // A name is typically 2-4 words, all letters and spaces
            if (preg_match('/^[A-Z][a-zA-Z]+(\s[A-Z][a-zA-Z]+){1,3}$/', trim($line))) {
                return trim($line);
            }
        }
        return $lines[0] ?? null;
    }

    private function extractLocation(string $text): ?string
    {
        $patterns = [
            '/(?:Location|Address|City)[:\s]+([^\n,]+(?:,\s*[^\n]+)?)/i',
            '/([A-Z][a-z]+(?:,\s*[A-Z]{2})?(?:,\s*[A-Z][a-z]+)?)/',
        ];
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                return trim($m[1]);
            }
        }
        return null;
    }

    private function extractSummary(string $text): ?string
    {
        if (preg_match('/(?:Summary|Profile|Objective|About)[:\n\s]+(.{50,500}?)(?:\n{2,}|(?:Experience|Education|Skills))/is', $text, $m)) {
            return trim(preg_replace('/\s+/', ' ', $m[1]));
        }
        return null;
    }

    private function extractExperience(string $text): array
    {
        $experience = [];
        if (preg_match_all('/([A-Z][\w\s&]+)\s*[-–|]\s*([A-Z][\w\s]+)(?:\s*\|\s*|\n)([\w\s,]+\d{4}[^\n]*)/i', $text, $m, PREG_SET_ORDER)) {
            foreach (array_slice($m, 0, 5) as $match) {
                $experience[] = [
                    'company'     => trim($match[1]),
                    'role'        => trim($match[2]),
                    'duration'    => trim($match[3]),
                    'description' => '',
                ];
            }
        }
        return $experience;
    }

    private function extractEducation(string $text): array
    {
        $education = [];
        $degreeKeywords = ['B.Sc', 'B.S.', 'M.Sc', 'M.S.', 'MBA', 'Ph.D', 'Bachelor', 'Master', 'Doctor', 'B.E', 'B.Tech', 'M.Tech'];
        $pattern = '/(?:' . implode('|', array_map('preg_quote', $degreeKeywords)) . ')[^\n]*/i';
        if (preg_match_all($pattern, $text, $matches)) {
            foreach (array_slice($matches[0], 0, 3) as $match) {
                $education[] = [
                    'institution' => $this->extractNearbyInstitution($text, $match),
                    'degree'      => trim($match),
                    'year'        => $this->extractYearNear($match),
                ];
            }
        }
        return $education;
    }

    private function extractNearbyInstitution(string $fullText, string $near): string
    {
        $pos = strpos($fullText, $near);
        if ($pos === false) return 'University';
        $surrounding = substr($fullText, max(0, $pos - 200), 400);
        if (preg_match('/([A-Z][a-zA-Z\s]+(University|College|Institute|School|Academy))/i', $surrounding, $m)) {
            return trim($m[0]);
        }
        return 'Academic Institution';
    }

    private function extractYearNear(string $text): ?string
    {
        preg_match('/(19|20)\d{2}/', $text, $m);
        return $m[0] ?? null;
    }

    private function extractCertifications(string $text): array
    {
        $certs = [];
        $keywords = ['AWS Certified', 'Google Certified', 'Microsoft Certified', 'Certified', 'Certificate in', 'PMP', 'CISSP', 'CPA', 'CFA'];
        foreach ($keywords as $keyword) {
            if (preg_match('/' . preg_quote($keyword, '/') . '[^\n]{0,80}/i', $text, $m)) {
                $certs[] = trim($m[0]);
            }
        }
        return array_values(array_unique($certs));
    }

    // -------------------------------------------------------------------------
    // ATS Scoring
    // -------------------------------------------------------------------------
    public function calculateAts(string $resumeText, string $jobTitle, string $jobDescription): array
    {
        if ($this->hasApiKey) {
            return $this->geminiCalculateAts($resumeText, $jobTitle, $jobDescription);
        }
        return $this->simulateCalculateAts($resumeText, $jobTitle, $jobDescription);
    }

    private function geminiCalculateAts(string $resumeText, string $jobTitle, string $jobDescription): array
    {
        $prompt = <<<PROMPT
You are an expert ATS (Applicant Tracking System) evaluator.

Analyze this resume against the job description and return ONLY valid JSON with this exact schema:
{
  "score": 75,
  "summary": "Brief 1-2 sentence summary of the match quality",
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_keywords": ["keyword3", "keyword4"],
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "sections_analysis": {
    "skills_match": 80,
    "experience_match": 70,
    "education_match": 75,
    "keywords_density": 65
  }
}

Job Title: {$jobTitle}

Job Description:
{$jobDescription}

Resume:
{$resumeText}
PROMPT;

        $response = $this->callGemini($prompt);
        return $this->parseJsonResponse($response, $this->simulateCalculateAts($resumeText, $jobTitle, $jobDescription));
    }

    private function simulateCalculateAts(string $resumeText, string $jobTitle, string $jobDescription): array
    {
        // Extract words from job description as keywords
        $jdWords     = $this->extractKeywords($jobDescription);
        $resumeWords = $this->extractKeywords($resumeText);

        $matched = array_intersect($jdWords, $resumeWords);
        $missing = array_diff($jdWords, $resumeWords);

        // Score: based on keyword overlap ratio, weighted
        $totalJdWords = count($jdWords);
        $matchedCount = count($matched);
        $baseScore    = $totalJdWords > 0 ? (int) round(($matchedCount / $totalJdWords) * 100) : 50;
        $score        = min(95, max(20, $baseScore + rand(-5, 10)));

        // Categorize strengths/weaknesses based on score
        $strengths   = $this->generateStrengths($matched, $score);
        $weaknesses  = $this->generateWeaknesses($missing, $score);
        $suggestions = $this->generateSuggestions($missing, $jobTitle);

        return [
            'score'            => $score,
            'summary'          => $this->generateAtsSummary($score, $jobTitle),
            'matched_keywords' => array_values(array_slice($matched, 0, 20)),
            'missing_keywords' => array_values(array_slice($missing, 0, 15)),
            'strengths'        => $strengths,
            'weaknesses'       => $weaknesses,
            'suggestions'      => $suggestions,
            'sections_analysis' => [
                'skills_match'     => min(100, $score + rand(-10, 15)),
                'experience_match' => min(100, $score + rand(-15, 10)),
                'education_match'  => min(100, $score + rand(-5, 20)),
                'keywords_density' => min(100, $score + rand(-20, 5)),
            ],
        ];
    }

    private function extractKeywords(string $text): array
    {
        $stopWords = [
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'we', 'you',
            'they', 'it', 'this', 'that', 'our', 'your', 'their', 'its', 'as',
            'if', 'all', 'not', 'also', 'than', 'then', 'so', 'up', 'out', 'no',
            'experience', 'work', 'working', 'able', 'good', 'team', 'role', 'position',
        ];

        $text    = strtolower(preg_replace('/[^a-zA-Z0-9\s+#]/', ' ', $text));
        $words   = preg_split('/\s+/', $text);
        $keywords = [];

        foreach ($words as $word) {
            $word = trim($word);
            if (strlen($word) > 3 && ! in_array($word, $stopWords)) {
                $keywords[] = $word;
            }
        }

        return array_unique($keywords);
    }

    private function generateStrengths(array $matched, int $score): array
    {
        $strengths = [];
        if (count($matched) > 10) {
            $strengths[] = 'Strong keyword alignment with the job description — ' . count($matched) . ' key terms matched';
        }
        if ($score >= 70) $strengths[] = 'Resume demonstrates a strong overall fit for this role';
        if ($score >= 60) $strengths[] = 'Technical skills appear well-aligned with job requirements';
        $strengths[] = 'Relevant industry terminology present throughout the resume';
        return array_slice($strengths, 0, 4);
    }

    private function generateWeaknesses(array $missing, int $score): array
    {
        $weaknesses = [];
        if ($score < 60) $weaknesses[] = 'Overall keyword density is below the optimal threshold for this role';
        if (count($missing) > 8) $weaknesses[] = count($missing) . ' job-critical keywords are absent from the resume';
        $weaknesses[] = 'Some required qualifications may not be clearly articulated';
        return array_slice($weaknesses, 0, 3);
    }

    private function generateSuggestions(array $missing, string $jobTitle): array
    {
        $suggestions = [];
        $topMissing  = array_slice($missing, 0, 3);
        foreach ($topMissing as $kw) {
            $suggestions[] = 'Add "' . ucwords($kw) . '" to your skills or experience sections if applicable';
        }
        $suggestions[] = "Quantify achievements with metrics (e.g., 'Reduced load time by 40%')";
        $suggestions[] = "Tailor the professional summary specifically for {$jobTitle} roles";
        $suggestions[] = 'Ensure the resume passes basic ATS formatting: avoid tables, graphics, and columns';
        return array_slice($suggestions, 0, 5);
    }

    private function generateAtsSummary(int $score, string $jobTitle): string
    {
        if ($score >= 80) return "Excellent match for the {$jobTitle} role. Your resume aligns very well with the job description.";
        if ($score >= 65) return "Good candidate for {$jobTitle}. A few keyword optimizations could push you into the top tier.";
        if ($score >= 50) return "Moderate alignment with {$jobTitle} requirements. Significant optimization recommended before applying.";
        return "Low ATS match for {$jobTitle}. Consider substantial resume tailoring or pivot your target role.";
    }

    // -------------------------------------------------------------------------
    // Interview Generation
    // -------------------------------------------------------------------------
    public function generateInterview(string $resumeText, string $jobTitle, string $jobDescription): array
    {
        if ($this->hasApiKey) {
            return $this->geminiGenerateInterview($resumeText, $jobTitle, $jobDescription);
        }
        return $this->simulateGenerateInterview($resumeText, $jobTitle, $jobDescription);
    }

    private function geminiGenerateInterview(string $resumeText, string $jobTitle, string $jobDescription): array
    {
        $prompt = <<<PROMPT
You are an expert technical interviewer. Generate 5 tailored interview questions based on the candidate's resume and the job description.

Return ONLY valid JSON with this exact schema:
[
  {
    "id": 1,
    "type": "behavioral",
    "question": "Question text here",
    "hints": "What a great answer looks like",
    "time_limit": 120
  }
]

Question types should vary: technical, behavioral, situational, problem-solving, culture-fit.

Job Title: {$jobTitle}
Job Description: {$jobDescription}
Resume: {$resumeText}
PROMPT;

        $response = $this->callGemini($prompt);
        return $this->parseJsonResponse($response, $this->simulateGenerateInterview($resumeText, $jobTitle, $jobDescription));
    }

    private function simulateGenerateInterview(string $resumeText, string $jobTitle, string $jobDescription): array
    {
        // Extract skills/tech from resume to personalize questions
        $parsed   = $this->simulateParseResume($resumeText);
        $skills   = array_slice($parsed['skills'] ?? ['your primary skills'], 0, 3);
        $skillStr = implode(', ', $skills) ?: 'your technical skills';

        return [
            [
                'id'         => 1,
                'type'       => 'behavioral',
                'question'   => "Tell me about yourself and why you're a great fit for this {$jobTitle} role. Focus on your most relevant experience.",
                'hints'      => 'Use the STAR method: Situation, Task, Action, Result. Highlight 2-3 relevant achievements.',
                'time_limit' => 120,
            ],
            [
                'id'         => 2,
                'type'       => 'technical',
                'question'   => "Your resume mentions {$skillStr}. Can you walk me through a challenging technical problem you solved using one of these and explain your thought process?",
                'hints'      => 'Describe the problem context, the constraints you faced, your solution approach, and the measurable outcome.',
                'time_limit' => 180,
            ],
            [
                'id'         => 3,
                'type'       => 'behavioral',
                'question'   => 'Describe a situation where you had to meet a tight deadline under pressure. How did you prioritize tasks, and what was the outcome?',
                'hints'      => 'Interviewers want to see your time management, prioritization, and resilience. Be specific about the deadline and results.',
                'time_limit' => 120,
            ],
            [
                'id'         => 4,
                'type'       => 'situational',
                'question'   => "Imagine you join our team as a {$jobTitle} and are assigned to a legacy codebase with poor documentation. How would you approach understanding and improving it?",
                'hints'      => 'Show your systematic approach: reading code, running tests, talking to team members, progressive refactoring.',
                'time_limit' => 150,
            ],
            [
                'id'         => 5,
                'type'       => 'culture-fit',
                'question'   => 'What aspects of your career development are most important to you, and how does this opportunity align with those goals?',
                'hints'      => 'Research the company values and connect your personal growth goals authentically to the role.',
                'time_limit' => 90,
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Interview Evaluation
    // -------------------------------------------------------------------------
    public function evaluateInterview(array $questions, array $answers, string $jobTitle): array
    {
        if ($this->hasApiKey) {
            return $this->geminiEvaluateInterview($questions, $answers, $jobTitle);
        }
        return $this->simulateEvaluateInterview($questions, $answers, $jobTitle);
    }

    private function geminiEvaluateInterview(array $questions, array $answers, string $jobTitle): array
    {
        $qaPairs = [];
        foreach ($questions as $q) {
            $answer = 'No answer provided';
            foreach ($answers as $a) {
                if (($a['question_id'] ?? null) == $q['id']) {
                    $answer = $a['answer'] ?? 'No answer provided';
                    break;
                }
            }
            $qaPairs[] = "Q{$q['id']}: {$q['question']}\nA: {$answer}";
        }
        $qaText = implode("\n\n", $qaPairs);

        $prompt = <<<PROMPT
You are an expert interviewer evaluating candidate responses for a {$jobTitle} role.

Evaluate the following Q&A pairs and return ONLY valid JSON with this schema:
{
  "overall_score": 75,
  "overall_feedback": "Brief overall assessment",
  "hire_recommendation": "Strong Yes / Yes / Maybe / No",
  "question_feedback": [
    {
      "question_id": 1,
      "score": 80,
      "rating": "Excellent",
      "what_went_well": "...",
      "what_to_improve": "...",
      "ideal_answer": "A model answer would be..."
    }
  ],
  "top_strengths": ["strength1", "strength2"],
  "key_improvements": ["improvement1", "improvement2"]
}

Q&A Pairs:
{$qaText}
PROMPT;

        $response = $this->callGemini($prompt);
        return $this->parseJsonResponse($response, $this->simulateEvaluateInterview($questions, $answers, $jobTitle));
    }

    private function simulateEvaluateInterview(array $questions, array $answers, string $jobTitle): array
    {
        $ratings          = ['Needs Improvement', 'Fair', 'Good', 'Very Good', 'Excellent'];
        $questionFeedback = [];
        $totalScore       = 0;

        foreach ($questions as $q) {
            $qId   = $q['id'];
            $answer = '';
            foreach ($answers as $a) {
                if (($a['question_id'] ?? null) == $qId) {
                    $answer = $a['answer'] ?? '';
                    break;
                }
            }

            $wordCount = str_word_count($answer);
            $score     = match (true) {
                $wordCount === 0 => 10,
                $wordCount < 20  => 35,
                $wordCount < 50  => 55,
                $wordCount < 100 => 70,
                $wordCount < 200 => 82,
                default          => 90,
            };
            $score      = min(98, $score + rand(-5, 8));
            $totalScore += $score;
            $ratingIdx  = (int) floor($score / 20);

            $questionFeedback[] = [
                'question_id'     => $qId,
                'score'           => $score,
                'rating'          => $ratings[min(4, $ratingIdx)],
                'what_went_well'  => $wordCount > 50
                    ? 'Your response demonstrates an understanding of the topic and communicates ideas clearly.'
                    : 'You addressed the question directly.',
                'what_to_improve' => $wordCount < 100
                    ? 'Provide more specific examples and quantifiable achievements. Use the STAR method for structured answers.'
                    : 'Consider refining your answer to be more concise while retaining key details.',
                'ideal_answer'    => $q['hints'] ?? 'A strong answer would use the STAR method with specific examples and measurable outcomes.',
            ];
        }

        $overallScore = count($questions) > 0
            ? (int) round($totalScore / count($questions))
            : 50;

        $recommendation = match (true) {
            $overallScore >= 85 => 'Strong Yes',
            $overallScore >= 70 => 'Yes',
            $overallScore >= 55 => 'Maybe',
            default             => 'No',
        };

        return [
            'overall_score'      => $overallScore,
            'overall_feedback'   => "Your {$jobTitle} interview performance shows " . ($overallScore >= 70 ? 'strong' : 'developing') . ' potential. Focus on using the STAR method and providing concrete examples.',
            'hire_recommendation' => $recommendation,
            'question_feedback'  => $questionFeedback,
            'top_strengths'      => [
                'Demonstrates relevant domain knowledge',
                'Communicates responses in an organized manner',
            ],
            'key_improvements'   => [
                'Incorporate specific metrics and quantifiable results in your examples',
                'Practice the STAR method: Situation, Task, Action, Result',
                'Research the company culture and align your answers to their values',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Gemini API Helpers
    // -------------------------------------------------------------------------
    private function callGemini(string $prompt): ?string
    {
        try {
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->timeout(30)
                ->post("{$this->geminiUrl}?key={$this->apiKey}", [
                    'contents' => [
                        [
                            'parts' => [['text' => $prompt]],
                        ],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.3,
                        'topK'        => 40,
                        'topP'        => 0.95,
                    ],
                ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            }

            Log::error('Gemini API error', ['status' => $response->status(), 'body' => $response->body()]);
            return null;
        } catch (\Throwable $e) {
            Log::error('Gemini API exception: ' . $e->getMessage());
            return null;
        }
    }

    private function parseJsonResponse(?string $response, array $fallback): array
    {
        if (! $response) return $fallback;

        // Strip markdown code fences if present
        $cleaned = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($response));

        try {
            $decoded = json_decode($cleaned, true, 512, JSON_THROW_ON_ERROR);
            return is_array($decoded) ? $decoded : $fallback;
        } catch (\JsonException $e) {
            Log::warning('Failed to parse Gemini JSON response: ' . $e->getMessage());
            return $fallback;
        }
    }
}
