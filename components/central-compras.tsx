"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X, ZoomIn, ZoomOut, Save, Edit, Check, Trash2, AlertTriangle, ShoppingCart, CheckCircle, XCircle, Package2, BarChart3, TrendingUp, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ensureAuthenticated, getSupabaseClient } from "@/lib/supabase"
import { HistoricoCompras } from "./historico-compras"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { v4 as uuidv4 } from 'uuid'

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
  uuid?: string
  produtosEditaveis?: ProdutoCompra[]
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

const parseProdutos = (data: any): ProdutoCompra[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.itens)) {
    return data.itens.map((item: any) => ({
      Fruta: item.descricao ?? "",
      Quantidade: item.quantidade ?? "",
      "Valor Unitário / KG": item.valor_unitario !== undefined ? String(item.valor_unitario) : "",
      "Valor Total": item.valor_total !== undefined ? String(item.valor_total) : "",
      Fornecedor: data.emissor?.nome_fantasia || data.emissor?.razao_social || "",
      Data: data.data_emissao || ""
    }));
  }
  return [];
};

const ProdutosTable = ({ 
  produtos, 
  uploadTimestamp,
  onProdutoChange,
  onSave,
  isEditing,
  onEdit,
  savedCompraId,
  onAddProduto,
  onRemoveProduto
}: { 
  produtos: EditableProduto[], 
  uploadTimestamp: string,
  onProdutoChange: (index: number, field: keyof EditableProduto, value: string) => void,
  onSave?: () => void,
  isEditing?: boolean,
  onEdit?: () => void,
  savedCompraId?: number,
  onAddProduto?: () => void,
  onRemoveProduto?: (index: number) => void
}) => {
  console.log("ProdutosTable recebe:", produtos);
  const total = produtos.reduce((acc, produto) => {
    let valor = 0;
    if (produto["Valor Total"] && !isNaN(Number(produto["Valor Total"]))) {
      valor = parseFloat(produto["Valor Total"] as string);
    }
    return acc + valor;
  }, 0)

  // Forçar isEditing para true se não estiver definido
  const editing = isEditing ?? true;

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
              {editing && <th className="p-3 text-left font-medium">Ações</th>}
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
                    disabled={!editing}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={produto.Quantidade || ''}
                    onChange={(e) => onProdutoChange(index, 'Quantidade', e.target.value.replace(',', '.'))}
                    className="h-8"
                    disabled={!editing}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={produto["Valor Unitário / KG"] || ''}
                    onChange={(e) => onProdutoChange(index, "Valor Unitário / KG", e.target.value.replace(',', '.'))}
                    className="h-8"
                    disabled={!editing}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={produto["Valor Total"] || ''}
                    onChange={(e) => onProdutoChange(index, "Valor Total", e.target.value.replace(',', '.'))}
                    className="h-8"
                    disabled={!editing}
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={produto.Fornecedor || ''}
                    onChange={(e) => onProdutoChange(index, 'Fornecedor', e.target.value)}
                    className="h-8"
                    disabled={!editing}
                  />
                </td>
                <td className="p-3">{formatDate(uploadTimestamp)}</td>
                {editing && (
                  <td className="p-3">
                    {onRemoveProduto && (
                      <Button variant="destructive" size="icon" onClick={() => onRemoveProduto(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-medium">
              <td className="p-3" colSpan={3}>Total</td>
              <td className="p-3">
                {formatCurrency(total.toString())}
              </td>
              <td className="p-3" colSpan={editing ? 3 : 2}>
                {savedCompraId === undefined && editing ? (
                  onSave && (
                    <Button 
                      onClick={onSave}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar no Histórico
                    </Button>
                  )
                ) : editing ? (
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
            {editing && (
              <tr>
                <td colSpan={editing ? 7 : 6} className="p-3">
                  {onAddProduto && (
                    <Button variant="outline" className="w-full" onClick={onAddProduto}>
                      + Adicionar Produto
                    </Button>
                  )}
                </td>
              </tr>
            )}
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

  // Mapeamento estático das credenciais Supabase para cada loja
  const SUPABASE_CONFIGS: Record<string, { url: string | undefined; key: string | undefined }> = {
    TOLEDO01: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_TOLEDO01,
      key: process.env.NEXT_PUBLIC_SUPABASE_KEY_TOLEDO01,
    },
    TOLEDO02: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_TOLEDO02,
      key: process.env.NEXT_PUBLIC_SUPABASE_KEY_TOLEDO02,
    },
    VIDEIRA: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_VIDEIRA,
      key: process.env.NEXT_PUBLIC_SUPABASE_KEY_VIDEIRA,
    },
    FRAIBURGO: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_FRAIBURGO,
      key: process.env.NEXT_PUBLIC_SUPABASE_KEY_FRAIBURGO,
    },
    CAMPOMOURAO: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_CAMPOMOURAO,
      key: process.env.NEXT_PUBLIC_SUPABASE_KEY_CAMPOMOURAO,
    },
  };

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
    const setFileQueue = tipo === 'frutas' ? setFrutasFileQueue : setDiversasFileQueue;
    setFileQueue(prev => {
      const newQueue = [...prev];
      const file = newQueue[fileIndex];
      let produtos = file.produtosEditaveis ? [...file.produtosEditaveis] : [];
      if (produtos[produtoIndex]) {
        let newValue = value;
        // Se for campo numérico, converte vírgula para ponto
        if (field === 'Quantidade' || field === 'Valor Unitário / KG' || field === 'Valor Total') {
          newValue = value.replace(',', '.');
        }
        produtos[produtoIndex] = {
          ...produtos[produtoIndex],
          [field]: newValue
        };
      }
      newQueue[fileIndex] = {
        ...file,
        produtosEditaveis: produtos,
        isEditing: true
      };
      return newQueue;
    });
  };

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
      : process.env.NEXT_PUBLIC_WEBHOOK_FRUTAS!

    for (let i = 0; i < fileQueue.length; i++) {
      if (fileQueue[i].status === 'error') continue

      try {
        // Gere o uuid antes de atualizar o estado
        const uuid = uuidv4();
        setFileQueue(prev => {
          const newQueue = [...prev]
          newQueue[i] = { ...newQueue[i], status: 'uploading', uuid }
          return newQueue
        })

        const formData = new FormData()
        formData.append("data", fileQueue[i].file)
        formData.append("storeId", storeId)
        formData.append("uploadTimestamp", fileQueue[i].uploadTimestamp)
        formData.append("webhookType", tipo === 'itens_diversos' ? 'demais_itens' : 'frutas')
        formData.append("uuid", uuid)

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

        // Após o envio, inicie o polling:
        const interval = setInterval(async () => {
          console.log('[Polling] Buscando status para uuid:', uuid);
          const { data, error } = await fetchStatusAndData(uuid);
          if (data && data.status === 'concluido') {
            let responseData = data.dados;
            if (typeof responseData === "string") {
              try {
                responseData = JSON.parse(responseData);
              } catch {}
            }
            // Converta para produtos editáveis
            const produtosEditaveis = parseProdutos(responseData);
            setFileQueue(prev => {
              const newQueue = [...prev];
              const idx = newQueue.findIndex(item => item.uuid === uuid);
              if (idx !== -1) {
                newQueue[idx] = { 
                  ...newQueue[idx], 
                  status: 'completed', 
                  response: responseData, 
                  produtosEditaveis,
                  isEditing: true 
                };
              }
              return newQueue;
            });
            clearInterval(interval);
          }
          if (error) {
            // Trate o erro se necessário
            clearInterval(interval);
          }
        }, 5000);

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
    const produtos = item.produtosEditaveis || []
    if (produtos.length === 0) return

    // Sanitize: garantir que todos os produtos tenham 'Valor Total' numérico
    const sanitizedProdutos = produtos.map(produto => ({
      ...produto,
      ["Valor Total"]: produto["Valor Total"] && !isNaN(Number(produto["Valor Total"])) ? produto["Valor Total"] : "0"
    }));

    console.log('Produtos que serão salvos:', sanitizedProdutos);
    sanitizedProdutos.forEach((p, i) => {
      console.log(`Produto ${i}:`, p, 
        'quantidade:', parseFloat(p.Quantidade || '0'),
        'valor_unitario:', parseFloat(p["Valor Unitário / KG"] || '0'),
        'valor_total:', parseFloat(p["Valor Total"] || '0')
      );
    });

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
      const { data: { session }, error: sessionError } = await getSupabaseClient().auth.getSession()
      if (sessionError || !session) {
        console.error('Erro ao obter sessão:', sessionError)
        toast.error('Erro de autenticação. Por favor, faça login novamente.')
        return
      }

      // Usar o ID do usuário da sessão
      const userId = session.user.id

      if (item.savedCompraId) {
        // Deletar todos os itens antigos da compra
        const { error: deleteError, data: deleteData } = await getSupabaseClient()
          .from('itens_compra')
          .delete()
          .eq('compra_id', item.savedCompraId)
          .eq('loja_id', userId);
        console.log('Delete result:', deleteError, deleteData);

        // Inserir todos os itens editados
        console.log('Itens a inserir:', sanitizedProdutos);
        const itensPromises = sanitizedProdutos.map(produto => {
          const quantidade = parseFloat(produto.Quantidade || '0');
          const valor_unitario = parseFloat(produto["Valor Unitário / KG"] || '0');
          const valor_total = parseFloat(produto["Valor Total"] || '0');
          return getSupabaseClient().from('itens_compra').insert({
            compra_id: item.savedCompraId,
            loja_id: userId,
            produto: tipo === 'frutas' ? produto.Fruta : produto.Fruta || '',
            quantidade,
            valor_unitario,
            valor_total,
            fornecedor: produto.Fornecedor || 'Sem Fornecedor Cadastrado',
            data_compra: item.uploadTimestamp,
            tipo_compra: tipo === 'frutas' ? 'fruta' : 'outros'
          });
        });

        try {
          const results = await Promise.all(itensPromises);
          results.forEach((result, idx) => {
            if (result.error) {
              console.error('Erro ao inserir item:', sanitizedProdutos[idx], result.error);
            }
          });
          setFileQueue(prev => {
            const newQueue = [...prev]
            newQueue[index] = {
              ...newQueue[index],
              produtosEditaveis: sanitizedProdutos,
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
        const valorTotal = sanitizedProdutos.reduce((acc, produto) => {
          return acc + parseFloat(produto["Valor Total"] || "0")
        }, 0)

        const { data: compraData, error: compraError } = await getSupabaseClient()
          .from('compras')
          .insert({
            loja_id: userId,
            fornecedor: sanitizedProdutos[0].Fornecedor || "Sem Fornecedor Cadastrado",
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

        const itensPromises = sanitizedProdutos.map(produto => {
          const quantidade = parseFloat(produto.Quantidade || '0');
          const valor_unitario = parseFloat(produto["Valor Unitário / KG"] || '0');
          const valor_total = parseFloat(produto["Valor Total"] || '0');
          return getSupabaseClient().from('itens_compra').insert({
            compra_id: compraData.id,
            loja_id: userId,
            produto: tipo === 'frutas' ? produto.Fruta : produto.Fruta || '',
            quantidade,
            valor_unitario,
            valor_total,
            fornecedor: produto.Fornecedor || 'Sem Fornecedor Cadastrado',
            data_compra: item.uploadTimestamp,
            tipo_compra: tipo === 'frutas' ? 'fruta' : 'outros'
          });
        });

        try {
          await Promise.all(itensPromises)
          setFileQueue(prev => {
            const newQueue = [...prev]
            newQueue[index] = {
              ...newQueue[index],
              savedCompraId: compraData.id,
              produtosEditaveis: sanitizedProdutos,
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

      // No final do handleSaveToSupabase, após salvar no Supabase:
      try {
        const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_RECEBE_DADOS;
        const storeId = localStorage.getItem("selectedStore");
        if (webhookUrl) {
          const categoria_envio = tipo === 'frutas' ? 'fruta' : 'demais_itens';
          const compraPayload = {
            storeId: storeId || '',
            categoria_envio,
            fornecedor: sanitizedProdutos[0]?.Fornecedor || 'Sem Fornecedor Cadastrado',
            data: item.uploadTimestamp,
            valor_total: sanitizedProdutos.reduce((acc, produto) => acc + parseFloat(produto["Valor Total"] || "0"), 0),
            tipo_compra: tipo === 'frutas' ? 'fruta' : 'outros',
            itens: sanitizedProdutos.map(produto => ({
              produto: tipo === 'frutas' ? produto.Fruta : produto.Fruta || '',
              quantidade: parseFloat(produto.Quantidade || '0'),
              valor_unitario: parseFloat(produto["Valor Unitário / KG"] || '0'),
              valor_total: parseFloat(produto["Valor Total"] || '0'),
              fornecedor: produto.Fornecedor || 'Sem Fornecedor Cadastrado',
              data: item.uploadTimestamp
            }))
          };
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(compraPayload)
          });
          toast.success('Dados enviados com sucesso!');
        }
      } catch (err) {
        toast.error('Erro ao enviar dados');
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

  // Função para buscar o status e dados pelo UUID
  const fetchStatusAndData = async (uuid: string) => {
    const selectedStore = localStorage.getItem("selectedStore")?.toUpperCase();
    const config = SUPABASE_CONFIGS[selectedStore || "TOLEDO01"];
    if (!config?.url || !config?.key) {
      console.error('URL ou chave do Supabase não encontrada para a loja:', selectedStore);
      return { data: null, error: 'Credenciais do Supabase não encontradas' };
    }

    const response = await fetch(
      `${config.url}/rest/v1/processamento_compras?select=status,dados&id=eq.${uuid}`,
      {
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Accept': 'application/json'
        }
      }
    );
    const dataArr = await response.json();
    const data = Array.isArray(dataArr) ? dataArr[0] : dataArr;
    return { data, error: null };
  };

  const handleAddProduto = (fileIndex: number, tipo: 'frutas' | 'itens_diversos') => {
    const setFileQueue = tipo === 'frutas' ? setFrutasFileQueue : setDiversasFileQueue;
    setFileQueue(prev => {
      const newQueue = [...prev];
      const file = newQueue[fileIndex];
      let produtos = file.produtosEditaveis ? [...file.produtosEditaveis] : [];
      produtos = [...produtos, { Fruta: '', Quantidade: '', "Valor Unitário / KG": '', "Valor Total": '', Fornecedor: '', Data: '' }];
      newQueue[fileIndex] = {
        ...file,
        produtosEditaveis: produtos,
        isEditing: true
      };
      return newQueue;
    });
  };

  const handleRemoveProduto = (fileIndex: number, produtoIndex: number, tipo: 'frutas' | 'itens_diversos') => {
    const setFileQueue = tipo === 'frutas' ? setFrutasFileQueue : setDiversasFileQueue;
    setFileQueue(prev => {
      const newQueue = [...prev];
      const file = newQueue[fileIndex];
      let produtos = file.produtosEditaveis ? [...file.produtosEditaveis] : [];
      produtos = produtos.filter((_, idx) => idx !== produtoIndex);
      newQueue[fileIndex] = {
        ...file,
        produtosEditaveis: produtos,
        isEditing: true
      };
      return newQueue;
    });
  };

  const processSingleFile = async (tipo: 'frutas' | 'itens_diversos', index: number) => {
    const fileQueue = tipo === 'frutas' ? frutasFileQueue : diversasFileQueue;
    const setFileQueue = tipo === 'frutas' ? setFrutasFileQueue : setDiversasFileQueue;
    const item = fileQueue[index];
    if (!item || item.status !== 'pending') return;

    setFileQueue(prev => {
      const newQueue = [...prev];
      newQueue[index] = { ...newQueue[index], status: 'uploading' };
      return newQueue;
    });

    const storeId = localStorage.getItem("selectedStore");
    if (!storeId) {
      setError("Loja não selecionada");
      return;
    }

    const uuid = uuidv4();
    setFileQueue(prev => {
      const newQueue = [...prev];
      newQueue[index] = { ...newQueue[index], uuid, status: 'uploading' };
      return newQueue;
    });

    const webhookUrl = tipo === 'itens_diversos'
      ? process.env.NEXT_PUBLIC_WEBHOOK_DEMAIS_ITENS!
      : process.env.NEXT_PUBLIC_WEBHOOK_FRUTAS!;

    const formData = new FormData();
    formData.append("data", item.file);
    formData.append("storeId", storeId);
    formData.append("uploadTimestamp", item.uploadTimestamp);
    formData.append("webhookType", tipo === 'itens_diversos' ? 'demais_itens' : 'frutas');
    formData.append("uuid", uuid);

    const processingToastId = 'processing-toast';
    toast.info('Processando arquivo, aguarde...', { id: processingToastId, duration: Infinity });

    try {
      const response = await fetch('/api/webhook', {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP! status: ${response.status} - ${errorText}`);
      }
      const responseText = await response.text();
      let parsedResponse: WebhookResponse | string;
      try {
        const jsonResponse = JSON.parse(responseText);
        if (Array.isArray(jsonResponse)) {
          parsedResponse = {
            entries: [{ status: 'success', message: 'Produtos processados com sucesso', data: jsonResponse }]
          };
        } else if (typeof jsonResponse === 'string') {
          try {
            const produtos = JSON.parse(jsonResponse);
            if (Array.isArray(produtos)) {
              parsedResponse = {
                entries: [{ status: 'success', message: 'Produtos processados com sucesso', data: produtos }]
              };
            } else {
              parsedResponse = responseText;
            }
          } catch {
            parsedResponse = responseText;
          }
        } else if (isWebhookResponse(jsonResponse)) {
          parsedResponse = jsonResponse;
        } else {
          parsedResponse = responseText;
        }
      } catch {
        parsedResponse = responseText;
      }
      setFileQueue(prev => {
        const newQueue = [...prev];
        newQueue[index] = { ...newQueue[index], status: 'processing', response: parsedResponse };
        return newQueue;
      });
      // Polling para status concluído
      const interval = setInterval(async () => {
        const { data, error } = await fetchStatusAndData(uuid);
        if (data && data.status === 'concluido') {
          let responseData = data.dados;
          if (typeof responseData === "string") {
            try { responseData = JSON.parse(responseData); } catch {}
          }
          const produtosEditaveis = parseProdutos(responseData);
          setFileQueue(prev => {
            const newQueue = [...prev];
            const idx = newQueue.findIndex(item => item.uuid === uuid);
            if (idx !== -1) {
              newQueue[idx] = {
                ...newQueue[idx],
                status: 'completed',
                response: responseData,
                produtosEditaveis,
                isEditing: true
              };
            }
            return newQueue;
          });
          toast.dismiss(processingToastId);
          toast.success('Itens processados com sucesso!');
          clearInterval(interval);
        }
        if (error) {
          toast.dismiss(processingToastId);
          clearInterval(interval);
        }
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao processar arquivo";
      setFileQueue(prev => {
        const newQueue = [...prev];
        newQueue[index] = { ...newQueue[index], status: 'error', error: errorMessage };
        return newQueue;
      });
      toast.dismiss(processingToastId);
      toast.error(errorMessage);
    }
  };

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
                          {item.status === 'pending' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => processSingleFile('frutas', index)}
                            >
                              Enviar
                            </Button>
                          )}
                          {item.status === 'processing' && (
                            <div className="px-4 py-2 bg-purple-600 text-white rounded shadow animate-pulse">Processando...</div>
                          )}
                          {item.status === 'uploading' && (
                            <div className="px-4 py-2 bg-blue-500 text-white rounded shadow animate-pulse">Enviando...</div>
                          )}
                          <Button
                            onClick={() => removeFile(index, 'frutas')}
                            variant="destructive"
                            size="icon"
                            disabled={item.status === 'processing' || item.status === 'uploading'}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {item.status === 'completed' && item.produtosEditaveis && (
                        <div className="mt-2">
                          <ProdutosTable
                            produtos={item.produtosEditaveis}
                            uploadTimestamp={item.uploadTimestamp}
                            onProdutoChange={(produtoIndex, field, value) => handleProdutoChange(index, produtoIndex, field, value, 'frutas')}
                            onSave={() => handleSaveToSupabase(index, 'frutas')}
                            isEditing={item.isEditing}
                            onEdit={() => handleEdit(index, 'frutas')}
                            savedCompraId={item.savedCompraId}
                            onAddProduto={() => handleAddProduto(index, 'frutas')}
                            onRemoveProduto={(produtoIndex) => handleRemoveProduto(index, produtoIndex, 'frutas')}
                          />
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
                          {item.status === 'pending' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => processSingleFile('itens_diversos', index)}
                            >
                              Enviar
                            </Button>
                          )}
                          {item.status === 'processing' && (
                            <div className="px-4 py-2 bg-purple-600 text-white rounded shadow animate-pulse">Processando...</div>
                          )}
                          {item.status === 'uploading' && (
                            <div className="px-4 py-2 bg-blue-500 text-white rounded shadow animate-pulse">Enviando...</div>
                          )}
                          <Button
                            onClick={() => removeFile(index, 'itens_diversos')}
                            variant="destructive"
                            size="icon"
                            disabled={item.status === 'processing' || item.status === 'uploading'}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {item.status === 'completed' && item.produtosEditaveis && (
                        <div className="mt-2">
                          <ProdutosTable
                            produtos={item.produtosEditaveis}
                            uploadTimestamp={item.uploadTimestamp}
                            onProdutoChange={(produtoIndex, field, value) => handleProdutoChange(index, produtoIndex, field, value, 'itens_diversos')}
                            onSave={() => handleSaveToSupabase(index, 'itens_diversos')}
                            isEditing={item.isEditing}
                            onEdit={() => handleEdit(index, 'itens_diversos')}
                            savedCompraId={item.savedCompraId}
                            onAddProduto={() => handleAddProduto(index, 'itens_diversos')}
                            onRemoveProduto={(produtoIndex) => handleRemoveProduto(index, produtoIndex, 'itens_diversos')}
                          />
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