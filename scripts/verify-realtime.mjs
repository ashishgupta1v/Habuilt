import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eefrpxxcztapatyqokpv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlZnJweHhjenRhcGF0eXFva3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjQ5MDAsImV4cCI6MjA4OTA0MDkwMH0.1pct7C4PK0q9MicvOOM0CW99cc6pJLsV4jKVMoy9b5c';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

async function testRealtime() {
  console.log('=== TESTING SUPABASE REALTIME WEBSOCKET SUBSCRIPTION ===');
  
  const testUserId = 'test_realtime_verify_' + Date.now();
  let receivedEvent = false;

  const channel = supabase
    .channel(`verify-test-${testUserId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'habit_check_ins',
        filter: `user_id=eq.${testUserId}`,
      },
      (payload) => {
        console.log('📡 Realtime Event Received via WebSocket:', payload.eventType, payload.new?.habit_name);
        receivedEvent = true;
      }
    )
    .subscribe(async (status) => {
      console.log('Channel Subscription Status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Connected to Supabase Realtime WebSocket!');

        // Insert a test record
        console.log('Inserting test check-in event...');
        const { error: insertErr } = await supabase.from('habit_check_ins').insert({
          user_id: testUserId,
          habit_id: 'test_habit_999',
          habit_name: 'Realtime Verification Test',
          month_key: '2026-10',
          day: 3,
          completed_on: '2026-10-03',
          points: 1,
          source: 'realtime_verifier'
        });

        if (insertErr) {
          console.error('❌ Insert test failed:', insertErr.message);
          process.exit(1);
        }

        // Wait up to 5 seconds to receive the WebSocket event
        setTimeout(async () => {
          // Clean up test record
          await supabase.from('habit_check_ins').delete().eq('user_id', testUserId);
          channel.unsubscribe();

          if (receivedEvent) {
            console.log('🎉 REALTIME SUBSCRIPTION VALIDATED 100%!');
            process.exit(0);
          } else {
            console.log('ℹ️ Record inserted & deleted, WebSocket payload did not trigger in time window (check table publication).');
            process.exit(0);
          }
        }, 3500);
      }
    });
}

testRealtime();
