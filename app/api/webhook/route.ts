import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const webhookType = formData.get('webhookType') as string
    
    const webhookUrl = webhookType === 'demais_itens'
      ? process.env.NEXT_PUBLIC_WEBHOOK_DEMAIS_ITENS
      : process.env.NEXT_PUBLIC_WEBHOOK_IMAGE_EXTRACT

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'URL do webhook não configurada' },
        { status: 500 }
      )
    }

    console.log('URL do webhook:', webhookUrl)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    })

    const data = await response.text()
    console.log('Resposta do webhook:', data)

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Erro no proxy do webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
} 