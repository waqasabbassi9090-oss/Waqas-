import React, { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { generateArchitectureTransform, enhancePrompt } from './services/geminiService';
import { UploadedImage, AppStatus, GenerationResult } from './types';
import { Wand2, Layout, Image as ImageIcon, Sparkles, Download, AlertCircle, RefreshCw, Eraser, Palette, Zap, Eye, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<UploadedImage | null>(null);
  const [referenceImage, setReferenceImage] = useState<UploadedImage | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setStatus(AppStatus.ENHANCING);
    try {
      const newPrompt = await enhancePrompt(prompt);
      setPrompt(newPrompt);
      setStatus(AppStatus.IDLE);
    } catch (e) {
      // Fail silently for enhancement, just keep original
      setStatus(AppStatus.IDLE);
    }
  };

  const handleGenerate = async () => {
    if (!sourceImage) {
      setError("Please upload a source image of the house/model.");
      return;
    }
    if (!prompt.trim() && !referenceImage) {
      setError("Please provide a prompt or a reference image (or both).");
      return;
    }

    setStatus(AppStatus.GENERATING);
    setError(null);
    setResult(null);

    try {
      const genResult = await generateArchitectureTransform(prompt, sourceImage, referenceImage);
      setResult(genResult);
      setStatus(AppStatus.SUCCESS);
    } catch (e: any) {
      setError(e.message);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleDownload = () => {
    if (result?.imageUrl) {
      const link = document.createElement('a');
      link.href = result.imageUrl;
      link.download = 'archigen-transform.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const presetStyles = [
    { label: "Modern Minimalist", prompt: "Modern minimalist style, white stucco facade, large black-frame windows, wood accents, soft daylight" },
    { label: "Industrial Loft", prompt: "Industrial style, exposed red brick, steel beams, large factory windows, concrete details" },
    { label: "Cyberpunk", prompt: "Cyberpunk aesthetic, neon lighting, rain-slicked surfaces, futuristic modifications, night time" },
    { label: "Cottage Core", prompt: "Cozy cottage style, stone walls, climbing ivy, warm lantern lighting, inviting atmosphere" },
  ];

  const quickEdits = [
    { label: "Remove People/Cars", icon: <Eraser size={14} />, text: "Remove all people and vehicles from the image, keeping the architecture clean" },
    { label: "Night Mode", icon: <Sparkles size={14} />, text: "Transform the scene to night time with warm interior lighting glowing through windows" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Layout className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              ArchiGen Transform
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Gemini 2.5 Flash Image
             </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              
              {/* Step 1: Source */}
              <div>
                <h2 className="text-lg font-semibold flex items-center mb-4">
                  <span className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                  Source Material
                </h2>
                <ImageUploader 
                  label="Source House/Model" 
                  image={sourceImage} 
                  onImageChange={setSourceImage}
                  description="Upload the exterior photo or 3D render you want to transform."
                  required
                />
              </div>

              <div className="relative">
                 <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-white text-sm text-slate-500">and</span>
                </div>
              </div>

              {/* Step 2: Instructions */}
              <div>
                <h2 className="text-lg font-semibold flex items-center mb-4">
                  <span className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                  Design Instructions
                </h2>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="prompt" className="block text-sm font-medium text-slate-700">
                      Prompt
                    </label>
                    <button 
                      onClick={handleEnhancePrompt}
                      disabled={!prompt || status === AppStatus.ENHANCING}
                      className="text-xs flex items-center text-violet-600 hover:text-violet-800 disabled:opacity-50"
                    >
                      {status === AppStatus.ENHANCING ? (
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 mr-1" />
                      )}
                      Magic Enhance
                    </button>
                  </div>
                  <div className="relative">
                    <textarea
                      id="prompt"
                      rows={4}
                      className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 border pr-10"
                      placeholder="Describe the desired look (e.g. 'Make it modern white concrete') or select a preset below."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </div>

                  {/* Quick Edits Chips */}
                  <div className="mt-3 flex flex-wrap gap-2">
                     {quickEdits.map((qe, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPrompt(qe.text)}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                      >
                        <span className="mr-1.5 opacity-70">{qe.icon}</span>
                        {qe.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Style Presets */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Style Presets</p>
                    <div className="grid grid-cols-2 gap-2">
                      {presetStyles.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPrompt(preset.prompt)}
                          className="text-left px-3 py-2 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors truncate"
                          title={preset.prompt}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                   <ImageUploader 
                    label="Style Reference Image (Optional)" 
                    image={referenceImage} 
                    onImageChange={setReferenceImage}
                    description="Upload a photo to strictly copy materials/colors from."
                  />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={status === AppStatus.GENERATING || status === AppStatus.ENHANCING || !sourceImage}
                className={`w-full py-4 px-6 rounded-xl text-white font-semibold shadow-lg transition-all transform flex items-center justify-center space-x-2
                  ${(status === AppStatus.GENERATING || status === AppStatus.ENHANCING)
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : !sourceImage 
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:scale-[1.02] active:scale-[0.98] shadow-indigo-500/25'
                  }
                `}
              >
                {status === AppStatus.GENERATING ? (
                  <>
                    <RefreshCw className="animate-spin w-5 h-5" />
                    <span>Processing Architecture...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Generate Transformation</span>
                  </>
                )}
              </button>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start border border-red-100">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full min-h-[600px] flex flex-col overflow-hidden sticky top-24">
               {/* Result Header */}
               <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-700 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
                    Result
                  </h3>
                  
                  {status === AppStatus.SUCCESS && result?.imageUrl && (
                    <div className="flex space-x-2">
                       <button
                          className="md:hidden text-sm flex items-center text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg"
                          onMouseDown={() => setIsComparing(true)}
                          onMouseUp={() => setIsComparing(false)}
                          onTouchStart={() => setIsComparing(true)}
                          onTouchEnd={() => setIsComparing(false)}
                       >
                          <Eye className="w-4 h-4 mr-1" /> Compare
                       </button>
                       <button 
                        onClick={handleDownload}
                        className="text-sm flex items-center text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                    </div>
                  )}
               </div>

               {/* Canvas Area */}
               <div className="flex-1 bg-slate-100/50 p-6 flex items-center justify-center relative">
                  {status === AppStatus.IDLE || status === AppStatus.ENHANCING ? (
                    <div className="text-center text-slate-400">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                         <ImageIcon className="w-8 h-8 opacity-40" />
                      </div>
                      <p className="text-lg font-medium text-slate-500">Ready to transform</p>
                      <p className="text-sm mt-1 max-w-xs mx-auto">Upload your house model and describe the changes you want to see.</p>
                    </div>
                  ) : null}

                  {status === AppStatus.GENERATING && (
                    <div className="text-center">
                       <div className="relative w-24 h-24 mx-auto mb-6">
                          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                          <Wand2 className="absolute inset-0 m-auto text-indigo-600 w-8 h-8 animate-pulse" />
                       </div>
                       <h3 className="text-xl font-semibold text-slate-800 mb-2">Generating Design</h3>
                       <p className="text-slate-500 animate-pulse">Analyzing structure and applying materials...</p>
                    </div>
                  )}

                  {status === AppStatus.SUCCESS && result?.imageUrl && (
                    <div className="w-full h-full flex flex-col">
                       {/* Interactive Image Container */}
                       <div className="relative rounded-lg overflow-hidden shadow-lg border border-slate-200 bg-white flex-1 flex items-center justify-center group select-none">
                          
                          {/* Main Image (Result) */}
                          <img 
                            src={isComparing && sourceImage ? sourceImage.previewUrl : result.imageUrl} 
                            alt="Transformed Architecture" 
                            className="max-w-full max-h-[70vh] object-contain transition-opacity duration-200"
                          />

                          {/* Compare Button Overlay (Desktop) */}
                          <div className="absolute bottom-4 right-4 hidden md:flex items-center space-x-2">
                             <div className="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center pointer-events-auto">
                                <Eye className="w-3 h-3 mr-1.5" />
                                <span className="font-medium">Press & Hold to Compare</span>
                             </div>
                          </div>

                           {/* Compare Overlay Trigger (Covers whole image) */}
                           <div 
                              className="absolute inset-0 z-10 cursor-pointer"
                              onMouseDown={() => setIsComparing(true)}
                              onMouseUp={() => setIsComparing(false)}
                              onMouseLeave={() => setIsComparing(false)}
                              onTouchStart={() => setIsComparing(true)}
                              onTouchEnd={() => setIsComparing(false)}
                           ></div>

                           {/* Label Badge */}
                           <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded text-slate-800 pointer-events-none shadow-sm">
                              {isComparing ? 'ORIGINAL' : 'TRANSFORMED'}
                           </div>
                       </div>

                       {result.text && (
                         <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                           <p className="text-sm text-slate-600 leading-relaxed">
                             <span className="font-semibold text-slate-900 block mb-1">AI Note:</span>
                             {result.text}
                           </p>
                         </div>
                       )}
                    </div>
                  )}
               </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;