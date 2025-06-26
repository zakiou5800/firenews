import { useState, useEffect } from "react";
import { useUserGuardContext } from "app/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Settings, Plus, Play, Pause, Trash2, Edit, Globe, Zap, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import brain from "brain";
import { toast } from "sonner";
import { CustomSourceResponse, ManualScrapeResponse, ScrapeResult } from "types";
import { useNavigate } from "react-router-dom";

interface AddSourceForm {
  name: string;
  url: string;
  selectors: string;
}

interface AIStatus {
  ai_available: boolean;
  service_name: string;
  capabilities: string[];
  fallback_active: boolean;
}

const ScrapingControl = () => {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  const [scrapingMode, setScrapingMode] = useState<"auto" | "manual">("auto");
  const [sources, setSources] = useState<CustomSourceResponse[]>([]);
  const [loadingMode, setLoadingMode] = useState(true);
  const [loadingSources, setLoadingSources] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeResults, setScrapeResults] = useState<ManualScrapeResponse | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [loadingAI, setLoadingAI] = useState(true);
  const [addForm, setAddForm] = useState<AddSourceForm>({
    name: "",
    url: "",
    selectors: "h1, h2, h3, .title, .headline"
  });

  // Load initial data efficiently
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingMode(true);
    setLoadingSources(true);
    setLoadingAI(true);
    
    try {
      // Load scraping mode, custom sources, and AI status in parallel for faster loading
      const [modeResponse, sourcesResponse, aiResponse] = await Promise.all([
        brain.get_scraping_mode().catch(err => ({ ok: false, error: err })),
        brain.get_custom_sources().catch(err => ({ ok: false, error: err })),
        brain.get_ai_status().catch(err => ({ ok: false, error: err }))
      ]);
      
      // Handle mode response
      if (modeResponse.ok) {
        try {
          const modeData = await modeResponse.json();
          setScrapingMode(modeData.mode);
        } catch (error) {
          console.error('Error parsing mode data:', error);
          toast.error('Failed to load scraping mode');
        }
      } else {
        console.error('Mode API error:', modeResponse.error || modeResponse.status);
        toast.error('Failed to load scraping mode');
      }
      setLoadingMode(false);
      
      // Handle sources response
      if (sourcesResponse.ok) {
        try {
          const sourcesData = await sourcesResponse.json();
          setSources(sourcesData || []);
        } catch (error) {
          console.error('Error parsing sources data:', error);
          toast.error('Failed to load custom sources');
        }
      } else {
        console.error('Sources API error:', sourcesResponse.error || sourcesResponse.status);
        toast.error('Failed to load custom sources');
      }
      setLoadingSources(false);
      
      // Handle AI status response
      if (aiResponse.ok) {
        try {
          const aiData = await aiResponse.json();
          setAiStatus(aiData);
        } catch (error) {
          console.error('Error parsing AI status data:', error);
          toast.error('Failed to load AI status');
        }
      } else {
        console.error('AI status API error:', aiResponse.error || aiResponse.status);
        toast.error('Failed to load AI status');
      }
      setLoadingAI(false);
      
    } catch (error) {
      console.error('Critical error loading scraping control data:', error);
      toast.error('Critical system error');
      setLoadingMode(false);
      setLoadingSources(false);
      setLoadingAI(false);
    }
  };

  const toggleScrapingMode = async () => {
    try {
      const newMode = scrapingMode === "auto" ? "manual" : "auto";
      const response = await brain.set_scraping_mode({ mode: newMode });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setScrapingMode(newMode);
      toast.success(`Scraping mode set to ${newMode}`);
    } catch (error) {
      console.error("Error toggling scraping mode:", error);
      toast.error("Failed to update scraping mode");
    }
  };

  const addCustomSource = async () => {
    try {
      if (!addForm.name || !addForm.url) {
        toast.error("Name and URL are required");
        return;
      }

      const selectors = addForm.selectors.split(',').map(s => s.trim()).filter(s => s);
      
      const response = await brain.add_custom_source({
        name: addForm.name,
        url: addForm.url,
        source_type: "website",
        selectors: selectors
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const newSource = await response.json();
      setSources([newSource, ...sources]);
      setAddForm({ name: "", url: "", selectors: "h1, h2, h3, .title, .headline" });
      setShowAddDialog(false);
      toast.success("Custom source added successfully");
    } catch (error) {
      console.error("Error adding custom source:", error);
      toast.error("Failed to add custom source");
    }
  };

  const toggleSourceStatus = async (sourceId: number) => {
    try {
      const response = await brain.toggle_source_status(sourceId);
      const data = await response.json();
      
      setSources(sources.map(source => 
        source.id === sourceId 
          ? { ...source, is_active: data.is_active }
          : source
      ));
      
      toast.success(`Source ${data.is_active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error("Error toggling source status:", error);
      toast.error("Failed to update source status");
    }
  };

  const deleteSource = async (sourceId: number) => {
    try {
      await brain.delete_custom_source(sourceId);
      setSources(sources.filter(source => source.id !== sourceId));
      toast.success("Source deleted successfully");
    } catch (error) {
      console.error("Error deleting source:", error);
      toast.error("Failed to delete source");
    }
  };

  const triggerManualScrape = async (sourceIds?: number[]) => {
    try {
      setScraping(true);
      setScrapeResults(null);
      
      const response = await brain.manual_scrape({ source_ids: sourceIds });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const results = await response.json();
      
      setScrapeResults(results);
      toast.success(`Scraping completed: ${results.total_articles} articles found`);
    } catch (error) {
      console.error("Error during manual scrape:", error);
      toast.error("Scraping failed");
    } finally {
      setScraping(false);
    }
  };

  // Show fast loading only initially, then partial loading states
  const isInitialLoad = loadingMode && loadingSources && loadingAI;
  
  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-black p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Settings className="h-12 w-12 text-red-500 mx-auto animate-spin" />
          <p className="text-red-400 text-lg font-mono tracking-wider">INITIALIZING CONTROL SYSTEMS...</p>
          <div className="w-64 mx-auto">
            <Progress value={85} className="h-2 bg-gray-800" />
          </div>
          <p className="text-gray-500 text-sm font-mono">Loading scraping control interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate("/")}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-black px-6 py-3 border border-gray-600"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              BACK TO DASHBOARD
            </Button>
          </div>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <Settings className="h-10 w-10 text-red-500" />
              <h1 className="text-4xl font-black text-white tracking-wider">
                SCRAPING CONTROL CENTER
              </h1>
            </div>
            <p className="text-red-400 font-mono text-sm tracking-wide">
              MANAGE FIRE NEWS DATA ACQUISITION SYSTEMS
            </p>
          </div>
        </div>

        {/* AI Status Card */}
        <Card className="bg-gray-900 border-blue-500/30 shadow-2xl">
          <CardHeader className="border-b border-blue-500/20">
            <CardTitle className="text-white font-black text-xl flex items-center space-x-2">
              <Zap className="h-6 w-6 text-blue-500" />
              <span>AI ANALYSIS STATUS</span>
              {loadingAI && <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full ml-2" />}
            </CardTitle>
            <CardDescription className="text-blue-400 font-mono">
              Gemini AI-powered content analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loadingAI ? (
              <div className="space-y-3">
                <div className="bg-gray-800 h-6 rounded animate-pulse" />
                <div className="bg-gray-800 h-4 w-3/4 rounded animate-pulse" />
              </div>
            ) : aiStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={aiStatus.ai_available ? "default" : "secondary"}
                      className={`font-mono ${aiStatus.ai_available ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                    >
                      {aiStatus.ai_available ? "ONLINE" : "OFFLINE"}
                    </Badge>
                    <span className="text-white font-bold text-lg">
                      {aiStatus.service_name || "AI Service"}
                    </span>
                  </div>
                  {aiStatus.fallback_active && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-500 font-mono">
                      FALLBACK ACTIVE
                    </Badge>
                  )}
                </div>
                
                {aiStatus.ai_available && aiStatus.capabilities.length > 0 && (
                  <div>
                    <h4 className="text-white font-bold mb-2">AI Capabilities:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {aiStatus.capabilities.map((capability, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-gray-300 font-mono">{capability}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!aiStatus.ai_available && (
                  <Alert className="bg-yellow-900/20 border-yellow-500/30">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-yellow-400 font-mono">
                      AI analysis unavailable. Using fallback keyword-based detection.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert className="bg-red-900/20 border-red-500/30">
                <XCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400 font-mono">
                  Failed to load AI status
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-red-500/30 shadow-2xl">
          <CardHeader className="border-b border-red-500/20">
            <CardTitle className="text-white font-black text-xl flex items-center space-x-2">
              <Zap className="h-6 w-6 text-red-500" />
              <span>OPERATION MODE</span>
              {loadingMode && <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full ml-2" />}
            </CardTitle>
            <CardDescription className="text-red-400 font-mono">
              Configure automatic or manual data acquisition
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loadingMode ? (
              <div className="space-y-3">
                <div className="bg-gray-800 h-6 rounded animate-pulse" />
                <div className="bg-gray-800 h-4 w-3/4 rounded animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={scrapingMode === "auto" ? "default" : "secondary"}
                      className={`font-mono ${scrapingMode === "auto" ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      {scrapingMode === "auto" ? "AUTO" : "MANUAL"}
                    </Badge>
                    <span className="text-white font-bold text-lg">
                      {scrapingMode === "auto" ? "AUTOMATIC" : "MANUAL"} MODE
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm font-mono">
                    {scrapingMode === "auto" 
                      ? "System automatically scrapes sources every interval"
                      : "Manual control over scraping operations"
                    }
                  </p>
                </div>
                <Switch
                  checked={scrapingMode === "auto"}
                  onCheckedChange={toggleScrapingMode}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Scraping Controls */}
        {scrapingMode === "manual" && (
          <Card className="bg-gray-900 border-red-500/30 shadow-2xl">
            <CardHeader className="border-b border-red-500/20">
              <CardTitle className="text-white font-black text-xl flex items-center space-x-2">
                <Play className="h-6 w-6 text-red-500" />
                <span>MANUAL SCRAPING</span>
              </CardTitle>
              <CardDescription className="text-red-400 font-mono">
                Trigger scraping operations on demand
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={() => triggerManualScrape()}
                  disabled={scraping}
                  className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3 text-lg"
                >
                  {scraping ? (
                    <>
                      <Pause className="h-5 w-5 mr-2 animate-spin" />
                      SCRAPING...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      START SCRAPING
                    </>
                  )}
                </Button>
                <div className="text-gray-400 font-mono text-sm">
                  Scrape all active sources
                </div>
              </div>

              {scraping && (
                <div className="space-y-2">
                  <Label className="text-white font-mono">SCRAPING IN PROGRESS</Label>
                  <Progress value={50} className="h-3 bg-gray-800" />
                </div>
              )}

              {scrapeResults && (
                <Alert className="bg-gray-800 border-green-500/30">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-400 font-mono">
                    SCRAPING COMPLETED: {scrapeResults.total_articles} articles found in {scrapeResults.duration_seconds.toFixed(2)}s
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Custom Sources with optimized loading */}
        <Card className="bg-gray-900 border-red-500/30 shadow-2xl">
          <CardHeader className="border-b border-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white font-black text-xl flex items-center space-x-2">
                  <Globe className="h-6 w-6 text-red-500" />
                  <span>CUSTOM SOURCES</span>
                  {loadingSources && <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full ml-2" />}
                </CardTitle>
                <CardDescription className="text-red-400 font-mono">
                  Manage custom news website sources
                </CardDescription>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700 text-white font-black" disabled={loadingSources}>
                    <Plus className="h-4 w-4 mr-2" />
                    ADD SOURCE
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-red-500/30 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white font-black text-xl">ADD CUSTOM SOURCE</DialogTitle>
                    <DialogDescription className="text-red-400 font-mono">
                      Configure a new news website source
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white font-mono">SOURCE NAME</Label>
                      <Input
                        value={addForm.name}
                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                        placeholder="e.g., Local News Station"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-mono">URL</Label>
                      <Input
                        value={addForm.url}
                        onChange={(e) => setAddForm({ ...addForm, url: e.target.value })}
                        placeholder="https://example.com"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-mono">CSS SELECTORS</Label>
                      <Textarea
                        value={addForm.selectors}
                        onChange={(e) => setAddForm({ ...addForm, selectors: e.target.value })}
                        placeholder="h1, h2, h3, .title, .headline"
                        className="bg-gray-800 border-gray-600 text-white font-mono"
                        rows={3}
                      />
                      <p className="text-gray-500 text-xs mt-1 font-mono">
                        Comma-separated CSS selectors for article headlines
                      </p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddDialog(false)}
                        className="border-gray-600 text-gray-400"
                      >
                        CANCEL
                      </Button>
                      <Button 
                        onClick={addCustomSource}
                        className="bg-red-600 hover:bg-red-700 text-white font-black"
                      >
                        ADD SOURCE
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingSources ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="bg-gray-700 h-6 w-1/3 rounded animate-pulse" />
                      <div className="bg-gray-700 h-4 w-2/3 rounded animate-pulse" />
                      <div className="bg-gray-700 h-3 w-1/2 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 font-mono">NO CUSTOM SOURCES CONFIGURED</p>
                <p className="text-gray-600 text-sm mt-2">Add news websites to scrape for fire incidents</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sources.map((source) => (
                  <div key={source.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-white font-bold text-lg">{source.name}</h3>
                          <Badge 
                            variant={source.is_active ? "default" : "secondary"}
                            className={`font-mono text-xs ${
                              source.is_active 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-600 text-gray-300'
                            }`}
                          >
                            {source.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </div>
                        <p className="text-gray-400 font-mono text-sm mb-2">{source.url}</p>
                        <p className="text-gray-500 text-xs font-mono">
                          Selectors: {source.selectors.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {scrapingMode === "manual" && (
                          <Button
                            size="sm"
                            onClick={() => triggerManualScrape([source.id])}
                            disabled={scraping || !source.is_active}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-mono"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            SCRAPE
                          </Button>
                        )}
                        <Switch
                          checked={source.is_active}
                          onCheckedChange={() => toggleSourceStatus(source.id)}
                          className="data-[state=checked]:bg-green-600"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSource(source.id)}
                          className="border-red-500 text-red-500 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scrape Results */}
        {scrapeResults && (
          <Card className="bg-gray-900 border-green-500/30 shadow-2xl">
            <CardHeader className="border-b border-green-500/20">
              <CardTitle className="text-white font-black text-xl flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span>SCRAPING RESULTS</span>
              </CardTitle>
              <CardDescription className="text-green-400 font-mono">
                Latest scraping operation results
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-green-500/20">
                  <div className="text-green-400 font-mono text-sm">TOTAL ARTICLES</div>
                  <div className="text-white font-black text-2xl">{scrapeResults.total_articles}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-blue-500/20">
                  <div className="text-blue-400 font-mono text-sm">SOURCES SCRAPED</div>
                  <div className="text-white font-black text-2xl">{scrapeResults.results.length}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-yellow-500/20">
                  <div className="text-yellow-400 font-mono text-sm">DURATION</div>
                  <div className="text-white font-black text-2xl">{scrapeResults.duration_seconds.toFixed(1)}s</div>
                </div>
              </div>
              
              {/* AI Analysis Results */}
              {scrapeResults.ai_analysis_used && (
                <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Zap className="h-5 w-5 text-blue-500" />
                    <h4 className="text-white font-bold">AI Analysis Results</h4>
                    <Badge className="bg-blue-600 text-white font-mono text-xs">GEMINI AI</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800 p-3 rounded border border-blue-500/20">
                      <div className="text-blue-400 font-mono text-sm">HIGH CONFIDENCE</div>
                      <div className="text-white font-black text-xl">{scrapeResults.high_confidence_articles}</div>
                      <div className="text-gray-400 text-xs font-mono">Articles with confidence ≥ 70%</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded border border-green-500/20">
                      <div className="text-green-400 font-mono text-sm">AI ENHANCED</div>
                      <div className="text-white font-black text-xl">
                        {scrapeResults.results.filter(r => r.ai_enhanced).length}
                      </div>
                      <div className="text-gray-400 text-xs font-mono">Sources processed with AI</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <h4 className="text-white font-bold mb-4">Source Results:</h4>
                {scrapeResults.results.map((result, index) => (
                  <div key={index} className="bg-gray-800 p-3 rounded border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {result.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-white font-mono">{result.source_name}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm font-mono">
                        <span className="text-green-400">{result.articles_found} articles</span>
                        <span className="text-blue-400">{result.duration_seconds.toFixed(2)}s</span>
                        {result.ai_enhanced && (
                          <Badge className="bg-blue-600 text-white text-xs">AI</Badge>
                        )}
                        {result.ai_confidence_avg && (
                          <span className="text-purple-400">
                            {(result.ai_confidence_avg * 100).toFixed(0)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                    {result.error && (
                      <p className="text-red-400 text-xs mt-2 font-mono">Error: {result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ScrapingControl;
