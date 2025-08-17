"use client";

import { useState, useEffect } from "react";
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
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Loader2,
  Sparkles,
  Wand2,
  AlertCircle,
  Download,
  Clock,
  Palette,
  Trash2,
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
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadImagesFromStorage = () => {
      try {
        const storedImages = localStorage.getItem("ai-artify-images");
        if (storedImages) {
          const parsedImages = JSON.parse(storedImages).map((img: any) => ({
            ...img,
            timestamp: new Date(img.timestamp),
          }));
          setGeneratedImages(parsedImages);
        }
      } catch (error) {
        console.error("Failed to load images from localStorage:", error);
      }
    };

    loadImagesFromStorage();
  }, []);

  useEffect(() => {
    if (generatedImages.length > 0) {
      try {
        localStorage.setItem(
          "ai-artify-images",
          JSON.stringify(generatedImages)
        );
      } catch (error) {
        console.error("Failed to save images to localStorage:", error);
      }
    }
  }, [generatedImages]);

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
        
        // Show success toast
        toast({
          title: "🎨 Artwork Generated!",
          description: "Your AI artwork has been created successfully.",
          duration: 3000,
        });
        
        // Auto-scroll to gallery after a short delay
        setTimeout(() => {
          scrollToGallery();
        }, 500);
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

  const handleClearGallery = () => {
    setGeneratedImages([]);
    try {
      localStorage.removeItem("ai-artify-images");
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    // Show confirmation dialog
    if (!confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Remove from state
      setGeneratedImages((prev) => prev.filter((img) => img.id !== imageId));
      
      // Update localStorage
      const updatedImages = generatedImages.filter((img) => img.id !== imageId);
      if (updatedImages.length > 0) {
        localStorage.setItem("ai-artify-images", JSON.stringify(updatedImages));
      } else {
        localStorage.removeItem("ai-artify-images");
      }
      
      // Show success toast
      toast({
        title: "🗑️ Image Deleted",
        description: "The image has been removed from your gallery.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to delete image:", error);
      toast({
        title: "❌ Error",
        description: "Failed to delete the image. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const scrollToGallery = () => {
    const gallerySection = document.getElementById('gallery-section');
    if (gallerySection) {
      gallerySection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">AI Artify</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Transform text into stunning AI artwork
                </p>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center justify-center sm:justify-end">
              <Button
                onClick={scrollToGallery}
                variant="ghost"
                className="text-foreground hover:text-primary transition-colors cursor-pointer w-full sm:w-auto touch-target"
              >
                Gallery
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Prompt Input Section */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Wand2 className="w-5 h-5 text-primary" />
                Create Your Artwork
              </CardTitle>
              <CardDescription className="text-sm">
                Describe the image you want to generate. Be creative and
                detailed for best results!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-sm font-medium">Your Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., A futuristic city in neon lights, cyberpunk style, highly detailed..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] sm:min-h-[120px] resize-none text-sm"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full h-12 text-base font-medium cursor-pointer touch-target"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Generating Artwork...</span>
                    <span className="sm:hidden">Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">Generate Artwork</span>
                    <span className="sm:hidden">Generate</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Example Prompts */}
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Need Inspiration?</CardTitle>
              <CardDescription className="text-sm">
                Try these example prompts to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {[
                  "A majestic dragon soaring over a mystical forest at sunset",
                  "Cyberpunk cityscape with neon lights and flying cars",
                  "Abstract geometric patterns in vibrant colors",
                  "A serene mountain landscape with aurora borealis",
                ].map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="cursor-pointer h-auto p-3 sm:p-4 text-left justify-start bg-transparent text-xs sm:text-sm leading-relaxed touch-target"
                    onClick={() => setPrompt(example)}
                    disabled={isGenerating}
                  >
                    <span className="line-clamp-2">{example}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {isGenerating && (
            <Card className="shadow-lg">
              <CardContent className="py-8 sm:py-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin" />
                  <div className="text-center space-y-2">
                    <p className="text-base sm:text-lg font-medium">
                      Creating your masterpiece...
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground px-4">
                      This may take 30-60 seconds
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {generatedImages.length > 0 && (
            <div id="gallery-section" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold">Your Gallery</h2>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    ({generatedImages.length} artwork
                    {generatedImages.length !== 1 ? "s" : ""})
                  </span>
                </div>
                <Button
                  onClick={handleClearGallery}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer text-destructive hover:text-destructive bg-transparent w-full sm:w-auto touch-target"
                >
                  Clear Gallery
                </Button>
              </div>

              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {generatedImages.map((image) => (
                  <Card
                    key={image.id}
                    className="group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 p-0"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={`Generated artwork: ${image.prompt}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      
                      {/* Download Button */}
                      <Button
                        onClick={() => handleDownload(image)}
                        size="sm"
                        className="cursor-pointer text-black absolute top-2 right-2 sm:top-3 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 touch-target bg-background/90 hover:bg-background border"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      {/* Delete Button */}
                      <Button
                        onClick={() => handleDeleteImage(image.id)}
                        size="sm"
                        variant="destructive"
                        className="cursor-pointer absolute top-2 left-2 sm:top-3 sm:left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 touch-target bg-destructive/90 hover:bg-destructive border"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      
                      {/* Mobile: Always show buttons on touch devices */}
                      <div className="sm:hidden absolute top-2 left-2 right-2 flex justify-between">
                        <Button
                          onClick={() => handleDeleteImage(image.id)}
                          size="sm"
                          variant="destructive"
                          className="cursor-pointer touch-target bg-destructive/90 hover:bg-destructive border text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => handleDownload(image)}
                          size="sm"
                          className="touch-target bg-background/90 hover:bg-background border text-xs"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3 sm:p-4 space-y-3">
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm font-medium line-clamp-2 leading-relaxed">
                          {image.prompt}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{image.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownload(image)}
                        variant="outline"
                        size="sm"
                        className="cursor-pointer w-full text-xs sm:text-sm touch-target"
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
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
