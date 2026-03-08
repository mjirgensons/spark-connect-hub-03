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
      admin_emails: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_category: string | null
          event_label: string | null
          event_type: string
          event_value: number | null
          id: string
          metadata: Json | null
          page_path: string | null
          referrer: string | null
          screen_height: number | null
          screen_width: number | null
          session_id: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          event_category?: string | null
          event_label?: string | null
          event_type: string
          event_value?: number | null
          id?: string
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          event_category?: string | null
          event_label?: string | null
          event_type?: string
          event_value?: number | null
          id?: string
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      analytics_sessions: {
        Row: {
          duration_seconds: number | null
          event_count: number | null
          first_page: string | null
          id: string
          is_bounce: boolean | null
          last_activity_at: string
          last_page: string | null
          page_count: number | null
          referrer: string | null
          screen_height: number | null
          screen_width: number | null
          session_id: string
          started_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          duration_seconds?: number | null
          event_count?: number | null
          first_page?: string | null
          id?: string
          is_bounce?: boolean | null
          last_activity_at?: string
          last_page?: string | null
          page_count?: number | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id: string
          started_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          duration_seconds?: number | null
          event_count?: number | null
          first_page?: string | null
          id?: string
          is_bounce?: boolean | null
          last_activity_at?: string
          last_page?: string | null
          page_count?: number | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string
          started_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string
          category: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          category?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          category?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          layout_type: string | null
          name: string
          parent_category_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          layout_type?: string | null
          name: string
          parent_category_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          layout_type?: string | null
          name?: string
          parent_category_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          confidence_score: number | null
          content: string
          created_at: string | null
          id: number
          latency_ms: number | null
          message_type: string
          retrieved_doc_ids: string[] | null
          session_id: string
          token_count: number | null
          was_cached: boolean | null
        }
        Insert: {
          confidence_score?: number | null
          content: string
          created_at?: string | null
          id?: number
          latency_ms?: number | null
          message_type: string
          retrieved_doc_ids?: string[] | null
          session_id: string
          token_count?: number | null
          was_cached?: boolean | null
        }
        Update: {
          confidence_score?: number | null
          content?: string
          created_at?: string | null
          id?: number
          latency_ms?: number | null
          message_type?: string
          retrieved_doc_ids?: string[] | null
          session_id?: string
          token_count?: number | null
          was_cached?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          buyer_email: string | null
          buyer_id: string | null
          chatbot_mode: string
          consent_at: string | null
          consent_given: boolean | null
          escalated_at: string | null
          escalation_reason: string | null
          id: string
          last_active_at: string | null
          metadata: Json | null
          seller_id: string | null
          session_id: string
          started_at: string | null
          status: string | null
          user_role: string | null
        }
        Insert: {
          buyer_email?: string | null
          buyer_id?: string | null
          chatbot_mode: string
          consent_at?: string | null
          consent_given?: boolean | null
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          last_active_at?: string | null
          metadata?: Json | null
          seller_id?: string | null
          session_id: string
          started_at?: string | null
          status?: string | null
          user_role?: string | null
        }
        Update: {
          buyer_email?: string | null
          buyer_id?: string | null
          chatbot_mode?: string
          consent_at?: string | null
          consent_given?: boolean | null
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          last_active_at?: string | null
          metadata?: Json | null
          seller_id?: string | null
          session_id?: string
          started_at?: string | null
          status?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      chat_summaries: {
        Row: {
          created_at: string | null
          id: number
          messages_covered: number | null
          session_id: string
          summary_text: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          messages_covered?: number | null
          session_id: string
          summary_text: string
        }
        Update: {
          created_at?: string | null
          id?: number
          messages_covered?: number | null
          session_id?: string
          summary_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_summaries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          direction: string
          error_message: string | null
          from_address: string
          html_body: string | null
          id: string
          locale: string | null
          mailgun_message_id: string | null
          metadata: Json | null
          opened_at: string | null
          pinecone_synced: boolean
          pinecone_synced_at: string | null
          plain_text_body: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          reply_to: string | null
          status: string | null
          subject: string
          template_key: string | null
          to_address: string
          user_email: string
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          direction: string
          error_message?: string | null
          from_address: string
          html_body?: string | null
          id?: string
          locale?: string | null
          mailgun_message_id?: string | null
          metadata?: Json | null
          opened_at?: string | null
          pinecone_synced?: boolean
          pinecone_synced_at?: string | null
          plain_text_body?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          reply_to?: string | null
          status?: string | null
          subject: string
          template_key?: string | null
          to_address: string
          user_email: string
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          direction?: string
          error_message?: string | null
          from_address?: string
          html_body?: string | null
          id?: string
          locale?: string | null
          mailgun_message_id?: string | null
          metadata?: Json | null
          opened_at?: string | null
          pinecone_synced?: boolean
          pinecone_synced_at?: string | null
          plain_text_body?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          reply_to?: string | null
          status?: string | null
          subject?: string
          template_key?: string | null
          to_address?: string
          user_email?: string
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_logs: {
        Row: {
          action: string
          banner_version: string | null
          categories: Json
          created_at: string
          id: string
          ip_hash: string | null
          page_url: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          banner_version?: string | null
          categories?: Json
          created_at?: string
          id?: string
          ip_hash?: string | null
          page_url?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          banner_version?: string | null
          categories?: Json
          created_at?: string
          id?: string
          ip_hash?: string | null
          page_url?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      contractor_details: {
        Row: {
          bio: string | null
          id: string
          is_verified: boolean | null
          jobs_completed: number | null
          portfolio_url: string | null
          rating: number | null
          service_areas: string[]
          trade_types: string[]
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          id: string
          is_verified?: boolean | null
          jobs_completed?: number | null
          portfolio_url?: string | null
          rating?: number | null
          service_areas?: string[]
          trade_types?: string[]
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          id?: string
          is_verified?: boolean | null
          jobs_completed?: number | null
          portfolio_url?: string | null
          rating?: number | null
          service_areas?: string[]
          trade_types?: string[]
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_id: string
          buyer_unread_count: number | null
          created_at: string | null
          id: string
          last_message_at: string | null
          product_id: string | null
          seller_id: string
          seller_unread_count: number | null
          status: string | null
          subject: string | null
        }
        Insert: {
          buyer_id: string
          buyer_unread_count?: number | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          product_id?: string | null
          seller_id: string
          seller_unread_count?: number | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          buyer_id?: string
          buyer_unread_count?: number | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          product_id?: string | null
          seller_id?: string
          seller_unread_count?: number | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cookie_categories: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          is_default: boolean
          is_required: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_required?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_required?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      cookie_definitions: {
        Row: {
          category_id: string
          created_at: string
          duration: string
          id: string
          is_active: boolean
          name: string
          provider: string
          purpose: string
          type: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          duration?: string
          id?: string
          is_active?: boolean
          name: string
          provider?: string
          purpose?: string
          type?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          duration?: string
          id?: string
          is_active?: boolean
          name?: string
          provider?: string
          purpose?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cookie_definitions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cookie_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      email_consent_log: {
        Row: {
          consent_category: string
          consent_text: string
          consent_type: string
          created_at: string | null
          email: string
          granted: boolean
          id: string
          ip_address: string | null
          source: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent_category: string
          consent_text: string
          consent_type: string
          created_at?: string | null
          email: string
          granted: boolean
          id?: string
          ip_address?: string | null
          source: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_category?: string
          consent_text?: string
          consent_type?: string
          created_at?: string | null
          email?: string
          granted?: boolean
          id?: string
          ip_address?: string | null
          source?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_consent_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          casl_category: string | null
          category: string
          created_at: string | null
          customer_type: string
          display_name: string
          from_email: string | null
          from_name: string | null
          html_body: string
          id: string
          is_active: boolean | null
          locale: string | null
          plain_text_body: string | null
          reply_to: string | null
          requires_consent: boolean | null
          subject: string
          template_key: string
          updated_at: string | null
          variables_schema: Json | null
          version: number | null
        }
        Insert: {
          casl_category?: string | null
          category?: string
          created_at?: string | null
          customer_type?: string
          display_name: string
          from_email?: string | null
          from_name?: string | null
          html_body: string
          id?: string
          is_active?: boolean | null
          locale?: string | null
          plain_text_body?: string | null
          reply_to?: string | null
          requires_consent?: boolean | null
          subject: string
          template_key: string
          updated_at?: string | null
          variables_schema?: Json | null
          version?: number | null
        }
        Update: {
          casl_category?: string | null
          category?: string
          created_at?: string | null
          customer_type?: string
          display_name?: string
          from_email?: string | null
          from_name?: string | null
          html_body?: string
          id?: string
          is_active?: boolean | null
          locale?: string | null
          plain_text_body?: string | null
          reply_to?: string | null
          requires_consent?: boolean | null
          subject?: string
          template_key?: string
          updated_at?: string | null
          variables_schema?: Json | null
          version?: number | null
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          created_at: string
          group_id: string
          group_title: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          group_id: string
          group_title: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          group_id?: string
          group_title?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      footer_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          section: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          section: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          section?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          category: string
          config: Json
          created_at: string
          display_name: string
          encrypted_credentials: Json | null
          id: string
          is_enabled: boolean
          last_health_check: string | null
          last_health_status: string | null
          notes: string | null
          service_name: string
          status: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string
          display_name: string
          encrypted_credentials?: Json | null
          id?: string
          is_enabled?: boolean
          last_health_check?: string | null
          last_health_status?: string | null
          notes?: string | null
          service_name: string
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          display_name?: string
          encrypted_credentials?: Json | null
          id?: string
          is_enabled?: boolean
          last_health_check?: string | null
          last_health_status?: string | null
          notes?: string | null
          service_name?: string
          status?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      marketing_consents: {
        Row: {
          casl_proof: Json | null
          consent_at: string | null
          consent_source: string | null
          consent_type: string
          email: string
          express_withdrawn_at: string | null
          id: string
          implied_expires_at: string | null
        }
        Insert: {
          casl_proof?: Json | null
          consent_at?: string | null
          consent_source?: string | null
          consent_type: string
          email: string
          express_withdrawn_at?: string | null
          id?: string
          implied_expires_at?: string | null
        }
        Update: {
          casl_proof?: Json | null
          consent_at?: string | null
          consent_source?: string | null
          consent_type?: string
          email?: string
          express_withdrawn_at?: string | null
          id?: string
          implied_expires_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message_body: string
          message_type: string
          recipient_id: string
          related_order_id: string | null
          related_product_id: string | null
          sender_id: string
        }
        Insert: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_body: string
          message_type?: string
          recipient_id: string
          related_order_id?: string | null
          related_product_id?: string | null
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_body?: string
          message_type?: string
          recipient_id?: string
          related_order_id?: string | null
          related_product_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          consent_text: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          source: string
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          consent_text: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          consent_text?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      order_disputes: {
        Row: {
          admin_note: string | null
          buyer_email: string
          buyer_id: string | null
          created_at: string | null
          description: string | null
          dispute_type: string
          id: string
          order_id: string
          resolved_at: string | null
          seller_responded_at: string | null
          seller_response: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          buyer_email: string
          buyer_id?: string | null
          created_at?: string | null
          description?: string | null
          dispute_type: string
          id?: string
          order_id: string
          resolved_at?: string | null
          seller_responded_at?: string | null
          seller_response?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          buyer_email?: string
          buyer_id?: string | null
          created_at?: string | null
          description?: string | null
          dispute_type?: string
          id?: string
          order_id?: string
          resolved_at?: string | null
          seller_responded_at?: string | null
          seller_response?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_disputes_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          order_id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          product_sku?: string | null
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          acknowledged_at: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          currency: string
          deadline_notifications_sent: Json
          delivered_at: string | null
          delivery_check_sent_at: string | null
          delivery_confirmed_at: string | null
          delivery_expected_by: string | null
          estimated_delivery: string | null
          funds_released_at: string | null
          guest_email: string | null
          id: string
          must_acknowledge_by: string | null
          must_ship_by: string | null
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_status: string
          platform_fee_cents: number | null
          preparing_at: string | null
          seller_id: string | null
          seller_payout_cents: number | null
          shipped_at: string | null
          shipping_address_line_1: string
          shipping_address_line_2: string | null
          shipping_city: string
          shipping_cost: number
          shipping_country: string
          shipping_method: string | null
          shipping_name: string
          shipping_phone: string | null
          shipping_postal_code: string
          shipping_province: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          stripe_transfer_group: string | null
          stripe_transfer_id: string | null
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          deadline_notifications_sent?: Json
          delivered_at?: string | null
          delivery_check_sent_at?: string | null
          delivery_confirmed_at?: string | null
          delivery_expected_by?: string | null
          estimated_delivery?: string | null
          funds_released_at?: string | null
          guest_email?: string | null
          id?: string
          must_acknowledge_by?: string | null
          must_ship_by?: string | null
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_status?: string
          platform_fee_cents?: number | null
          preparing_at?: string | null
          seller_id?: string | null
          seller_payout_cents?: number | null
          shipped_at?: string | null
          shipping_address_line_1: string
          shipping_address_line_2?: string | null
          shipping_city: string
          shipping_cost?: number
          shipping_country?: string
          shipping_method?: string | null
          shipping_name: string
          shipping_phone?: string | null
          shipping_postal_code: string
          shipping_province: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_group?: string | null
          stripe_transfer_id?: string | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          deadline_notifications_sent?: Json
          delivered_at?: string | null
          delivery_check_sent_at?: string | null
          delivery_confirmed_at?: string | null
          delivery_expected_by?: string | null
          estimated_delivery?: string | null
          funds_released_at?: string | null
          guest_email?: string | null
          id?: string
          must_acknowledge_by?: string | null
          must_ship_by?: string | null
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_status?: string
          platform_fee_cents?: number | null
          preparing_at?: string | null
          seller_id?: string | null
          seller_payout_cents?: number | null
          shipped_at?: string | null
          shipping_address_line_1?: string
          shipping_address_line_2?: string | null
          shipping_city?: string
          shipping_cost?: number
          shipping_country?: string
          shipping_method?: string | null
          shipping_name?: string
          shipping_phone?: string | null
          shipping_postal_code?: string
          shipping_province?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_group?: string | null
          stripe_transfer_id?: string | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_compatible_appliances: {
        Row: {
          appliance_type: string
          brand: string | null
          created_at: string
          dimensions: Json | null
          id: string
          model_name: string | null
          model_number: string | null
          notes: string | null
          product_id: string
          reference_url: string | null
          sort_order: number | null
        }
        Insert: {
          appliance_type: string
          brand?: string | null
          created_at?: string
          dimensions?: Json | null
          id?: string
          model_name?: string | null
          model_number?: string | null
          notes?: string | null
          product_id: string
          reference_url?: string | null
          sort_order?: number | null
        }
        Update: {
          appliance_type?: string
          brand?: string | null
          created_at?: string
          dimensions?: Json | null
          id?: string
          model_name?: string | null
          model_number?: string | null
          notes?: string | null
          product_id?: string
          reference_url?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_compatible_appliances_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string
          description: string | null
          discount_percentage: number | null
          id: string
          inclusion_status: string
          option_name: string
          option_type: string
          price_discounted: number | null
          price_retail: number | null
          product_id: string
          sort_order: number | null
          specifications: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          inclusion_status?: string
          option_name: string
          option_type: string
          price_discounted?: number | null
          price_retail?: number | null
          product_id: string
          sort_order?: number | null
          specifications?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          inclusion_status?: string
          option_name?: string
          option_type?: string
          price_discounted?: number | null
          price_retail?: number | null
          product_id?: string
          sort_order?: number | null
          specifications?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_questions: {
        Row: {
          buyer_id: string
          buyer_name: string | null
          created_at: string | null
          id: string
          is_public: boolean | null
          option_id: string | null
          pinecone_synced: boolean
          pinecone_synced_at: string | null
          product_id: string
          question_text: string
          response_date: string | null
          seller_id: string | null
          seller_response: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          buyer_name?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          option_id?: string | null
          pinecone_synced?: boolean
          pinecone_synced_at?: string | null
          product_id: string
          question_text: string
          response_date?: string | null
          seller_id?: string | null
          seller_response?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          buyer_name?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          option_id?: string | null
          pinecone_synced?: boolean
          pinecone_synced_at?: string | null
          product_id?: string
          question_text?: string
          response_date?: string | null
          seller_id?: string | null
          seller_response?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_questions_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_questions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          admin_note: string | null
          body: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          reviewer_name: string
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          body?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          reviewer_name: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          body?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          reviewer_name?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          additional_image_urls: string[] | null
          availability_status: string | null
          color: string | null
          created_at: string
          finish: string | null
          id: string
          main_image_url: string | null
          material: string | null
          price_discounted: number | null
          price_retail: number | null
          product_id: string
          sort_order: number | null
          stock_level: number | null
          updated_at: string
          variant_name: string
        }
        Insert: {
          additional_image_urls?: string[] | null
          availability_status?: string | null
          color?: string | null
          created_at?: string
          finish?: string | null
          id?: string
          main_image_url?: string | null
          material?: string | null
          price_discounted?: number | null
          price_retail?: number | null
          product_id: string
          sort_order?: number | null
          stock_level?: number | null
          updated_at?: string
          variant_name: string
        }
        Update: {
          additional_image_urls?: string[] | null
          availability_status?: string | null
          color?: string | null
          created_at?: string
          finish?: string | null
          id?: string
          main_image_url?: string | null
          material?: string | null
          price_discounted?: number | null
          price_retail?: number | null
          product_id?: string
          sort_order?: number | null
          stock_level?: number | null
          updated_at?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          additional_features: Json | null
          additional_image_urls: string[] | null
          availability_status: string
          category_id: string | null
          color: string
          compatible_kitchen_layouts: string[] | null
          condition: string | null
          condition_notes: string | null
          construction_type: string | null
          countertop_discount_percentage: number | null
          countertop_finish: string | null
          countertop_included: boolean | null
          countertop_material: string | null
          countertop_option: string | null
          countertop_price_discounted: number | null
          countertop_price_retail: number | null
          countertop_stock: number | null
          countertop_thickness: string | null
          created_at: string
          deleted_at: string | null
          delivery_option: string | null
          delivery_prep_days: number | null
          delivery_price: number | null
          delivery_zone: string | null
          depth_inches: number | null
          depth_mm: number
          discount_percentage: number
          door_material: string | null
          door_style: string | null
          finish_type: string | null
          hardware_details: Json | null
          height_inches: number | null
          height_mm: number
          hinge_brand: string | null
          hinge_model: string | null
          id: string
          installation_instructions_url: string | null
          is_custom_order: boolean | null
          is_featured: boolean
          lead_time_days: number | null
          listing_rejection_reason: string | null
          listing_status: string
          long_description: string | null
          main_image_url: string | null
          manufacturer: string | null
          material: string
          measurement_standard: string | null
          pickup_address: string | null
          pickup_available: boolean | null
          pickup_city: string | null
          pickup_phone: string | null
          pickup_postal_code: string | null
          pickup_prep_days: number | null
          pickup_province: string | null
          pinecone_synced: boolean | null
          previous_rejection_reason: string | null
          price_discounted_usd: number
          price_retail_usd: number
          product_code: string
          product_name: string
          resubmission_count: number
          seller_id: string | null
          short_description: string | null
          slide_brand: string | null
          slide_model: string | null
          stock_level: number
          style: string
          tag: string | null
          technical_drawings_url: string | null
          updated_at: string
          wall_a_length_mm: number | null
          wall_b_length_mm: number | null
          wall_c_length_mm: number | null
          width_inches: number | null
          width_mm: number
        }
        Insert: {
          additional_features?: Json | null
          additional_image_urls?: string[] | null
          availability_status?: string
          category_id?: string | null
          color: string
          compatible_kitchen_layouts?: string[] | null
          condition?: string | null
          condition_notes?: string | null
          construction_type?: string | null
          countertop_discount_percentage?: number | null
          countertop_finish?: string | null
          countertop_included?: boolean | null
          countertop_material?: string | null
          countertop_option?: string | null
          countertop_price_discounted?: number | null
          countertop_price_retail?: number | null
          countertop_stock?: number | null
          countertop_thickness?: string | null
          created_at?: string
          deleted_at?: string | null
          delivery_option?: string | null
          delivery_prep_days?: number | null
          delivery_price?: number | null
          delivery_zone?: string | null
          depth_inches?: number | null
          depth_mm: number
          discount_percentage?: number
          door_material?: string | null
          door_style?: string | null
          finish_type?: string | null
          hardware_details?: Json | null
          height_inches?: number | null
          height_mm: number
          hinge_brand?: string | null
          hinge_model?: string | null
          id?: string
          installation_instructions_url?: string | null
          is_custom_order?: boolean | null
          is_featured?: boolean
          lead_time_days?: number | null
          listing_rejection_reason?: string | null
          listing_status?: string
          long_description?: string | null
          main_image_url?: string | null
          manufacturer?: string | null
          material: string
          measurement_standard?: string | null
          pickup_address?: string | null
          pickup_available?: boolean | null
          pickup_city?: string | null
          pickup_phone?: string | null
          pickup_postal_code?: string | null
          pickup_prep_days?: number | null
          pickup_province?: string | null
          pinecone_synced?: boolean | null
          previous_rejection_reason?: string | null
          price_discounted_usd: number
          price_retail_usd: number
          product_code: string
          product_name: string
          resubmission_count?: number
          seller_id?: string | null
          short_description?: string | null
          slide_brand?: string | null
          slide_model?: string | null
          stock_level?: number
          style: string
          tag?: string | null
          technical_drawings_url?: string | null
          updated_at?: string
          wall_a_length_mm?: number | null
          wall_b_length_mm?: number | null
          wall_c_length_mm?: number | null
          width_inches?: number | null
          width_mm: number
        }
        Update: {
          additional_features?: Json | null
          additional_image_urls?: string[] | null
          availability_status?: string
          category_id?: string | null
          color?: string
          compatible_kitchen_layouts?: string[] | null
          condition?: string | null
          condition_notes?: string | null
          construction_type?: string | null
          countertop_discount_percentage?: number | null
          countertop_finish?: string | null
          countertop_included?: boolean | null
          countertop_material?: string | null
          countertop_option?: string | null
          countertop_price_discounted?: number | null
          countertop_price_retail?: number | null
          countertop_stock?: number | null
          countertop_thickness?: string | null
          created_at?: string
          deleted_at?: string | null
          delivery_option?: string | null
          delivery_prep_days?: number | null
          delivery_price?: number | null
          delivery_zone?: string | null
          depth_inches?: number | null
          depth_mm?: number
          discount_percentage?: number
          door_material?: string | null
          door_style?: string | null
          finish_type?: string | null
          hardware_details?: Json | null
          height_inches?: number | null
          height_mm?: number
          hinge_brand?: string | null
          hinge_model?: string | null
          id?: string
          installation_instructions_url?: string | null
          is_custom_order?: boolean | null
          is_featured?: boolean
          lead_time_days?: number | null
          listing_rejection_reason?: string | null
          listing_status?: string
          long_description?: string | null
          main_image_url?: string | null
          manufacturer?: string | null
          material?: string
          measurement_standard?: string | null
          pickup_address?: string | null
          pickup_available?: boolean | null
          pickup_city?: string | null
          pickup_phone?: string | null
          pickup_postal_code?: string | null
          pickup_prep_days?: number | null
          pickup_province?: string | null
          pinecone_synced?: boolean | null
          previous_rejection_reason?: string | null
          price_discounted_usd?: number
          price_retail_usd?: number
          product_code?: string
          product_name?: string
          resubmission_count?: number
          seller_id?: string | null
          short_description?: string | null
          slide_brand?: string | null
          slide_model?: string | null
          stock_level?: number
          style?: string
          tag?: string | null
          technical_drawings_url?: string | null
          updated_at?: string
          wall_a_length_mm?: number | null
          wall_b_length_mm?: number | null
          wall_c_length_mm?: number | null
          width_inches?: number | null
          width_mm?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_chatbot_enabled: boolean | null
          auto_approve_products: boolean | null
          banner_url: string | null
          bio: string | null
          business_address: Json | null
          business_number: string | null
          business_type: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          gst_hst_number: string | null
          id: string
          location: string | null
          logo_url: string | null
          phone: string | null
          seller_ai_consent_accepted: boolean | null
          seller_branding_visible: boolean | null
          seller_restricted_at: string | null
          seller_restriction_reason: string | null
          seller_restriction_status: string | null
          seller_status: string | null
          seller_tier: string | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean | null
          stripe_onboarding_status: string | null
          stripe_payouts_enabled: boolean | null
          updated_at: string
          user_type: string
          website: string | null
        }
        Insert: {
          ai_chatbot_enabled?: boolean | null
          auto_approve_products?: boolean | null
          banner_url?: string | null
          bio?: string | null
          business_address?: Json | null
          business_number?: string | null
          business_type?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          gst_hst_number?: string | null
          id: string
          location?: string | null
          logo_url?: string | null
          phone?: string | null
          seller_ai_consent_accepted?: boolean | null
          seller_branding_visible?: boolean | null
          seller_restricted_at?: string | null
          seller_restriction_reason?: string | null
          seller_restriction_status?: string | null
          seller_status?: string | null
          seller_tier?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_status?: string | null
          stripe_payouts_enabled?: boolean | null
          updated_at?: string
          user_type: string
          website?: string | null
        }
        Update: {
          ai_chatbot_enabled?: boolean | null
          auto_approve_products?: boolean | null
          banner_url?: string | null
          bio?: string | null
          business_address?: Json | null
          business_number?: string | null
          business_type?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          gst_hst_number?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          phone?: string | null
          seller_ai_consent_accepted?: boolean | null
          seller_branding_visible?: boolean | null
          seller_restricted_at?: string | null
          seller_restriction_reason?: string | null
          seller_restriction_status?: string | null
          seller_status?: string | null
          seller_tier?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_status?: string | null
          stripe_payouts_enabled?: boolean | null
          updated_at?: string
          user_type?: string
          website?: string | null
        }
        Relationships: []
      }
      project_contractors: {
        Row: {
          contractor_id: string
          created_at: string
          id: string
          project_id: string
          status: string
          trade_type: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          id?: string
          project_id: string
          status?: string
          trade_type: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          id?: string
          project_id?: string
          status?: string
          trade_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_contractors_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          id: string
          notes: string | null
          opening_depth_mm: number | null
          opening_height_mm: number | null
          opening_width_mm: number | null
          product_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          opening_depth_mm?: number | null
          opening_height_mm?: number | null
          opening_width_mm?: number | null
          product_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          opening_depth_mm?: number | null
          opening_height_mm?: number | null
          opening_width_mm?: number | null
          product_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_request_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string | null
          product_name: string
          quantity: number
          quote_request_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          quote_request_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          quote_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_request_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_request_items_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          admin_notes: string | null
          company_name: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          delivery_address: string | null
          id: string
          notes: string | null
          project_timeline: string | null
          project_type: string | null
          quote_number: string
          quoted_at: string | null
          quoted_total: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          company_name?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          delivery_address?: string | null
          id?: string
          notes?: string | null
          project_timeline?: string | null
          project_type?: string | null
          quote_number: string
          quoted_at?: string | null
          quoted_total?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          company_name?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          delivery_address?: string | null
          id?: string
          notes?: string | null
          project_timeline?: string | null
          project_type?: string | null
          quote_number?: string
          quoted_at?: string | null
          quoted_total?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      seller_agreements: {
        Row: {
          accepted_at: string
          agreement_type: string
          agreement_version: string
          id: string
          ip_address: string | null
          seller_id: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          agreement_type: string
          agreement_version?: string
          id?: string
          ip_address?: string | null
          seller_id: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          agreement_type?: string
          agreement_version?: string
          id?: string
          ip_address?: string | null
          seller_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_agreements_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_knowledge_base: {
        Row: {
          content: string
          created_at: string | null
          id: string
          kb_type: string
          pinecone_synced: boolean | null
          seller_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          kb_type: string
          pinecone_synced?: boolean | null
          seller_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          kb_type?: string
          pinecone_synced?: boolean | null
          seller_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      seller_payouts: {
        Row: {
          created_at: string
          gross_amount_cents: number
          hst_on_commission_cents: number
          id: string
          order_id: string
          payout_status: string
          platform_fee_cents: number
          released_at: string | null
          seller_id: string
          seller_payout_cents: number
          stripe_fee_cents: number
          stripe_transfer_id: string | null
        }
        Insert: {
          created_at?: string
          gross_amount_cents?: number
          hst_on_commission_cents?: number
          id?: string
          order_id: string
          payout_status?: string
          platform_fee_cents?: number
          released_at?: string | null
          seller_id: string
          seller_payout_cents?: number
          stripe_fee_cents?: number
          stripe_transfer_id?: string | null
        }
        Update: {
          created_at?: string
          gross_amount_cents?: number
          hst_on_commission_cents?: number
          id?: string
          order_id?: string
          payout_status?: string
          platform_fee_cents?: number
          released_at?: string | null
          seller_id?: string
          seller_payout_cents?: number
          stripe_fee_cents?: number
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          phone: string | null
          postal_code: string
          province: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          phone?: string | null
          postal_code: string
          province: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          phone?: string | null
          postal_code?: string
          province?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          event_id: string
          event_type: string
          order_id: string | null
          payload: Json | null
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          order_id?: string | null
          payload?: Json | null
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          order_id?: string | null
          payload?: Json | null
          processed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_signals: {
        Row: {
          created_at: string
          icon_name: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_name: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          direction: string
          duration_ms: number | null
          endpoint_key: string | null
          error_message: string | null
          event_id: string | null
          event_type: string
          id: string
          integration_id: string | null
          is_replay: boolean
          is_test: boolean
          max_retries: number
          next_retry_at: string | null
          provider: string | null
          request_payload: Json | null
          response_body: string | null
          response_status: number | null
          retry_count: number
          status: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          direction: string
          duration_ms?: number | null
          endpoint_key?: string | null
          error_message?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          integration_id?: string | null
          is_replay?: boolean
          is_test?: boolean
          max_retries?: number
          next_retry_at?: string | null
          provider?: string | null
          request_payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          retry_count?: number
          status?: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          direction?: string
          duration_ms?: number | null
          endpoint_key?: string | null
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          integration_id?: string | null
          is_replay?: boolean
          is_test?: boolean
          max_retries?: number
          next_retry_at?: string | null
          provider?: string | null
          request_payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          retry_count?: number
          status?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_seller_health_score: {
        Args: { p_seller_id: string }
        Returns: Json
      }
      get_full_schema_dump: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
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
