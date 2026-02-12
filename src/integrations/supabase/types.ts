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
        ]
      }
      companies: {
        Row: {
          admin_email: string
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
          id: string
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
          id?: string
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
          id?: string
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
          id: string
          company_id: string
          name: string
          description: string | null
          skills: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          skills?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          skills?: string[] | null
          created_at?: string
          updated_at?: string
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
        Relationships: [
          {
            foreignKeyName: "rcaimobile_candidate_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "rcaimobile_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "rcaimobile_candidate_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "rcaimobile_profiles"
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
        Relationships: [
          {
            foreignKeyName: "rcaimobile_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rcaimobile_profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "rcaimobile_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rcaimobile_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rcaimobile_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
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
