import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://caysnmdwyiqvavolkclw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNheXNubWR3eWlxdmF2b2xrY2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTc0OTgsImV4cCI6MjA4NTY3MzQ5OH0.ouUNLVGZ-h0tjaHQ3i430aMsFGl75yoDB0KrxRFws2s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
