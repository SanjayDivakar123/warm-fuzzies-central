export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      access_codes: {
        Row: {
          can_see_results: boolean
          code: string
          created_at: string
          created_by_admin: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          is_used: boolean | null
          max_uses: number | null
          updated_at: string
        }
        Insert: {
          can_see_results?: boolean
          code: string
          created_at?: string
          created_by_admin?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_used?: boolean | null
          max_uses?: number | null
          updated_at?: string
        }
        Update: {
          can_see_results?: boolean
          code?: string
          created_at?: string
          created_by_admin?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_used?: boolean | null
          max_uses?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_codes_created_by_admin_fkey"
            columns: ["created_by_admin"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      assessment_progress: {
        Row: {
          assessment_type: string
          attempt_number: number | null
          created_at: string | null
          dominant_color: string | null
          id: string
          results: Json | null
          scores: Json | null
          user_id: string
        }
        Insert: {
          assessment_type: string
          attempt_number?: number | null
          created_at?: string | null
          dominant_color?: string | null
          id?: string
          results?: Json | null
          scores?: Json | null
          user_id: string
        }
        Update: {
          assessment_type?: string
          attempt_number?: number | null
          created_at?: string | null
          dominant_color?: string | null
          id?: string
          results?: Json | null
          scores?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      assessment_results: {
        Row: {
          assessment_type: string
          created_at: string
          id: string
          results: Json
          shareable_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_type: string
          created_at?: string
          id?: string
          results: Json
          shareable_code?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_type?: string
          created_at?: string
          id?: string
          results?: Json
          shareable_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          company_id: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_credits: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          type: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          type: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_credits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_transactions: {
        Row: {
          amount: number
          company_id: string
          company_user_id: string | null
          created_at: string
          description: string | null
          id: string
          stripe_payment_intent_id: string | null
          type: string
        }
        Insert: {
          amount: number
          company_id: string
          company_user_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          company_id?: string
          company_user_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_transactions_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          author_name: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          featured_image_alt: string | null
          id: string
          meta_description: string | null
          meta_keywords: string[] | null
          published_at: string | null
          read_time: number | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          featured_image_alt?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          published_at?: string | null
          read_time?: number | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          featured_image_alt?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          published_at?: string | null
          read_time?: number | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          calendar_integration_id: string | null
          company_id: string
          created_at: string
          description: string | null
          end_time: string
          external_event_id: string | null
          id: string
          interview_id: string | null
          last_synced_at: string | null
          location: string | null
          meeting_link: string | null
          start_time: string
          sync_error: string | null
          title: string
          updated_at: string
        }
        Insert: {
          calendar_integration_id?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          end_time: string
          external_event_id?: string | null
          id?: string
          interview_id?: string | null
          last_synced_at?: string | null
          location?: string | null
          meeting_link?: string | null
          start_time: string
          sync_error?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          calendar_integration_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          end_time?: string
          external_event_id?: string | null
          id?: string
          interview_id?: string | null
          last_synced_at?: string | null
          location?: string | null
          meeting_link?: string | null
          start_time?: string
          sync_error?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_calendar_integration_id_fkey"
            columns: ["calendar_integration_id"]
            isOneToOne: false
            referencedRelation: "calendar_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          company_id: string
          created_at: string
          id: string
          is_connected: boolean | null
          last_synced_at: string | null
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          provider: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_activities: {
        Row: {
          activity_type: string
          application_id: string | null
          candidate_id: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          job_posting_id: string | null
          metadata: Json | null
          performed_by: string | null
          performed_by_name: string | null
          title: string
        }
        Insert: {
          activity_type: string
          application_id?: string | null
          candidate_id: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          job_posting_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
          title: string
        }
        Update: {
          activity_type?: string
          application_id?: string | null
          candidate_id?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          job_posting_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_activities_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_activities_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_activities_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_application_links: {
        Row: {
          applications_count: number | null
          assessment_category: string | null
          assessment_type: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          ideal_role_color: string | null
          is_active: boolean | null
          link_code: string | null
          max_applications: number | null
          position_title: string
          required_skills: string[] | null
        }
        Insert: {
          applications_count?: number | null
          assessment_category?: string | null
          assessment_type?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ideal_role_color?: string | null
          is_active?: boolean | null
          link_code?: string | null
          max_applications?: number | null
          position_title: string
          required_skills?: string[] | null
        }
        Update: {
          applications_count?: number | null
          assessment_category?: string | null
          assessment_type?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ideal_role_color?: string | null
          is_active?: boolean | null
          link_code?: string | null
          max_applications?: number | null
          position_title?: string
          required_skills?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_application_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_applications: {
        Row: {
          application_link_id: string | null
          applied_at: string | null
          candidate_id: string
          created_at: string | null
          current_stage_id: string | null
          hired_at: string | null
          id: string
          internal_notes: string | null
          job_posting_id: string
          referrer_id: string | null
          rejected_at: string | null
          rejection_reason: string | null
          source: string | null
          stage_entered_at: string | null
          updated_at: string | null
          withdrawn_at: string | null
        }
        Insert: {
          application_link_id?: string | null
          applied_at?: string | null
          candidate_id: string
          created_at?: string | null
          current_stage_id?: string | null
          hired_at?: string | null
          id?: string
          internal_notes?: string | null
          job_posting_id: string
          referrer_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          source?: string | null
          stage_entered_at?: string | null
          updated_at?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          application_link_id?: string | null
          applied_at?: string | null
          candidate_id?: string
          created_at?: string | null
          current_stage_id?: string | null
          hired_at?: string | null
          id?: string
          internal_notes?: string | null
          job_posting_id?: string
          referrer_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          source?: string | null
          stage_entered_at?: string | null
          updated_at?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_applications_application_link_id_fkey"
            columns: ["application_link_id"]
            isOneToOne: false
            referencedRelation: "candidate_application_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "hiring_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_applications_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_documents: {
        Row: {
          application_id: string | null
          candidate_id: string
          company_id: string
          document_type: string
          extracted_experience: Json | null
          extracted_skills: Json | null
          extracted_text: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          application_id?: string | null
          candidate_id: string
          company_id: string
          document_type: string
          extracted_experience?: Json | null
          extracted_skills?: Json | null
          extracted_text?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          application_id?: string | null
          candidate_id?: string
          company_id?: string
          document_type?: string
          extracted_experience?: Json | null
          extracted_skills?: Json | null
          extracted_text?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_notes: {
        Row: {
          application_id: string | null
          candidate_id: string
          company_id: string
          content: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          id: string
          is_pinned: boolean | null
          is_private: boolean | null
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          candidate_id: string
          company_id: string
          content: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          is_pinned?: boolean | null
          is_private?: boolean | null
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          candidate_id?: string
          company_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          is_pinned?: boolean | null
          is_private?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_ratings: {
        Row: {
          application_id: string | null
          candidate_id: string
          comments: string | null
          communication: number | null
          company_id: string
          created_at: string
          culture_fit: number | null
          custom_ratings: Json | null
          experience: number | null
          id: string
          interview_id: string | null
          overall_rating: number | null
          rated_by: string | null
          rated_by_name: string | null
          recommendation: string | null
          strengths: string | null
          technical_skills: number | null
          updated_at: string
          weaknesses: string | null
        }
        Insert: {
          application_id?: string | null
          candidate_id: string
          comments?: string | null
          communication?: number | null
          company_id: string
          created_at?: string
          culture_fit?: number | null
          custom_ratings?: Json | null
          experience?: number | null
          id?: string
          interview_id?: string | null
          overall_rating?: number | null
          rated_by?: string | null
          rated_by_name?: string | null
          recommendation?: string | null
          strengths?: string | null
          technical_skills?: number | null
          updated_at?: string
          weaknesses?: string | null
        }
        Update: {
          application_id?: string | null
          candidate_id?: string
          comments?: string | null
          communication?: number | null
          company_id?: string
          created_at?: string
          culture_fit?: number | null
          custom_ratings?: Json | null
          experience?: number | null
          id?: string
          interview_id?: string | null
          overall_rating?: number | null
          rated_by?: string | null
          rated_by_name?: string | null
          recommendation?: string | null
          strengths?: string | null
          technical_skills?: number | null
          updated_at?: string
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_ratings_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_ratings_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_ratings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_ratings_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_tag_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          candidate_id: string
          id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          candidate_id: string
          id?: string
          tag_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          candidate_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_tag_assignments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "candidate_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_tags: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_tags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          archived_at: string | null
          archived_reason: string | null
          assessment_category: string | null
          assessment_completed_at: string | null
          assessment_result_id: string | null
          assessment_type: string | null
          company_id: string
          converted_to_employee_id: string | null
          created_at: string | null
          created_by: string | null
          email: string
          fit_analysis: Json | null
          fit_analyzed_at: string | null
          fit_score: number | null
          full_name: string | null
          id: string
          ideal_role_color: string | null
          invite_code: string | null
          job_posting_id: string | null
          notes: string | null
          phone: string | null
          position_title: string | null
          public_token: string | null
          required_skills: string[] | null
          resume_parsed_content: string | null
          resume_url: string | null
          source: string | null
          status: Database["public"]["Enums"]["candidate_status"]
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_reason?: string | null
          assessment_category?: string | null
          assessment_completed_at?: string | null
          assessment_result_id?: string | null
          assessment_type?: string | null
          company_id: string
          converted_to_employee_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          fit_analysis?: Json | null
          fit_analyzed_at?: string | null
          fit_score?: number | null
          full_name?: string | null
          id?: string
          ideal_role_color?: string | null
          invite_code?: string | null
          job_posting_id?: string | null
          notes?: string | null
          phone?: string | null
          position_title?: string | null
          public_token?: string | null
          required_skills?: string[] | null
          resume_parsed_content?: string | null
          resume_url?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_reason?: string | null
          assessment_category?: string | null
          assessment_completed_at?: string | null
          assessment_result_id?: string | null
          assessment_type?: string | null
          company_id?: string
          converted_to_employee_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          fit_analysis?: Json | null
          fit_analyzed_at?: string | null
          fit_score?: number | null
          full_name?: string | null
          id?: string
          ideal_role_color?: string | null
          invite_code?: string | null
          job_posting_id?: string | null
          notes?: string | null
          phone?: string | null
          position_title?: string | null
          public_token?: string | null
          required_skills?: string[] | null
          resume_parsed_content?: string | null
          resume_url?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_assessment_result_id_fkey"
            columns: ["assessment_result_id"]
            isOneToOne: false
            referencedRelation: "assessment_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_converted_to_employee_id_fkey"
            columns: ["converted_to_employee_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      career_page_settings: {
        Row: {
          about_company: string | null
          benefits_list: Json | null
          company_id: string
          contact_email: string | null
          created_at: string
          glassdoor_url: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          is_enabled: boolean | null
          linkedin_url: string | null
          meta_description: string | null
          meta_title: string | null
          slug: string | null
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          about_company?: string | null
          benefits_list?: Json | null
          company_id: string
          contact_email?: string | null
          created_at?: string
          glassdoor_url?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_enabled?: boolean | null
          linkedin_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          slug?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          about_company?: string | null
          benefits_list?: Json | null
          company_id?: string
          contact_email?: string | null
          created_at?: string
          glassdoor_url?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_enabled?: boolean | null
          linkedin_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          slug?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_page_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          admin_email: string
          allow_pay_per_insight: boolean | null
          assessment_category: Database["public"]["Enums"]["company_assessment_category"]
          assessment_type: Database["public"]["Enums"]["company_assessment_type"]
          created_at: string | null
          credit_balance: number
          custom_domain: string | null
          custom_domain_enabled: boolean | null
          email_show_logo: boolean | null
          email_template_body: string | null
          email_template_cta_text: string | null
          email_template_greeting: string | null
          email_template_subject: string | null
          google_sso_enabled: boolean | null
          google_workspace_domain: string | null
          hiring_subscription_cancel_at_period_end: boolean | null
          hiring_subscription_current_period_end: string | null
          hiring_subscription_enabled: boolean | null
          hiring_subscription_id: string | null
          hiring_subscription_status: string | null
          id: string
          insight_credits: number | null
          insight_usage_count: number | null
          insight_usage_month: string | null
          insights_paid_enabled: boolean | null
          logo_url: string | null
          logo_url_dark: string | null
          ms_teams_notifications_enabled: boolean | null
          ms_teams_webhook_url: string | null
          name: string
          primary_color: string | null
          seats_purchased: number
          secondary_color: string | null
          slack_bot_token: string | null
          slack_channel_id: string | null
          slack_notifications_enabled: boolean | null
          stripe_customer_id: string | null
          subdomain: string
          subdomain_enabled: boolean | null
          subdomain_status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_email: string
          allow_pay_per_insight?: boolean | null
          assessment_category?: Database["public"]["Enums"]["company_assessment_category"]
          assessment_type?: Database["public"]["Enums"]["company_assessment_type"]
          created_at?: string | null
          credit_balance?: number
          custom_domain?: string | null
          custom_domain_enabled?: boolean | null
          email_show_logo?: boolean | null
          email_template_body?: string | null
          email_template_cta_text?: string | null
          email_template_greeting?: string | null
          email_template_subject?: string | null
          google_sso_enabled?: boolean | null
          google_workspace_domain?: string | null
          hiring_subscription_cancel_at_period_end?: boolean | null
          hiring_subscription_current_period_end?: string | null
          hiring_subscription_enabled?: boolean | null
          hiring_subscription_id?: string | null
          hiring_subscription_status?: string | null
          id?: string
          insight_credits?: number | null
          insight_usage_count?: number | null
          insight_usage_month?: string | null
          insights_paid_enabled?: boolean | null
          logo_url?: string | null
          logo_url_dark?: string | null
          ms_teams_notifications_enabled?: boolean | null
          ms_teams_webhook_url?: string | null
          name: string
          primary_color?: string | null
          seats_purchased?: number
          secondary_color?: string | null
          slack_bot_token?: string | null
          slack_channel_id?: string | null
          slack_notifications_enabled?: boolean | null
          stripe_customer_id?: string | null
          subdomain: string
          subdomain_enabled?: boolean | null
          subdomain_status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_email?: string
          allow_pay_per_insight?: boolean | null
          assessment_category?: Database["public"]["Enums"]["company_assessment_category"]
          assessment_type?: Database["public"]["Enums"]["company_assessment_type"]
          created_at?: string | null
          credit_balance?: number
          custom_domain?: string | null
          custom_domain_enabled?: boolean | null
          email_show_logo?: boolean | null
          email_template_body?: string | null
          email_template_cta_text?: string | null
          email_template_greeting?: string | null
          email_template_subject?: string | null
          google_sso_enabled?: boolean | null
          google_workspace_domain?: string | null
          hiring_subscription_cancel_at_period_end?: boolean | null
          hiring_subscription_current_period_end?: string | null
          hiring_subscription_enabled?: boolean | null
          hiring_subscription_id?: string | null
          hiring_subscription_status?: string | null
          id?: string
          insight_credits?: number | null
          insight_usage_count?: number | null
          insight_usage_month?: string | null
          insights_paid_enabled?: boolean | null
          logo_url?: string | null
          logo_url_dark?: string | null
          ms_teams_notifications_enabled?: boolean | null
          ms_teams_webhook_url?: string | null
          name?: string
          primary_color?: string | null
          seats_purchased?: number
          secondary_color?: string | null
          slack_bot_token?: string | null
          slack_channel_id?: string | null
          slack_notifications_enabled?: boolean | null
          stripe_customer_id?: string | null
          subdomain?: string
          subdomain_enabled?: boolean | null
          subdomain_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_api_keys: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_api_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_roles: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          skills: string[] | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          skills?: string[] | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          skills?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          assessment_category: string | null
          assessment_completed_at: string | null
          assessment_history: Json | null
          assessment_result_id: string | null
          assessment_type: string | null
          charge_amount: number | null
          charged_at: string | null
          company_id: string
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          invite_code: string | null
          invite_count: number
          invited_at: string | null
          job_description: string | null
          job_role: string | null
          joined_at: string | null
          keyboard_shortcuts_enabled: boolean | null
          last_reassessed_at: string | null
          notify_task_completion: boolean | null
          role: Database["public"]["Enums"]["company_user_role"]
          skills: string[] | null
          status: Database["public"]["Enums"]["company_user_status"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assessment_category?: string | null
          assessment_completed_at?: string | null
          assessment_history?: Json | null
          assessment_result_id?: string | null
          assessment_type?: string | null
          charge_amount?: number | null
          charged_at?: string | null
          company_id: string
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          invite_code?: string | null
          invite_count?: number
          invited_at?: string | null
          job_description?: string | null
          job_role?: string | null
          joined_at?: string | null
          keyboard_shortcuts_enabled?: boolean | null
          last_reassessed_at?: string | null
          notify_task_completion?: boolean | null
          role?: Database["public"]["Enums"]["company_user_role"]
          skills?: string[] | null
          status?: Database["public"]["Enums"]["company_user_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_category?: string | null
          assessment_completed_at?: string | null
          assessment_history?: Json | null
          assessment_result_id?: string | null
          assessment_type?: string | null
          charge_amount?: number | null
          charged_at?: string | null
          company_id?: string
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          invite_code?: string | null
          invite_count?: number
          invited_at?: string | null
          job_description?: string | null
          job_role?: string | null
          joined_at?: string | null
          keyboard_shortcuts_enabled?: boolean | null
          last_reassessed_at?: string | null
          notify_task_completion?: boolean | null
          role?: Database["public"]["Enums"]["company_user_role"]
          skills?: string[] | null
          status?: Database["public"]["Enums"]["company_user_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_users_assessment_result_id_fkey"
            columns: ["assessment_result_id"]
            isOneToOne: false
            referencedRelation: "assessment_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_recipients: {
        Row: {
          application_id: string | null
          campaign_id: string
          candidate_id: string
          clicked_at: string | null
          created_at: string
          email: string
          error_message: string | null
          id: string
          name: string | null
          opened_at: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          application_id?: string | null
          campaign_id: string
          candidate_id: string
          clicked_at?: string | null
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          name?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          application_id?: string | null
          campaign_id?: string
          candidate_id?: string
          clicked_at?: string | null
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          name?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_recipients_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_recipients_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          body_html: string
          body_text: string | null
          bounced_count: number | null
          clicked_count: number | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          opened_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          subject: string
          target_criteria: Json | null
          target_job_id: string | null
          target_stage_id: string | null
          template_id: string | null
          total_recipients: number | null
          updated_at: string
        }
        Insert: {
          body_html: string
          body_text?: string | null
          bounced_count?: number | null
          clicked_count?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          opened_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject: string
          target_criteria?: Json | null
          target_job_id?: string | null
          target_stage_id?: string | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string
        }
        Update: {
          body_html?: string
          body_text?: string | null
          bounced_count?: number | null
          clicked_count?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          opened_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject?: string
          target_criteria?: Json | null
          target_job_id?: string | null
          target_stage_id?: string | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_target_job_id_fkey"
            columns: ["target_job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_target_stage_id_fkey"
            columns: ["target_stage_id"]
            isOneToOne: false
            referencedRelation: "hiring_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          source: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          source?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          available_variables: string[] | null
          body_html: string
          body_text: string | null
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          subject: string
          template_type: Database["public"]["Enums"]["email_template_type"]
          updated_at: string | null
        }
        Insert: {
          available_variables?: string[] | null
          body_html: string
          body_text?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          subject: string
          template_type: Database["public"]["Enums"]["email_template_type"]
          updated_at?: string | null
        }
        Update: {
          available_variables?: string[] | null
          body_html?: string
          body_text?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          subject?: string
          template_type?: Database["public"]["Enums"]["email_template_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      family_plan_members: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          joined_at: string | null
          member_email: string
          member_user_id: string | null
          owner_user_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          member_email: string
          member_user_id?: string | null
          owner_user_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          member_email?: string
          member_user_id?: string | null
          owner_user_id?: string
          status?: string | null
        }
        Relationships: []
      }
      free_assessments: {
        Row: {
          assessment_type: string
          granted_at: string
          granted_by: string
          id: string
          used: boolean | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          assessment_type: string
          granted_at?: string
          granted_by: string
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          assessment_type?: string
          granted_at?: string
          granted_by?: string
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hiring_pipeline_stages: {
        Row: {
          auto_send_email_template_id: string | null
          color_code: string | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_final_stage: boolean | null
          is_rejection_stage: boolean | null
          job_posting_id: string
          name: string
          stage_order: number
          stage_type: Database["public"]["Enums"]["hiring_stage_type"]
          updated_at: string | null
        }
        Insert: {
          auto_send_email_template_id?: string | null
          color_code?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_final_stage?: boolean | null
          is_rejection_stage?: boolean | null
          job_posting_id: string
          name: string
          stage_order?: number
          stage_type?: Database["public"]["Enums"]["hiring_stage_type"]
          updated_at?: string | null
        }
        Update: {
          auto_send_email_template_id?: string | null
          color_code?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_final_stage?: boolean | null
          is_rejection_stage?: boolean | null
          job_posting_id?: string
          name?: string
          stage_order?: number
          stage_type?: Database["public"]["Enums"]["hiring_stage_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hiring_pipeline_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hiring_pipeline_stages_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_team_members: {
        Row: {
          added_at: string | null
          added_by: string | null
          id: string
          job_posting_id: string
          team_role: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          id?: string
          job_posting_id: string
          team_role?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          id?: string
          job_posting_id?: string
          team_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hiring_team_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hiring_team_members_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hiring_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          feedback: Json | null
          id: string
          instructions_for_candidate: string | null
          interview_type: Database["public"]["Enums"]["interview_type"]
          interviewer_ids: string[] | null
          location: string | null
          meeting_link: string | null
          organizer_id: string | null
          overall_score: number | null
          recommendation: string | null
          reminder_sent_at: string | null
          scheduled_at: string
          stage_id: string | null
          status: Database["public"]["Enums"]["interview_status"]
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          feedback?: Json | null
          id?: string
          instructions_for_candidate?: string | null
          interview_type?: Database["public"]["Enums"]["interview_type"]
          interviewer_ids?: string[] | null
          location?: string | null
          meeting_link?: string | null
          organizer_id?: string | null
          overall_score?: number | null
          recommendation?: string | null
          reminder_sent_at?: string | null
          scheduled_at: string
          stage_id?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          feedback?: Json | null
          id?: string
          instructions_for_candidate?: string | null
          interview_type?: Database["public"]["Enums"]["interview_type"]
          interviewer_ids?: string[] | null
          location?: string | null
          meeting_link?: string | null
          organizer_id?: string | null
          overall_score?: number | null
          recommendation?: string | null
          reminder_sent_at?: string | null
          scheduled_at?: string
          stage_id?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "hiring_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          applications_count: number | null
          closes_at: string | null
          company_id: string
          company_role_id: string | null
          created_at: string | null
          department: string | null
          description: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          hiring_manager_id: string | null
          id: string
          ideal_role_color_primary: string | null
          ideal_role_color_secondary: string | null
          location: string | null
          preferred_skills: string[] | null
          published_at: string | null
          recruiter_id: string | null
          remote_policy: Database["public"]["Enums"]["remote_policy"] | null
          required_experience_years: number | null
          required_skills: string[] | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          status: Database["public"]["Enums"]["job_posting_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          applications_count?: number | null
          closes_at?: string | null
          company_id: string
          company_role_id?: string | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          hiring_manager_id?: string | null
          id?: string
          ideal_role_color_primary?: string | null
          ideal_role_color_secondary?: string | null
          location?: string | null
          preferred_skills?: string[] | null
          published_at?: string | null
          recruiter_id?: string | null
          remote_policy?: Database["public"]["Enums"]["remote_policy"] | null
          required_experience_years?: number | null
          required_skills?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["job_posting_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          applications_count?: number | null
          closes_at?: string | null
          company_id?: string
          company_role_id?: string | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          hiring_manager_id?: string | null
          id?: string
          ideal_role_color_primary?: string | null
          ideal_role_color_secondary?: string | null
          location?: string | null
          preferred_skills?: string[] | null
          published_at?: string | null
          recruiter_id?: string | null
          remote_policy?: Database["public"]["Enums"]["remote_policy"] | null
          required_experience_years?: number | null
          required_skills?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["job_posting_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_company_role_id_fkey"
            columns: ["company_role_id"]
            isOneToOne: false
            referencedRelation: "company_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
        ]
      }
      job_templates: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          ideal_primary_color: string
          ideal_secondary_color: string | null
          is_global: boolean | null
          name: string
          required_skills: string[] | null
          suggested_interview_questions: Json | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ideal_primary_color: string
          ideal_secondary_color?: string | null
          is_global?: boolean | null
          name: string
          required_skills?: string[] | null
          suggested_interview_questions?: Json | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          ideal_primary_color?: string
          ideal_secondary_color?: string | null
          is_global?: boolean | null
          name?: string
          required_skills?: string[] | null
          suggested_interview_questions?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          application_id: string
          bonus: number | null
          candidate_notes: string | null
          created_at: string | null
          created_by: string | null
          decline_reason: string | null
          document_url: string | null
          equity: string | null
          expires_at: string | null
          id: string
          internal_notes: string | null
          job_title: string | null
          responded_at: string | null
          salary: number
          salary_currency: string | null
          sent_at: string | null
          signed_at: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          application_id: string
          bonus?: number | null
          candidate_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          decline_reason?: string | null
          document_url?: string | null
          equity?: string | null
          expires_at?: string | null
          id?: string
          internal_notes?: string | null
          job_title?: string | null
          responded_at?: string | null
          salary: number
          salary_currency?: string | null
          sent_at?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          application_id?: string
          bonus?: number | null
          candidate_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          decline_reason?: string | null
          document_url?: string | null
          equity?: string | null
          expires_at?: string | null
          id?: string
          internal_notes?: string | null
          job_title?: string | null
          responded_at?: string | null
          salary?: number
          salary_currency?: string | null
          sent_at?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          email: string
          id: string
          status: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email: string
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email?: string
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rcaimobile_candidate_profiles: {
        Row: {
          growth_signals: Json
          headline: string | null
          id: string
          last_updated: string | null
          overall_confidence: string
          risks: Json
          role_color_primary: string
          role_color_scores: Json
          role_color_secondary: string | null
          strengths: Json
          user_id: string
        }
        Insert: {
          growth_signals?: Json
          headline?: string | null
          id?: string
          last_updated?: string | null
          overall_confidence?: string
          risks?: Json
          role_color_primary: string
          role_color_scores?: Json
          role_color_secondary?: string | null
          strengths?: Json
          user_id: string
        }
        Update: {
          growth_signals?: Json
          headline?: string | null
          id?: string
          last_updated?: string | null
          overall_confidence?: string
          risks?: Json
          role_color_primary?: string
          role_color_scores?: Json
          role_color_secondary?: string | null
          strengths?: Json
          user_id?: string
        }
        Relationships: []
      }
      rcaimobile_candidate_reviews: {
        Row: {
          candidate_id: string
          created_at: string | null
          id: string
          job_id: string
          notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          id?: string
          job_id: string
          notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rcaimobile_candidate_reviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "rcaimobile_candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rcaimobile_candidate_reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "rcaimobile_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      rcaimobile_jobs: {
        Row: {
          company: string
          created_by: string | null
          department: string | null
          description: string
          id: string
          ideal_role_color: string
          location: string
          posted_at: string | null
          status: string
          title: string
        }
        Insert: {
          company: string
          created_by?: string | null
          department?: string | null
          description: string
          id?: string
          ideal_role_color: string
          location: string
          posted_at?: string | null
          status?: string
          title: string
        }
        Update: {
          company?: string
          created_by?: string | null
          department?: string | null
          description?: string
          id?: string
          ideal_role_color?: string
          location?: string
          posted_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      rcaimobile_notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      rcaimobile_role_fit_insights: {
        Row: {
          alignments: Json
          candidate_id: string
          fit_score: string
          fit_summary: string
          frictions: Json
          generated_at: string | null
          id: string
          job_id: string
          recommendation: string | null
        }
        Insert: {
          alignments?: Json
          candidate_id: string
          fit_score: string
          fit_summary: string
          frictions?: Json
          generated_at?: string | null
          id?: string
          job_id: string
          recommendation?: string | null
        }
        Update: {
          alignments?: Json
          candidate_id?: string
          fit_score?: string
          fit_summary?: string
          frictions?: Json
          generated_at?: string | null
          id?: string
          job_id?: string
          recommendation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rcaimobile_role_fit_insights_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "rcaimobile_candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rcaimobile_role_fit_insights_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "rcaimobile_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      registrants_hg: {
        Row: {
          created_at: string | null
          email: string
          experience_level: string
          full_name: string
          id: string
          registered_at: string | null
          school_organization: string
        }
        Insert: {
          created_at?: string | null
          email: string
          experience_level: string
          full_name: string
          id?: string
          registered_at?: string | null
          school_organization: string
        }
        Update: {
          created_at?: string | null
          email?: string
          experience_level?: string
          full_name?: string
          id?: string
          registered_at?: string | null
          school_organization?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string | null
          email: string
          id: number
          idea: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          idea?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          idea?: string | null
          name?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          company_id: string
          created_at: string
          filters: Json
          id: string
          last_used_at: string | null
          name: string
          use_count: number | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          filters: Json
          id?: string
          last_used_at?: string | null
          name: string
          use_count?: number | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          filters?: Json
          id?: string
          last_used_at?: string | null
          name?: string
          use_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reminders: {
        Row: {
          company_id: string
          company_user_id: string
          created_at: string
          created_by: string | null
          delivery_status: string | null
          id: string
          next_occurrence_at: string | null
          recurrence: string
          scheduled_for: string
          sent_at: string | null
          status: string
        }
        Insert: {
          company_id: string
          company_user_id: string
          created_at?: string
          created_by?: string | null
          delivery_status?: string | null
          id?: string
          next_occurrence_at?: string | null
          recurrence?: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          company_id?: string
          company_user_id?: string
          created_at?: string
          created_by?: string | null
          delivery_status?: string | null
          id?: string
          next_occurrence_at?: string | null
          recurrence?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reminders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reminders_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          frequency: string
          id: string
          include_sections: Json | null
          is_active: boolean
          last_sent_at: string | null
          name: string
          next_send_at: string | null
          recipients: string[]
          report_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          frequency?: string
          id?: string
          include_sections?: Json | null
          is_active?: boolean
          last_sent_at?: string | null
          name: string
          next_send_at?: string | null
          recipients?: string[]
          report_type?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          frequency?: string
          id?: string
          include_sections?: Json | null
          is_active?: boolean
          last_sent_at?: string | null
          name?: string
          next_send_at?: string | null
          recipients?: string[]
          report_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      school_classes: {
        Row: {
          admin_id: string
          block: string
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          block: string
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          block?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      school_students: {
        Row: {
          class_id: string
          created_at: string
          grade: string
          id: string
          name: string
          role_color: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          grade: string
          id?: string
          name: string
          role_color?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          grade?: string
          id?: string
          name?: string
          role_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "school_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      school_team_members: {
        Row: {
          id: string
          student_id: string
          team_id: string
        }
        Insert: {
          id?: string
          student_id: string
          team_id: string
        }
        Update: {
          id?: string
          student_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_team_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "school_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "school_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      school_teams: {
        Row: {
          access_code: string
          class_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          access_code: string
          class_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          access_code?: string
          class_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_teams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "school_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_transitions: {
        Row: {
          application_id: string
          auto_transitioned: boolean | null
          from_stage_id: string | null
          id: string
          moved_at: string | null
          moved_by: string | null
          notes: string | null
          to_stage_id: string | null
        }
        Insert: {
          application_id: string
          auto_transitioned?: boolean | null
          from_stage_id?: string | null
          id?: string
          moved_at?: string | null
          moved_by?: string | null
          notes?: string | null
          to_stage_id?: string | null
        }
        Update: {
          application_id?: string
          auto_transitioned?: boolean | null
          from_stage_id?: string | null
          id?: string
          moved_at?: string | null
          moved_by?: string | null
          notes?: string | null
          to_stage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_transitions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_transitions_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "hiring_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_transitions_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_transitions_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "hiring_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          ai_score: number | null
          approved_at: string | null
          approved_by: string | null
          assigner_email: string | null
          company_id: string
          created_at: string
          employee_completed_at: string | null
          employee_notes: string | null
          employee_status: string | null
          id: string
          notification_sent_at: string | null
          notify_on_completion: boolean | null
          outcome_notes: string | null
          outcome_status: string | null
          primary_assignee_id: string | null
          reasoning: Json
          secondary_assignee_id: string | null
          task_id: string
          updated_at: string
        }
        Insert: {
          ai_score?: number | null
          approved_at?: string | null
          approved_by?: string | null
          assigner_email?: string | null
          company_id: string
          created_at?: string
          employee_completed_at?: string | null
          employee_notes?: string | null
          employee_status?: string | null
          id?: string
          notification_sent_at?: string | null
          notify_on_completion?: boolean | null
          outcome_notes?: string | null
          outcome_status?: string | null
          primary_assignee_id?: string | null
          reasoning?: Json
          secondary_assignee_id?: string | null
          task_id: string
          updated_at?: string
        }
        Update: {
          ai_score?: number | null
          approved_at?: string | null
          approved_by?: string | null
          assigner_email?: string | null
          company_id?: string
          created_at?: string
          employee_completed_at?: string | null
          employee_notes?: string | null
          employee_status?: string | null
          id?: string
          notification_sent_at?: string | null
          notify_on_completion?: boolean | null
          outcome_notes?: string | null
          outcome_status?: string | null
          primary_assignee_id?: string | null
          reasoning?: Json
          secondary_assignee_id?: string | null
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_primary_assignee_id_fkey"
            columns: ["primary_assignee_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_secondary_assignee_id_fkey"
            columns: ["secondary_assignee_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_compatibility_scores: {
        Row: {
          analysis: Json | null
          calculated_at: string
          company_id: string
          compatibility_score: number
          id: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          analysis?: Json | null
          calculated_at?: string
          company_id: string
          compatibility_score: number
          id?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          analysis?: Json | null
          calculated_at?: string
          company_id?: string
          compatibility_score?: number
          id?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_compatibility_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_compatibility_scores_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_compatibility_scores_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_insights: {
        Row: {
          company_id: string
          created_at: string
          id: string
          insights: Json
          team_hash: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          insights: Json
          team_hash: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          insights?: Json
          team_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_insights_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          advice_to_others: string
          created_at: string
          id: string
          liked_most: string
          name: string
          organization: string
          permission_level: string
          problem_description: string
          recommendation_score: number
          results_benefits: string
          role_title: string
          updated_at: string
          video_testimonial_interest: string
        }
        Insert: {
          advice_to_others: string
          created_at?: string
          id?: string
          liked_most: string
          name: string
          organization: string
          permission_level: string
          problem_description: string
          recommendation_score: number
          results_benefits: string
          role_title: string
          updated_at?: string
          video_testimonial_interest: string
        }
        Update: {
          advice_to_others?: string
          created_at?: string
          id?: string
          liked_most?: string
          name?: string
          organization?: string
          permission_level?: string
          problem_description?: string
          recommendation_score?: number
          results_benefits?: string
          role_title?: string
          updated_at?: string
          video_testimonial_interest?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          price_id: string | null
          product_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id?: string | null
          product_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id?: string | null
          product_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_assessments: {
        Row: {
          assessment_type: string
          created_at: string
          dominant_color: string | null
          id: string
          phone_number: string
          score_blue: number
          score_green: number
          score_red: number
          score_yellow: number
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          assessment_type?: string
          created_at?: string
          dominant_color?: string | null
          id?: string
          phone_number: string
          score_blue?: number
          score_green?: number
          score_red?: number
          score_yellow?: number
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          assessment_type?: string
          created_at?: string
          dominant_color?: string | null
          id?: string
          phone_number?: string
          score_blue?: number
          score_green?: number
          score_red?: number
          score_yellow?: number
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      work_tasks: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          department: string | null
          description: string | null
          due_date: string | null
          id: string
          importance: Database["public"]["Enums"]["task_priority"]
          quadrant: Database["public"]["Enums"]["covey_quadrant"]
          required_skills: string[] | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          urgency: Database["public"]["Enums"]["task_priority"]
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          department?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          importance?: Database["public"]["Enums"]["task_priority"]
          quadrant?: Database["public"]["Enums"]["covey_quadrant"]
          required_skills?: string[] | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["task_priority"]
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          department?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          importance?: Database["public"]["Enums"]["task_priority"]
          quadrant?: Database["public"]["Enums"]["covey_quadrant"]
          required_skills?: string[] | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["task_priority"]
        }
        Relationships: [
          {
            foreignKeyName: "work_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invite_code: { Args: never; Returns: string }
      generate_shareable_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_company_admin_for_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_valid_subdomain: { Args: { subdomain: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "blogger" | "user"
      candidate_status:
        | "invited"
        | "applied"
        | "assessment_pending"
        | "assessment_completed"
        | "hired"
        | "archived"
        | "rejected"
      company_assessment_category:
        | "professional"
        | "entrepreneur"
        | "executive"
        | "manager"
      company_assessment_type: "25q" | "50q"
      company_user_role: "admin" | "employee" | "hr" | "partner"
      company_user_status: "invited" | "active" | "revoked"
      covey_quadrant: "q1" | "q2" | "q3" | "q4"
      email_template_type:
        | "candidate_invite"
        | "interview_scheduled"
        | "interview_reminder"
        | "rejection"
        | "offer_letter"
        | "offer_accepted"
        | "welcome"
      employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "temporary"
        | "internship"
      hiring_stage_type:
        | "applied"
        | "screening"
        | "phone_interview"
        | "technical_interview"
        | "onsite_interview"
        | "reference_check"
        | "offer"
        | "hired"
        | "rejected"
      interview_status: "scheduled" | "completed" | "cancelled" | "no_show"
      interview_type:
        | "phone"
        | "video"
        | "onsite"
        | "panel"
        | "technical"
        | "behavioral"
      job_posting_status: "draft" | "open" | "paused" | "closed" | "filled"
      offer_status:
        | "draft"
        | "sent"
        | "accepted"
        | "declined"
        | "expired"
        | "rescinded"
      remote_policy: "onsite" | "remote" | "hybrid"
      task_priority: "high" | "medium" | "low"
      task_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "blogger", "user"],
      candidate_status: [
        "invited",
        "applied",
        "assessment_pending",
        "assessment_completed",
        "hired",
        "archived",
        "rejected",
      ],
      company_assessment_category: [
        "professional",
        "entrepreneur",
        "executive",
        "manager",
      ],
      company_assessment_type: ["25q", "50q"],
      company_user_role: ["admin", "employee", "hr", "partner"],
      company_user_status: ["invited", "active", "revoked"],
      covey_quadrant: ["q1", "q2", "q3", "q4"],
      email_template_type: [
        "candidate_invite",
        "interview_scheduled",
        "interview_reminder",
        "rejection",
        "offer_letter",
        "offer_accepted",
        "welcome",
      ],
      employment_type: [
        "full_time",
        "part_time",
        "contract",
        "temporary",
        "internship",
      ],
      hiring_stage_type: [
        "applied",
        "screening",
        "phone_interview",
        "technical_interview",
        "onsite_interview",
        "reference_check",
        "offer",
        "hired",
        "rejected",
      ],
      interview_status: ["scheduled", "completed", "cancelled", "no_show"],
      interview_type: [
        "phone",
        "video",
        "onsite",
        "panel",
        "technical",
        "behavioral",
      ],
      job_posting_status: ["draft", "open", "paused", "closed", "filled"],
      offer_status: [
        "draft",
        "sent",
        "accepted",
        "declined",
        "expired",
        "rescinded",
      ],
      remote_policy: ["onsite", "remote", "hybrid"],
      task_priority: ["high", "medium", "low"],
      task_status: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
