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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_channels: {
        Row: {
          agent_id: string
          channel_id: string
          channel_type: string
          created_at: string | null
          id: string
          is_enabled: boolean | null
        }
        Insert: {
          agent_id: string
          channel_id: string
          channel_type: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
        }
        Update: {
          agent_id?: string
          channel_id?: string
          channel_type?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_channels_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_knowledge_bases: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          is_enabled: boolean | null
          knowledge_base_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          knowledge_base_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          knowledge_base_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_bases_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_knowledge_bases_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_stages: {
        Row: {
          agent_id: string
          created_at: string | null
          funnel_status: string | null
          ia_context: string | null
          id: string
          is_active: boolean | null
          name: string
          objective: string | null
          stage_order: number
          success_criteria: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          funnel_status?: string | null
          ia_context?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          objective?: string | null
          stage_order: number
          success_criteria?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          funnel_status?: string | null
          ia_context?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          objective?: string | null
          stage_order?: number
          success_criteria?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_stages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_triggers: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          is_enabled: boolean | null
          phrase: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          phrase: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          phrase?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_triggers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          behavior_rules: string | null
          created_at: string | null
          function: string | null
          id: string
          instance_id: string | null
          is_active: boolean | null
          knowledge_content: string | null
          name: string
          persona_name: string | null
          updated_at: string | null
        }
        Insert: {
          behavior_rules?: string | null
          created_at?: string | null
          function?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          knowledge_content?: string | null
          name: string
          persona_name?: string | null
          updated_at?: string | null
        }
        Update: {
          behavior_rules?: string | null
          created_at?: string | null
          function?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          knowledge_content?: string | null
          name?: string
          persona_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          active: boolean | null
          advanced_matching_enabled: boolean | null
          cancellation_keywords: string[] | null
          company_name: string | null
          company_subtitle: string | null
          conversion_api_enabled: boolean | null
          conversion_keywords: string[] | null
          created_at: string | null
          custom_audience_pixel_id: string | null
          custom_message: string | null
          data_processing_options: string[] | null
          data_processing_options_country: number | null
          data_processing_options_state: number | null
          event_type: string | null
          external_id: string | null
          facebook_access_token: string | null
          id: string
          name: string
          pixel_id: string | null
          pixel_integration_type: string | null
          redirect_type: string | null
          server_side_api_enabled: boolean | null
          test_event_code: string | null
          tracking_domain: string | null
          updated_at: string | null
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean | null
          advanced_matching_enabled?: boolean | null
          cancellation_keywords?: string[] | null
          company_name?: string | null
          company_subtitle?: string | null
          conversion_api_enabled?: boolean | null
          conversion_keywords?: string[] | null
          created_at?: string | null
          custom_audience_pixel_id?: string | null
          custom_message?: string | null
          data_processing_options?: string[] | null
          data_processing_options_country?: number | null
          data_processing_options_state?: number | null
          event_type?: string | null
          external_id?: string | null
          facebook_access_token?: string | null
          id?: string
          name: string
          pixel_id?: string | null
          pixel_integration_type?: string | null
          redirect_type?: string | null
          server_side_api_enabled?: boolean | null
          test_event_code?: string | null
          tracking_domain?: string | null
          updated_at?: string | null
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean | null
          advanced_matching_enabled?: boolean | null
          cancellation_keywords?: string[] | null
          company_name?: string | null
          company_subtitle?: string | null
          conversion_api_enabled?: boolean | null
          conversion_keywords?: string[] | null
          created_at?: string | null
          custom_audience_pixel_id?: string | null
          custom_message?: string | null
          data_processing_options?: string[] | null
          data_processing_options_country?: number | null
          data_processing_options_state?: number | null
          event_type?: string | null
          external_id?: string | null
          facebook_access_token?: string | null
          id?: string
          name?: string
          pixel_id?: string | null
          pixel_integration_type?: string | null
          redirect_type?: string | null
          server_side_api_enabled?: boolean | null
          test_event_code?: string | null
          tracking_domain?: string | null
          updated_at?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_name: string | null
          company_subtitle: string | null
          created_at: string | null
          facebook_access_token: string | null
          facebook_pixel_id: string | null
          id: string
          logo_url: string | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name?: string | null
          company_subtitle?: string | null
          created_at?: string | null
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          id?: string
          logo_url?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string | null
          company_subtitle?: string | null
          created_at?: string | null
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          id?: string
          logo_url?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversions: {
        Row: {
          created_at: string | null
          data: Json | null
          id: number
          order_id: string | null
          payment: string | null
          product: string | null
          project_id: number | null
          source: string | null
          value: number | null
          visitor_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: number
          order_id?: string | null
          payment?: string | null
          product?: string | null
          project_id?: number | null
          source?: string | null
          value?: number | null
          visitor_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: number
          order_id?: string | null
          payment?: string | null
          product?: string | null
          project_id?: number | null
          source?: string | null
          value?: number | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          data: Json | null
          event_type: string
          id: number
          page: string | null
          project_id: number | null
          session_id: string | null
          url: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          event_type: string
          id?: number
          page?: string | null
          project_id?: number | null
          session_id?: string | null
          url?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          event_type?: string
          id?: number
          page?: string | null
          project_id?: number | null
          session_id?: string | null
          url?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_bases: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lead_messages: {
        Row: {
          created_at: string | null
          file_name: string | null
          id: string
          instance_name: string | null
          is_from_me: boolean
          is_read: boolean | null
          lead_id: string
          media_type: string | null
          media_url: string | null
          message_text: string
          mime_type: string | null
          sent_at: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          id?: string
          instance_name?: string | null
          is_from_me?: boolean
          is_read?: boolean | null
          lead_id: string
          media_type?: string | null
          media_url?: string | null
          message_text: string
          mime_type?: string | null
          sent_at?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          id?: string
          instance_name?: string | null
          is_from_me?: boolean
          is_read?: boolean | null
          lead_id?: string
          media_type?: string | null
          media_url?: string | null
          message_text?: string
          mime_type?: string | null
          sent_at?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agent_id: string | null
          browser: string | null
          campaign_id: string | null
          collected_variables: Json | null
          created_at: string | null
          current_stage_id: string | null
          device_model: string | null
          device_type: string | null
          evolution_message_id: string | null
          evolution_status: string | null
          facebook_ad_id: string | null
          facebook_adset_id: string | null
          facebook_campaign_id: string | null
          first_contact_date: string | null
          id: string
          initial_message: string | null
          ip_address: string | null
          last_contact_date: string | null
          last_message: string | null
          location: string | null
          name: string
          os: string | null
          phone: string
          profile_picture_url: string | null
          status: string | null
          unread_count: number | null
          updated_at: string | null
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          agent_id?: string | null
          browser?: string | null
          campaign_id?: string | null
          collected_variables?: Json | null
          created_at?: string | null
          current_stage_id?: string | null
          device_model?: string | null
          device_type?: string | null
          evolution_message_id?: string | null
          evolution_status?: string | null
          facebook_ad_id?: string | null
          facebook_adset_id?: string | null
          facebook_campaign_id?: string | null
          first_contact_date?: string | null
          id?: string
          initial_message?: string | null
          ip_address?: string | null
          last_contact_date?: string | null
          last_message?: string | null
          location?: string | null
          name: string
          os?: string | null
          phone: string
          profile_picture_url?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          agent_id?: string | null
          browser?: string | null
          campaign_id?: string | null
          collected_variables?: Json | null
          created_at?: string | null
          current_stage_id?: string | null
          device_model?: string | null
          device_type?: string | null
          evolution_message_id?: string | null
          evolution_status?: string | null
          facebook_ad_id?: string | null
          facebook_adset_id?: string | null
          facebook_campaign_id?: string | null
          first_contact_date?: string | null
          id?: string
          initial_message?: string | null
          ip_address?: string | null
          last_contact_date?: string | null
          last_message?: string | null
          location?: string | null
          name?: string
          os?: string | null
          phone?: string
          profile_picture_url?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "agent_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_leads: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          id: string
          name: string
          phone: string
          status: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          webhook_data: Json | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          phone: string
          status?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webhook_data?: Json | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string
          status?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          allowed_domains: string | null
          created_at: string | null
          fb_access_token: string | null
          fb_pixel_id: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          allowed_domains?: string | null
          created_at?: string | null
          fb_access_token?: string | null
          fb_pixel_id?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          allowed_domains?: string | null
          created_at?: string | null
          fb_access_token?: string | null
          fb_pixel_id?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: number
          pageviews: number | null
          project_id: number | null
          referrer: string | null
          session_id: string
          started_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string
        }
        Insert: {
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: number
          pageviews?: number | null
          project_id?: number | null
          referrer?: string | null
          session_id: string
          started_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id: string
        }
        Update: {
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: number
          pageviews?: number | null
          project_id?: number | null
          referrer?: string | null
          session_id?: string
          started_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_examples: {
        Row: {
          created_at: string | null
          id: string
          message: string
          role: string | null
          stage_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          role?: string | null
          stage_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          role?: string | null
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_examples_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "agent_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_variables: {
        Row: {
          created_at: string | null
          description: string | null
          field_name: string
          field_type: string | null
          id: string
          is_required: boolean | null
          stage_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          field_name: string
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          stage_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          field_name?: string
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_variables_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "agent_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          city: string | null
          client_ip: string | null
          client_user_agent: string | null
          conversion_date: string | null
          conversion_source: string | null
          conversion_value: number | null
          converted: boolean | null
          country: string | null
          created_at: string | null
          days_to_convert: number | null
          device_browser: string | null
          device_os: string | null
          device_screen: string | null
          device_type: string | null
          email: string | null
          empresa: string | null
          facebook_id: string | null
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          fingerprint: string | null
          first_referrer: string | null
          first_seen: string | null
          first_utm_campaign: string | null
          first_utm_content: string | null
          first_utm_medium: string | null
          first_utm_source: string | null
          first_utm_term: string | null
          id: number
          instagram: string | null
          last_seen: string | null
          max_scroll_depth: number | null
          name: string | null
          phone: string | null
          project_id: number | null
          state: string | null
          status: string | null
          total_pageviews: number | null
          total_time_seconds: number | null
          total_visits: number | null
          updated_at: string | null
          visitor_id: string
          whatsapp_contacted: boolean | null
          whatsapp_date: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          client_ip?: string | null
          client_user_agent?: string | null
          conversion_date?: string | null
          conversion_source?: string | null
          conversion_value?: number | null
          converted?: boolean | null
          country?: string | null
          created_at?: string | null
          days_to_convert?: number | null
          device_browser?: string | null
          device_os?: string | null
          device_screen?: string | null
          device_type?: string | null
          email?: string | null
          empresa?: string | null
          facebook_id?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          fingerprint?: string | null
          first_referrer?: string | null
          first_seen?: string | null
          first_utm_campaign?: string | null
          first_utm_content?: string | null
          first_utm_medium?: string | null
          first_utm_source?: string | null
          first_utm_term?: string | null
          id?: number
          instagram?: string | null
          last_seen?: string | null
          max_scroll_depth?: number | null
          name?: string | null
          phone?: string | null
          project_id?: number | null
          state?: string | null
          status?: string | null
          total_pageviews?: number | null
          total_time_seconds?: number | null
          total_visits?: number | null
          updated_at?: string | null
          visitor_id: string
          whatsapp_contacted?: boolean | null
          whatsapp_date?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          client_ip?: string | null
          client_user_agent?: string | null
          conversion_date?: string | null
          conversion_source?: string | null
          conversion_value?: number | null
          converted?: boolean | null
          country?: string | null
          created_at?: string | null
          days_to_convert?: number | null
          device_browser?: string | null
          device_os?: string | null
          device_screen?: string | null
          device_type?: string | null
          email?: string | null
          empresa?: string | null
          facebook_id?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          fingerprint?: string | null
          first_referrer?: string | null
          first_seen?: string | null
          first_utm_campaign?: string | null
          first_utm_content?: string | null
          first_utm_medium?: string | null
          first_utm_source?: string | null
          first_utm_term?: string | null
          id?: number
          instagram?: string | null
          last_seen?: string | null
          max_scroll_depth?: number | null
          name?: string | null
          phone?: string | null
          project_id?: number | null
          state?: string | null
          status?: string | null
          total_pageviews?: number | null
          total_time_seconds?: number | null
          total_visits?: number | null
          updated_at?: string | null
          visitor_id?: string
          whatsapp_contacted?: boolean | null
          whatsapp_date?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          base_url: string
          created_at: string
          description: string | null
          id: string
          instance_name: string
          status: string
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          base_url?: string
          created_at?: string
          description?: string | null
          id?: string
          instance_name: string
          status?: string
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          base_url?: string
          created_at?: string
          description?: string | null
          id?: string
          instance_name?: string
          status?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          created_at: string | null
          from_me: boolean | null
          id: number
          matched: boolean | null
          message: string | null
          phone: string
          project_id: number | null
          push_name: string | null
          raw_data: Json | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string | null
          from_me?: boolean | null
          id?: number
          matched?: boolean | null
          message?: string | null
          phone: string
          project_id?: number | null
          push_name?: string | null
          raw_data?: Json | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string | null
          from_me?: boolean | null
          id?: number
          matched?: boolean | null
          message?: string | null
          phone?: string
          project_id?: number | null
          push_name?: string | null
          raw_data?: Json | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
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
    Enums: {},
  },
} as const
