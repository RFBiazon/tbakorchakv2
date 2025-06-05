import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface Ocorrencia {
  codigo: number;
  tipo: string;
  data: string;
  cidade: string;
  ocorrencia: string;
  motivo: string;
  observacao_2: string;
  observacao_3: string;
}

interface OcorrenciaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ocorrencia: Ocorrencia;
  setOcorrencia: React.Dispatch<React.SetStateAction<Ocorrencia>>;
  onSave: () => void;
  isEditing: boolean;
}

export const OcorrenciaModal: React.FC<OcorrenciaModalProps> = ({ open, onOpenChange, ocorrencia, setOcorrencia, onSave, isEditing }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Ocorrência' : 'Nova Ocorrência'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div>
            <Label>Tipo de Ocorrência</Label>
            <Select
              value={ocorrencia.codigo.toString()}
              onValueChange={(value) => {
                const tipo = {
                  "101": "Medida Disciplinar",
                  "102": "Ocorrência",
                  "103": "Ajuste Salarial",
                  "104": "Adicional/Bônus",
                  "105": "Alteração de função",
                  "106": "Furo de Caixa"
                }[value] || "";
                setOcorrencia((prev: Ocorrencia) => ({
                  ...prev,
                  codigo: parseInt(value),
                  tipo: tipo
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="101">Medida Disciplinar</SelectItem>
                <SelectItem value="102">Ocorrência</SelectItem>
                <SelectItem value="103">Ajuste Salarial</SelectItem>
                <SelectItem value="104">Adicional/Bônus</SelectItem>
                <SelectItem value="105">Alteração de função</SelectItem>
                <SelectItem value="106">Furo de Caixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data</Label>
            <Input
              type="date"
              value={ocorrencia.data.split('/').reverse().join('-')}
              onChange={(e) => {
                const data = new Date(e.target.value).toLocaleDateString('pt-BR')
                setOcorrencia((prev: Ocorrencia) => ({ ...prev, data }))
              }}
            />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input
              value={ocorrencia.cidade}
              onChange={(e) => setOcorrencia((prev: Ocorrencia) => ({ ...prev, cidade: e.target.value }))}
            />
          </div>
          <div>
            <Label>Ocorrência</Label>
            <Input
              value={ocorrencia.ocorrencia}
              onChange={(e) => setOcorrencia((prev: Ocorrencia) => ({ ...prev, ocorrencia: e.target.value }))}
            />
          </div>
          <div className="col-span-2">
            <Label>Motivo</Label>
            <Textarea
              value={ocorrencia.motivo}
              onChange={(e) => setOcorrencia((prev: Ocorrencia) => ({ ...prev, motivo: e.target.value }))}
            />
          </div>
          <div className="col-span-2">
            <Label>Observação 2</Label>
            <Textarea
              value={ocorrencia.observacao_2}
              onChange={(e) => setOcorrencia((prev: Ocorrencia) => ({ ...prev, observacao_2: e.target.value }))}
            />
          </div>
          <div className="col-span-2">
            <Label>Observação 3</Label>
            <Textarea
              value={ocorrencia.observacao_3}
              onChange={(e) => setOcorrencia((prev: Ocorrencia) => ({ ...prev, observacao_3: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 