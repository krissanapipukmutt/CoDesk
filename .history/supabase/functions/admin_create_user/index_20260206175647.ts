import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const defaultAllowedOrigins = ['http://localhost:5173'];
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const originAllowlist = allowedOrigins.length ? allowedOrigins : defaultAllowedOrigins;

const buildCorsHeaders = (origin: string | null) => {
  const allowOrigin = origin && originAllowlist.includes(origin) ? origin : 'null';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400'
  };
};

type Payload = {
  employee_id: string;
  email: string;
  password: string;
  role: 'employee' | 'hr' | 'admin';
};

const jsonResponse = (origin: string | null, status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...buildCorsHeaders(origin), 'Content-Type': 'application/json' }
  });

serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: buildCorsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return jsonResponse(origin, 405, { error: { code: 'METHOD_NOT_ALLOWED' } });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse(origin, 401, { error: { code: 'UNAUTHORIZED' } });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse(origin, 500, { error: { code: 'SERVER_MISCONFIG' } });
  }

  let payload: Payload | null = null;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    payload = null;
  }
  if (!payload?.employee_id || !payload?.email || !payload?.password || !payload?.role) {
    return jsonResponse(origin, 400, { error: { code: 'INVALID_INPUT' } });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse(origin, 401, { error: { code: 'UNAUTHORIZED' } });
  }

  const { data: adminProfile, error: adminErr } = await userClient
    .schema('codesk')
    .from('profiles')
    .select('user_id, role')
    .eq('user_id', userData.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (adminErr || !adminProfile) {
    return jsonResponse(origin, 403, { error: { code: 'UNAUTHORIZED' } });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: employee, error: empErr } = await adminClient
    .schema('codesk')
    .from('employees')
    .select('id, email, active')
    .eq('id', payload.employee_id)
    .maybeSingle();

  if (empErr) {
    return jsonResponse(origin, 400, { error: { code: 'EMPLOYEE_NOT_FOUND' } });
  }
  if (!employee) {
    return jsonResponse(origin, 400, { error: { code: 'EMPLOYEE_NOT_FOUND' } });
  }
  if (!employee.active) {
    return jsonResponse(origin, 400, { error: { code: 'EMPLOYEE_INACTIVE' } });
  }

  const { data: existingProfile } = await adminClient
    .schema('codesk')
    .from('profiles')
    .select('user_id')
    .eq('employee_id', payload.employee_id)
    .maybeSingle();

  if (existingProfile?.user_id) {
    return jsonResponse(origin, 409, { error: { code: 'EMPLOYEE_ALREADY_LINKED' } });
  }

  const { data: createdUser, error: createErr } = await adminClient.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true
  });

  if (createErr || !createdUser?.user) {
    const message = `${createErr?.message ?? ''}`.toLowerCase();
    const code = message.includes('already') || message.includes('exists') ? 'EMAIL_EXISTS' : 'CREATE_USER_FAILED';
    return jsonResponse(origin, 400, { error: { code } });
  }

  const { error: insertErr } = await adminClient.schema('codesk').from('profiles').insert({
    user_id: createdUser.user.id,
    employee_id: payload.employee_id,
    role: payload.role
  });

  if (insertErr) {
    await adminClient.auth.admin.deleteUser(createdUser.user.id);
    return jsonResponse(origin, 400, { error: { code: 'PROFILE_INSERT_FAILED' } });
  }

  return jsonResponse(origin, 200, {
    user_id: createdUser.user.id,
    employee_id: payload.employee_id,
    role: payload.role
  });
});
