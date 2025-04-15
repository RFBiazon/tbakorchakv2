import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://osemdcmygzkrccaaqyvj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zZW1kY215Z3prcmNjYWFxeXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk0NDQ0MDAsImV4cCI6MjAyNTAyMDQwMH0.0QwXw4QwXw4QwXw4QwXw4QwXw4QwXw4QwXw4QwXw4'
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