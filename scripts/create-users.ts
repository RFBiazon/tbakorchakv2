import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://osemdcmygzkrccaaqyvj.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk0OTMyOCwiZXhwIjoyMDU5NTI1MzI4fQ.BD1jvnLWleSA74_oF2sOH0Ux2A10YHg-Gy8UDlOOgI0"
const supabase = createClient(supabaseUrl, supabaseKey)

const users = [
  {
    email: 'toledo01@tba.com',
    password: 'Toledo01@2024',
    loja: 'toledo01'
  },
  {
    email: 'toledo02@tba.com',
    password: 'Toledo02@2024',
    loja: 'toledo02'
  },
  {
    email: 'videira@tba.com',
    password: 'Videira@2024',
    loja: 'videira'
  },
  {
    email: 'fraiburgo@tba.com',
    password: 'Fraiburgo@2024',
    loja: 'fraiburgo'
  },
  {
    email: 'campomourao@tba.com',
    password: 'CampoMourao@2024',
    loja: 'campomourao'
  }
]

async function createUsers() {
  for (const user of users) {
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          loja: user.loja
        }
      }
    })

    if (error) {
      console.error(`Erro ao criar usuário ${user.email}:`, error.message)
    } else {
      console.log(`Usuário ${user.email} criado com sucesso!`)
    }
  }
}

createUsers() 