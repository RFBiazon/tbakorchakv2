"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X, ZoomIn, ZoomOut, Save, Edit, Check, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { HistoricoCompras } from "./historico-compras"
import { toast } from "sonner"

interface ProdutoCompra {
  Fruta: string
  Quantidade: string
  "Valor Unitário / KG": string
  "Valor Total": string
  Data: string
  Fornecedor: string
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
                    value={produto.Fruta}
                    onChange={(e) => onProdutoChange(index, 'Fruta', e.target.value)}
                    className="h-8"
                    disabled={!isEditing && savedCompraId !== undefined}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={produto.Quantidade || ''}
                    onChange={(e) => onProdutoChange(index, 'Quantidade', e.target.value)}
                    className="h-8"
                    disabled={!isEditing && savedCompraId !== undefined}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={produto["Valor Unitário / KG"] || ''}
                    onChange={(e) => onProdutoChange(index, "Valor Unitário / KG", e.target.value)}
                    className="h-8"
                    disabled={!isEditing && savedCompraId !== undefined}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={produto["Valor Total"] || ''}
                    onChange={(e) => onProdutoChange(index, "Valor Total", e.target.value)}
                    className="h-8"
                    disabled={!isEditing && savedCompraId !== undefined}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={produto.Fornecedor}
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
                    <Button 
                      onClick={onSave}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar no Histórico
                    </Button>
                  )
                ) : isEditing ? (
                  <Button 
                    onClick={onSave}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                ) : onEdit && (
                  <Button 
                    onClick={onEdit}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
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
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Novo estado para controlar o zoom de cada imagem
  const [imageZooms, setImageZooms] = useState<{[key: number]: number}>({})

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setFileQueue(prev => [...prev, ...newFiles])
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
            setFileQueue(prev => [...prev, {
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

  const removeFile = (index: number) => {
    setFileQueue(prev => {
      const newQueue = [...prev]
      URL.revokeObjectURL(newQueue[index].preview)
      newQueue.splice(index, 1)
      return newQueue
    })
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

  const handleProdutoChange = (fileIndex: number, produtoIndex: number, field: keyof EditableProduto, value: string) => {
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

  const processQueue = async () => {
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

        const response = await fetch(process.env.NEXT_PUBLIC_WEBHOOK_IMAGE_EXTRACT!, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Erro ao enviar arquivo")
        }

        const responseText = await response.text()
        let parsedResponse: WebhookResponse | string
        
        try {
          // Primeiro tenta fazer o parse da resposta completa
          const jsonResponse = JSON.parse(responseText)
          
          // Se a resposta for um array direto, converte para o formato WebhookResponse
          if (Array.isArray(jsonResponse)) {
            parsedResponse = {
              entries: [{
                status: 'success',
                message: 'Produtos processados com sucesso',
                data: jsonResponse
              }]
            }
          } else if (typeof jsonResponse === 'string') {
            // Se for uma string JSON de array, tenta fazer o parse
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
        } catch {
          // Se não conseguir fazer o parse como JSON, usa como string
          parsedResponse = responseText
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
        setFileQueue(prev => {
          const newQueue = [...prev]
          newQueue[i] = { 
            ...newQueue[i], 
            status: 'error',
            error: err instanceof Error ? err.message : "Erro ao enviar arquivo"
          }
          return newQueue
        })
      }
    }

    setIsUploading(false)
    setIsProcessing(false)
  }

  const handleSaveToSupabase = async (index: number) => {
    const item = fileQueue[index]
    if (!item.response || typeof item.response === 'string') return

    if (isWebhookResponse(item.response)) {
      const entry = item.response.entries[0]
      if (entry.data && Array.isArray(entry.data)) {
        const produtos = parseProdutos(entry.data)
        
        try {
          if (item.savedCompraId) {
            // Se já existe um ID, atualizar o registro existente
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

            if (compraError) throw compraError

            // Deletar itens antigos
            const { error: deleteError } = await supabase
              .from('itens_compra')
              .delete()
              .eq('compra_id', item.savedCompraId)

            if (deleteError) throw deleteError

            // Inserir novos itens
            const itensPromises = produtos.map(produto => {
              return supabase.from('itens_compra').insert({
                compra_id: item.savedCompraId,
                produto: produto.Fruta,
                quantidade: parseFloat(produto.Quantidade),
                valor_unitario: parseFloat(produto["Valor Unitário / KG"]),
                valor_total: parseFloat(produto["Valor Total"]),
                fornecedor: produto.Fornecedor,
                data_compra: item.uploadTimestamp,
                tipo_compra: 'fruta'
              })
            })

            await Promise.all(itensPromises)
            toast.success('Compra atualizada com sucesso!')
          } else {
            // Criar novo registro
            const valorTotal = produtos.reduce((acc, produto) => {
              return acc + parseFloat(produto["Valor Total"] || "0")
            }, 0)

            const { data: compraData, error: compraError } = await supabase
              .from('compras')
              .insert({
                fornecedor: produtos[0].Fornecedor || "Sem Fornecedor Cadastrado",
                data_compra: item.uploadTimestamp,
                valor_total: valorTotal,
                tipo_compra: 'fruta'
              })
              .select()
              .single()

            if (compraError) throw compraError

            const itensPromises = produtos.map(produto => {
              return supabase.from('itens_compra').insert({
                compra_id: compraData.id,
                produto: produto.Fruta,
                quantidade: parseFloat(produto.Quantidade),
                valor_unitario: parseFloat(produto["Valor Unitário / KG"]),
                valor_total: parseFloat(produto["Valor Total"]),
                fornecedor: produto.Fornecedor,
                data_compra: item.uploadTimestamp,
                tipo_compra: 'fruta'
              })
            })

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
          }
        } catch (error) {
          console.error('Erro ao salvar:', error)
          toast.error('Erro ao salvar a compra')
        }
      }
    }
  }

  const handleEdit = (index: number) => {
    setFileQueue(prev => {
      const newQueue = [...prev]
      newQueue[index] = {
        ...newQueue[index],
        isEditing: true
      }
      return newQueue
    })
  }

  const handleClearQueue = () => {
    // Limpar as URLs dos previews antes de limpar a fila
    fileQueue.forEach(item => {
      URL.revokeObjectURL(item.preview)
    })
    setFileQueue([])
    setError(null)
    setStatus(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Central de Compras</h1>
      
      <Tabs defaultValue="frutas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="frutas">Compra de Frutas</TabsTrigger>
          <TabsTrigger value="outros">Outros Itens</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="frutas">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de Compra de Frutas</CardTitle>
              <CardDescription>
                Faça upload de notas fiscais ou tire fotos para registrar compras de frutas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                    disabled={isUploading || isProcessing}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar Arquivos
                  </Button>
                  <Button
                    onClick={handleCameraCapture}
                    className="flex-1"
                    disabled={isUploading || isProcessing || showCamera}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Usar Câmera
                  </Button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".jpg,.jpeg"
                  multiple
                  className="hidden"
                />

                {showCamera && (
                  <div className="relative rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <Button onClick={captureImage} variant="secondary">
                        Capturar
                      </Button>
                      <Button onClick={stopCamera} variant="destructive">
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid gap-6">
                  {fileQueue.map((item, index) => (
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
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleZoom(index, false)}
                                disabled={(imageZooms[index] || 1) <= 0.5}
                                className="bg-background/80 backdrop-blur-sm"
                              >
                                <ZoomOut className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleZoom(index, true)}
                                disabled={(imageZooms[index] || 1) >= 3}
                                className="bg-background/80 backdrop-blur-sm"
                              >
                                <ZoomIn className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            onClick={() => removeFile(index)}
                            variant="destructive"
                            size="icon"
                          >
                            <X className="h-4 w-4" />
                          </Button>
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
                                        handleProdutoChange(index, produtoIndex, field, value)
                                      }
                                      onSave={() => handleSaveToSupabase(index)}
                                      isEditing={item.isEditing}
                                      onEdit={() => handleEdit(index)}
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

                {fileQueue.length > 0 && (
                  <div className="flex gap-4">
                    <Button
                      onClick={fileQueue.every(item => item.status === 'completed') ? handleClearQueue : processQueue}
                      disabled={isUploading || isProcessing}
                      className={fileQueue.every(item => item.status === 'completed') 
                        ? "w-full bg-red-500 hover:bg-red-600"
                        : "w-full"
                      }
                    >
                      {fileQueue.every(item => item.status === 'completed') ? (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Limpar
                        </>
                      ) : (
                        isUploading ? "Enviando..." : isProcessing ? "Processando..." : "Enviar Arquivos"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outros">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de Outros Itens</CardTitle>
              <CardDescription>
                Faça upload de notas fiscais ou tire fotos para registrar compras de outros itens
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mesmo conteúdo do tab de frutas, mas com tipo_compra='outros' */}
              <div className="text-center text-muted-foreground">
                Em desenvolvimento. Por enquanto, use a mesma interface de frutas.
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