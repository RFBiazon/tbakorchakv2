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

    // Iniciar o envio do arquivo para n8n sem aguardar a resposta
    fetch(webhookUrl, {
      method: "POST",
      body: newFormData,
    }).then(async (response) => {
      const responseText = await response.text()
      console.log('Webhook response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      })
    }).catch((error) => {
      console.error('Error in webhook processing:', error)
    })
    
    // Retornar sucesso imediatamente
    return new NextResponse(JSON.stringify({ 
      status: 'sucesso',
      message: 'Imagem recebida com sucesso. O processamento foi iniciado e pode levar alguns instantes para ser concluído.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      },
    })
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
    },
  })
} 