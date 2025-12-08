// Supabase Edge Function: telemetry-ingest
// Docs: https://supabase.com/docs/guides/functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request): Promise<Response> => {
  try {
    // 1. Verify API Key from Headers
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API Key" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Init Supabase Admin Client (bypasses RLS for ingestion)
    const supabaseUrl = Deno.env.get("https://sssrhomzojggryxcnkij.supabase.co") ?? "";
    const serviceRoleKey = Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzc3Job216b2pnZ3J5eGNua2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODEwOTksImV4cCI6MjA4MDc1NzA5OX0.EQt1vrqrsNGSFJ8BC-rviS-H_f7udgKMuyNsu2qCof4") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 3. Find Device
    const { data: device, error: devError } = await supabase
      .from("devices")
      .select("id, machine_id")
      .eq("api_key", apiKey)
      .single();

    if (devError || !device) {
      console.error("Invalid API Key", devError);
      return new Response(JSON.stringify({ error: "Invalid API Key" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Parse Telemetry Payload
    const body = await req.json();
    const {
      timestamp,
      gpsLat,
      gpsLng,
      fuelLevel,
      engineRpm,
      speed,
      engineHours,
    } = body ?? {};

    if (
      gpsLat === undefined ||
      gpsLng === undefined ||
      fuelLevel === undefined ||
      engineRpm === undefined ||
      speed === undefined ||
      engineHours === undefined
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required telemetry fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 5. Optional: Fetch last telemetry to detect anomalies (e.g., fuel theft)
    const { data: lastTelem, error: lastError } = await supabase
      .from("telemetry")
      .select("timestamp, fuel_level_percent")
      .eq("device_id", device.id)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastError) {
      console.warn("Could not fetch last telemetry", lastError);
    }

    if (lastTelem) {
      const fuelDrop = lastTelem.fuel_level_percent - fuelLevel;
      if (fuelDrop > 5) {
        console.log(
          `[ALERT] Potential Fuel Theft detected for device ${device.id}`,
        );
        // TODO: Insert into alerts table or trigger notification
      }
    }

    // 6. Insert Telemetry
    const { error: insertError } = await supabase.from("telemetry").insert({
      device_id: device.id,
      timestamp: timestamp || new Date().toISOString(),
      gps_lat: gpsLat,
      gps_lng: gpsLng,
      fuel_level_percent: fuelLevel,
      engine_rpm: engineRpm,
      speed_kmh: speed,
      engine_hours_total: engineHours,
      is_ignition_on: engineRpm > 300,
    });

    if (insertError) {
      console.error("Insert error", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error in telemetry-ingest", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
