import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gioatsiyyngoxmvuqotp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpb2F0c2l5eW5nb3htdnVxb3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MzE4NzMsImV4cCI6MjA4MjAwNzg3M30.Zc822Xs1K4NQf6ZZFrd4js23Vt0J_qobxLndmVAJmbI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
