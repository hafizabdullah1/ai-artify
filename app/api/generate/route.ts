import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required and must be a string" }, { status: 400 })
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY
    console.log("[v0] Hugging Face API Key exists:", !!apiKey)
    console.log("[v0] API Key length:", apiKey?.length || 0)

    if (!apiKey) {
      return NextResponse.json(
        { error: "Hugging Face API key not configured. Please add HUGGINGFACE_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    const requestBody = {
      inputs: prompt,
      parameters: {
        guidance_scale: 7.5,
        num_inference_steps: 20,
        width: 1024,
        height: 1024,
      },
    }

    const modelId = "stabilityai/stable-diffusion-xl-base-1.0"
    const endpoint = `https://api-inference.huggingface.co/models/${modelId}`

    console.log("[v0] Making request to Hugging Face API...")
    console.log("[v0] Using endpoint:", endpoint)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("[v0] API Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Hugging Face API error:", errorText)

      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      if (response.status === 401) {
        console.log("[v0] Authentication failed - check API key")
        return NextResponse.json(
          {
            error: "Invalid API key. Please check your HUGGINGFACE_API_KEY environment variable.",
            details: errorData.message || errorText,
          },
          { status: 401 },
        )
      }

      if (response.status === 503) {
        return NextResponse.json({ error: "Model is loading. Please try again in a few moments." }, { status: 503 })
      }

      if (response.status === 429) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
      }

      return NextResponse.json(
        {
          error: "Failed to generate image. Please try again.",
          details: errorData.message || errorText,
        },
        { status: 500 },
      )
    }

    const imageBlob = await response.blob()

    // Convert blob to base64
    const arrayBuffer = await imageBlob.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const dataUrl = `data:${imageBlob.type};base64,${base64}`

    console.log("[v0] Successfully generated image")
    return NextResponse.json({
      success: true,
      image: dataUrl,
      prompt: prompt,
    })
  } catch (error) {
    console.error("[v0] API route error:", error)
    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 })
  }
}
