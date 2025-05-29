"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [displayValue, setDisplayValue] = React.useState("")

  // Converter YYYY-MM-DD para dd/MM/yyyy para exibição
  const formatToDisplay = (dateString: string): string => {
    if (!dateString) return ""
    
    // Se já está no formato dd/MM/yyyy, retorna como está
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      return dateString
    }
    
    // Se está no formato YYYY-MM-DD, converte para dd/MM/yyyy
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-')
      return `${day}/${month}/${year}`
    }
    
    return dateString
  }

  // Converter dd/MM/yyyy para YYYY-MM-DD para compatibilidade
  const formatToISO = (dateString: string): string => {
    if (!dateString) return ""
    
    // Se já está no formato YYYY-MM-DD, retorna como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }
    
    // Se está no formato dd/MM/yyyy, converte para YYYY-MM-DD
    const match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (match) {
      const [, day, month, year] = match
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    return dateString
  }

  // Sincronizar com o valor externo
  React.useEffect(() => {
    setDisplayValue(formatToDisplay(value || ""))
  }, [value])

  // Converter string de data para objeto Date
  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined
    
    // Tentar formato dd/MM/yyyy
    const ddmmyyyyMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }
    
    // Tentar formato YYYY-MM-DD
    const yyyymmddMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (yyyymmddMatch) {
      const [, year, month, day] = yyyymmddMatch
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }
    
    return undefined
  }

  // Validar e formatar entrada manual
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setDisplayValue(newValue)
    
    const parsedDate = parseDate(newValue)
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      const isoValue = format(parsedDate, "yyyy-MM-dd")
      onChange?.(isoValue)
    } else if (newValue === "") {
      onChange?.("")
    }
  }

  // Selecionar data do calendário
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const isoValue = format(date, "yyyy-MM-dd")
      const displayValue = format(date, "dd/MM/yyyy")
      setDisplayValue(displayValue)
      onChange?.(isoValue)
    }
    setOpen(false)
  }

  const selectedDate = parseDate(displayValue || value || "")

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <Input
            value={displayValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-10"
          />
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={disabled}
            locale={ptBR}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
} 