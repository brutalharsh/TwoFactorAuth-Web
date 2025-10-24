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
          id: number
          username: string
          password: string
        }
        Insert: {
          id?: number
          username: string
          password: string
        }
        Update: {
          id?: number
          username?: string
          password?: string
        }
        Relationships: []
      }
      auths: {
        Row: {
          id: number
          user_id: number
          provider: string
          name: string
          key: string
          algorithm: string
          digits: number
          period: number
        }
        Insert: {
          id?: number
          user_id: number
          provider: string
          name: string
          key: string
          algorithm?: string
          digits?: number
          period?: number
        }
        Update: {
          id?: number
          user_id?: number
          provider?: string
          name?: string
          key?: string
          algorithm?: string
          digits?: number
          period?: number
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