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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          headline: string | null
          timezone: string | null
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
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
          updated_at?: string
        }
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
          created_at?: string
          updated_at?: string
        }
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
    }
    CompositeTypes: Record<string, never>
  }
}
