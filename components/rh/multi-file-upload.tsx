import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { EmployeesService } from '@/lib/employees-service';

const tiposDocumentos = [
  { value: "rg", label: "RG" },
  { value: "cpf", label: "CPF" },
  { value: "habilitacao", label: "Habilitação" },
  { value: "comprovante_residencia", label: "Comprovante de Residência" },
  { value: "ctps", label: "CTPS" },
  { value: "nis", label: "NIS" },
  { value: "foto_3x4", label: "Foto 3x4" },
  { value: "documentos_filhos_menores_14", label: "Documentos dos Filhos < 14" },
  { value: "exame_admissional", label: "Exame Admissional" },
  { value: "carteirinha_vacinacao", label: "Carteirinha de Vacinação" }
];

const WEBHOOK_RH1 = process.env.NEXT_PUBLIC_WEBHOOK_UPLOAD_DOCS1;
const WEBHOOK_RH2 = process.env.NEXT_PUBLIC_WEBHOOK_UPLOAD_DOCS2;

interface MultiFileUploadProps {
  employeeName: string;
  driveLink: string | null;
  onUploadComplete?: (link: string) => void;
  renderChecklist?: (checklist: Record<string, string>) => void;
  employeeId: string;
}

interface FileItem {
  file: File;
  tipo: string;
}

interface DocHistorico {
  nome: string;
  tipo: string;
  data: string;
  link: string;
}

