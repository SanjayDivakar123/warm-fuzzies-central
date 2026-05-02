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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      inboxes: {
        Row: {
          created_at: string
          daily_send_cap: number
          display_name: string | null
          email: string
          id: string
          provider: Database["public"]["Enums"]["inbox_provider"]
          status: Database["public"]["Enums"]["inbox_status"]
          tenant_id: string
          updated_at: string
          warmup_progress: number
        }
        Insert: {
          created_at?: string
          daily_send_cap?: number
          display_name?: string | null
          email: string
          id?: string
          provider?: Database["public"]["Enums"]["inbox_provider"]
          status?: Database["public"]["Enums"]["inbox_status"]
          tenant_id: string
          updated_at?: string
          warmup_progress?: number
        }
        Update: {
          created_at?: string
          daily_send_cap?: number
          display_name?: string | null
          email?: string
          id?: string
          provider?: Database["public"]["Enums"]["inbox_provider"]
          status?: Database["public"]["Enums"]["inbox_status"]
          tenant_id?: string
          updated_at?: string
          warmup_progress?: number
        }
        Relationships: [
          {
            foreignKeyName: "inboxes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          first_name: string | null
          icp_score: number | null
          id: string
          last_name: string | null
          linkedin_url: string | null
          metadata: Json
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tenant_id: string
          title: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          icp_score?: number | null
          id?: string
          last_name?: string | null
          linkedin_url?: string | null
          metadata?: Json
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tenant_id: string
          title?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          icp_score?: number | null
          id?: string
          last_name?: string | null
          linkedin_url?: string | null
          metadata?: Json
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tenant_id?: string
          title?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          external_id: string | null
          id: string
          inbox_id: string | null
          lead_id: string | null
          sent_at: string | null
          sequence_id: string | null
          status: Database["public"]["Enums"]["message_status"]
          subject: string | null
          tenant_id: string
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          external_id?: string | null
          id?: string
          inbox_id?: string | null
          lead_id?: string | null
          sent_at?: string | null
          sequence_id?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          tenant_id: string
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          external_id?: string | null
          id?: string
          inbox_id?: string | null
          lead_id?: string | null
          sent_at?: string | null
          sequence_id?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          tenant_id?: string
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_inbox_id_fkey"
            columns: ["inbox_id"]
            isOneToOne: false
            referencedRelation: "inboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          onboarded: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          onboarded?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarded?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sequences: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          steps: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          steps?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          steps?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          calendly_url: string | null
          created_at: string
          icp_description: string | null
          id: string
          name: string
          owner_id: string
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          calendly_url?: string | null
          created_at?: string
          icp_description?: string | null
          id?: string
          name: string
          owner_id: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          calendly_url?: string | null
          created_at?: string
          icp_description?: string | null
          id?: string
          name?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_tenant_owner: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "member"
      inbox_provider: "gmail" | "smtp"
      inbox_status: "pending" | "active" | "warming" | "paused" | "error"
      lead_status:
        | "new"
        | "contacted"
        | "replied"
        | "qualified"
        | "meeting_booked"
        | "closed_won"
        | "closed_lost"
        | "unsubscribed"
      message_direction: "outbound" | "inbound"
      message_status:
        | "queued"
        | "sent"
        | "delivered"
        | "opened"
        | "replied"
        | "bounced"
        | "failed"
      tenant_role: "owner" | "member"
      tenant_status: "onboarding" | "active" | "paused" | "cancelled"
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
      app_role: ["admin", "owner", "member"],
      inbox_provider: ["gmail", "smtp"],
      inbox_status: ["pending", "active", "warming", "paused", "error"],
      lead_status: [
        "new",
        "contacted",
        "replied",
        "qualified",
        "meeting_booked",
        "closed_won",
        "closed_lost",
        "unsubscribed",
      ],
      message_direction: ["outbound", "inbound"],
      message_status: [
        "queued",
        "sent",
        "delivered",
        "opened",
        "replied",
        "bounced",
        "failed",
      ],
      tenant_role: ["owner", "member"],
      tenant_status: ["onboarding", "active", "paused", "cancelled"],
    },
  },
} as const
