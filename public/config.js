// Supabase Configuration
// ใช้ค่าจาก .env.local
const SUPABASE_CONFIG = {
    url: 'https://caysnmdwyiqvavolkclw.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNheXNubWR3eWlxdmF2b2xrY2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTc0OTgsImV4cCI6MjA4NTY3MzQ5OH0.ouUNLVGZ-h0tjaHQ3i430aMsFGl75yoDB0KrxRFws2s'
};

// Export for use in HTML files  
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}
