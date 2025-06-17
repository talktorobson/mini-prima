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
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
          role: Database["public"]["Enums"]["admin_role"]
          staff_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["admin_role"]
          staff_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["admin_role"]
          staff_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      case_updates: {
        Row: {
          case_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          title: string
          update_type: string
          visibility: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          title: string
          update_type: string
          visibility?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          title?: string
          update_type?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_updates_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          actual_close_date: string | null
          assigned_lawyer: string | null
          case_number: string
          case_number_external: string | null
          case_risk_value: number | null
          case_title: string
          client_id: string
          client_satisfaction: number | null
          counterparty_name: string | null
          court_agency: string | null
          court_process_number: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          end_date: string | null
          expected_close_date: string | null
          fixed_fee: number | null
          hourly_rate: number | null
          hours_budgeted: number | null
          hours_worked: number | null
          id: string
          key_dates: string | null
          next_steps: string | null
          notes: string | null
          opposing_party: string | null
          outcome: string | null
          priority: Database["public"]["Enums"]["priority"]
          progress_percentage: number | null
          risk_level: Database["public"]["Enums"]["priority"] | null
          service_type: string
          start_date: string
          status: Database["public"]["Enums"]["case_status"]
          supporting_staff: Json | null
          total_value: number | null
          updated_at: string | null
        }
        Insert: {
          actual_close_date?: string | null
          assigned_lawyer?: string | null
          case_number: string
          case_number_external?: string | null
          case_risk_value?: number | null
          case_title: string
          client_id: string
          client_satisfaction?: number | null
          counterparty_name?: string | null
          court_agency?: string | null
          court_process_number?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          expected_close_date?: string | null
          fixed_fee?: number | null
          hourly_rate?: number | null
          hours_budgeted?: number | null
          hours_worked?: number | null
          id?: string
          key_dates?: string | null
          next_steps?: string | null
          notes?: string | null
          opposing_party?: string | null
          outcome?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          progress_percentage?: number | null
          risk_level?: Database["public"]["Enums"]["priority"] | null
          service_type: string
          start_date?: string
          status?: Database["public"]["Enums"]["case_status"]
          supporting_staff?: Json | null
          total_value?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_close_date?: string | null
          assigned_lawyer?: string | null
          case_number?: string
          case_number_external?: string | null
          case_risk_value?: number | null
          case_title?: string
          client_id?: string
          client_satisfaction?: number | null
          counterparty_name?: string | null
          court_agency?: string | null
          court_process_number?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          expected_close_date?: string | null
          fixed_fee?: number | null
          hourly_rate?: number | null
          hours_budgeted?: number | null
          hours_worked?: number | null
          id?: string
          key_dates?: string | null
          next_steps?: string | null
          notes?: string | null
          opposing_party?: string | null
          outcome?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          progress_percentage?: number | null
          risk_level?: Database["public"]["Enums"]["priority"] | null
          service_type?: string
          start_date?: string
          status?: Database["public"]["Enums"]["case_status"]
          supporting_staff?: Json | null
          total_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cases_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_dashboard_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_cases_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_activity_logs: {
        Row: {
          activity_type: string
          client_id: string
          created_at: string
          description: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          user_agent: string | null
        }
        Insert: {
          activity_type: string
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
        }
        Update: {
          activity_type?: string
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_activity_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_dashboard_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_activity_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_registration_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          client_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["registration_status"]
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          status: Database["public"]["Enums"]["registration_status"]
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["registration_status"]
        }
        Relationships: [
          {
            foreignKeyName: "client_registration_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_dashboard_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_registration_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          client_rating: number | null
          client_since: string
          cnpj: string | null
          company_name: string
          company_size: string | null
          contact_person: string
          created_at: string | null
          created_by: string | null
          data_processing_consent: boolean | null
          documents_folder_url: string | null
          email: string
          estimated_case_value: number | null
          id: string
          industry: string | null
          initial_consultation_date: string | null
          last_service_date: string | null
          linked_lead_id: string | null
          marketing_consent: boolean | null
          notes: string | null
          payment_terms: string | null
          phone: string
          portal_access: boolean | null
          position: string | null
          preferred_contact_method: string | null
          primary_lawyer: string | null
          reference_source: string | null
          region: Database["public"]["Enums"]["region"] | null
          registration_date: string | null
          registration_notes: string | null
          registration_status:
            | Database["public"]["Enums"]["registration_status"]
            | null
          services_contracted: Json | null
          status: Database["public"]["Enums"]["client_status"]
          total_contract_value: number | null
          updated_at: string | null
          urgency_level: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          client_rating?: number | null
          client_since?: string
          cnpj?: string | null
          company_name: string
          company_size?: string | null
          contact_person: string
          created_at?: string | null
          created_by?: string | null
          data_processing_consent?: boolean | null
          documents_folder_url?: string | null
          email: string
          estimated_case_value?: number | null
          id?: string
          industry?: string | null
          initial_consultation_date?: string | null
          last_service_date?: string | null
          linked_lead_id?: string | null
          marketing_consent?: boolean | null
          notes?: string | null
          payment_terms?: string | null
          phone: string
          portal_access?: boolean | null
          position?: string | null
          preferred_contact_method?: string | null
          primary_lawyer?: string | null
          reference_source?: string | null
          region?: Database["public"]["Enums"]["region"] | null
          registration_date?: string | null
          registration_notes?: string | null
          registration_status?:
            | Database["public"]["Enums"]["registration_status"]
            | null
          services_contracted?: Json | null
          status?: Database["public"]["Enums"]["client_status"]
          total_contract_value?: number | null
          updated_at?: string | null
          urgency_level?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          client_rating?: number | null
          client_since?: string
          cnpj?: string | null
          company_name?: string
          company_size?: string | null
          contact_person?: string
          created_at?: string | null
          created_by?: string | null
          data_processing_consent?: boolean | null
          documents_folder_url?: string | null
          email?: string
          estimated_case_value?: number | null
          id?: string
          industry?: string | null
          initial_consultation_date?: string | null
          last_service_date?: string | null
          linked_lead_id?: string | null
          marketing_consent?: boolean | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string
          portal_access?: boolean | null
          position?: string | null
          preferred_contact_method?: string | null
          primary_lawyer?: string | null
          reference_source?: string | null
          region?: Database["public"]["Enums"]["region"] | null
          registration_date?: string | null
          registration_notes?: string | null
          registration_status?:
            | Database["public"]["Enums"]["registration_status"]
            | null
          services_contracted?: Json | null
          status?: Database["public"]["Enums"]["client_status"]
          total_contract_value?: number | null
          updated_at?: string | null
          urgency_level?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      document_access_logs: {
        Row: {
          access_timestamp: string
          action: Database["public"]["Enums"]["access_action"]
          client_id: string
          document_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_timestamp?: string
          action: Database["public"]["Enums"]["access_action"]
          client_id: string
          document_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_timestamp?: string
          action?: Database["public"]["Enums"]["access_action"]
          client_id?: string
          document_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_dashboard_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "document_access_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          access_level: string
          case_id: string | null
          clicksign_status: string | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          digital_signature: string | null
          document_category: string | null
          document_name: string
          document_type: string
          expiry_date: string | null
          file_path: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_visible_to_client: boolean | null
          last_modified: string | null
          notes: string | null
          original_filename: string | null
          signature_required: boolean | null
          status: Database["public"]["Enums"]["document_status"]
          tags: Json | null
          updated_at: string | null
          upload_date: string | null
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          access_level?: string
          case_id?: string | null
          clicksign_status?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          digital_signature?: string | null
          document_category?: string | null
          document_name: string
          document_type: string
          expiry_date?: string | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_visible_to_client?: boolean | null
          last_modified?: string | null
          notes?: string | null
          original_filename?: string | null
          signature_required?: boolean | null
          status?: Database["public"]["Enums"]["document_status"]
          tags?: Json | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          access_level?: string
          case_id?: string | null
          clicksign_status?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          digital_signature?: string | null
          document_category?: string | null
          document_name?: string
          document_type?: string
          expiry_date?: string | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_visible_to_client?: boolean | null
          last_modified?: string | null
          notes?: string | null
          original_filename?: string | null
          signature_required?: boolean | null
          status?: Database["public"]["Enums"]["document_status"]
          tags?: Json | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_documents_case_id"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_dashboard_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_documents_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_records: {
        Row: {
          aging_bucket: string | null
          amount: number
          case_id: string | null
          category: string | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          days_overdue: number | null
          description: string
          due_date: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          paid_date: string | null
          payment_date: string | null
          payment_link: string | null
          payment_method: string | null
          receipt: string | null
          status: Database["public"]["Enums"]["financial_status"]
          tax_amount: number | null
          tax_rate: number | null
          total_with_tax: number | null
          type: Database["public"]["Enums"]["financial_type"]
          updated_at: string | null
        }
        Insert: {
          aging_bucket?: string | null
          amount: number
          case_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          days_overdue?: number | null
          description: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_date?: string | null
          payment_date?: string | null
          payment_link?: string | null
          payment_method?: string | null
          receipt?: string | null
          status?: Database["public"]["Enums"]["financial_status"]
          tax_amount?: number | null
          tax_rate?: number | null
          total_with_tax?: number | null
          type: Database["public"]["Enums"]["financial_type"]
          updated_at?: string | null
        }
        Update: {
          aging_bucket?: string | null
          amount?: number
          case_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          days_overdue?: number | null
          description?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_date?: string | null
          payment_date?: string | null
          payment_link?: string | null
          payment_method?: string | null
          receipt?: string | null
          status?: Database["public"]["Enums"]["financial_status"]
          tax_amount?: number | null
          tax_rate?: number | null
          total_with_tax?: number | null
          type?: Database["public"]["Enums"]["financial_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_lawyer: string | null
          budget_range: string | null
          company: string | null
          company_size: string | null
          conversion_probability: number | null
          converted_to_client_id: string | null
          created_by: string | null
          created_date: string
          email: string
          id: string
          industry: string | null
          initial_message: string | null
          last_contact: string | null
          lead_score: number | null
          name: string
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          region: Database["public"]["Enums"]["region"] | null
          service_interest: Json | null
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string | null
          utm_campaign: string | null
        }
        Insert: {
          assigned_lawyer?: string | null
          budget_range?: string | null
          company?: string | null
          company_size?: string | null
          conversion_probability?: number | null
          converted_to_client_id?: string | null
          created_by?: string | null
          created_date?: string
          email: string
          id?: string
          industry?: string | null
          initial_message?: string | null
          last_contact?: string | null
          lead_score?: number | null
          name: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          region?: Database["public"]["Enums"]["region"] | null
          service_interest?: Json | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string | null
          utm_campaign?: string | null
        }
        Update: {
          assigned_lawyer?: string | null
          budget_range?: string | null
          company?: string | null
          company_size?: string | null
          conversion_probability?: number | null
          converted_to_client_id?: string | null
          created_by?: string | null
          created_date?: string
          email?: string
          id?: string
          industry?: string | null
          initial_message?: string | null
          last_contact?: string | null
          lead_score?: number | null
          name?: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          region?: Database["public"]["Enums"]["region"] | null
          service_interest?: Json | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string | null
          utm_campaign?: string | null
        }
        Relationships: []
      }
      portal_faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          order_position: number | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      portal_messages: {
        Row: {
          attachments: Json | null
          case_id: string | null
          content: string
          created_at: string
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          read_at: string | null
          recipient_id: string
          recipient_type: Database["public"]["Enums"]["recipient_type"]
          sender_id: string
          sender_type: Database["public"]["Enums"]["sender_type"]
          subject: string | null
          thread_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          case_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          read_at?: string | null
          recipient_id: string
          recipient_type: Database["public"]["Enums"]["recipient_type"]
          sender_id: string
          sender_type: Database["public"]["Enums"]["sender_type"]
          subject?: string | null
          thread_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          case_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          read_at?: string | null
          recipient_id?: string
          recipient_type?: Database["public"]["Enums"]["recipient_type"]
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["sender_type"]
          subject?: string | null
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_notifications: {
        Row: {
          action_url: string | null
          client_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          action_url?: string | null
          client_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          action_url?: string | null
          client_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "portal_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_dashboard_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "portal_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_sessions: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          last_activity: string
          session_token: string
          user_agent: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string
          session_token: string
          user_agent?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_dashboard_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "portal_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_settings: {
        Row: {
          client_id: string
          created_at: string
          email_notifications: boolean | null
          id: string
          language: string | null
          preferences: Json | null
          timezone: string | null
          updated_at: string
          whatsapp_notifications: boolean | null
        }
        Insert: {
          client_id: string
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string
          whatsapp_notifications?: boolean | null
        }
        Update: {
          client_id?: string
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string
          whatsapp_notifications?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "client_dashboard_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "portal_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          bio: string | null
          created_at: string | null
          created_by: string | null
          email: string
          end_date: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          languages: Json | null
          monthly_salary: number | null
          notes: string | null
          oab_number: string | null
          performance_rating: number | null
          phone: string | null
          photo: string | null
          position: string
          primary_region: Database["public"]["Enums"]["region"] | null
          skills: Json | null
          specialization: Json | null
          start_date: string
          status: Database["public"]["Enums"]["staff_status"]
          target_hours: number | null
          updated_at: string | null
          workload_percentage: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          end_date?: string | null
          full_name: string
          hourly_rate?: number | null
          id?: string
          languages?: Json | null
          monthly_salary?: number | null
          notes?: string | null
          oab_number?: string | null
          performance_rating?: number | null
          phone?: string | null
          photo?: string | null
          position: string
          primary_region?: Database["public"]["Enums"]["region"] | null
          skills?: Json | null
          specialization?: Json | null
          start_date: string
          status?: Database["public"]["Enums"]["staff_status"]
          target_hours?: number | null
          updated_at?: string | null
          workload_percentage?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          end_date?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          languages?: Json | null
          monthly_salary?: number | null
          notes?: string | null
          oab_number?: string | null
          performance_rating?: number | null
          phone?: string | null
          photo?: string | null
          position?: string
          primary_region?: Database["public"]["Enums"]["region"] | null
          skills?: Json | null
          specialization?: Json | null
          start_date?: string
          status?: Database["public"]["Enums"]["staff_status"]
          target_hours?: number | null
          updated_at?: string | null
          workload_percentage?: number | null
        }
        Relationships: []
      }
      staff_access_permissions: {
        Row: {
          access_type: Database["public"]["Enums"]["access_type"]
          created_at: string | null
          granted_at: string | null
          granted_by: string
          id: string
          is_active: boolean | null
          staff_id: string
          updated_at: string | null
        }
        Insert: {
          access_type: Database["public"]["Enums"]["access_type"]
          created_at?: string | null
          granted_at?: string | null
          granted_by: string
          id?: string
          is_active?: boolean | null
          staff_id: string
          updated_at?: string | null
        }
        Update: {
          access_type?: Database["public"]["Enums"]["access_type"]
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string
          id?: string
          is_active?: boolean | null
          staff_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_access_permissions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_client_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          staff_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by: string
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          staff_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          staff_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_client_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_dashboard_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "staff_client_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_client_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string
          billable: boolean | null
          case_id: string | null
          client_id: string | null
          completed_date: string | null
          created_at: string | null
          created_by: string | null
          deadline_critical: boolean | null
          dependencies: Json | null
          description: string | null
          due_date: string | null
          hourly_rate: number | null
          id: string
          next_action: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["priority"]
          progress_percentage: number | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: string | null
          time_estimate: number | null
          time_spent: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to: string
          billable?: boolean | null
          case_id?: string | null
          client_id?: string | null
          completed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline_critical?: boolean | null
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          hourly_rate?: number | null
          id?: string
          next_action?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          progress_percentage?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: string | null
          time_estimate?: number | null
          time_spent?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string
          billable?: boolean | null
          case_id?: string | null
          client_id?: string | null
          completed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline_critical?: boolean | null
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          hourly_rate?: number | null
          id?: string
          next_action?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          progress_percentage?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: string | null
          time_estimate?: number | null
          time_spent?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      active_timers: {
        Row: {
          case_id: string | null
          client_id: string | null
          description: string
          hourly_rate: number
          id: string
          last_activity: string | null
          staff_id: string
          started_at: string
          task_type: string
        }
        Insert: {
          case_id?: string | null
          client_id?: string | null
          description: string
          hourly_rate: number
          id?: string
          last_activity?: string | null
          staff_id: string
          started_at?: string
          task_type: string
        }
        Update: {
          case_id?: string | null
          client_id?: string | null
          description?: string
          hourly_rate?: number
          id?: string
          last_activity?: string | null
          staff_id?: string
          started_at?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_timers_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_timers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_dashboard_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "active_timers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_timers_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_rates: {
        Row: {
          client_id: string | null
          client_rate: number | null
          created_at: string | null
          custom_rate: number | null
          default_hourly_rate: number
          effective_from: string
          effective_until: string | null
          id: string
          is_active: boolean | null
          staff_id: string
          task_type: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          client_rate?: number | null
          created_at?: string | null
          custom_rate?: number | null
          default_hourly_rate: number
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          staff_id: string
          task_type?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          client_rate?: number | null
          created_at?: string | null
          custom_rate?: number | null
          default_hourly_rate?: number
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          staff_id?: string
          task_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_rates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_dashboard_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "billing_rates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_rates_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approval_notes: string | null
          billable_amount: number | null
          billable_minutes: number | null
          billed_at: string | null
          case_id: string | null
          client_id: string | null
          created_at: string | null
          description: string
          duration_minutes: number | null
          end_time: string | null
          hourly_rate: number
          id: string
          invoice_id: string | null
          is_billable: boolean | null
          staff_id: string
          start_time: string
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          task_type: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approval_notes?: string | null
          billable_amount?: number | null
          billable_minutes?: number | null
          billed_at?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description: string
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate: number
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          staff_id: string
          start_time: string
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          task_type: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approval_notes?: string | null
          billable_amount?: number | null
          billable_minutes?: number | null
          billed_at?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate?: number
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          staff_id?: string
          start_time?: string
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          task_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_dashboard_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "time_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      time_tracking_summaries: {
        Row: {
          approved_entries: number | null
          billed_amount: number | null
          billable_hours: number | null
          case_id: string | null
          client_id: string | null
          draft_entries: number | null
          generated_at: string | null
          id: string
          period_end: string
          period_start: string
          period_type: string
          staff_id: string | null
          submitted_entries: number | null
          total_amount: number | null
          total_entries: number | null
          total_hours: number | null
        }
        Insert: {
          approved_entries?: number | null
          billed_amount?: number | null
          billable_hours?: number | null
          case_id?: string | null
          client_id?: string | null
          draft_entries?: number | null
          generated_at?: string | null
          id?: string
          period_end: string
          period_start: string
          period_type: string
          staff_id?: string | null
          submitted_entries?: number | null
          total_amount?: number | null
          total_entries?: number | null
          total_hours?: number | null
        }
        Update: {
          approved_entries?: number | null
          billed_amount?: number | null
          billable_hours?: number | null
          case_id?: string | null
          client_id?: string | null
          draft_entries?: number | null
          generated_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          staff_id?: string | null
          submitted_entries?: number | null
          total_amount?: number | null
          total_entries?: number | null
          total_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "time_tracking_summaries_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_summaries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_dashboard_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "time_tracking_summaries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_summaries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_dashboard_summary: {
        Row: {
          active_cases: number | null
          client_id: string | null
          company_name: string | null
          contact_person: string | null
          pending_amount: number | null
          total_cases: number | null
          total_documents: number | null
          unread_messages: number | null
          unread_notifications: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_client_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_staff_assigned_clients: {
        Args: { staff_user_id?: string }
        Returns: {
          client_id: string
        }[]
      }
      get_staff_info: {
        Args: { staff_user_id?: string }
        Returns: {
          staff_id: string
          full_name: string
          email: string
          staff_position: string
          role: string
        }[]
      }
      is_admin_or_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_client_activity: {
        Args: {
          activity_type_param: string
          description_param?: string
          metadata_param?: Json
        }
        Returns: undefined
      }
      user_owns_case: {
        Args: { case_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      access_action: "view" | "download" | "preview"
      access_type:
        | "client_access"
        | "billing"
        | "messaging"
        | "cases_management"
        | "document_management"
        | "system_setup"
      admin_role: "admin" | "staff"
      case_status:
        | "Open"
        | "In Progress"
        | "Waiting Client"
        | "Waiting Court"
        | "On Hold"
        | "Closed - Won"
        | "Closed - Lost"
        | "Cancelled"
      client_status: "Active" | "Inactive" | "Suspended" | "Terminated"
      document_status:
        | "Draft"
        | "Under Review"
        | "Approved"
        | "Signed"
        | "Expired"
        | "Archived"
      financial_status: "Pending" | "Paid" | "Overdue" | "Partial" | "Cancelled"
      financial_type:
        | "Income"
        | "Expense"
        | "Receivable"
        | "Payable"
        | "Invoice"
      lead_status: "Cold" | "Warm" | "Hot" | "Qualified" | "Lost" | "Converted"
      message_type: "message" | "notification" | "system"
      notification_type:
        | "info"
        | "success"
        | "warning"
        | "error"
        | "case_update"
        | "document"
        | "payment"
        | "message"
      priority: "Low" | "Medium" | "High" | "Urgent"
      recipient_type: "client" | "lawyer" | "staff"
      region:
        | "Região 1 (015 Cerquilho)"
        | "Região 2 (019 Campinas)"
        | "Região 3 (011 SP Sul)"
        | "Região 4 (011 SP Oeste)"
        | "Região 5 (013 Litoral)"
      registration_status: "pending" | "approved" | "rejected" | "under_review"
      sender_type: "client" | "lawyer" | "staff"
      staff_status: "Active" | "Inactive" | "On Leave" | "Terminated"
      task_status: "To Do" | "In Progress" | "Waiting" | "Done" | "Cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_action: ["view", "download", "preview"],
      access_type: [
        "client_access",
        "billing",
        "messaging",
        "cases_management",
        "document_management",
        "system_setup",
      ],
      admin_role: ["admin", "staff"],
      case_status: [
        "Open",
        "In Progress",
        "Waiting Client",
        "Waiting Court",
        "On Hold",
        "Closed - Won",
        "Closed - Lost",
        "Cancelled",
      ],
      client_status: ["Active", "Inactive", "Suspended", "Terminated"],
      document_status: [
        "Draft",
        "Under Review",
        "Approved",
        "Signed",
        "Expired",
        "Archived",
      ],
      financial_status: ["Pending", "Paid", "Overdue", "Partial", "Cancelled"],
      financial_type: ["Income", "Expense", "Receivable", "Payable", "Invoice"],
      lead_status: ["Cold", "Warm", "Hot", "Qualified", "Lost", "Converted"],
      message_type: ["message", "notification", "system"],
      notification_type: [
        "info",
        "success",
        "warning",
        "error",
        "case_update",
        "document",
        "payment",
        "message",
      ],
      priority: ["Low", "Medium", "High", "Urgent"],
      recipient_type: ["client", "lawyer", "staff"],
      region: [
        "Região 1 (015 Cerquilho)",
        "Região 2 (019 Campinas)",
        "Região 3 (011 SP Sul)",
        "Região 4 (011 SP Oeste)",
        "Região 5 (013 Litoral)",
      ],
      registration_status: ["pending", "approved", "rejected", "under_review"],
      sender_type: ["client", "lawyer", "staff"],
      staff_status: ["Active", "Inactive", "On Leave", "Terminated"],
      task_status: ["To Do", "In Progress", "Waiting", "Done", "Cancelled"],
    },
  },
} as const
