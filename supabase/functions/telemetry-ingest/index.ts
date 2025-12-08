
// Follow this setup: https://supabase.com/docs/guides/functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

serve(async (req) => {
  // 1. Verify API Key from Headers
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing API Key' }), { status: 401 });
  }

  // 2. Init Supabase Admin Client (to bypass RLS for ingestion)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // 3. Find Device
  const { data: device, error: devError } = await supabase
    .from('devices')
    .select('id, machine_id')
    .eq('api_key', apiKey)
    .single();

  if (devError || !device) {
    return new Response(JSON.stringify({ error: 'Invalid Device' }), { status: 403 });
  }

  // 4. Parse Payload
  const body = await req.json();
  const { gpsLat, gpsLng, fuelLevel, engineRpm, speed, engineHours, timestamp } = body;

  // 5. Fuel Anomaly Detection Logic (Simple Heuristic)
  // Retrieve last telemetry to compare fuel
  const { data: lastTelem } = await supabase
    .from('telemetry')
    .select('fuel_level_percent, timestamp')
    .eq('device_id', device.id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (lastTelem) {
      const fuelDrop = lastTelem.fuel_level_percent - fuelLevel;
      // If fuel drops > 5% in less than 10 mins without engine load? Suspect theft.
      // (This is a simplified example)
      if (fuelDrop > 5) {
          console.log(`[ALERT] Potential Fuel Theft detected for device ${device.id}`);
          // TODO: Insert into alerts table or trigger notification
      }
  }

  // 6. Insert Telemetry
  const { error: insertError } = await supabase
    .from('telemetry')
    .insert({
        device_id: device.id,
        timestamp: timestamp || new Date().toISOString(),
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        fuel_level_percent: fuelLevel,
        engine_rpm: engineRpm,
        speed_kmh: speed,
        engine_hours_total: engineHours,
        is_ignition_on: engineRpm > 300
    });

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
})