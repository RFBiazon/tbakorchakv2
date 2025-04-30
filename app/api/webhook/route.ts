import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_IMAGE_EXTRACT
    
    console.log('Webhook URL:', webhookUrl)
    console.log('FormData contents:', {
      data: formData.get('data'),
      storeId: formData.get('storeId'),
      uploadTimestamp: formData.get('uploadTimestamp')
    })
    
    if (!webhookUrl) {
      throw new Error('Webhook URL não configurada')
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      body: formData,
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Webhook error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Erro no webhook: ${response.status} ${response.statusText}`)
    }

    const data = await response.text()
    console.log('Webhook success response:', data)
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
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