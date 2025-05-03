"use client"

import { useState, useEffect } from "react"
import { supabase, ensureAuthenticated, getSupabaseClient } from "@/lib/supabase"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React from "react"
import { useRouter } from "next/navigation"

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
  const [tipoHistorico, setTipoHistorico] = useState<'fruta' | 'outros'>('fruta')
  const router = useRouter()

  const fetchCompras = async () => {
    try {
      const supabase = getSupabaseClient()
      
      // Primeiro verifica se tem uma loja selecionada
      const selectedStore = localStorage.getItem("selectedStore")
      if (!selectedStore) {
        toast.error('Selecione uma loja primeiro')
        return
      }

      // Verifica a sessão
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Se não tem sessão, tenta autenticar
      if (!session) {
        const isAuth = await ensureAuthenticated()
        if (!isAuth) {
          toast.error('Por favor, faça login novamente')
          return
        }
        // Tenta obter a sessão novamente após autenticação
        const { data: { session: newSession }, error: newSessionError } = await supabase.auth.getSession()
        if (newSessionError || !newSession) {
          console.error('Erro ao obter nova sessão:', newSessionError)
          toast.error('Erro de autenticação. Por favor, faça login novamente.')
          return
        }
      }

      // Usar o ID do usuário da sessão como loja_id
      const userId = session?.user?.id
      if (!userId) {
        toast.error('Erro ao obter ID do usuário')
        return
      }

      // Buscar todas as compras da loja atual
      const { data: comprasData, error: comprasError } = await supabase
        .from('compras')
        .select('*')
        .eq('loja_id', userId)
        .order('data_compra', { ascending: false })

      if (comprasError) throw comprasError

      const comprasWithItems = await Promise.all((comprasData || []).map(async (compra: any) => {
        // Para cada compra, buscar seus itens
        const { data: itensData, error: itensError } = await supabase
          .from('itens_compra')
          .select('*')
          .eq('compra_id', compra.id)
          .eq('loja_id', userId)

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
      if (error instanceof Error) {
        if (error.message.includes('Auth session missing')) {
          toast.error('Sessão expirada. Por favor, faça login novamente.')
        } else {
          toast.error(`Erro ao carregar histórico: ${error.message}`)
        }
      } else {
        toast.error('Erro ao carregar histórico')
      }
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

  const formatNumber = (value: number) => {
    return value.toString().replace('.', ',')
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
    // Automatically expand the purchase when editing
    setExpandedCompras(prev => {
      const next = new Set(prev)
      next.add(compraId)
      return next
    })
  }

  const handleCancelEdit = () => {
    setEditingCompra(null)
    fetchCompras() // Recarrega os dados originais
  }

  const handleSaveEdit = async (compra: Compra) => {
    try {
      // Verifica autenticação antes de salvar
      const isAuthenticated = await ensureAuthenticated()
      if (!isAuthenticated) {
        throw new Error('Usuário não autenticado')
      }

      const supabase = getSupabaseClient()
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Erro ao obter sessão do usuário')
      }

      const { error } = await supabase
        .from('compras')
        .update({
          fornecedor: compra.fornecedor,
          valor_total: compra.valor_total,
          updated_at: new Date().toISOString(),
        })
        .eq('id', compra.id)
        .eq('loja_id', session.user.id)

      if (error) {
        console.error('Erro ao atualizar compra:', error)
        toast.error('Erro ao salvar alterações')
        throw error
      }

      toast.success('Alterações salvas com sucesso')
      setEditingCompra(null)
      await fetchCompras() // Recarrega os dados
    } catch (error) {
      console.error('Erro ao atualizar compra:', error)
      toast.error('Erro ao salvar alterações. Por favor, faça login novamente.')
      // Redireciona para a página de login se necessário
      router.push('/')
    }
  }

  const handleItemChange = (compraId: number, itemId: number, field: keyof ItemCompra, value: string) => {
    // Converte vírgula para ponto antes de processar o valor
    const processedValue = value.replace(',', '.')
    
    setCompras(prev => {
      return prev.map(compra => {
        if (compra.id !== compraId) return compra

        const newItens = compra.itens?.map(item => {
          if (item.id !== itemId) return item

          let newItem = { ...item }
          if (field === 'quantidade' || field === 'valor_unitario') {
            const numValue = parseFloat(processedValue) || 0
            newItem[field] = numValue
            // Recalcular valor total
            if (field === 'quantidade') {
              newItem.valor_total = numValue * newItem.valor_unitario
            } else {
              newItem.valor_total = newItem.quantidade * numValue
            }
          } else if (field === 'valor_total') {
            newItem.valor_total = parseFloat(processedValue) || 0
          } else {
            (newItem as any)[field] = processedValue
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

  const handleClearHistory = async () => {
    try {
      const isAuthenticated = await ensureAuthenticated()
      if (!isAuthenticated) {
        throw new Error('Usuário não autenticado')
      }

      const supabase = getSupabaseClient()
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Erro ao obter sessão do usuário')
      }

      // Primeiro deleta os itens das compras
      const { error: itensError } = await supabase
        .from('itens_compra')
        .delete()
        .eq('loja_id', session.user.id)

      if (itensError) throw itensError

      // Depois deleta as compras
      const { error: comprasError } = await supabase
        .from('compras')
        .delete()
        .eq('loja_id', session.user.id)

      if (comprasError) throw comprasError

      toast.success('Histórico limpo com sucesso')
      setCompras([]) // Limpa o estado local
    } catch (error) {
      console.error('Erro ao limpar histórico:', error)
      toast.error('Erro ao limpar histórico. Por favor, tente novamente.')
    }
  }

  // Filtra as compras baseado no tipo selecionado
  const comprasFiltradas = compras.filter(compra => compra.tipo_compra === tipoHistorico)

  if (loading) {
    return <div>Carregando histórico...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="destructive" 
                onClick={handleClearHistory}
              >
                Limpar Histórico
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Limpar todo o histórico de compras</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={fetchCompras}>Atualizar</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Atualizar lista de compras</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Tabs defaultValue="fruta" className="w-full" onValueChange={(value) => setTipoHistorico(value as 'fruta' | 'outros')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fruta">Compras de Frutas</TabsTrigger>
          <TabsTrigger value="outros">Demais Itens</TabsTrigger>
        </TabsList>

        <TabsContent value="fruta">
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
                {comprasFiltradas.map((compra) => (
                  <React.Fragment key={compra.id}>
                    <TableRow 
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
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-green-500 hover:bg-green-600"
                                    onClick={() => handleSaveEdit(compra)}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Salvar alterações</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={handleCancelEdit}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Cancelar edição</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
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
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar compra</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedCompras.has(compra.id) && (
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
                                {compra.itens?.map((item) => (
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
                                          value={item.quantidade.toString().replace('.', ',')}
                                          onChange={(e) => handleItemChange(compra.id, item.id, 'quantidade', e.target.value)}
                                          className="h-8"
                                          type="text"
                                        />
                                      ) : (
                                        formatNumber(item.quantidade)
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {editingCompra === compra.id ? (
                                        <Input
                                          value={item.valor_unitario.toString().replace('.', ',')}
                                          onChange={(e) => handleItemChange(compra.id, item.id, 'valor_unitario', e.target.value)}
                                          className="h-8"
                                          type="text"
                                        />
                                      ) : (
                                        formatCurrency(item.valor_unitario)
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {editingCompra === compra.id ? (
                                        <Input
                                          value={item.valor_total.toString().replace('.', ',')}
                                          onChange={(e) => handleItemChange(compra.id, item.id, 'valor_total', e.target.value)}
                                          className="h-8"
                                          type="text"
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
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="outros">
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
                {comprasFiltradas.map((compra) => (
                  <React.Fragment key={compra.id}>
                    <TableRow 
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
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-green-500 hover:bg-green-600"
                                    onClick={() => handleSaveEdit(compra)}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Salvar alterações</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={handleCancelEdit}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Cancelar edição</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
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
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar compra</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedCompras.has(compra.id) && (
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
                                {compra.itens?.map((item) => (
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
                                          value={item.quantidade.toString().replace('.', ',')}
                                          onChange={(e) => handleItemChange(compra.id, item.id, 'quantidade', e.target.value)}
                                          className="h-8"
                                          type="text"
                                        />
                                      ) : (
                                        formatNumber(item.quantidade)
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {editingCompra === compra.id ? (
                                        <Input
                                          value={item.valor_unitario.toString().replace('.', ',')}
                                          onChange={(e) => handleItemChange(compra.id, item.id, 'valor_unitario', e.target.value)}
                                          className="h-8"
                                          type="text"
                                        />
                                      ) : (
                                        formatCurrency(item.valor_unitario)
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {editingCompra === compra.id ? (
                                        <Input
                                          value={item.valor_total.toString().replace('.', ',')}
                                          onChange={(e) => handleItemChange(compra.id, item.id, 'valor_total', e.target.value)}
                                          className="h-8"
                                          type="text"
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
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 