export function MultiFileUpload({ employeeName, driveLink, onUploadComplete, renderChecklist, employeeId }: MultiFileUploadProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [historico, setHistorico] = useState<DocHistorico[]>([]);
  const [checklist, setChecklist] = useState<Record<string, string>>({});
  const [hasDocs, setHasDocs] = useState(false);

  useEffect(() => {
    if (renderChecklist) {
      renderChecklist(checklist);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(checklist)]);

  useEffect(() => {
    async function fetchDocs() {
      if (employeeId) {
        try {
          const docs: DocHistorico[] = await EmployeesService.getEmployeeDocuments(employeeId);
          setHasDocs(Array.isArray(docs) && docs.length > 0);
          setHistorico(docs);
          const initialChecklist: Record<string, string> = {};
          docs.forEach((doc: DocHistorico) => {
            if (doc.tipo && doc.link) initialChecklist[doc.tipo] = doc.link;
          });
          setChecklist(initialChecklist);
        } catch (e) { /* ignora erro */ }
      }
    }
    fetchDocs();
  }, [employeeId]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files || []).map(file => ({ file, tipo: "" }));
    setFiles(prev => [...prev, ...newFiles]);
  }

  function handleTipoChange(idx: number, tipo: string) {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, tipo } : f));
  }

  function handleRemove(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  async function addDocumentToEmployee(employeeId: string, newDoc: DocHistorico) {
    try {
      const docs: DocHistorico[] = await EmployeesService.getEmployeeDocuments(employeeId);
      const updatedDocs = [...(Array.isArray(docs) ? docs : []), newDoc];
      await EmployeesService.updateEmployee(employeeId, { documents_jsonb: updatedDocs });
      setHistorico(updatedDocs);
    } catch (e) { /* ignora erro */ }
  }

  async function handleSend() {
    setUploading(true);
    let currentDriveLink: string = driveLink || '';
    let docsExist = hasDocs && !!currentDriveLink;
    const total = files.length;
    let toastRef = toast({
      title: `Enviando arquivos...`,
      description: `Enviando 1 de ${total} arquivos`,
    });
    for (let i = 0; i < files.length; i++) {
      if (i > 0) {
        toastRef.update({
          id: toastRef.id,
          title: `Enviando arquivos...`,
          description: `Enviando ${i + 1} de ${total} arquivos`,
        });
      }
      const { file, tipo } = files[i];
      try {
        let arquivoLink = '';
        if (!docsExist && !currentDriveLink) {
          if (!WEBHOOK_RH1) throw new Error('Webhook RH1 não configurado');
          const formData = new FormData();
          formData.append('file', file);
          formData.append('documentoId', employeeName);
          formData.append('tipoArquivo', tipo);
          const response = await fetch(WEBHOOK_RH1, {
            method: "POST",
            body: formData
          });
          if (!response.ok) throw new Error("Falha ao enviar documento");
          const text = await response.text();
          const urlMatch = text.match(/https?:\/\/drive\.google\.com\/drive\/folders\/[\w-]+/);
          currentDriveLink = urlMatch ? urlMatch[0] : '';
          if (!currentDriveLink) throw new Error("Link do Google Drive não encontrado na resposta");
          onUploadComplete?.(currentDriveLink);
          arquivoLink = currentDriveLink;
          docsExist = true;
        } else {
          if (!WEBHOOK_RH2) throw new Error('Webhook RH2 não configurado');
          if (!currentDriveLink) throw new Error('Drive link não encontrado');
          const driveId = currentDriveLink.split("/folders/")[1];
          const formData2 = new FormData();
          formData2.append('file', file);
          formData2.append('tipoArquivo', tipo);
          formData2.append('drive_id', driveId);
          const response2 = await fetch(WEBHOOK_RH2, {
            method: "POST",
            body: formData2
          });
          if (!response2.ok) throw new Error("Falha ao enviar documento");
          const text2 = await response2.text();
          const urlMatch2 = text2.match(/https?:\/\/drive\.google\.com\/drive\/folders\/[\w-]+/);
          arquivoLink = urlMatch2 ? urlMatch2[0] : currentDriveLink;
        }
        const docObj: DocHistorico = { nome: file.name, tipo, data: new Date().toISOString(), link: arquivoLink };
        await addDocumentToEmployee(employeeId, docObj);
        setChecklist(prev => ({ ...prev, [tipo]: arquivoLink }));
      } catch (err: any) {
        toastRef.update({
          id: toastRef.id,
          title: `Erro ao enviar ${file.name}`,
          description: err.message || String(err),
        });
        console.error('Erro ao enviar arquivo:', err);
      }
    }
    setFiles([]);
    setUploading(false);
    toastRef.update({
      id: toastRef.id,
      title: 'Upload concluído!',
      description: `${total} arquivos enviados com sucesso!`,
    });
  }

  const allSelected = files.length > 0 && files.every(f => f.tipo);

  return (
    <div className="space-y-4">
      <input type="file" multiple onChange={handleFileChange} className="hidden" id="multi-upload-input" />
      <div
        className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 mb-2 cursor-pointer"
        onClick={() => document.getElementById('multi-upload-input')?.click()}
      >
        <span className="text-4xl mb-2">&#8682;</span>
        <div className="font-medium">Clique ou arraste arquivos aqui</div>
        <div className="text-xs text-muted-foreground">Suporta arquivos PDF, JPEG, PNG</div>
      </div>
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((f, idx) => (
            <div key={idx} className="flex items-center gap-2 w-full">
              <span className="truncate flex-1 min-w-0">{f.file.name}</span>
              <Select value={f.tipo} onValueChange={(tipo: string) => handleTipoChange(idx, tipo)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocumentos.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" onClick={() => handleRemove(idx)} disabled={uploading}>Remover</Button>
            </div>
          ))}
        </div>
      )}
      <Button onClick={handleSend} disabled={!allSelected || uploading} className="w-full">
        &#8682; Enviar Arquivos
      </Button>
      {/* Histórico de Documentos */}
      {historico.length > 0 && (
        <div className="mt-6">
          <div className="font-semibold mb-2">Histórico de Documentos</div>
          <div className="flex flex-col gap-2">
            {historico.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between bg-muted/30 rounded px-3 py-2">
                <div>
                  <div className="font-medium">{tiposDocumentos.find(t => t.value === doc.tipo)?.label || doc.tipo}</div>
                  <div className="text-xs text-muted-foreground">{doc.nome}</div>
                  <div className="text-xs text-muted-foreground">{new Date(doc.data).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Checklist de Documentos */}
      {!renderChecklist && (
        <div className="mt-6">
          <div className="font-semibold mb-2">Checklist de Documentos</div>
          <ul className="space-y-2">
            {tiposDocumentos.map(doc => (
              <li key={doc.value} className="flex items-center gap-2">
                {checklist[doc.value] ? (
                  <span className="text-green-500">●</span>
                ) : (
                  <span className="text-muted-foreground">○</span>
                )}
                <span>{doc.label}</span>
                {checklist[doc.value] && (
                  <a href={checklist[doc.value]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-2">Abrir</a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 