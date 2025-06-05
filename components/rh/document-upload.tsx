import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Upload } from "lucide-react"

interface DocumentUploadProps {
  employeeId: string
  employeeName: string
  driveLink?: string
  onUploadComplete: (driveLink: string) => void
}

const documentTypes = [
  { id: "rg", label: "RG" },
  { id: "cpf", label: "CPF" },
  { id: "habilitacao", label: "Habilitação" },
  { id: "comprovante_residencia", label: "Comprovante de Residência" },
  { id: "ctps", label: "CTPS" },
  { id: "nis", label: "NIS" },
  { id: "foto_3x4", label: "Foto 3x4" },
  { id: "documentos_filhos_menores_14", label: "Documentos dos Filhos Menores de 14 anos" },
  { id: "exame_admissional", label: "Exame Admissional" },
  { id: "carteirinha_vacinacao", label: "Carteirinha de Vacinação" }
]

const WEBHOOK_RH1 = process.env.NEXT_PUBLIC_WEBHOOK_UPLOAD_DOCS1;
const WEBHOOK_RH2 = process.env.NEXT_PUBLIC_WEBHOOK_UPLOAD_DOCS2;

export function DocumentUpload({ employeeId, employeeName, driveLink, onUploadComplete }: DocumentUploadProps) {
  const [selectedType, setSelectedType] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<File[]>([])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setUploadQueue(prev => [...prev, ...files])
    }
  }

  const handleRemoveFile = (index: number) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== index))
  }

  const handleClearQueue = () => {
    setUploadQueue([])
  }

  const handleSend = async () => {
    if (uploadQueue.length === 0 || !selectedType) return
    setUploading(true)
    const file = uploadQueue[0]
    try {
      if (!driveLink) {
        if (!WEBHOOK_RH1) throw new Error('Webhook RH1 não configurado')
        const formData = new FormData()
        formData.append('file', file)
        formData.append('documentoId', employeeName)
        formData.append('tipoArquivo', selectedType)
        const response = await fetch(WEBHOOK_RH1, {
          method: "POST",
          body: formData
        })
        if (!response.ok) throw new Error("Failed to upload document")
        const text = await response.text()
        const urlMatch = text.match(/https?:\/\/drive\.google\.com\/drive\/folders\/[\w-]+/)
        const newDriveLink = urlMatch ? urlMatch[0] : ''
        if (!newDriveLink) throw new Error("Link do Google Drive não encontrado na resposta")
        onUploadComplete(newDriveLink)
        const driveId = newDriveLink.split("/folders/")[1]
        if (!WEBHOOK_RH2) throw new Error('Webhook RH2 não configurado')
        const formData2 = new FormData()
        formData2.append('file', file)
        formData2.append('tipoArquivo', selectedType)
        formData2.append('drive_id', driveId)
        await fetch(WEBHOOK_RH2, {
          method: "POST",
          body: formData2
        })
      } else {
        const driveId = driveLink.split("/folders/")[1]
        if (!WEBHOOK_RH2) throw new Error('Webhook RH2 não configurado')
        const formData = new FormData()
        formData.append('file', file)
        formData.append('tipoArquivo', selectedType)
        formData.append('drive_id', driveId)
        await fetch(WEBHOOK_RH2, {
          method: "POST",
          body: formData
        })
      }
      setUploadQueue(prev => prev.slice(1))
      toast.success("Documento enviado com sucesso!")
    } catch (error) {
      console.error("Error uploading document:", error)
      toast.error("Erro ao enviar documento")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Tipo de Documento" />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map(type => (
              <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <input
            type="file"
            id="document-upload"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById("document-upload")?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Selecionar Arquivo
          </Button>
        </div>
        <Button
          variant="destructive"
          onClick={handleClearQueue}
          disabled={uploadQueue.length === 0 || uploading}
        >
          Excluir Todos
        </Button>
        <Button
          variant="default"
          onClick={handleSend}
          disabled={uploadQueue.length === 0 || !selectedType || uploading}
        >
          Enviar
        </Button>
      </div>
      {uploadQueue.length > 0 && (
        <div className="flex flex-col gap-2">
          {uploadQueue.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span>{file.name}</span>
              <Button size="sm" variant="ghost" onClick={() => handleRemoveFile(idx)} disabled={uploading}>Remover</Button>
            </div>
          ))}
        </div>
      )}
      {uploading && (
        <div className="text-sm text-muted-foreground">
          Enviando documento...
        </div>
      )}
    </div>
  )
} 