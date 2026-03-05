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
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
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
          created_at: string
          currency: string
          estimated_delivery: string | null
          guest_email: string | null
          id: string
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_status: string
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
          created_at?: string
          currency?: string
          estimated_delivery?: string | null
          guest_email?: string | null
          id?: string
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_status?: string
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
          created_at?: string
          currency?: string
          estimated_delivery?: string | null
          guest_email?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_status?: string
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
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
          additional_image_urls: string[] | null
          availability_status: string
          category_id: string | null
          color: string
          compatible_kitchen_layouts: string[] | null
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
          depth_inches: number | null
          depth_mm: number
          discount_percentage: number
          height_inches: number | null
          height_mm: number
          id: string
          installation_instructions_url: string | null
          is_featured: boolean
          long_description: string | null
          main_image_url: string | null
          manufacturer: string | null
          material: string
          price_discounted_usd: number
          price_retail_usd: number
          product_code: string
          product_name: string
          seller_id: string | null
          short_description: string | null
          stock_level: number
          style: string
          tag: string | null
          updated_at: string
          width_inches: number | null
          width_mm: number
        }
        Insert: {
          additional_image_urls?: string[] | null
          availability_status?: string
          category_id?: string | null
          color: string
          compatible_kitchen_layouts?: string[] | null
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
          depth_inches?: number | null
          depth_mm: number
          discount_percentage?: number
          height_inches?: number | null
          height_mm: number
          id?: string
          installation_instructions_url?: string | null
          is_featured?: boolean
          long_description?: string | null
          main_image_url?: string | null
          manufacturer?: string | null
          material: string
          price_discounted_usd: number
          price_retail_usd: number
          product_code: string
          product_name: string
          seller_id?: string | null
          short_description?: string | null
          stock_level?: number
          style: string
          tag?: string | null
          updated_at?: string
          width_inches?: number | null
          width_mm: number
        }
        Update: {
          additional_image_urls?: string[] | null
          availability_status?: string
          category_id?: string | null
          color?: string
          compatible_kitchen_layouts?: string[] | null
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
          depth_inches?: number | null
          depth_mm?: number
          discount_percentage?: number
          height_inches?: number | null
          height_mm?: number
          id?: string
          installation_instructions_url?: string | null
          is_featured?: boolean
          long_description?: string | null
          main_image_url?: string | null
          manufacturer?: string | null
          material?: string
          price_discounted_usd?: number
          price_retail_usd?: number
          product_code?: string
          product_name?: string
          seller_id?: string | null
          short_description?: string | null
          stock_level?: number
          style?: string
          tag?: string | null
          updated_at?: string
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
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          location: string | null
          phone: string | null
          updated_at: string
          user_type: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_type: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_type?: string
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
