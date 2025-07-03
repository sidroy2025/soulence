export interface CanvasOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  apiUrl: string;
}

export interface CanvasTokenResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  refresh_token?: string;
  expires_in?: number;
}

export interface CanvasUser {
  id: number;
  name: string;
  short_name: string;
  sortable_name: string;
  email: string;
  avatar_url: string;
  locale: string;
  effective_locale: string;
  time_zone: string;
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  workflow_state: string;
  enrollment_term_id: number;
  start_at: string;
  end_at: string;
  enrollments?: CanvasEnrollment[];
  teachers?: CanvasUser[];
}

export interface CanvasEnrollment {
  type: string;
  role: string;
  role_id: number;
  user_id: number;
  enrollment_state: string;
  grades?: {
    current_score: number;
    current_grade: string;
    final_score: number;
    final_grade: string;
  };
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  due_at: string;
  lock_at: string;
  unlock_at: string;
  has_submitted_submissions: boolean;
  course_id: number;
  points_possible: number;
  grading_type: string;
  submission_types: string[];
  workflow_state: string;
  html_url: string;
  submissions_download_url: string;
  position: number;
  submission?: CanvasSubmission;
}

export interface CanvasSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  submitted_at: string;
  score: number;
  grade: string;
  workflow_state: string;
  late: boolean;
  missing: boolean;
  excused: boolean;
}

export interface CanvasSyncStatus {
  userId: string;
  lastSyncedAt: Date;
  isConnected: boolean;
  totalCourses: number;
  totalAssignments: number;
  syncErrors?: string[];
}

export interface CanvasWebhookEvent {
  id: string;
  body: {
    assignment_id?: number;
    course_id?: number;
    submission_id?: number;
    user_id?: number;
    workflow_state?: string;
    updated_at?: string;
  };
  metadata: {
    event_name: string;
    event_time: string;
    root_account_id: string;
    root_account_uuid: string;
    user_id: string;
  };
}