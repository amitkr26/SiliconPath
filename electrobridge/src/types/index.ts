export interface Opportunity {
  id?: string;
  title: string;
  organization: string;
  category: "JRF" | "SRF" | "PhD" | "Govt Job" | "Private Job" | "Fellowship";
  location: string | null;
  stipend: string | null;
  deadline: string | null;
  eligibility: string | null;
  description: string | null;
  apply_link: string | null;
  source_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  posted_at?: string;
  apply_clicks?: number;
  tags: string[];
  slug?: string;
  org_slug?: string;
  verification_status?: "verified" | "unverified" | "link_unavailable" | "expired";
  verified_at?: string;
  official_page_url?: string;
  apply_link_type?: "direct" | "homepage" | "pdf" | "email" | "portal";
  last_link_checked?: string;
  link_check_status?: number;
  admin_notes?: string;
  company_page_id?: string;
}

export interface NewsArticle {
  id?: string;
  title: string;
  summary: string | null;
  source: string | null;
  source_url: string | null;
  published_at: string | null;
  image_url: string | null;
  tags: string[];
  created_at?: string;
}

export interface Subscriber {
  id?: string;
  email: string;
  keywords: string[];
  categories: string[];
  created_at?: string;
  is_active: boolean;
}

export interface SavedOpportunity {
  id?: string;
  user_id: string;
  opportunity_id: string;
  created_at?: string;
}

export interface LinkCheckLog {
  id?: string;
  opportunity_id: string;
  checked_at: string;
  http_status: number;
  is_reachable: boolean;
  error_message: string;
}

export interface OpportunityReport {
  id?: string;
  opportunity_id: string;
  report_type: "broken_link" | "wrong_info" | "expired" | "other";
  description: string;
  reported_at: string;
  is_resolved: boolean;
}

export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  headline: string;
  about: string;
  avatar_url: string;
  banner_url: string;
  current_position: string;
  current_org: string;
  qualification: string;
  specialization: string;
  has_net: boolean;
  has_gate: boolean;
  city: string;
  country: string;
  preferred_location: string;
  website_url: string;
  skills: string[];
  is_open_to_work: boolean;
  open_to_work_types: string[];
  profile_views: number;
  follower_count: number;
  following_count: number;
  connection_count: number;
  is_profile_public: boolean;
  resume_ats_score: number;
  created_at: string;
  updated_at: string;
}

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  post_type: 'post' | 'article' | 'opportunity_share' | 'achievement' | 'question';
  media_urls: string[];
  opportunity_id: string | null;
  article_title: string | null;
  tags: string[];
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  views_count: number;
  visibility: 'public' | 'connections' | 'followers';
  is_pinned: boolean;
  created_at: string;
  user_profile?: Pick<UserProfile, 'full_name' | 'username' | 'avatar_url' | 'headline'>;
  user_reaction?: string | null;
  has_reposted?: boolean;
  opportunity?: Opportunity | null;
}

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  message: string | null;
  created_at: string;
}

export interface SkillEndorsement {
  id: string;
  profile_owner_id: string;
  endorser_id: string;
  skill: string;
  created_at: string;
  endorser?: Pick<UserProfile, 'full_name' | 'avatar_url'>;
}

export interface Recommendation {
  id: string;
  author_id: string;
  recipient_id: string;
  relationship: string;
  content: string;
  is_visible: boolean;
  created_at: string;
  author?: Pick<UserProfile, 'full_name' | 'avatar_url' | 'headline'>;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  actor_id: string;
  entity_type: string | null;
  entity_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: Pick<UserProfile, 'full_name' | 'avatar_url' | 'username'>;
}

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count_1: number;
  unread_count_2: number;
  created_at: string;
  other_user?: Pick<UserProfile, 'full_name' | 'avatar_url' | 'headline' | 'username'>;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface CompanyPage {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logo_url: string;
  banner_url: string;
  website: string;
  industry: string;
  company_type: string;
  headquarters: string;
  founded_year: number;
  employee_count_range: string;
  specialties: string[];
  follower_count: number;
  is_verified: boolean;
  is_claimed: boolean;
  created_at: string;
}
