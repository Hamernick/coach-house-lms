export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          user_id: string
          ein: string | null
          status: Database["public"]["Enums"]["organization_status"]
          profile: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          ein?: string | null
          status?: Database["public"]["Enums"]["organization_status"]
          profile?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          ein?: string | null
          status?: Database["public"]["Enums"]["organization_status"]
          profile?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_user_id_fkey",
            columns: ["user_id"],
            isOneToOne: true,
            referencedRelation: "profiles",
            referencedColumns: ["id"],
          },
        ]
      }
      module_assignments: {
        Row: {
          module_id: string
          schema: Json
          complete_on_submit: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          module_id: string
          schema?: Json
          complete_on_submit?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          module_id?: string
          schema?: Json
          complete_on_submit?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_assignments_module_id_fkey",
            columns: ["module_id"],
            referencedRelation: "modules",
            referencedColumns: ["id"],
          },
        ]
      }
      assignment_submissions: {
        Row: {
          id: string
          module_id: string
          user_id: string
          answers: Json
          status: Database["public"]["Enums"]["submission_status"]
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          user_id: string
          answers?: Json
          status?: Database["public"]["Enums"]["submission_status"]
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          user_id?: string
          answers?: Json
          status?: Database["public"]["Enums"]["submission_status"]
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_module_id_fkey",
            columns: ["module_id"],
            referencedRelation: "modules",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "assignment_submissions_user_id_fkey",
            columns: ["user_id"],
            referencedRelation: "profiles",
            referencedColumns: ["id"],
          },
        ]
      }
      attachments: {
        Row: {
          id: string
          owner_id: string | null
          scope_type: Database["public"]["Enums"]["attachment_scope_type"]
          scope_id: string
          kind: Database["public"]["Enums"]["attachment_kind"]
          storage_path: string
          mime: string | null
          size: number | null
          meta: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          scope_type: Database["public"]["Enums"]["attachment_scope_type"]
          scope_id: string
          kind: Database["public"]["Enums"]["attachment_kind"]
          storage_path: string
          mime?: string | null
          size?: number | null
          meta?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string | null
          scope_type?: Database["public"]["Enums"]["attachment_scope_type"]
          scope_id?: string
          kind?: Database["public"]["Enums"]["attachment_kind"]
          storage_path?: string
          mime?: string | null
          size?: number | null
          meta?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollment_invites: {
        Row: {
          id: string
          class_id: string
          email: string
          token: string
          expires_at: string
          invited_by: string | null
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          email: string
          token: string
          expires_at: string
          invited_by?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          email?: string
          token?: string
          expires_at?: string
          invited_by?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_invites_class_id_fkey",
            columns: ["class_id"],
            referencedRelation: "classes",
            referencedColumns: ["id"],
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          headline: string | null
          timezone: string | null
          email: string | null
          role: Database["public"]["Enums"]["user_role"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          headline?: string | null
          timezone?: string | null
          email?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          headline?: string | null
          timezone?: string | null
          email?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey",
            columns: ["id"],
            isOneToOne: true,
            referencedRelation: "users",
            referencedColumns: ["id"],
          },
        ]
      }
      classes: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          stripe_product_id: string | null
          stripe_price_id: string | null
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          id: string
          class_id: string
          idx: number
          slug: string
          title: string
          description: string | null
          video_url: string | null
          content_md: string | null
          duration_minutes: number | null
          deck_path: string | null
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          idx: number
          slug: string
          title: string
          description?: string | null
          video_url?: string | null
          content_md?: string | null
          duration_minutes?: number | null
          deck_path?: string | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          idx?: number
          slug?: string
          title?: string
          description?: string | null
          video_url?: string | null
          content_md?: string | null
          duration_minutes?: number | null
          deck_path?: string | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_class_id_fkey",
            columns: ["class_id"],
            referencedRelation: "classes",
            referencedColumns: ["id"],
          },
        ]
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          class_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          class_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          class_id?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey",
            columns: ["class_id"],
            referencedRelation: "classes",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "enrollments_user_id_fkey",
            columns: ["user_id"],
            referencedRelation: "profiles",
            referencedColumns: ["id"],
          },
        ]
      }
      module_progress: {
        Row: {
          id: string
          user_id: string
          module_id: string
          status: Database["public"]["Enums"]["module_progress_status"]
          completed_at: string | null
          notes: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          status?: Database["public"]["Enums"]["module_progress_status"]
          completed_at?: string | null
          notes?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          status?: Database["public"]["Enums"]["module_progress_status"]
          completed_at?: string | null
          notes?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_module_id_fkey",
            columns: ["module_id"],
            referencedRelation: "modules",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "module_progress_user_id_fkey",
            columns: ["user_id"],
            referencedRelation: "profiles",
            referencedColumns: ["id"],
          },
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          current_period_end: string | null
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          updated_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          current_period_end?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          current_period_end?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey",
            columns: ["user_id"],
            referencedRelation: "profiles",
            referencedColumns: ["id"],
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          id: string
          type: string
          payload: Json
          created_at: string
        }
        Insert: {
          id: string
          type: string
          payload: Json
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          payload?: Json
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      handle_updated_at: {
        Args: Record<string, never>
        Returns: unknown
      }
      apply_submission_to_organization: {
        Args: {
          p_user_id: string
          p_answers: Json
        }
        Returns: void
      }
      next_unlocked_module: {
        Args: {
          p_user_id: string
        }
        Returns: string | null
      }
      progress_for_class: {
        Args: {
          p_user_id: string
          p_class_id: string
        }
        Returns: {
          total: number | null
          completed: number | null
        }[]
      }
    }
    Enums: {
      user_role: "student" | "admin"
      module_progress_status: "not_started" | "in_progress" | "completed"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
      organization_status: "pending" | "approved" | "n/a"
      submission_status: "submitted" | "accepted" | "revise"
      attachment_scope_type: "class" | "module" | "submission"
      attachment_kind: "deck" | "resource" | "submission"
    }
    CompositeTypes: Record<string, never>
  }
}
