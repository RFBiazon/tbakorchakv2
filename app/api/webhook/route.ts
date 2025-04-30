import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_IMAGE_EXTRACT
    
    console.log('Webhook URL:', webhookUrl)
    
    if (!webhookUrl) {
      throw new Error('Webhook URL não configurada')
    }

    // Verificar se o arquivo está presente
    const file = formData.get('data')
    if (!file || !(file instanceof File)) {
      throw new Error('Arquivo não encontrado no FormData')
    }

    // Verificar se o storeId está presente
    const storeId = formData.get('storeId')
    if (!storeId) {
      throw new Error('storeId não encontrado no FormData')
    }

    // Criar um novo FormData com o arquivo como blob
    const newFormData = new FormData()
    newFormData.append('data', new Blob([await file.arrayBuffer()], { type: file.type }), file.name)
    newFormData.append('storeId', storeId.toString())
    newFormData.append('uploadTimestamp', formData.get('uploadTimestamp')?.toString() || new Date().toISOString())

    console.log('Enviando arquivo:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Configurar o timeout para 5 minutos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000)

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        body: newFormData,
        signal: controller.signal,
        headers: {
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=300'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Erro no webhook: ${response.status} ${response.statusText}`)
      }

      const responseText = await response.text()
      console.log('Webhook response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      })

      return new NextResponse(JSON.stringify({ 
        status: 'sucesso',
        message: 'Imagem processada com sucesso'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=300'
        },
      })
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  } catch (error) {
    console.error('Erro no webhook:', error)
    return new NextResponse(JSON.stringify({ 
      error: 'Erro Interno do Servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=300'
      },
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Connection': 'keep-alive',
      'Keep-Alive': 'timeout=300'
    },
  })
} 