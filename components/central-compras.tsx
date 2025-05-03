"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X, ZoomIn, ZoomOut, Save, Edit, Check, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase, checkAndRefreshSession, ensureAuthenticated } from "@/lib/supabase"
import { HistoricoCompras } from "./historico-compras"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ProdutoCompra {
  Fruta?: string
  Quantidade?: string
  "Valor Unitário / KG"?: string
  "Valor Total"?: string
  Data?: string
  Fornecedor?: string
}

interface FileQueueItem {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  response?: WebhookResponse | string
  uploadTimestamp: string
  savedCompraId?: number
  isEditing?: boolean
}

interface WebhookEntry {
  status: 'success' | 'error' | 'processing'
  message: string
  data?: ProdutoCompra[] | string
}

interface WebhookResponse {
  entries: WebhookEntry[]
}

interface ImageZoomModalProps {
  imageUrl: string
  onClose: () => void
}

interface EditableProduto extends ProdutoCompra {
  isEdited?: boolean
}

const formatCurrency = (value: string) => {
  const number = parseFloat(value)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(number)
}

const formatNumber = (value: string) => {
  if (!value) return ''
  const number = parseFloat(value)
  return number.toString().replace('.', ',')
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR')
}

const parseProdutos = (data: string | ProdutoCompra[]): ProdutoCompra[] => {
  if (typeof data === 'string') {
    try {
      // Tenta fazer o parse do JSON string
      return JSON.parse(data)
    } catch {
      console.error('Erro ao fazer parse dos produtos')
      return []
    }
  }
  return data
}

