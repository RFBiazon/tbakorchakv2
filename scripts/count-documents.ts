import { getSupabaseClient } from "@/lib/supabase"

async function countDocuments() {
  try {
    const supabase = getSupabaseClient()
    const { count, error } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })

    if (error) {
      console.error("Erro ao contar documentos:", error)
      return
    }

    console.log(`Total de registros na tabela documents: ${count}`)
  } catch (error) {
    console.error("Erro ao executar a consulta:", error)
  }
}

countDocuments() 