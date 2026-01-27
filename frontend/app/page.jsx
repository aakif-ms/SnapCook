"use client";

import { useState } from "react";
import { Upload, Search, ChefHat, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { analyzeImage } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleAnalyze = async () => {
    if (!file && !textInput) return;
    setLoading(true);
    try {
      const data = await analyzeImage(file, textInput);
      setResults(data);
    } catch (e) {
      alert("Error analyzing input");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-full mb-4">
            <ChefHat className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
            SnapCook
          </h1>
          <p className="text-lg text-neutral-600">
            Upload a photo of your pantry or type ingredients to get started.
          </p>
        </div>

        <Card className="border-2 border-dashed border-neutral-200 shadow-sm">
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-full max-w-sm">
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="cursor-pointer file:text-orange-600 file:font-semibold"
                />
              </div>
              <span className="text-sm text-neutral-400 font-medium">- OR -</span>
              <Input
                placeholder="Type ingredients (e.g. chicken, rice)..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="max-w-sm"
              />
              <Button 
                size="lg" 
                onClick={handleAnalyze} 
                disabled={loading || (!file && !textInput)}
                className="bg-orange-600 hover:bg-orange-700 text-white w-full max-w-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Find Recipes
              </Button>
            </div>
          </CardContent>
        </Card>

        {results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-semibold">
              Found {results.recipes.length} matches based on 
              <span className="text-orange-600"> {results.detected_ingredients.join(", ")}</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.recipes.map((recipe) => (
                <Card 
                  key={recipe.id} 
                  className="hover:shadow-lg transition-all cursor-pointer border-orange-100 hover:border-orange-300"
                  onClick={() => router.push(`/recipe/${recipe.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span>{recipe.title}</span>
                      <span className="text-sm font-normal bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                        {recipe.minutes} min
                      </span>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {recipe.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-orange-600 font-medium text-sm">
                      Start Cooking <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}