const ProdutosTable = ({ 
  produtos, 
  uploadTimestamp,
  onProdutoChange,
  onSave,
  isEditing,
  onEdit,
  savedCompraId
}: { 
  produtos: EditableProduto[], 
  uploadTimestamp: string,
  onProdutoChange: (index: number, field: keyof EditableProduto, value: string) => void,
  onSave?: () => void,
  isEditing?: boolean,
  onEdit?: () => void,
  savedCompraId?: number
}) => {
  const total = produtos.reduce((acc, produto) => {
    const valor = produto["Valor Total"] ? parseFloat(produto["Valor Total"]) : 0
    return acc + valor
  }, 0)

  return (
    <div className="mt-4 bg-card rounded-lg border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left font-medium">Produto</th>
              <th className="p-3 text-left font-medium">Qtd</th>
              <th className="p-3 text-left font-medium">Valor Unit.</th>
              <th className="p-3 text-left font-medium">Valor Total</th>
              <th className="p-3 text-left font-medium">Fornecedor</th>
              <th className="p-3 text-left font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto, index) => (
              <tr key={index} className={`border-b ${produto.isEdited ? 'bg-muted/50' : ''}`}>
                <td className="p-3">
                  <Input
                    value={produto.Fruta || ''}
                    onChange={(e) => onProdutoChange(index, 'Fruta', e.target.value)}
                    className="h-8"
                    disabled={!isEditing && savedCompraId !== undefined}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={produto.Quantidade ? String(produto.Quantidade).replace('.', ',') : ''}
                    onChange={(e) => onProdutoChange(index, 'Quantidade', e.target.value.replace(',', '.'))}
                    className="h-8"
                    disabled={!isEditing && savedCompraId !== undefined}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={produto["Valor Unitário / KG"] ? String(produto["Valor Unitário / KG"]).replace('.', ',') : ''}
                    onChange={(e) => onProdutoChange(index, "Valor Unitário / KG", e.target.value.replace(',', '.'))}
                    className="h-8"
                    disabled={!isEditing && savedCompraId !== undefined}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={produto["Valor Total"] ? String(produto["Valor Total"]).replace('.', ',') : ''}
                    onChange={(e) => onProdutoChange(index, "Valor Total", e.target.value.replace(',', '.'))}
                    className="h-8"
                    disabled={!isEditing && savedCompraId !== undefined}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={produto.Fornecedor || ''}
                    onChange={(e) => onProdutoChange(index, 'Fornecedor', e.target.value)}
                    className="h-8"
                    disabled={!isEditing && savedCompraId !== undefined}
                  />
                </td>
                <td className="p-3">{formatDate(uploadTimestamp)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-medium">
              <td className="p-3" colSpan={3}>Total</td>
              <td className="p-3">
                {formatCurrency(total.toString())}
              </td>
              <td className="p-3" colSpan={2}>
                {savedCompraId === undefined ? (
                  onSave && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                    <Button 
                      onClick={onSave}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar no Histórico
                    </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Salvar esta compra no histórico</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                ) : isEditing ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                  <Button 
                    onClick={onSave}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Salvar as alterações feitas nesta compra</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : onEdit && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                  <Button 
                    onClick={onEdit}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar os detalhes desta compra</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

const ImageZoomModal = ({ imageUrl, onClose }: ImageZoomModalProps) => {
  const [scale, setScale] = useState(1)
  
  const increaseZoom = () => setScale(prev => Math.min(prev + 0.5, 3))
  const decreaseZoom = () => setScale(prev => Math.max(prev - 0.5, 0.5))

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 z-50 bg-background rounded-lg shadow-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={decreaseZoom}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={increaseZoom}
              disabled={scale >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-sm">Zoom: {(scale * 100).toFixed(0)}%</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="min-h-full flex items-center justify-center">
            <img
              src={imageUrl}
              alt="Zoom preview"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease-in-out'
              }}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function CentralCompras() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [frutasFileQueue, setFrutasFileQueue] = useState<FileQueueItem[]>([])
  const [diversasFileQueue, setDiversasFileQueue] = useState<FileQueueItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const frutasFileInputRef = useRef<HTMLInputElement>(null)
  const diversasFileInputRef = useRef<HTMLInputElement>(null)
  const [imageZooms, setImageZooms] = useState<{[key: number]: number}>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, tipo: 'frutas' | 'itens_diversos') => {
    const files = event.target.files
    if (!files) return

    const newFiles: FileQueueItem[] = Array.from(files).map(file => {
      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        return {
          file,
          preview: URL.createObjectURL(file),
          status: 'pending',
          uploadTimestamp: new Date().toISOString()
        }
      } else {
        return {
          file,
          preview: URL.createObjectURL(file),
          status: 'error',
          error: "Por favor, selecione apenas arquivos JPG",
          uploadTimestamp: new Date().toISOString()
        }
      }
    })

    if (tipo === 'frutas') {
      setFrutasFileQueue(prev => [...prev, ...newFiles])
    } else {
      setDiversasFileQueue(prev => [...prev, ...newFiles])
    }
    setError(null)
  }

  const handleCameraCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setShowCamera(true)
    } catch (err) {
      setError("Erro ao acessar a câmera. Verifique as permissões do seu dispositivo.")
    }
  }

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" })
            setFrutasFileQueue(prev => [...prev, {
              file,
              preview: URL.createObjectURL(blob),
              status: 'pending',
              uploadTimestamp: new Date().toISOString()
            }])
            stopCamera()
          }
        }, "image/jpeg")
      }
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const removeFile = (index: number, tipo: 'frutas' | 'itens_diversos') => {
    if (tipo === 'frutas') {
      setFrutasFileQueue(prev => {
        const newQueue = [...prev]
        URL.revokeObjectURL(newQueue[index].preview)
        newQueue.splice(index, 1)
        return newQueue
      })
    } else {
      setDiversasFileQueue(prev => {
      const newQueue = [...prev]
      URL.revokeObjectURL(newQueue[index].preview)
      newQueue.splice(index, 1)
      return newQueue
    })
    }
  }

  const isWebhookResponse = (response: any): response is WebhookResponse => {
    return response && 
           typeof response === 'object' && 
           Array.isArray(response.entries);
  }

  const handleZoom = (index: number, increase: boolean) => {
    setImageZooms(prev => ({
      ...prev,
      [index]: Math.max(0.5, Math.min(3, (prev[index] || 1) + (increase ? 0.5 : -0.5)))
    }))
  }

  const handleProdutoChange = (fileIndex: number, produtoIndex: number, field: keyof EditableProduto, value: string, tipo: 'frutas' | 'itens_diversos') => {
    // Converte vírgula para ponto antes de processar o valor
    const processedValue = value.replace(',', '.')
    
    const setFileQueue = tipo === 'frutas' ? setFrutasFileQueue : setDiversasFileQueue
    
    setFileQueue(prev => {
      const newQueue = [...prev]
      const file = newQueue[fileIndex]
      
      if (file.response && typeof file.response !== 'string' && file.response.entries) {
        const entry = file.response.entries[0]
        if (entry.data && Array.isArray(entry.data)) {
          const newData = [...entry.data] as EditableProduto[]
          newData[produtoIndex] = {
            ...newData[produtoIndex],
            [field]: value,
            isEdited: true
          }
          entry.data = newData
        }
      }
      
      return newQueue
    })
  }

  const processQueue = async (tipo: 'frutas' | 'itens_diversos') => {
    const fileQueue = tipo === 'frutas' ? frutasFileQueue : diversasFileQueue
    const setFileQueue = tipo === 'frutas' ? setFrutasFileQueue : setDiversasFileQueue
    
    if (fileQueue.length === 0) return

    setIsUploading(true)
    setIsProcessing(true)
    setError(null)
    setStatus(null)

    const storeId = localStorage.getItem("selectedStore")
    if (!storeId) {
      setError("Loja não selecionada")
      setIsUploading(false)
      setIsProcessing(false)
      return
    }

    const webhookUrl = tipo === 'itens_diversos' 
      ? process.env.NEXT_PUBLIC_WEBHOOK_DEMAIS_ITENS!
      : process.env.NEXT_PUBLIC_WEBHOOK_IMAGE_EXTRACT!

    for (let i = 0; i < fileQueue.length; i++) {
      if (fileQueue[i].status === 'error') continue

      try {
        setFileQueue(prev => {
          const newQueue = [...prev]
          newQueue[i] = { ...newQueue[i], status: 'uploading' }
          return newQueue
        })

        const formData = new FormData()
        formData.append("data", fileQueue[i].file)
        formData.append("storeId", storeId)
        formData.append("uploadTimestamp", fileQueue[i].uploadTimestamp)
        formData.append("webhookType", tipo === 'itens_diversos' ? 'demais_itens' : 'frutas')

        const response = await fetch('/api/webhook', {
          method: "POST",
          body: formData
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Resposta do servidor:', errorText)
          throw new Error(`Erro HTTP! status: ${response.status} - ${errorText}`)
        }

        const responseText = await response.text()
        let parsedResponse: WebhookResponse | string
        
        try {
          // Primeiro tenta fazer o parse da resposta completa
          const jsonResponse = JSON.parse(responseText)
          
          if (Array.isArray(jsonResponse)) {
            parsedResponse = {
              entries: [{
                status: 'success',
                message: 'Produtos processados com sucesso',
                data: jsonResponse
              }]
            }
          } else if (typeof jsonResponse === 'string') {
            try {
              const produtos = JSON.parse(jsonResponse)
              if (Array.isArray(produtos)) {
                parsedResponse = {
                  entries: [{
                    status: 'success',
                    message: 'Produtos processados com sucesso',
                    data: produtos
                  }]
                }
              } else {
                parsedResponse = responseText
              }
            } catch {
              parsedResponse = responseText
            }
          } else if (isWebhookResponse(jsonResponse)) {
            parsedResponse = jsonResponse
          } else {
            parsedResponse = responseText
          }
        } catch (parseError) {
          console.error('Erro ao processar resposta:', parseError)
          throw new Error('Erro ao processar resposta do servidor')
        }
        
        setFileQueue(prev => {
          const newQueue = [...prev]
          newQueue[i] = { 
            ...newQueue[i], 
            status: 'completed',
            response: parsedResponse
          }
          return newQueue
        })

      } catch (err) {
        console.error('Erro ao processar arquivo:', err)
        const errorMessage = err instanceof Error ? err.message : "Erro ao processar arquivo"
        setFileQueue(prev => {
          const newQueue = [...prev]
          newQueue[i] = { 
            ...newQueue[i], 
            status: 'error',
            error: errorMessage
          }
          return newQueue
        })
        toast.error(errorMessage)
      }
    }

    setIsUploading(false)
    setIsProcessing(false)
  }

  const handleSaveToSupabase = async (index: number, tipo: 'frutas' | 'itens_diversos') => {
    const fileQueue = tipo === 'frutas' ? frutasFileQueue : diversasFileQueue
    const setFileQueue = tipo === 'frutas' ? setFrutasFileQueue : setDiversasFileQueue
    
    const item = fileQueue[index]
    if (!item.response || typeof item.response === 'string') return

    if (isWebhookResponse(item.response)) {
      const entry = item.response.entries[0]
      if (entry.data && Array.isArray(entry.data)) {
        const produtos = parseProdutos(entry.data)
        
        try {
          // Verificar se há uma loja selecionada
          const selectedStore = localStorage.getItem("selectedStore")
          if (!selectedStore) {
            toast.error('Nenhuma loja selecionada. Por favor, selecione uma loja.')
            return
          }

          // Verificar autenticação
          const isAuthenticated = await ensureAuthenticated()
          if (!isAuthenticated) {
            toast.error('Sessão expirada. Por favor, faça login novamente.')
            return
          }

          // Obter a sessão atual
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          if (sessionError || !session) {
            console.error('Erro ao obter sessão:', sessionError)
            toast.error('Erro de autenticação. Por favor, faça login novamente.')
            return
          }

          // Usar o ID do usuário da sessão
          const userId = session.user.id

          if (item.savedCompraId) {
            // Atualizar registro existente
            const valorTotal = produtos.reduce((acc, produto) => {
              return acc + parseFloat(produto["Valor Total"] || "0")
            }, 0)

            // Atualizar a compra principal
            const { error: compraError } = await supabase
              .from('compras')
              .update({
                fornecedor: produtos[0].Fornecedor,
                valor_total: valorTotal
              })
              .eq('id', item.savedCompraId)
              .eq('loja_id', userId)

            if (compraError) {
              console.error('Erro ao atualizar compra:', compraError)
              toast.error('Erro ao atualizar compra. Por favor, tente novamente.')
              return
            }

            // Deletar itens antigos
            const { error: deleteError } = await supabase
              .from('itens_compra')
              .delete()
              .eq('compra_id', item.savedCompraId)
              .eq('loja_id', userId)

            if (deleteError) {
              console.error('Erro ao deletar itens:', deleteError)
              toast.error('Erro ao atualizar itens. Por favor, tente novamente.')
              return
            }

            // Inserir novos itens
            const itensPromises = produtos.map(produto => {
              return supabase.from('itens_compra').insert({
                compra_id: item.savedCompraId,
                loja_id: userId,
                produto: tipo === 'frutas' ? produto.Fruta : produto.Fruta || '',
                quantidade: parseFloat(produto.Quantidade || '0'),
                valor_unitario: parseFloat(produto["Valor Unitário / KG"] || '0'),
                valor_total: parseFloat(produto["Valor Total"] || '0'),
                fornecedor: produto.Fornecedor || 'Sem Fornecedor Cadastrado',
                data_compra: item.uploadTimestamp,
                tipo_compra: tipo === 'frutas' ? 'fruta' : 'outros'
              })
            })

            try {
              await Promise.all(itensPromises)
              
              // Atualizar o estado com o status de edição
              setFileQueue(prev => {
                const newQueue = [...prev]
                newQueue[index] = {
                  ...newQueue[index],
                  isEditing: false
                }
                return newQueue
              })
              
              toast.success('Compra atualizada com sucesso!')
            } catch (error) {
              console.error('Erro ao inserir novos itens:', error)
              toast.error('Erro ao salvar itens. Por favor, tente novamente.')
              return
            }
          } else {
            // Criar novo registro
            const valorTotal = produtos.reduce((acc, produto) => {
              return acc + parseFloat(produto["Valor Total"] || "0")
            }, 0)

            const { data: compraData, error: compraError } = await supabase
              .from('compras')
              .insert({
                loja_id: userId,
                fornecedor: produtos[0].Fornecedor || "Sem Fornecedor Cadastrado",
                data_compra: item.uploadTimestamp,
                valor_total: valorTotal,
                tipo_compra: tipo === 'frutas' ? 'fruta' : 'outros'
              })
              .select()
              .single()

            if (compraError) {
              console.error('Erro ao criar compra:', compraError)
              toast.error('Erro ao criar compra. Por favor, tente novamente.')
              return
            }

            const itensPromises = produtos.map(produto => {
              return supabase.from('itens_compra').insert({
                compra_id: compraData.id,
                loja_id: userId,
                produto: tipo === 'frutas' ? produto.Fruta : produto.Fruta || '',
                quantidade: parseFloat(produto.Quantidade || '0'),
                valor_unitario: parseFloat(produto["Valor Unitário / KG"] || '0'),
                valor_total: parseFloat(produto["Valor Total"] || '0'),
                fornecedor: produto.Fornecedor || 'Sem Fornecedor Cadastrado',
                data_compra: item.uploadTimestamp,
                tipo_compra: tipo === 'frutas' ? 'fruta' : 'outros'
              })
            })

            try {
              await Promise.all(itensPromises)
              
              // Atualizar o estado com o ID da compra salva
              setFileQueue(prev => {
                const newQueue = [...prev]
                newQueue[index] = {
                  ...newQueue[index],
                  savedCompraId: compraData.id,
                  isEditing: false
                }
                return newQueue
              })
              
              toast.success('Compra salva com sucesso!')
            } catch (error) {
              console.error('Erro ao inserir itens:', error)
              toast.error('Erro ao salvar itens. Por favor, tente novamente.')
              return
            }
          }
        } catch (error) {
          console.error('Erro ao salvar compra:', error)
          if (error instanceof Error && error.message.includes('Auth session missing')) {
            toast.error('Sessão expirada. Por favor, faça login novamente.')
          } else {
            toast.error('Erro ao salvar compra. Por favor, tente novamente.')
          }
          return
        }
      }
    }
  }

  const handleEdit = (index: number, tipo: 'frutas' | 'itens_diversos') => {
    const setFileQueue = tipo === 'frutas' ? setFrutasFileQueue : setDiversasFileQueue
    
    setFileQueue(prev => {
      const newQueue = [...prev]
      newQueue[index] = {
        ...newQueue[index],
        isEditing: true
      }
      return newQueue
    })
  }

  const handleClearQueue = (tipo: 'frutas' | 'itens_diversos') => {
    const queue = tipo === 'frutas' ? frutasFileQueue : diversasFileQueue
    queue.forEach(item => {
      URL.revokeObjectURL(item.preview)
    })
    if (tipo === 'frutas') {
      setFrutasFileQueue([])
    } else {
      setDiversasFileQueue([])
    }
    setError(null)
    setStatus(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Central de Compras</h1>
      
      <Tabs defaultValue="frutas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="frutas">Compra de Frutas</TabsTrigger>
          <TabsTrigger value="itens_diversos">Itens Diversos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="frutas">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de Compra de Frutas</CardTitle>
              <CardDescription>
                Faça upload de notas fiscais para registrar compras de frutas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                  <Button
                          onClick={() => frutasFileInputRef.current?.click()}
                    className="flex-1"
                    disabled={isUploading || isProcessing}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar Arquivos
                  </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Selecionar notas fiscais para processamento</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <input
                  type="file"
                  ref={frutasFileInputRef}
                  onChange={(e) => handleFileSelect(e, 'frutas')}
                  accept=".jpg,.jpeg"
                  multiple
                  className="hidden"
                />

                <div className="grid gap-6">
                  {frutasFileQueue.map((item, index) => (
                    <div key={index} className="relative">
                      <div className="relative rounded-lg overflow-hidden border">
                        <div className="relative h-[400px] overflow-auto">
                          <img
                            src={item.preview}
                            alt={`Preview ${index + 1}`}
                            style={{
                              transform: `scale(${imageZooms[index] || 1})`,
                              transformOrigin: 'center',
                              transition: 'transform 0.2s ease-in-out'
                            }}
                            className="w-full object-contain"
                          />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
                          {item.status === 'completed' && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleZoom(index, false)}
                                disabled={(imageZooms[index] || 1) <= 0.5}
                                className="bg-background/80 backdrop-blur-sm"
                              >
                                <ZoomOut className="h-4 w-4" />
                              </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Diminuir zoom</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleZoom(index, true)}
                                disabled={(imageZooms[index] || 1) >= 3}
                                className="bg-background/80 backdrop-blur-sm"
                              >
                                <ZoomIn className="h-4 w-4" />
                              </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Aumentar zoom</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                          <Button
                                  onClick={() => removeFile(index, 'frutas')}
                            variant="destructive"
                            size="icon"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remover arquivo</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      {item.status === 'uploading' && (
                        <div className="mt-2 text-blue-500">Enviando...</div>
                      )}

                      {item.status === 'error' && (
                        <div className="mt-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                          {item.error}
                        </div>
                      )}

                      {item.status === 'completed' && item.response && (
                        <div className="mt-2">
                          {typeof item.response === 'string' ? (
                            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
                              {item.response}
                            </div>
                          ) : isWebhookResponse(item.response) ? (
                            <div>
                              {item.response.entries.map((entry: WebhookEntry, i: number) => (
                                <div key={i}>
                                  <div className={`p-3 rounded-lg mb-2 ${
                                    entry.status === 'success' ? 'bg-green-500/10 text-green-500' : 
                                    entry.status === 'error' ? 'bg-destructive/10 text-destructive' : 
                                    'bg-blue-500/10 text-blue-500'
                                  }`}>
                                    {entry.message}
                                  </div>
                                  {entry.data && (
                                    <ProdutosTable 
                                      produtos={parseProdutos(entry.data) as EditableProduto[]}
                                      uploadTimestamp={item.uploadTimestamp}
                                      onProdutoChange={(produtoIndex, field, value) => 
                                        handleProdutoChange(index, produtoIndex, field, value, 'frutas')
                                      }
                                      onSave={() => handleSaveToSupabase(index, 'frutas')}
                                      isEditing={item.isEditing}
                                      onEdit={() => handleEdit(index, 'frutas')}
                                      savedCompraId={item.savedCompraId}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                              Resposta recebida
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    {error}
                  </div>
                )}

                {frutasFileQueue.length > 0 && (
                  <div className="flex gap-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                    <Button
                            onClick={frutasFileQueue.every(item => item.status === 'completed') 
                              ? () => handleClearQueue('frutas') 
                              : () => processQueue('frutas')}
                      disabled={isUploading || isProcessing}
                            className={frutasFileQueue.every(item => item.status === 'completed') 
                        ? "w-full bg-red-500 hover:bg-red-600"
                        : "w-full"
                      }
                    >
                            {frutasFileQueue.every(item => item.status === 'completed') ? (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Limpar
                        </>
                      ) : (
                        isUploading ? "Enviando..." : isProcessing ? "Processando..." : "Enviar Arquivos"
                      )}
                    </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{frutasFileQueue.every(item => item.status === 'completed') 
                            ? "Limpar lista de arquivos" 
                            : "Enviar arquivos para processamento"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itens_diversos">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de Itens Diversos</CardTitle>
              <CardDescription>
                Faça upload de notas fiscais para registrar itens diversos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => diversasFileInputRef.current?.click()}
                          className="flex-1"
                          disabled={isUploading || isProcessing}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Selecionar Arquivos
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Selecionar notas fiscais para processamento</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <input
                  type="file"
                  ref={diversasFileInputRef}
                  onChange={(e) => handleFileSelect(e, 'itens_diversos')}
                  accept=".jpg,.jpeg"
                  multiple
                  className="hidden"
                />

                <div className="grid gap-6">
                  {diversasFileQueue.map((item, index) => (
                    <div key={index} className="relative">
                      <div className="relative rounded-lg overflow-hidden border">
                        <div className="relative h-[400px] overflow-auto">
                          <img
                            src={item.preview}
                            alt={`Preview ${index + 1}`}
                            style={{
                              transform: `scale(${imageZooms[index] || 1})`,
                              transformOrigin: 'center',
                              transition: 'transform 0.2s ease-in-out'
                            }}
                            className="w-full object-contain"
                          />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
                          {item.status === 'completed' && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleZoom(index, false)}
                                      disabled={(imageZooms[index] || 1) <= 0.5}
                                      className="bg-background/80 backdrop-blur-sm"
                                    >
                                      <ZoomOut className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Diminuir zoom</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleZoom(index, true)}
                                      disabled={(imageZooms[index] || 1) >= 3}
                                      className="bg-background/80 backdrop-blur-sm"
                                    >
                                      <ZoomIn className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Aumentar zoom</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => removeFile(index, 'itens_diversos')}
                                  variant="destructive"
                                  size="icon"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remover arquivo</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      {item.status === 'uploading' && (
                        <div className="mt-2 text-blue-500">Enviando...</div>
                      )}

                      {item.status === 'error' && (
                        <div className="mt-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                          {item.error}
                        </div>
                      )}

                      {item.status === 'completed' && item.response && (
                        <div className="mt-2">
                          {typeof item.response === 'string' ? (
                            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
                              {item.response}
                            </div>
                          ) : isWebhookResponse(item.response) ? (
                            <div>
                              {item.response.entries.map((entry: WebhookEntry, i: number) => (
                                <div key={i}>
                                  <div className={`p-3 rounded-lg mb-2 ${
                                    entry.status === 'success' ? 'bg-green-500/10 text-green-500' : 
                                    entry.status === 'error' ? 'bg-destructive/10 text-destructive' : 
                                    'bg-blue-500/10 text-blue-500'
                                  }`}>
                                    {entry.message}
                                  </div>
                                  {entry.data && (
                                    <ProdutosTable 
                                      produtos={parseProdutos(entry.data) as EditableProduto[]}
                                      uploadTimestamp={item.uploadTimestamp}
                                      onProdutoChange={(produtoIndex, field, value) => 
                                        handleProdutoChange(index, produtoIndex, field, value, 'itens_diversos')
                                      }
                                      onSave={() => handleSaveToSupabase(index, 'itens_diversos')}
                                      isEditing={item.isEditing}
                                      onEdit={() => handleEdit(index, 'itens_diversos')}
                                      savedCompraId={item.savedCompraId}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                              Resposta recebida
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                    {error}
                  </div>
                )}

                {diversasFileQueue.length > 0 && (
                  <div className="flex gap-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={diversasFileQueue.every(item => item.status === 'completed') 
                              ? () => handleClearQueue('itens_diversos') 
                              : () => processQueue('itens_diversos')}
                            disabled={isUploading || isProcessing}
                            className={diversasFileQueue.every(item => item.status === 'completed') 
                              ? "w-full bg-red-500 hover:bg-red-600"
                              : "w-full"
                            }
                          >
                            {diversasFileQueue.every(item => item.status === 'completed') ? (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Limpar
                              </>
                            ) : (
                              isUploading ? "Enviando..." : isProcessing ? "Processando..." : "Enviar Arquivos"
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{diversasFileQueue.every(item => item.status === 'completed') 
                            ? "Limpar lista de arquivos" 
                            : "Enviar arquivos para processamento"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Compras</CardTitle>
              <CardDescription>
                Visualize todas as compras registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HistoricoCompras />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {zoomImage && (
        <ImageZoomModal
          imageUrl={zoomImage}
          onClose={() => setZoomImage(null)}
        />
      )}
    </div>
  )
} 