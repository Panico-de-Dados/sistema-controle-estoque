const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '\n[ERRO] Variáveis SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não encontradas.\n' +
    'Copie backend/.env.example para backend/.env e preencha com os dados do seu projeto Supabase.\n'
  );
  process.exit(1);
}

// service_role key -> só pode ser usada no backend (nunca no navegador)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

module.exports = supabase;
