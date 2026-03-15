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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          annual_turnover: number | null
          cin: string | null
          company_name: string
          created_at: string
          created_by: string | null
          debt_levels: number | null
          ebitda: number | null
          headquarters: string | null
          id: string
          interest_rate: number | null
          loan_amount: number | null
          loan_tenure: number | null
          loan_type: string | null
          pan: string | null
          purpose_of_loan: string | null
          revenue: number | null
          sector: string
          subsector: string | null
          total_assets: number | null
          updated_at: string
        }
        Insert: {
          annual_turnover?: number | null
          cin?: string | null
          company_name: string
          created_at?: string
          created_by?: string | null
          debt_levels?: number | null
          ebitda?: number | null
          headquarters?: string | null
          id?: string
          interest_rate?: number | null
          loan_amount?: number | null
          loan_tenure?: number | null
          loan_type?: string | null
          pan?: string | null
          purpose_of_loan?: string | null
          revenue?: number | null
          sector: string
          subsector?: string | null
          total_assets?: number | null
          updated_at?: string
        }
        Update: {
          annual_turnover?: number | null
          cin?: string | null
          company_name?: string
          created_at?: string
          created_by?: string | null
          debt_levels?: number | null
          ebitda?: number | null
          headquarters?: string | null
          id?: string
          interest_rate?: number | null
          loan_amount?: number | null
          loan_tenure?: number | null
          loan_type?: string | null
          pan?: string | null
          purpose_of_loan?: string | null
          revenue?: number | null
          sector?: string
          subsector?: string | null
          total_assets?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      credit_scores: {
        Row: {
          capacity_score: number | null
          capital_score: number | null
          character_score: number | null
          collateral_score: number | null
          company_id: string
          conditions_score: number | null
          created_at: string
          credit_grade: string | null
          id: string
          reasoning: Json | null
          total_score: number | null
        }
        Insert: {
          capacity_score?: number | null
          capital_score?: number | null
          character_score?: number | null
          collateral_score?: number | null
          company_id: string
          conditions_score?: number | null
          created_at?: string
          credit_grade?: string | null
          id?: string
          reasoning?: Json | null
          total_score?: number | null
        }
        Update: {
          capacity_score?: number | null
          capital_score?: number | null
          character_score?: number | null
          collateral_score?: number | null
          company_id?: string
          conditions_score?: number | null
          created_at?: string
          credit_grade?: string | null
          id?: string
          reasoning?: Json | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      document_classifications: {
        Row: {
          approved_by: string | null
          approved_type: string | null
          confidence: number | null
          created_at: string
          detected_type: string
          document_id: string
          id: string
          status: string
        }
        Insert: {
          approved_by?: string | null
          approved_type?: string | null
          confidence?: number | null
          created_at?: string
          detected_type: string
          document_id: string
          id?: string
          status?: string
        }
        Update: {
          approved_by?: string | null
          approved_type?: string | null
          confidence?: number | null
          created_at?: string
          detected_type?: string
          document_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_classifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_schema_fields: {
        Row: {
          created_at: string
          display_order: number
          field_name: string
          field_type: string
          id: string
          is_required: boolean
          schema_id: string
          source_document: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          field_name: string
          field_type?: string
          id?: string
          is_required?: boolean
          schema_id: string
          source_document?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean
          schema_id?: string
          source_document?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_schema_fields_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "extraction_schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_schemas: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          schema_name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          schema_name?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          schema_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_schemas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_signals: {
        Row: {
          company_id: string
          created_at: string
          document_id: string | null
          id: string
          period: string | null
          signal_name: string
          signal_value: number | null
          source: string | null
          unit: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          document_id?: string | null
          id?: string
          period?: string | null
          signal_name: string
          signal_value?: number | null
          source?: string | null
          unit?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          document_id?: string | null
          id?: string
          period?: string | null
          signal_name?: string
          signal_value?: number | null
          source?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_signals_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      gst_reconciliations: {
        Row: {
          company_id: string
          created_at: string
          gap_amount: number | null
          gap_percentage: number | null
          gstr_2a: number | null
          gstr_3b: number | null
          id: string
          month: string
          status: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          gap_amount?: number | null
          gap_percentage?: number | null
          gstr_2a?: number | null
          gstr_3b?: number | null
          id?: string
          month: string
          status?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          gap_amount?: number | null
          gap_percentage?: number | null
          gstr_2a?: number | null
          gstr_3b?: number | null
          id?: string
          month?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gst_reconciliations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          company_id: string
          content: Json | null
          created_at: string
          generated_by: string | null
          id: string
          recommendation: string | null
          report_type: string
        }
        Insert: {
          company_id: string
          content?: Json | null
          created_at?: string
          generated_by?: string | null
          id?: string
          recommendation?: string | null
          report_type?: string
        }
        Update: {
          company_id?: string
          content?: Json | null
          created_at?: string
          generated_by?: string | null
          id?: string
          recommendation?: string | null
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_signals: {
        Row: {
          category: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          risk_type: string
          severity: string
          source: string | null
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          risk_type: string
          severity: string
          source?: string | null
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          risk_type?: string
          severity?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      secondary_research: {
        Row: {
          company_id: string
          content: string | null
          created_at: string
          id: string
          research_type: string
          severity: string | null
          source: string | null
        }
        Insert: {
          company_id: string
          content?: string | null
          created_at?: string
          id?: string
          research_type: string
          severity?: string | null
          source?: string | null
        }
        Update: {
          company_id?: string
          content?: string | null
          created_at?: string
          id?: string
          research_type?: string
          severity?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secondary_research_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
    }
    Enums: {
      app_role: "credit_analyst" | "risk_manager" | "admin"
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
      app_role: ["credit_analyst", "risk_manager", "admin"],
    },
  },
} as const
