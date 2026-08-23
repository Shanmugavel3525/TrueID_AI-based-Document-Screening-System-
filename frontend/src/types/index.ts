export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'OFFICER';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  badge_number: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DocumentData {
  id: string;
  document_type: string;
  original_filename: string;
  file_path: string;
  file_mime_type: string;
  file_size_bytes: number;
  sha256_hash: string;
  uploaded_at: string;
}

export interface ExtractedFields {
  document_number?: string;
  full_name?: string;
  surname?: string;
  given_names?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_country?: string;
  raw_fields_json?: Record<string, any>;
  extraction_confidence: number;
}

export interface MRZResult {
  mrz_detected: boolean;
  mrz_type?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  valid_doc_number_checksum: boolean;
  valid_dob_checksum: boolean;
  valid_expiry_checksum: boolean;
  valid_composite_checksum: boolean;
  all_checksums_valid: boolean;
  matches_viz_fields: boolean;
  checksum_details_json?: Record<string, any>;
}

export interface RuleEvaluation {
  rule: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
}

export interface ValidationResult {
  is_expired: boolean;
  is_future_issue_date: boolean;
  is_valid_age: boolean;
  is_valid_doc_number_format: boolean;
  passed_all_rules: boolean;
  rule_evaluations_json?: RuleEvaluation[];
}

export interface SuspiciousRegion {
  region_name: string;
  confidence: number;
  description: string;
  bbox?: [number, number, number, number];
}

export interface TamperingResult {
  ela_anomaly_score: number;
  ela_heatmap_path?: string;
  photo_splicing_score: number;
  noise_variance_score: number;
  metadata_manipulation_flag: boolean;
  has_tampering_evidence: boolean;
  suspicious_regions_json?: SuspiciousRegion[];
}

export interface FaceVerificationResult {
  doc_face_detected: boolean;
  doc_face_crop_path?: string;
  live_face_detected: boolean;
  live_face_path?: string;
  similarity_score: number;
  match_status: 'MATCH' | 'MISMATCH' | 'INCONCLUSIVE' | 'LOW_QUALITY' | 'NO_LIVE_CAPTURE';
  confidence: number;
}

export interface RegistryCheck {
  check_status: 'CLEAR' | 'HIT_STOLEN' | 'HIT_WANTED' | 'HIT_REVOKED';
  matched_registry?: string;
  matched_record_id?: string;
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  match_details_json?: Record<string, any>;
}

export interface RiskFactor {
  code: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  points: number;
  category: string;
}

export interface RiskAssessment {
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'MANUAL_REVIEW';
  requires_manual_review: boolean;
  contributing_factors_json?: RiskFactor[];
  evaluated_at: string;
}

export interface ScreeningDetail {
  id: string;
  document_id: string;
  officer_id?: string;
  status: 'IN_PROGRESS' | 'CLEARED' | 'REFER_SECONDARY' | 'REJECTED' | 'DETAINED';
  officer_notes?: string;
  started_at: string;
  completed_at?: string;
  document: DocumentData;
  extracted_fields?: ExtractedFields;
  mrz_result?: MRZResult;
  validation_result?: ValidationResult;
  tampering_result?: TamperingResult;
  face_result?: FaceVerificationResult;
  registry_check?: RegistryCheck;
  risk_assessment?: RiskAssessment;
  officer_badge?: string;
  officer_name?: string;
}

export interface ScreeningSummary {
  id: string;
  document_id: string;
  document_type: string;
  traveler_name?: string;
  document_number?: string;
  nationality?: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'MANUAL_REVIEW';
  status: 'IN_PROGRESS' | 'CLEARED' | 'REFER_SECONDARY' | 'REJECTED' | 'DETAINED';
  officer_name?: string;
  officer_badge?: string;
  started_at: string;
  completed_at?: string;
}

export interface DashboardStats {
  total_screenings: number;
  today_screenings: number;
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  pending_reviews_count: number;
  recent_alerts: {
    screening_id: string;
    traveler_name: string;
    document_number: string;
    risk_score: number;
    risk_level: string;
    timestamp: string;
  }[];
}

export interface RegistryRecord {
  id: string;
  registry_type: string;
  document_number?: string;
  full_name?: string;
  date_of_birth?: string;
  nationality?: string;
  reason: string;
  severity: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  username?: string;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  details_json?: Record<string, any>;
  ip_address: string;
  timestamp: string;
}

export interface RiskWeights {
  mrz_mismatch_weight: number;
  photo_splicing_weight: number;
  ela_anomaly_weight: number;
  face_mismatch_weight: number;
  expired_doc_weight: number;
  stolen_doc_weight: number;
  watchlist_hit_weight: number;
  future_date_weight: number;
  viz_mrz_mismatch_weight: number;
  inconclusive_quality_weight: number;
}
