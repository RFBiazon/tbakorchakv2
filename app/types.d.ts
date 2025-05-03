// Tipos globais para a aplicação

// Adiciona tipos globais para as bibliotecas jsPDF
interface Window {
  jspdf: {
    jsPDF: any
  }
}

const handleEdit = (compraId: number) => {
  setEditingCompra(compraId)
  // Expande automaticamente a compra quando estiver editando
  setExpandedCompras(prev => {
    const next = new Set(prev)
    next.add(compraId)
    return next
  })
}
