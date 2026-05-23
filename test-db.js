const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert({
      order_no: "TEST-1234",
      product_kind: "balance",
      product_code: "STANDARD",
      amount: 98000,
      buyer_name: "Test",
      buyer_phone: "01012345678",
      status: "pending",
      user_provider: null,
      user_provider_account_id: null,
      user_email: null,
      contact_email: null,
      os_targets: null
    });
  
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
