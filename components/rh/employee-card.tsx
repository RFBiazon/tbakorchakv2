import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface EmployeeCardProps {
  name: string
  position: string
  department: string
  status: string
  admissionDate: string
  workSchedule: string
  salary?: string
  email?: string
  phone?: string
}

export function EmployeeCard({
  name,
  position,
  department,
  status,
  admissionDate,
  workSchedule,
  salary,
  email,
  phone
}: EmployeeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ATIVO":
        return "bg-green-500"
      case "DESLIGADO":
        return "bg-red-500"
      case "FÉRIAS":
        return "bg-blue-500"
      case "AFASTADO":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={`https://avatar.vercel.sh/${name}.png`} alt={name} />
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <CardTitle className="text-lg">{name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{position}</Badge>
            <Badge className={getStatusColor(status)}>{status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Departamento:</span>
            <span>{department}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Admissão:</span>
            <span>{admissionDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Horário:</span>
            <span>{workSchedule}</span>
          </div>
          {salary && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Salário:</span>
              <span>{salary}</span>
            </div>
          )}
          {email && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{email}</span>
            </div>
          )}
          {phone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telefone:</span>
              <span>{phone}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 