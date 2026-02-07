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
  action?: 'create' | 'update_role' | 'delete';
  employee_id?: string;
  email?: string;
  password?: string;
  role?: 'employee' | 'hr' | 'admin';
  target_user_id?: string;
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
    return jsonResponse(origin, 401, { error: { code: 'UNAUTHORIZED', message: 'Missing Authorization header' } });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse(origin, 500, {
      error: { code: 'SERVER_MISCONFIG', message: 'Missing SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY' }
    });
  }

  let payload: Payload | null = null;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    payload = null;
  }
  const action = payload?.action ?? 'create';
  if (action === 'create') {
    if (!payload?.employee_id || !payload?.email || !payload?.password || !payload?.role) {
      return jsonResponse(origin, 400, { error: { code: 'INVALID_INPUT', message: 'Invalid payload' } });
    }
  } else if (action === 'update_role') {
    if (!payload?.target_user_id || !payload?.role) {
      return jsonResponse(origin, 400, { error: { code: 'INVALID_INPUT', message: 'Missing target_user_id or role' } });
    }
  } else if (action === 'delete') {
    if (!payload?.target_user_id) {
      return jsonResponse(origin, 400, { error: { code: 'INVALID_INPUT', message: 'Missing target_user_id' } });
    }
  } else {
    return jsonResponse(origin, 400, { error: { code: 'INVALID_INPUT', message: 'Unknown action' } });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse(origin, 401, { error: { code: 'UNAUTHORIZED', message: userErr?.message ?? 'Invalid session' } });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: adminProfile, error: adminErr } = await adminClient
    .schema('codesk')
    .from('profiles')
    .select('user_id, role')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (adminErr) {
    console.error('admin lookup failed', adminErr);
    return jsonResponse(origin, 500, { error: { code: 'ADMIN_LOOKUP_FAILED', message: adminErr.message } });
  }
  if (!adminProfile) {
    return jsonResponse(origin, 403, { error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' } });
  }
  if (adminProfile.role !== 'admin') {
    return jsonResponse(origin, 403, { error: { code: 'ROLE_NOT_ADMIN', message: `role=${adminProfile.role}` } });
  }

  if (action === 'update_role') {
    const { data: updatedProfile, error: updateErr } = await adminClient
      .schema('codesk')
      .from('profiles')
      .update({ role: payload!.role })
      .eq('user_id', payload!.target_user_id)
      .select('user_id, employee_id, role')
      .maybeSingle();

    if (updateErr) {
      return jsonResponse(origin, 400, { error: { code: 'PROFILE_UPDATE_FAILED', message: updateErr.message } });
    }
    if (!updatedProfile) {
      return jsonResponse(origin, 404, { error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' } });
    }
    return jsonResponse(origin, 200, updatedProfile);
  }

  if (action === 'delete') {
    const { data: existingProfile, error: profileErr } = await adminClient
      .schema('codesk')
      .from('profiles')
      .select('user_id, employee_id')
      .eq('user_id', payload!.target_user_id)
      .maybeSingle();

    if (profileErr) {
      return jsonResponse(origin, 400, { error: { code: 'PROFILE_LOOKUP_FAILED', message: profileErr.message } });
    }
    if (!existingProfile) {
      return jsonResponse(origin, 404, { error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' } });
    }

    const { error: deleteProfileErr } = await adminClient
      .schema('codesk')
      .from('profiles')
      .delete()
      .eq('user_id', payload!.target_user_id);

    if (deleteProfileErr) {
      return jsonResponse(origin, 400, { error: { code: 'PROFILE_DELETE_FAILED', message: deleteProfileErr.message } });
    }

    const { error: deleteUserErr } = await adminClient.auth.admin.deleteUser(payload!.target_user_id);
    if (deleteUserErr) {
      return jsonResponse(origin, 400, { error: { code: 'AUTH_DELETE_FAILED', message: deleteUserErr.message } });
    }

    return jsonResponse(origin, 200, { user_id: payload!.target_user_id, deleted: true });
  }

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
    email: payload.email!,
    password: payload.password!,
    email_confirm: true
  });

  if (createErr || !createdUser?.user) {
    const message = `${createErr?.message ?? ''}`.toLowerCase();
    const code = message.includes('already') || message.includes('exists') ? 'EMAIL_EXISTS' : 'CREATE_USER_FAILED';
    return jsonResponse(origin, 400, { error: { code } });
  }

  const { error: insertErr } = await adminClient.schema('codesk').from('profiles').insert({
    user_id: createdUser.user.id,
    employee_id: payload.employee_id!,
    role: payload.role!
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
