export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface UserStats {
  total_resumes: number;
  total_ats_scans: number;
  average_ats_score: number | null;
  total_interviews: number;
  completed_interviews: number;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface UserResponse {
  user: User;
  stats: UserStats;
}

export interface Resume {
  id: number;
  original_filename: string;
  mime_type: string | null;
  parsed_content: {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    summary: string | null;
    skills: string[];
    experience: Array<{
      company: string;
      role: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      institution: string;
      degree: string;
      year: string | null;
    }>;
    certifications: string[];
  } | null;
  created_at: string;
  updated_at: string;
}

export interface AtsScore {
  id: number;
  resume_id: number;
  resume: {
    id: number;
    original_filename: string;
  } | null;
  job_title: string;
  company_name: string | null;
  score: number;
  feedback: {
    score: number;
    summary: string;
    matched_keywords: string[];
    missing_keywords: string[];
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    sections_analysis: {
      skills_match: number;
      experience_match: number;
      education_match: number;
      keywords_density: number;
    };
  };
  created_at: string;
}

export interface InterviewQuestion {
  id: number;
  type: string;
  question: string;
  hints: string;
  time_limit: number;
}

export interface InterviewAnswer {
  question_id: number;
  answer: string;
}

export interface QuestionFeedback {
  question_id: number;
  score: number;
  rating: string;
  what_went_well: string;
  what_to_improve: string;
  ideal_answer: string;
}

export interface Interview {
  id: string; // UUID
  resume_id: number;
  resume?: {
    id: number;
    original_filename: string;
  } | null;
  job_title: string;
  company_name: string | null;
  job_description: string | null;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[] | null;
  score: number | null;
  feedback: {
    overall_score: number;
    overall_feedback: string;
    hire_recommendation: string;
    question_feedback: QuestionFeedback[];
    top_strengths: string[];
    key_improvements: string[];
  } | null;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: number;
  user_id: number;
  resume_id: number | null;
  resume?: {
    id: number;
    original_filename: string;
  } | null;
  job_title: string;
  company_name: string | null;
  job_description: string | null;
  status: 'applied' | 'ats_scanned' | 'interviewing' | 'offered' | 'rejected';
  score: number | null;
  created_at: string;
  updated_at: string;
}

