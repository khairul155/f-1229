
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()
    const apiKey = Deno.env.get('NEBIUS_API_KEY')

    if (!apiKey) {
      throw new Error('API key not found')
    }

    console.log('Starting image generation for prompt:', prompt)

    const requestBody = {
      model: "black-forest-labs/flux-schnell",
      response_format: "b64_json",
      response_extension: "webp",
      width: 1024,
      height: 1024,
      num_inference_steps: 4,
      negative_prompt: "",
      seed: -1,
      prompt: prompt,
      n: 2  // Generate 2 images
    };

    console.log('Sending request with configuration:', JSON.stringify(requestBody))

    const response = await fetch("https://api.studio.nebius.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Nebius API error:', error)
      throw new Error('Failed to generate images')
    }

    const data = await response.json()
    console.log('Received response with', data.data?.length || 0, 'images')

    if (!data.data || data.data.length === 0) {
      throw new Error('No images were generated')
    }
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
