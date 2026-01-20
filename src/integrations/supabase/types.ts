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
      companies: {
        Row: {
          admin_email: string
          assessment_type: Database["public"]["Enums"]["company_assessment_type"]
          created_at: string | null
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
          name: string
          primary_color: string | null
          seats_purchased: number
          secondary_color: string | null
          subdomain: string
          updated_at: string | null
        }
        Insert: {
          admin_email: string
          assessment_type?: Database["public"]["Enums"]["company_assessment_type"]
          created_at?: string | null
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
          name: string
          primary_color?: string | null
          seats_purchased?: number
          secondary_color?: string | null
          subdomain: string
          updated_at?: string | null
        }
        Update: {
          admin_email?: string
          assessment_type?: Database["public"]["Enums"]["company_assessment_type"]
          created_at?: string | null
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
          name?: string
          primary_color?: string | null
          seats_purchased?: number
          secondary_color?: string | null
          subdomain?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      company_users: {
        Row: {
          assessment_completed_at: string | null
          assessment_result_id: string | null
          company_id: string
          created_at: string | null
          email: string
          id: string
          invite_code: string | null
          invite_count: number
          invited_at: string | null
          job_role: string | null
          joined_at: string | null
          role: Database["public"]["Enums"]["company_user_role"]
          skills: string[] | null
          status: Database["public"]["Enums"]["company_user_status"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assessment_completed_at?: string | null
          assessment_result_id?: string | null
          company_id: string
          created_at?: string | null
          email: string
          id?: string
          invite_code?: string | null
          invite_count?: number
          invited_at?: string | null
          job_role?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["company_user_role"]
          skills?: string[] | null
          status?: Database["public"]["Enums"]["company_user_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_completed_at?: string | null
          assessment_result_id?: string | null
          company_id?: string
          created_at?: string | null
          email?: string
          id?: string
          invite_code?: string | null
          invite_count?: number
          invited_at?: string | null
          job_role?: string | null
          joined_at?: string | null
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
          company_id: string
          created_at: string
          id: string
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
          company_id: string
          created_at?: string
          id?: string
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
          company_id?: string
          created_at?: string
          id?: string
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
      company_assessment_type: "25q" | "50q"
      company_user_role: "admin" | "employee"
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
      company_assessment_type: ["25q", "50q"],
      company_user_role: ["admin", "employee"],
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
