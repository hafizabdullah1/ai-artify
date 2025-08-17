"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Sparkles,
  Wand2,
  AlertCircle,
  Download,
  Clock,
  Palette,
} from "lucide-react";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      if (data.success && data.image) {
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          url: data.image,
          prompt: data.prompt,
          timestamp: new Date(),
        };
        setGeneratedImages((prev) => [newImage, ...prev]);
        setPrompt(""); // Clear prompt after successful generation
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement("a");
    link.href = image.url;
    link.download = `ai-artify-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Artify</h1>
              <p className="text-sm text-muted-foreground">
                Transform text into stunning AI artwork
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Prompt Input Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Create Your Artwork
              </CardTitle>
              <CardDescription>
                Describe the image you want to generate. Be creative and
                detailed for best results!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Your Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., A futuristic city in neon lights, cyberpunk style, highly detailed..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Artwork...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Artwork
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {isGenerating && (
            <Card className="shadow-lg">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium">
                      Creating your masterpiece...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This may take 30-60 seconds
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Example Prompts */}
          <Card>
            <CardHeader>
              <CardTitle>Need Inspiration?</CardTitle>
              <CardDescription>
                Try these example prompts to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  "A majestic dragon soaring over a mystical forest at sunset",
                  "Cyberpunk cityscape with neon lights and flying cars",
                  "Abstract geometric patterns in vibrant colors",
                  "A serene mountain landscape with aurora borealis",
                ].map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 text-left justify-start bg-transparent"
                    onClick={() => setPrompt(example)}
                    disabled={isGenerating}
                  >
                    <span className="text-sm">{example}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {generatedImages.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold">Your Gallery</h2>
                <span className="text-sm text-muted-foreground">
                  ({generatedImages.length} artwork
                  {generatedImages.length !== 1 ? "s" : ""})
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {generatedImages.map((image) => (
                  <Card
                    key={image.id}
                    className="group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={`Generated artwork: ${image.prompt}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      <Button
                        onClick={() => handleDownload(image)}
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-2">
                        <p className="text-sm font-medium line-clamp-2 leading-relaxed">
                          {image.prompt}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{image.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownload(image)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
