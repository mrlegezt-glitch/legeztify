import { createClient } from '@supabase/supabase-js';

// User provided keys
const supabaseUrl = 'https://krmqapwqqnjcjcgkdcaq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybXFhcHdxcW5qY2pjZ2tkY2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODYzNDMsImV4cCI6MjA4MTY2MjM0M30.Xl7ujaesKnpxEmPrCcwquGDtP-_tbzKQDdcK5u8jCw0';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface FavoriteSong {
    id?: number;
    video_id: string;
    title: string;
    artist: string;
    thumbnail: string;
    stream_url: string;
    created_at?: string;
}
