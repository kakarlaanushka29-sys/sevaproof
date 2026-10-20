// profile.js - functions used by profile.html
// Needs supabase.js to define the global Supabase client:  sb

// !! CHECK setup_profile.sql and change this if your table has a different name !!
const PROFILE_TABLE = "profiles";

// Options shown in the "I am a..." dropdown
const TYPES = ["volunteer", "organizer"];   // lowercase: same values the dashboard checks

// Always keep role in lowercase so dashboard / other pages match it
function fixRole(p) {
  if (p && p.role) p.role = String(p.role).toLowerCase();
  return p;
}

// Current logged-in user (or throws if not logged in)
async function currentUser() {
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) throw new Error("Please log in again");
  return data.user;
}

// Read this user's profile row ({} if none yet)
async function getProfile() {
  const user = await currentUser();
  const { data, error } = await sb.from(PROFILE_TABLE).select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return fixRole(data || { id: user.id });
}

// Make sure the user has a member_code and member_year (created once, on first visit)
async function ensureMember(p) {
  if (p.member_code && p.member_year) return fixRole(p);
  const user = await currentUser();
  const member_code = p.member_code || crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const member_year = p.member_year || new Date().getFullYear();
  const { data, error } = await sb
    .from(PROFILE_TABLE)
    .upsert({ id: user.id, member_code, member_year }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return fixRole(data);
}

// Save the form fields (name, phone, role, org, emp_id, city, bio) and return the full row
async function saveProfileData(fields) {
  const user = await currentUser();
  const { data, error } = await sb
    .from(PROFILE_TABLE)
    .upsert({ id: user.id, ...fields, role: String(fields.role || "").toLowerCase() }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return fixRole(data);
}

// Text stored inside the ID-card QR code
function memberPayload(p) {
  return JSON.stringify({
    app: "sevaproof",
    code: p.member_code,
    name: p.name || "",
    role: p.role || "",
    org: p.org || "",
    year: p.member_year,
  });
}