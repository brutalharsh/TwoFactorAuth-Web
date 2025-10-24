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
      users: {
        Row: {
          id: string // UUID
          username: string
          pass: string // Plain text password
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          pass: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          pass?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      auths: {
        Row: {
          id: string // UUID
          user_id: string // UUID
          provider: string
          name: string
          key: string
          algorithm: string
          digits: number
          period: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          name: string
          key: string
          algorithm?: string
          digits?: number
          period?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          name?: string
          key?: string
          algorithm?: string
          digits?: number
          period?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auths_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}