"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronDown, ChevronRight, Edit, Save, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface ItemCompra {
  id: number
  produto: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  compra_id: number
}

interface Compra {
  id: number
  fornecedor: string
  data_compra: string
  valor_total: number
  tipo_compra: 'fruta' | 'outros'
  itens?: ItemCompra[]
  isEditing?: boolean
}

export function HistoricoCompras() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCompras, setExpandedCompras] = useState<Set<number>>(new Set())
  const [editingCompra, setEditingCompra] = useState<number | null>(null)

  const fetchCompras = async () => {
    try {
      // Primeiro, buscar todas as compras
      const { data: comprasData, error: comprasError } = await supabase
        .from('compras')
        .select('*')
        .order('data_compra', { ascending: false })

      if (comprasError) throw comprasError

      const comprasWithItems = await Promise.all((comprasData || []).map(async (compra) => {
        // Para cada compra, buscar seus itens
        const { data: itensData, error: itensError } = await supabase
          .from('itens_compra')
          .select('*')
          .eq('compra_id', compra.id)

        if (itensError) throw itensError

        // Se não houver itens, significa que a compra foi excluída parcialmente
        if (!itensData || itensData.length === 0) {
          return null
        }

        return {
          ...compra,
          itens: itensData
        }
      }))

      // Filtrar compras nulas (excluídas)
      setCompras(comprasWithItems.filter(Boolean) as Compra[])
    } catch (error) {
      console.error('Erro ao buscar compras:', error)
      toast.error('Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompras()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR })
  }

  const toggleCompra = (compraId: number) => {
    setExpandedCompras(prev => {
      const next = new Set(prev)
      if (next.has(compraId)) {
        next.delete(compraId)
      } else {
        next.add(compraId)
      }
      return next
    })
  }

  const handleEdit = (compraId: number) => {
    setEditingCompra(compraId)
  }

  const handleCancelEdit = () => {
    setEditingCompra(null)
    fetchCompras() // Recarrega os dados originais
  }

  const handleSaveEdit = async (compra: Compra) => {
    try {
      // Atualizar a compra principal
      const { error: compraError } = await supabase
        .from('compras')
        .update({
          fornecedor: compra.fornecedor,
          valor_total: compra.valor_total
        })
        .eq('id', compra.id)

      if (compraError) throw compraError

      // Atualizar os itens
      if (compra.itens) {
        const updatePromises = compra.itens.map(item => 
          supabase
            .from('itens_compra')
            .update({
              produto: item.produto,
              quantidade: item.quantidade,
              valor_unitario: item.valor_unitario,
              valor_total: item.valor_total
            })
            .eq('id', item.id)
        )

        await Promise.all(updatePromises)
      }

      setEditingCompra(null)
      toast.success('Compra atualizada com sucesso!')
      fetchCompras()
    } catch (error) {
      console.error('Erro ao atualizar compra:', error)
      toast.error('Erro ao atualizar compra')
    }
  }

  const handleItemChange = (compraId: number, itemId: number, field: keyof ItemCompra, value: string) => {
    setCompras(prev => {
      return prev.map(compra => {
        if (compra.id !== compraId) return compra

        const newItens = compra.itens?.map(item => {
          if (item.id !== itemId) return item

          let newItem = { ...item }
          if (field === 'quantidade' || field === 'valor_unitario') {
            const numValue = parseFloat(value) || 0
            newItem[field] = numValue
            // Recalcular valor total
            if (field === 'quantidade') {
              newItem.valor_total = numValue * newItem.valor_unitario
            } else {
              newItem.valor_total = newItem.quantidade * numValue
            }
          } else if (field === 'valor_total') {
            newItem.valor_total = parseFloat(value) || 0
          } else {
            (newItem as any)[field] = value
          }
          return newItem
        })

        // Recalcular valor total da compra
        const novoValorTotal = newItens?.reduce((acc, item) => acc + item.valor_total, 0) || 0

        return {
          ...compra,
          itens: newItens,
          valor_total: novoValorTotal
        }
      })
    })
  }

  if (loading) {
    return <div>Carregando histórico...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Histórico de Compras</h2>
        <Button onClick={fetchCompras}>Atualizar</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {compras.map((compra) => (
              <>
                <TableRow 
                  key={compra.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleCompra(compra.id)}
                >
                  <TableCell>
                    {expandedCompras.has(compra.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(compra.data_compra)}</TableCell>
                  <TableCell>
                    {editingCompra === compra.id ? (
                      <Input
                        value={compra.fornecedor}
                        onChange={(e) => {
                          setCompras(prev => prev.map(c => 
                            c.id === compra.id ? { ...c, fornecedor: e.target.value } : c
                          ))
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-8"
                      />
                    ) : (
                      compra.fornecedor || "Sem Fornecedor Cadastrado"
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(compra.valor_total)}</TableCell>
                  <TableCell>{compra.tipo_compra === 'fruta' ? 'Frutas' : 'Outros'}</TableCell>
                  <TableCell>
                    {editingCompra === compra.id ? (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleSaveEdit(compra)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-red-500 hover:bg-red-600"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(compra.id)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {expandedCompras.has(compra.id) && compra.itens && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead>Quantidade</TableHead>
                              <TableHead>Valor Unit.</TableHead>
                              <TableHead>Valor Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {compra.itens.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  {editingCompra === compra.id ? (
                                    <Input
                                      value={item.produto}
                                      onChange={(e) => handleItemChange(compra.id, item.id, 'produto', e.target.value)}
                                      className="h-8"
                                    />
                                  ) : (
                                    item.produto
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingCompra === compra.id ? (
                                    <Input
                                      value={item.quantidade}
                                      onChange={(e) => handleItemChange(compra.id, item.id, 'quantidade', e.target.value)}
                                      className="h-8"
                                      type="number"
                                      step="0.01"
                                    />
                                  ) : (
                                    item.quantidade
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingCompra === compra.id ? (
                                    <Input
                                      value={item.valor_unitario}
                                      onChange={(e) => handleItemChange(compra.id, item.id, 'valor_unitario', e.target.value)}
                                      className="h-8"
                                      type="number"
                                      step="0.01"
                                    />
                                  ) : (
                                    formatCurrency(item.valor_unitario)
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingCompra === compra.id ? (
                                    <Input
                                      value={item.valor_total}
                                      onChange={(e) => handleItemChange(compra.id, item.id, 'valor_total', e.target.value)}
                                      className="h-8"
                                      type="number"
                                      step="0.01"
                                    />
                                  ) : (
                                    formatCurrency(item.valor_total)
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 