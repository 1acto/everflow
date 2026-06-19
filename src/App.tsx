import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, Pause, ChevronLeft, ChevronRight, Settings, 
  Sparkles, BookOpen, Search, Clock, CheckCircle2,
  X, FileText, Cpu, Copy, Download,
  ExternalLink, SlidersHorizontal, Monitor
} from "lucide-react";
import { parseMarkdownToSlides, Slide } from "./parser";
import { SlideDiagrams } from "./components/SlideDiagrams";

interface PresentationItem {
  id: string;
  title: string;
  preset: string;
  accent: string;
  mtime: number;
}

export default function App() {
  const [routeHash, setRouteHash] = useState<string>(() => window.location.hash);
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loadingDeck, setLoadingDeck] = useState<boolean>(false);
  const [deckMetadata, setDeckMetadata] = useState<{ title?: string; preset?: string; accent?: string } | null>(null);

  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAutoplayActive, setIsAutoplayActive] = useState<boolean>(false);
  const [autoplayInterval] = useState<number>(8000); // ms
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [accentColor, setAccentColor] = useState<"blue" | "teal" | "mint" | "lavender">("lavender");
  const [themeStyle, setThemeStyle] = useState<"clean" | "aura" | "io-grid">("aura");
  const [fontSize, setFontSize] = useState<"normal" | "large" | "mega">("normal");
  const [slideTransition, setSlideTransition] = useState<"slide" | "fade" | "zoom">("slide");
  const [isPresenterNotesOpen] = useState<boolean>(true);
  const [copiedNote, setCopiedNote] = useState<boolean>(false);

  // New Fullscreen & Export & Presenter States
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<"markdown" | "text" | "json">("markdown");
  const [copiedExport, setCopiedExport] = useState<boolean>(false);
  const [laserPointerActive, setLaserPointerActive] = useState<boolean>(false);

  // Cross-Window Presentation & Synchronization Setup
  const [presenterMode, setPresenterMode] = useState<"normal" | "audience" | "presenter">(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const m = p.get("mode");
      if (m === "audience" || m === "presenter") return m;
    }
    return "normal";
  });
  
  const [notesFontSize, setNotesFontSize] = useState<number>(18);
  const [laserRelativePos, setLaserRelativePos] = useState<{ xPercent: number; yPercent: number }>({ xPercent: 0, yPercent: 0 });

  const [dashboardBgStyle, setDashboardBgStyle] = useState<"aurora" | "grid" | "morph" | "minimal">("aurora");
  const [dashSearchQuery, setDashSearchQuery] = useState<string>("");
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isDashSettingsOpen, setIsDashSettingsOpen] = useState<boolean>(false);
  // Listen to hash changes for routing
  useEffect(() => {
    const handleHashChange = () => {
      setRouteHash(window.location.hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Parse current presentation ID from route hash or direct path.
  // Supports both #/presentation/deep-modules and /presentation/deep-modules.
  const selectedPresentationId = useMemo<string | null>(() => {
    const hashMatch = routeHash.match(/^#\/presentation\/([^/?]+)/);
    if (hashMatch) return hashMatch[1];
    if (routeHash) return null;
    const pathMatch = window.location.pathname.match(/^\/presentation\/([^/?#]+)/);
    return pathMatch ? pathMatch[1] : null;
  }, [routeHash]);

  // Fetch all presentations on dashboard mount
  useEffect(() => {
    if (!selectedPresentationId) {
      setLoadingList(true);
      fetch("/api/presentations")
        .then(res => res.json())
        .then((data: PresentationItem[]) => {
          setPresentations(data);
          setLoadingList(false);
        })
        .catch(err => {
          console.error("Failed to load presentations", err);
          setLoadingList(false);
        });
    }
  }, [selectedPresentationId]);

  // Fetch slide deck by ID
  useEffect(() => {
    if (selectedPresentationId) {
      setLoadingDeck(true);
      fetch(`/api/presentations/${selectedPresentationId}`)
        .then(res => res.json())
        .then((data: { id: string; metadata: { title?: string; preset?: string; accent?: string }; content: string }) => {
          setDeckMetadata(data.metadata);
          
          let initialAccent: "blue" | "teal" | "mint" | "lavender" = "lavender";
          const accentMeta = data.metadata.accent?.toLowerCase();
          if (accentMeta === "blue") initialAccent = "blue";
          else if (accentMeta === "teal") initialAccent = "teal";
          else if (accentMeta === "mint" || accentMeta === "green") initialAccent = "mint";
          else if (accentMeta === "lavender" || accentMeta === "gemini") initialAccent = "lavender";
          
          const parsed = parseMarkdownToSlides(data.content, initialAccent);
          setSlides(parsed);
          setCurrentSlideIndex(0);
          setAccentColor(initialAccent);
          setLoadingDeck(false);
        })
        .catch(err => {
          console.error("Failed to load presentation slides", err);
          setLoadingDeck(false);
        });
    } else {
      setSlides([]);
      setDeckMetadata(null);
    }
  }, [selectedPresentationId]);

  const currentSlide = useMemo<Slide | undefined>(() => {
    return slides[currentSlideIndex];
  }, [slides, currentSlideIndex]);

  const nextSlide = useMemo<Slide | undefined>(() => {
    if (slides.length === 0) return undefined;
    return slides[(currentSlideIndex + 1) % slides.length];
  }, [slides, currentSlideIndex]);

  // Broadcast Channel for CROSS-TAB sync (real-time, zero backend)
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Send updates to other window
  const broadcastStateChange = useCallback((type: string, payload: unknown) => {
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({ type, payload });
      } catch (e) {
        // BroadcastChannel blocked or failed (sandboxed iframe constraints)
      }
    }
    // Also save in localStorage as backup fallback
    try {
      localStorage.setItem(`sync_keynote_${selectedPresentationId}_${type}`, JSON.stringify({ payload, timestamp: Date.now() }));
    } catch (e) {
      // Storage restriction
    }
  }, [selectedPresentationId]);

  // Setup BroadcastChannel listeners
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window && selectedPresentationId) {
      const channelName = `google_io_keynote_synergy_channel_${selectedPresentationId}`;
      const ch = new BroadcastChannel(channelName);
      channelRef.current = ch;

      ch.onmessage = (event) => {
        const { type, payload } = event.data as { type: string; payload: unknown };
        if (type === "SYNC_INDEX" && typeof payload === "number") {
          setCurrentSlideIndex(prev => prev !== payload ? payload : prev);
        } else if (type === "SYNC_ACCENT" && (payload === "blue" || payload === "teal" || payload === "mint" || payload === "lavender")) {
          setAccentColor(payload);
        } else if (type === "SYNC_THEME" && (payload === "clean" || payload === "aura" || payload === "io-grid")) {
          setThemeStyle(payload);
        } else if (type === "SYNC_LASER_ACTIVE" && typeof payload === "boolean") {
          setLaserPointerActive(payload);
        } else if (type === "SYNC_LASER_POS" && payload && typeof payload === "object") {
          const pos = payload as { xPercent: number; yPercent: number };
          setLaserRelativePos(pos);
        } else if (type === "SYNC_TRANSITION" && (payload === "slide" || payload === "fade" || payload === "zoom")) {
          setSlideTransition(payload);
        } else if (type === "SYNC_AUTOPLAY" && typeof payload === "boolean") {
          setIsAutoplayActive(payload);
        }
      };

      return () => {
        ch.close();
      };
    }
  }, [selectedPresentationId]);

  // Sync state broadcast on local changes
  useEffect(() => {
    if (selectedPresentationId) {
      broadcastStateChange("SYNC_INDEX", currentSlideIndex);
    }
  }, [currentSlideIndex, selectedPresentationId, broadcastStateChange]);

  useEffect(() => {
    if (selectedPresentationId) {
      broadcastStateChange("SYNC_ACCENT", accentColor);
    }
  }, [accentColor, selectedPresentationId, broadcastStateChange]);

  useEffect(() => {
    if (selectedPresentationId) {
      broadcastStateChange("SYNC_THEME", themeStyle);
    }
  }, [themeStyle, selectedPresentationId, broadcastStateChange]);

  useEffect(() => {
    if (selectedPresentationId) {
      broadcastStateChange("SYNC_LASER_ACTIVE", laserPointerActive);
    }
  }, [laserPointerActive, selectedPresentationId, broadcastStateChange]);

  useEffect(() => {
    if (selectedPresentationId && laserPointerActive) {
      broadcastStateChange("SYNC_LASER_POS", laserRelativePos);
    }
  }, [laserRelativePos, laserPointerActive, selectedPresentationId, broadcastStateChange]);

  useEffect(() => {
    if (selectedPresentationId) {
      broadcastStateChange("SYNC_TRANSITION", slideTransition);
    }
  }, [slideTransition, selectedPresentationId, broadcastStateChange]);

  useEffect(() => {
    if (selectedPresentationId) {
      broadcastStateChange("SYNC_AUTOPLAY", isAutoplayActive);
    }
  }, [isAutoplayActive, selectedPresentationId, broadcastStateChange]);

  // Read Backup state changes from LocalStorage StorageEvents
  useEffect(() => {
    if (!selectedPresentationId) return;
    const prefix = `sync_keynote_${selectedPresentationId}_`;
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith(prefix)) return;
      try {
        const type = e.key.replace(prefix, "");
        const info = JSON.parse(e.newValue || "{}") as { payload: unknown };
        if (info && info.payload !== undefined) {
          if (type === "SYNC_INDEX" && typeof info.payload === "number") {
            setCurrentSlideIndex(prev => prev !== info.payload ? info.payload : prev);
          } else if (type === "SYNC_ACCENT" && (info.payload === "blue" || info.payload === "teal" || info.payload === "mint" || info.payload === "lavender")) {
            setAccentColor(info.payload);
          } else if (type === "SYNC_THEME" && (info.payload === "clean" || info.payload === "aura" || info.payload === "io-grid")) {
            setThemeStyle(info.payload);
          } else if (type === "SYNC_LASER_ACTIVE" && typeof info.payload === "boolean") {
            setLaserPointerActive(info.payload);
          } else if (type === "SYNC_LASER_POS" && info.payload && typeof info.payload === "object") {
            setLaserRelativePos(info.payload as { xPercent: number; yPercent: number });
          } else if (type === "SYNC_TRANSITION" && (info.payload === "slide" || info.payload === "fade" || info.payload === "zoom")) {
            setSlideTransition(info.payload);
          } else if (type === "SYNC_AUTOPLAY" && typeof info.payload === "boolean") {
            setIsAutoplayActive(info.payload);
          }
        }
      } catch (err) {
        // ignore format issues
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [selectedPresentationId]);

  // Auto-play Timer Reference
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard navigation control
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === " ") {
      event.preventDefault();
      setCurrentSlideIndex(prev => (prev < slides.length - 1 ? prev + 1 : 0));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setCurrentSlideIndex(prev => (prev > 0 ? prev - 1 : slides.length - 1));
    } else if (event.key === "Escape") {
      setIsSidebarOpen(false);
      setIsFullscreen(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [slides]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Sync native fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyNativeFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyNativeFullscreen);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const [secondsSpoke, setSecondsSpoke] = useState<number>(0);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    if (isFullscreen || presenterMode === "presenter") {
      timerInterval = setInterval(() => {
        setSecondsSpoke(s => s + 1);
      }, 1000);
    } else {
      setSecondsSpoke(0);
    }
    return () => {
      clearInterval(timerInterval);
    };
  }, [isFullscreen, presenterMode]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Autoplay handler
  useEffect(() => {
    if (isAutoplayActive) {
      autoplayTimerRef.current = setTimeout(() => {
        setCurrentSlideIndex(prev => (prev < slides.length - 1 ? prev + 1 : 0));
      }, autoplayInterval);
    } else {
      clearTimeout(autoplayTimerRef.current);
    }
    return () => {
      clearTimeout(autoplayTimerRef.current);
    };
  }, [isAutoplayActive, currentSlideIndex, autoplayInterval, slides]);

  // Filter slides by search text
  const filteredSlides = useMemo(() => {
    if (!searchQuery.trim()) return slides;
    const q = searchQuery.toLowerCase();
    return slides.filter(
      s =>
        s.headline.toLowerCase().includes(q) ||
        s.headlineEnglish.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.categoryThai.toLowerCase().includes(q) ||
        s.points.some(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    );
  }, [searchQuery, slides]);

  // Transition variants
  const transitionVariants = {
    slide: {
      initial: { x: 80, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -80, opacity: 0 }
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    zoom: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 1.05, opacity: 0 }
    }
  };

  const listContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.08
      }
    }
  };

  const listItemVariants = {
    hidden: { y: 12, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1, 
      transition: { type: "spring", stiffness: 350, damping: 28 } 
    }
  };

  const getAccentHex = () => {
    switch (accentColor) {
      case "blue": return "#1a73e8";
      case "teal": return "#00796b";
      case "mint": return "#34a853";
      case "lavender": return "#8a4bf3";
    }
  };

  const getAccentBgClass = () => {
    switch (accentColor) {
      case "blue": return "bg-[#1a73e8]";
      case "teal": return "bg-[#00796b]";
      case "mint": return "bg-[#34a853]";
      case "lavender": return "bg-[#8a4bf3]";
    }
  };

  const getAccentTextClass = () => {
    switch (accentColor) {
      case "blue": return "text-[#1a73e8]";
      case "teal": return "text-[#00796b]";
      case "mint": return "text-[#34a853]";
      case "lavender": return "text-[#8a4bf3]";
    }
  };

  const getAccentBorderClass = () => {
    switch (accentColor) {
      case "blue": return "border-[#1a73e8]";
      case "teal": return "border-[#00796b]";
      case "mint": return "border-[#34a853]";
      case "lavender": return "border-[#8a4bf3]";
    }
  };

  const handleCopyNotes = () => {
    if (!currentSlide) return;
    const rawNotes = currentSlide.speakerNotes.join("\n");
    navigator.clipboard.writeText(rawNotes).then(() => {
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    });
  };

  const getExportContent = (format: "markdown" | "text" | "json") => {
    if (format === "json") {
      return JSON.stringify(slides, null, 2);
    }
    
    if (format === "markdown") {
      return slides.map(s => {
        const pointsMd = s.points.map(p => `- **${p.title}**: ${p.description}`).join("\n");
        const notesMd = s.speakerNotes.map(n => `> ${n}`).join("\n");
        return `# Slide ${s.id}: ${s.headline}\n*${s.headlineEnglish}*\nCategory: ${s.category} (${s.categoryThai})\n\n### Key points\n${pointsMd}\n\n### Speaker Notes\n${notesMd}\n\n---\n`;
      }).join("\n\n");
    }
    
    return slides.map(s => {
      const pointsText = s.points.map(p => `• ${p.title}: ${p.description}`).join("\n");
      const notesText = s.speakerNotes.join("\n");
      return `[SLIDE ${s.id}] ${s.headline}\n(${s.headlineEnglish})\n\nPOINTS:\n${pointsText}\n\nNOTES:\n${notesText}\n\n====================\n`;
    }).join("\n\n");
  };

  const handleDownloadExport = () => {
    const text = getExportContent(exportFormat);
    const mimeType = exportFormat === "json" ? "application/json" : "text/markdown";
    const extension = exportFormat === "json" ? "json" : exportFormat === "markdown" ? "md" : "txt";
    const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedPresentationId || 'presentation'}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyExport = () => {
    const text = getExportContent(exportFormat);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2000);
    });
  };

  // Group presentations by folder recursively
  const folderGroups = useMemo(() => {
    const groups: Record<string, PresentationItem[]> = {};
    presentations.forEach(deck => {
      const matchesSearch = 
        deck.title.toLowerCase().includes(dashSearchQuery.toLowerCase()) ||
        deck.id.toLowerCase().includes(dashSearchQuery.toLowerCase()) ||
        deck.preset.toLowerCase().includes(dashSearchQuery.toLowerCase()) ||
        deck.accent.toLowerCase().includes(dashSearchQuery.toLowerCase());
        
      if (!matchesSearch) return;

      const parts = deck.id.split('/');
      if (parts.length > 1) {
        const folderPath = parts.slice(0, -1).join('/');
        if (!groups[folderPath]) {
          groups[folderPath] = [];
        }
        groups[folderPath].push(deck);
      } else {
        const rootFolder = "Root Library";
        if (!groups[rootFolder]) {
          groups[rootFolder] = [];
        }
        groups[rootFolder].push(deck);
      }
    });
    return groups;
  }, [presentations, dashSearchQuery]);

  // Render Dashboard View
  if (!selectedPresentationId) {
    return (
      <div className={`min-h-screen flex flex-col text-[#1F1F1F] relative overflow-hidden transition-all duration-300 ${
        themeStyle === "clean" ? "bg-white" :
        themeStyle === "io-grid" ? "bg-[#F8F9FA] bg-[radial-gradient(#e5e7eb_1px,transparent_1.5px)] bg-[size:24px_24px]" :
        "bg-[#F8F9FA]"
      }`}>
        {/* Animated Background Selector Render */}
        {themeStyle === "aura" && dashboardBgStyle === "aurora" && (
          <div className={`absolute inset-0 animate-aurora pointer-events-none z-0 opacity-50 ${
            accentColor === "blue" ? "bg-[linear-gradient(135deg,rgba(232,240,254,0.7)_0%,rgba(224,242,254,0.7)_50%,#ffffff_100%)]" :
            accentColor === "teal" ? "bg-[linear-gradient(135deg,rgba(224,242,254,0.7)_0%,rgba(204,251,241,0.7)_50%,#ffffff_100%)]" :
            accentColor === "mint" ? "bg-[linear-gradient(135deg,rgba(209,250,229,0.7)_0%,rgba(236,253,245,0.7)_50%,#ffffff_100%)]" :
            "bg-[linear-gradient(135deg,rgba(243,232,255,0.7)_0%,rgba(224,231,255,0.7)_50%,#ffffff_100%)]"
          }`} />
        )}
        {themeStyle === "aura" && dashboardBgStyle === "grid" && (
          <div className="absolute inset-0 animate-grid-move pointer-events-none z-0 opacity-40" />
        )}
        {themeStyle === "aura" && dashboardBgStyle === "morph" && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#f8f9fa] opacity-60">
            <div className={`absolute top-1/4 left-1/4 w-96 h-96 blur-3xl shape-morph-1 ${
              accentColor === "blue" ? "bg-blue-500/10" :
              accentColor === "teal" ? "bg-teal-500/10" :
              accentColor === "mint" ? "bg-emerald-500/10" :
              "bg-[#8a4bf3]/10"
            }`} />
            <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 blur-3xl shape-morph-2 ${
              accentColor === "blue" ? "bg-sky-500/10" :
              accentColor === "teal" ? "bg-cyan-500/10" :
              accentColor === "mint" ? "bg-teal-500/10" :
              "bg-indigo-500/10"
            }`} />
          </div>
        )}

        <header className="py-6 px-6 md:px-12 border-b border-gray-250/60 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 12C2 7.58 5.58 4 10 4C13.5 4 15.5 6 17 8C18.5 10 20.5 12 22 12C22 16.42 18.42 20 14 20C10.5 20 8.5 18 7 16C5.5 14 3.5 12 2 12Z" stroke={getAccentHex()} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12Z" fill={getAccentHex()} />
              </svg>
              <span className="font-black text-xl tracking-tight uppercase text-gray-900">
                Project <span style={{ color: getAccentHex() }}>Everflow</span>
              </span>
            </div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Local Presentation Library</div>
          </div>
        </header>
        
        <main className="flex-grow max-w-6xl mx-auto w-full py-16 px-6 md:px-12">
          <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 text-gray-900 leading-none">
                Presenter Workspace
              </h1>
              <p className="text-sm text-gray-650 max-w-xl leading-relaxed">
                A Material 3 designed workspace with folder-based slide organization and real-time projector syncing.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-20">
              <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search decks..."
                  value={dashSearchQuery}
                  onChange={(e) => setDashSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-full bg-white/70 hover:border-gray-400 focus:bg-white transition-all shadow-2xs outline-none text-left"
                />
              </div>

              <button
                onClick={() => setIsDashSettingsOpen(true)}
                className="px-4 py-2 text-xs font-bold text-gray-750 bg-white border border-gray-250 hover:bg-gray-50 rounded-full flex items-center justify-center space-x-1.5 shadow-2xs hover:border-gray-400 active:scale-95 transition-all"
                title="Workspace Settings"
              >
                <Settings className="w-4 h-4 text-gray-500" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {loadingList ? (
            <div className="py-20 text-center text-gray-500 font-mono text-xs uppercase tracking-widest animate-pulse relative z-10">
              Syncing presentation library...
            </div>
          ) : Object.keys(folderGroups).length === 0 ? (
            <div className="py-20 px-8 text-center border-2 border-dashed border-gray-300 rounded-[2rem] bg-white/80 max-w-3xl mx-auto relative z-10">
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Presentations Found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search criteria or create a .md file inside library/ directory.</p>
            </div>
          ) : (
            <div className="space-y-8 relative z-10">
              {Object.entries(folderGroups).map(([folderName, decks]) => {
                const isCollapsed = collapsedFolders[folderName] || false;
                const toggleFolder = () => {
                  setCollapsedFolders(prev => ({ ...prev, [folderName]: !isCollapsed }));
                };

                return (
                  <div key={folderName} className="bg-white/60 backdrop-blur-md rounded-[32px] p-6 text-left shadow-xs transition-all">
                    <div 
                      className="flex items-center justify-between cursor-pointer pb-4 mb-3"
                      onClick={toggleFolder}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                          accentColor === "blue" ? "bg-blue-50 text-[#1a73e8] border-blue-100" :
                          accentColor === "teal" ? "bg-teal-50 text-[#00796b] border-teal-100" :
                          accentColor === "mint" ? "bg-emerald-50 text-[#34a853] border-emerald-100" :
                          "bg-purple-50 text-[#8a4bf3] border-purple-100"
                        }`}>
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">
                            {folderName}
                          </h2>
                          <span className="text-[9px] font-mono text-gray-450 uppercase font-bold tracking-widest mt-1.5 block">
                            {decks.length} {decks.length === 1 ? 'Presentation' : 'Presentations'}
                          </span>
                        </div>
                      </div>
                      <button className="px-3.5 py-1.5 text-[10px] font-bold tracking-wider uppercase bg-white border border-gray-250 hover:bg-gray-50 text-gray-750 rounded-xl shadow-2xs">
                        {isCollapsed ? "Expand" : "Collapse"}
                      </button>
                    </div>

                    {!isCollapsed && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {decks.map(deck => {
                          const formattedDate = new Date(deck.mtime).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric'
                          });
                          return (
                            <div 
                              key={deck.id}
                              className="group bg-white hover:bg-gray-50/50 rounded-[24px] shadow-xs hover:shadow-md p-6 flex flex-col justify-between h-64 transition-all cursor-pointer relative"
                              onClick={() => {
                                window.location.hash = `#/presentation/${deck.id}`;
                              }}
                            >
                              <div>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                  <span className="px-2.5 py-0.5 text-[9px] font-bold tracking-wider rounded bg-gray-100/50 text-gray-700 border border-gray-200/40 uppercase">
                                    {deck.preset.replace('google-io-', '')}
                                  </span>
                                  <span className={`px-2.5 py-0.5 text-[9px] font-bold tracking-wider rounded uppercase ${
                                    accentColor === "blue" ? "bg-blue-50 text-[#1a73e8] border-blue-100" :
                                    accentColor === "teal" ? "bg-teal-50 text-[#00796b] border-teal-100" :
                                    accentColor === "mint" ? "bg-emerald-50 text-[#34a853] border-emerald-100" :
                                    "bg-purple-50 text-[#8a4bf3] border-purple-100"
                                  }`}>
                                    {deck.accent}
                                  </span>
                                </div>
                                <h3 className="text-md font-extrabold text-gray-900 group-hover:text-[#1a73e8] leading-snug line-clamp-3 transition-colors text-left">
                                  {deck.title}
                                </h3>
                              </div>
                              
                              <div className="flex items-center justify-between pt-3.5 mt-auto">
                                <div className="text-[9px] text-gray-500 font-mono text-left">
                                  MODIFIED • <span className="font-extrabold text-gray-700">{formattedDate}</span>
                                </div>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    title="Open Presenter View"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.location.hash = `#/presentation/${deck.id}`;
                                      setPresenterMode("presenter");
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    title="Open Slides"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.location.hash = `#/presentation/${deck.id}`;
                                    }}
                                    className={`p-1.5 rounded-full transition-all ${
                                      accentColor === "blue" ? "bg-blue-50 text-[#1a73e8] hover:bg-blue-100" :
                                      accentColor === "teal" ? "bg-teal-50 text-[#00796b] hover:bg-teal-100" :
                                      accentColor === "mint" ? "bg-emerald-50 text-[#34a853] hover:bg-emerald-100" :
                                      "bg-purple-50 text-[#8a4bf3] hover:bg-purple-100"
                                    }`}
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <AnimatePresence>
          {isDashSettingsOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDashSettingsOpen(false)}
                className="fixed inset-0 bg-black z-40"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="fixed inset-0 m-auto w-[360px] h-fit bg-white/95 backdrop-blur-md rounded-[28px] shadow-2xl z-50 p-6 flex flex-col justify-between border border-gray-200/80 text-left"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-150 pb-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Workspace Settings</h3>
                    <button onClick={() => setIsDashSettingsOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1.5 uppercase tracking-wider">THEME STYLE</label>
                      <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                        {(["aura", "io-grid", "clean"] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setThemeStyle(s)}
                            className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                              themeStyle === s ? "bg-white text-gray-950 shadow-xs" : "text-gray-500 hover:text-gray-900"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1.5 uppercase tracking-wider">ACCENT COLOR</label>
                      <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-xl">
                        {(["blue", "teal", "mint", "lavender"] as const).map(c => (
                          <button
                            key={c}
                            onClick={() => setAccentColor(c)}
                            className={`py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                              accentColor === c 
                                ? `bg-white text-gray-950 shadow-xs` 
                                : "text-gray-500 hover:text-gray-900"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {themeStyle === "aura" && (
                      <div>
                        <label className="text-[10px] text-gray-500 font-bold block mb-1.5 uppercase tracking-wider">ANIMATION SCHEME</label>
                        <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl">
                          {(["aurora", "grid", "morph", "minimal"] as const).map(bg => (
                            <button
                              key={bg}
                              onClick={() => setDashboardBgStyle(bg)}
                              className={`py-1.5 rounded-lg text-[9.5px] font-bold uppercase transition-all ${
                                dashboardBgStyle === bg ? "bg-white text-gray-950 shadow-xs" : "text-gray-500 hover:text-gray-900"
                              }`}
                            >
                              {bg}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-5 border-t border-gray-150 mt-6 text-center text-[10px] text-gray-400 font-mono">
                  Google Product Design Lab • 2026
                </div>
              </motion.div>
            </>
          )}
        </ AnimatePresence>
      </div>
    );
  }

  // Render Loader for Slide Deck
  if (loadingDeck || !currentSlide) {
    return (
      <div className="min-h-screen bg-[#08090C] text-white flex flex-col justify-center items-center font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-4 border-t-purple-500 border-indigo-900 animate-spin mb-4"></div>
        <span>COMPILING KEYNOTE SYSTEM DECK...</span>
      </div>
    );
  }

  const uniqueCategories = (() => {
    const cats: string[] = [];
    slides.forEach(s => {
      if (s.category && !cats.includes(s.category)) {
        cats.push(s.category);
      }
    });
    return cats;
  })();

  const currentChapterIndex = uniqueCategories.indexOf(currentSlide.category) + 1;
  const isOhMyPiChapter = currentSlide.category === "OH MY PI";
  const heroScreenshotSrc = isOhMyPiChapter ? "/ohmypi.png" : null;
  const textOnlyHero = currentSlide.layoutType === "hero" && currentSlide.diagramType === "intro" && !heroScreenshotSrc;
  const heroLogoSrc = currentSlide.headline === "เรื่องเล่าของ Pi Coding Agent" ? "/logos/pi.svg" : null;

  // 1. PURE AUDIENCE PRESENTATION MODE
  if (presenterMode === "audience") {
    return (
      <div 
        className="h-screen w-full relative flex flex-col justify-between overflow-hidden p-4 md:p-6 transition-colors duration-500 bg-[#08090C] text-[#E8EAED]"
      >
        {laserPointerActive && (
          <div 
            className="absolute pointer-events-none rounded-full bg-red-400 w-8 h-8 shadow-[0_0_15px_#f87171,0_0_30px_#ef4444,0_0_60px_#ef4444] z-50 transition-all duration-75"
            style={{ 
              left: `${laserRelativePos.xPercent * 100}%`, 
              top: `${laserRelativePos.yPercent * 100}%`,
              transform: "translate(-50%, -50%)"
            }}
          />
        )}

        <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#1a73e8]/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-none w-full flex flex-col justify-between h-full z-10 relative space-y-4 px-2 md:px-4">
          
          <div className="flex items-center justify-between border-b border-gray-800/40 pb-5">
            <div className="flex items-center space-x-4">
              <span className={`text-[11px] font-black px-4 py-2 rounded-full uppercase tracking-widest ${
                accentColor === "blue" ? "bg-blue-900/30 text-blue-300 border border-blue-800/30" :
                accentColor === "teal" ? "bg-teal-900/30 text-teal-300 border border-teal-800/30" :
                accentColor === "mint" ? "bg-emerald-900/30 text-emerald-300 border border-emerald-800/30" :
                "bg-purple-900/30 text-purple-300 border border-purple-800/30"
              }`}>
                {currentSlide.category} • {currentSlide.categoryThai}
              </span>
              <span className="text-xs text-gray-400 font-mono hidden sm:inline">CH {currentChapterIndex} / {uniqueCategories.length}</span>
            </div>
            <div className="text-xs font-mono text-gray-300 bg-gray-950/80 px-4 py-1.5 rounded-lg border border-gray-800/60 shadow-lg">
              SLIDE {currentSlide.id.toString().padStart(2, "0")} / {slides.length.toString().padStart(2, "0")}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-2 min-h-0">
            <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              variants={transitionVariants[slideTransition]}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="w-full text-white"
            >
              {/* Dynamic layouts for Audience View */}
              {currentSlide.layoutType === "hero" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
                  <div className={`${textOnlyHero ? "lg:col-span-12 max-w-6xl mx-auto" : "lg:col-span-7"} space-y-8 text-left`}>
                    <div className="space-y-4">
                      {heroLogoSrc && (
                        <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-white shadow-lg">
                          <img src={heroLogoSrc} alt="" className="h-16 w-16 object-contain" />
                        </div>
                      )}
                      <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-[1.08]">
                        {currentSlide.headline}
                      </h2>
                      <p className={`text-sm md:text-base font-extrabold tracking-widest uppercase ${getAccentTextClass()}`}>
                        {currentSlide.headlineEnglish}
                      </p>
                      {currentSlide.subheader && (
                        <p className={`text-lg text-gray-300 leading-relaxed mt-4 ${textOnlyHero ? "max-w-5xl" : "max-w-3xl"}`}>
                          {currentSlide.subheader}
                        </p>
                      )}
                    </div>
                    <div className="space-y-5 pt-4">
                      {currentSlide.points.map((pt, k) => (
                        <div key={k} className="flex items-start space-x-4 group">
                          <span className={`mt-2 w-3.5 h-3.5 rounded-full ${getAccentBgClass()} shrink-0 shadow-lg`} />
                          <div>
                            <h4 className="text-lg font-bold text-gray-150 uppercase tracking-tight">{pt.title}</h4>
                            {pt.description && (
                              <p className="text-sm md:text-base text-gray-400 leading-relaxed mt-1">{pt.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {!textOnlyHero && (
                    <div className="lg:col-span-5 h-[500px] md:h-[580px] lg:h-[640px] xl:h-[680px] flex items-center">
                      {heroScreenshotSrc ? (
                        <div className="w-full rounded-[28px] border border-white/10 bg-gray-950/90 p-3 shadow-2xl">
                          <img src={heroScreenshotSrc} alt="หน้าจอ Oh My Pi ในเทอร์มินัล" className="w-full rounded-2xl object-contain" />
                        </div>
                      ) : (
                        <SlideDiagrams type={currentSlide.diagramType} accentColor={accentColor} />
                      )}
                    </div>
                  )}
                </div>
              ) : currentSlide.layoutType === "split" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
                  <div className="space-y-5 text-left flex flex-col justify-center">
                    <div className="space-y-2 mb-4">
                      <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-tight">{currentSlide.headline}</h2>
                      <p className={`text-xs md:text-sm font-extrabold tracking-wider uppercase ${getAccentTextClass()}`}>{currentSlide.headlineEnglish}</p>
                    </div>
                    {currentSlide.points.map((pt, k) => (
                      <div key={k} className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-all flex flex-col space-y-1">
                        <h4 className="text-base font-bold text-white uppercase tracking-wider">{pt.title}</h4>
                        {pt.description && <p className="text-sm text-gray-400 leading-relaxed">{pt.description}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="h-[500px] md:h-[580px] lg:h-[640px] xl:h-[680px]">
                    <SlideDiagrams type={currentSlide.diagramType} accentColor={accentColor} />
                  </div>
                </div>
              ) : currentSlide.layoutType === "grid" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
                  <div className="lg:col-span-6 space-y-4 text-left">
                    <div className="space-y-2 mb-4">
                      <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-tight">{currentSlide.headline}</h2>
                      <p className={`text-xs md:text-sm font-extrabold tracking-wider uppercase ${getAccentTextClass()}`}>{currentSlide.headlineEnglish}</p>
                    </div>
                    {currentSlide.points.map((pt, k) => (
                      <div key={k} className="p-4 bg-gray-950/85 border border-gray-800 rounded-2xl space-y-1">
                        <h4 className="text-sm font-bold text-white uppercase flex items-center space-x-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${getAccentBgClass()}`} />
                          <span>{pt.title}</span>
                        </h4>
                        {pt.description && <p className="text-xs text-gray-400 leading-relaxed">{pt.description}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="lg:col-span-6 h-[500px] md:h-[580px] lg:h-[640px] xl:h-[680px]">
                    <SlideDiagrams type={currentSlide.diagramType} accentColor={accentColor} />
                  </div>
                </div>
              ) : currentSlide.layoutType === "benchmark" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
                  <div className="lg:col-span-5 text-left space-y-4">
                    <div className="space-y-2 mb-4">
                      <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-tight">{currentSlide.headline}</h2>
                      <p className={`text-xs md:text-sm font-extrabold tracking-wider uppercase ${getAccentTextClass()}`}>{currentSlide.headlineEnglish}</p>
                    </div>
                    {currentSlide.points.map((pt, k) => (
                      <div key={k} className="p-4 rounded-2xl border border-white/10 bg-white/2 flex items-start space-x-3 transition-all hover:bg-white/4">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 animate-pulse" style={{ backgroundColor: getAccentHex() }}></div>
                        <div className="space-y-1 text-left">
                          <h4 className="text-xs md:text-sm font-bold text-gray-100">{pt.title}</h4>
                          {pt.description && <p className="text-xs text-gray-400 leading-relaxed">{pt.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="lg:col-span-7 h-[500px] md:h-[580px] lg:h-[640px] xl:h-[680px]">
                    <SlideDiagrams type={currentSlide.diagramType} accentColor={accentColor} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch w-full">
                  <div className="lg:col-span-5 text-left space-y-4 flex flex-col justify-center">
                    <div className="space-y-2 mb-4">
                      <h2 className="text-4xl font-black tracking-tighter leading-tight">{currentSlide.headline}</h2>
                      <p className={`text-xs font-extrabold tracking-wider uppercase ${getAccentTextClass()}`}>{currentSlide.headlineEnglish}</p>
                    </div>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">// DETAILS:</p>
                    {currentSlide.points.map((pt, k) => (
                      <div key={k} className="p-3 rounded-xl border border-gray-800 bg-gray-950">
                        <span className="font-bold text-xs text-white block">{pt.title}</span>
                        {pt.description && <span className="text-xs text-gray-400 block mt-0.5 leading-tight">{pt.description}</span>}
                        {pt.isCode && pt.codeSnippet && (
                          <pre className="block mt-2 p-2 bg-black rounded text-[10px] text-emerald-450 overflow-x-auto leading-relaxed font-mono">
                            {pt.codeSnippet}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="lg:col-span-7 h-[500px] md:h-[580px] lg:h-[640px] xl:h-[680px]">
                    <SlideDiagrams type={currentSlide.diagramType} accentColor={accentColor} />
                  </div>
                </div>
              )}
            </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center text-[10.5px] text-gray-500 font-mono pt-6 border-t border-gray-800/40">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-gray-400 font-bold uppercase tracking-wider">PROJECTOR SYNCED FEED</span>
            </div>
            <button 
              onClick={() => setPresenterMode("normal")} 
              className="hover:text-gray-300 underline uppercase tracking-wider pointer-events-auto"
            >
              [Exit Audience Mode]
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. PROFESSIONAL SPEAKER CONTROL COCKPIT DESK
  if (presenterMode === "presenter") {
    const launchAudience = () => {
      window.open(
        `${window.location.pathname}?mode=audience${window.location.hash}`, 
        "_blank", 
        "width=1280,height=720,menubar=no,status=no,toolbar=no,location=no"
      );
    };

    return (
      <div className="min-h-screen bg-[#F8F9FA] text-[#1F1F1F] font-sans flex flex-col justify-between">
        <header className="px-6 py-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-xs">
          <div className="flex items-center space-x-3 text-left">
            <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-0.5 rounded-md tracking-wider font-extrabold">
              Speaker Notes Station
            </span>
            <h1 className="text-md font-black text-gray-900 uppercase tracking-tight">
              {deckMetadata?.title || selectedPresentationId}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center space-x-2.5 shadow-xs">
              <Clock className="w-4 h-4 text-indigo-550 animate-pulse" />
              <div className="text-left">
                <p className="text-[8px] uppercase tracking-widest text-gray-400 font-mono font-bold leading-none">TIME ELAPSED</p>
                <p className="text-sm font-mono font-black text-gray-800 mt-0.5">{formatTimer(secondsSpoke)}</p>
              </div>
              <button 
                onClick={() => setSecondsSpoke(0)}
                className="text-[9px] font-mono text-gray-500 hover:text-gray-900 ml-2 bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded"
              >
                RESET
              </button>
            </div>

            <button
              onClick={launchAudience}
              className="flex items-center space-x-2 px-5 py-2.5 bg-[#ea4335] hover:bg-[#ea4335]/90 text-white text-xs font-black rounded-xl shadow-xs border border-red-500 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Audience Screen</span>
            </button>

            <button
              onClick={() => setPresenterMode("normal")}
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-750 hover:bg-gray-50 text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              Exit Cockpit
            </button>
          </div>
        </header>

        <main className="flex-grow p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          {/* LEFT COLUMN: Large readable speaker notes (8 cols) */}
          <div className="xl:col-span-8 flex flex-col space-y-6">
            <div className="bg-white border border-gray-200 p-8 rounded-[2rem] text-left flex-1 flex flex-col relative shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-5">
                <div className="flex items-center space-x-2 text-indigo-655">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-black uppercase tracking-wider font-mono">
                    Speaker Notes
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 scale-90">
                  <button
                    onClick={() => setNotesFontSize(prev => Math.max(14, prev - 2))}
                    className="p-1 px-2.5 bg-white text-xs font-bold text-gray-650 hover:text-gray-900 rounded border border-gray-300 shadow-xs"
                  >
                    A-
                  </button>
                  <span className="text-[10px] font-mono text-gray-500 px-1">{notesFontSize}px</span>
                  <button
                    onClick={() => setNotesFontSize(prev => Math.min(32, prev + 2))}
                    className="p-1 px-2.5 bg-white text-xs font-bold text-gray-650 hover:text-gray-900 rounded border border-gray-300 shadow-xs"
                  >
                    A+
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 space-y-5 my-1.5">
                {currentSlide.speakerNotes.length > 0 ? (
                  currentSlide.speakerNotes.map((note, index) => (
                    <p 
                      key={index} 
                      className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl leading-relaxed text-gray-850 font-sans font-medium text-left"
                      style={{ fontSize: `${notesFontSize}px` }}
                    >
                      {note}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-400 font-sans italic text-sm">No notes available for this slide.</p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 mt-4 flex items-center justify-between">
                <button
                  onClick={handleCopyNotes}
                  className="px-3.5 py-1.5 hover:bg-gray-100 text-[11px] font-bold text-gray-550 rounded-lg flex items-center space-x-1.5 transition-colors border border-gray-200 bg-white shadow-xs"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedNote ? "Copied" : "Copy Notes"}</span>
                </button>
                <span className="text-[10px] text-gray-450 font-mono">SLIDE {currentSlide.id} KEY-DETAILS</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Next slide anticipator & Slide index (4 cols) */}
          <div className="xl:col-span-4 flex flex-col space-y-6">
            {/* Next Slide Predictor */}
            <div className="bg-white border border-gray-200 p-6 rounded-[2rem] text-left shadow-xs space-y-4">
              <div className="flex items-center space-x-1.5 text-amber-500 border-b border-gray-200 pb-2.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider font-mono">
                  Up Next Slide
                </span>
              </div>
              
              {nextSlide ? (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left space-y-2">
                  <span className="inline-block px-2.5 py-0.5 bg-amber-50 text-amber-700 font-mono text-[9px] uppercase tracking-wider rounded border border-amber-100">
                    SLIDE {nextSlide.id.toString().padStart(2, "0")} UP NEXT
                  </span>
                  <h4 className="text-md font-black text-gray-800 leading-tight">
                    {nextSlide.headline}
                  </h4>
                  <p className="text-xs text-gray-550 font-mono">{nextSlide.headlineEnglish}</p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center text-xs text-gray-400 font-mono">
                  END OF DECK
                </div>
              )}
            </div>

            {/* Slide Index quick selector */}
            <div className="bg-white border border-gray-200 p-6 rounded-[2rem] flex-1 flex flex-col min-h-[300px] text-left shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                  Quick Slide Navigation ({slides.length})
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[300px]">
                {slides.map((s, idx) => {
                  const isActive = idx === currentSlideIndex;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isActive ? "border-indigo-200 bg-indigo-50/50 text-indigo-950 font-bold" : "border-gray-100 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className={`text-[9px] font-mono font-semibold leading-none ${isActive ? "text-indigo-600/80" : "text-gray-400"}`}>
                          SLIDE {s.id.toString().padStart(2, "0")}
                        </p>
                        <p className={`text-[11.5px] font-bold truncate mt-1 ${isActive ? "text-indigo-950" : "text-gray-750"}`}>
                          {s.headline}
                        </p>
                      </div>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200 p-5 mt-auto flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-3.5">
            <button
              onClick={() => setCurrentSlideIndex(prev => (prev > 0 ? prev - 1 : slides.length - 1))}
              className="p-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-full transition-transform active:scale-95 shadow-xs"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentSlideIndex(prev => (prev < slides.length - 1 ? prev + 1 : 0))}
              className="px-6 py-3 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-full transition-transform active:scale-95 shadow-md flex items-center space-x-2 font-bold"
            >
              <span>Next Slide</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="text-xs font-mono text-gray-550 bg-white px-3.5 py-2 rounded-full border border-gray-200 shadow-xs">
              Slide: <span className="font-extrabold text-gray-900">{currentSlide.id}</span> / {slides.length}
            </div>
          </div>

          <div className="flex space-x-2 items-center justify-center">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlideIndex(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === currentSlideIndex 
                    ? `w-8 bg-indigo-600` 
                    : "w-2.5 bg-gray-200 hover:bg-gray-300"
                }`}
              />
            ))}
          </div>
        </footer>
      </div>
    );

  }

  // 3. NORMAL PRESENTATION VIEW
  const launchPresenter = () => {
    window.open(
      `${window.location.pathname}?mode=presenter${window.location.hash}`, 
      "_blank", 
      "width=1280,height=720,menubar=no,status=no,toolbar=no,location=no"
    );
  };

  const currentThemeBgClass = () => {
    switch (themeStyle) {
      case "clean": return "bg-white text-gray-900";
      case "io-grid": return "bg-[#F8F9FA] text-gray-900 bg-[radial-gradient(#e5e7eb_1px,transparent_1.5px)] bg-[size:24px_24px]";
      default: return "animate-aurora text-gray-900"; // aura
    }
  };

  return (
    <div 
      className={`h-screen w-full relative flex flex-col justify-between overflow-hidden p-4 md:p-6 transition-all duration-500 ${currentThemeBgClass()}`}
    >
      {laserPointerActive && (
        <div 
          className="absolute pointer-events-none rounded-full bg-red-500 w-8 h-8 shadow-[0_0_15px_#ef4444,0_0_30px_#ef4444] z-50"
          style={{ 
            left: `${laserRelativePos.xPercent * 100}%`, 
            top: `${laserRelativePos.yPercent * 100}%`,
            transform: "translate(-50%, -50%)"
          }}
        />
      )}

      {selectedPresentationId && (
        <>
          {/* Top Left Breadcrumb Bar */}
          <div className="fixed top-3 left-3 md:left-4 bg-white/95 backdrop-blur-md border border-gray-200/80 px-3.5 py-2 rounded-full shadow-lg flex items-center space-x-2.5 z-40 w-auto transition-all">
            <div className="flex items-center space-x-2 text-[10.5px] font-mono text-gray-500 font-bold uppercase tracking-wider">
              <span className="text-gray-400">Library</span>
              <span>/</span>
              <span className="text-gray-700">{selectedPresentationId.split('/').slice(0, -1).join('/') || "root"}</span>
              <span>/</span>
              <span style={{ color: getAccentHex() }}>{deckMetadata?.title || selectedPresentationId.split('/').pop()}</span>
            </div>
          </div>

          {/* Top Right Chapter / Category Bar */}
          <div className="fixed top-3 right-3 md:right-4 bg-white/95 backdrop-blur-md border border-gray-200/80 px-3.5 py-2 rounded-full shadow-lg flex items-center space-x-2.5 z-40 w-auto transition-all">
            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
              accentColor === "blue" ? "bg-blue-50 text-[#1a73e8]" :
              accentColor === "teal" ? "bg-teal-50 text-[#00796b]" :
              accentColor === "mint" ? "bg-emerald-50 text-[#34a853]" :
              "bg-purple-50 text-[#8a4bf3]"
            }`}>
              {currentSlide.category} • {currentSlide.categoryThai}
            </span>
            <div className="w-px h-4 bg-gray-250" />
            <span className="text-[10px] font-bold text-gray-500 font-mono tracking-wider">
              CH {currentChapterIndex} / {uniqueCategories.length}
            </span>
            <div className="w-px h-4 bg-gray-250" />
            <div className="flex items-center space-x-1.5" title={`Progress: ${currentSlideIndex + 1} / ${slides.length}`}>
              <span className="text-[9px] font-bold text-gray-800 font-mono">SLIDE {currentSlideIndex + 1} / {slides.length}</span>
              <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden border border-gray-200/40">
                <div 
                  className="h-full transition-all duration-300" 
                  style={{ 
                    width: `${((currentSlideIndex + 1) / slides.length) * 100}%`,
                    backgroundColor: getAccentHex()
                  }} 
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Slide Navigation Overlay Panel */}
      <div className="max-w-none w-full z-10 flex flex-col justify-between h-full space-y-4 px-2 md:px-4">
        

        {/* Content Body - Elevated M3 Card */}
        <div className="flex-1 flex flex-col justify-center py-2 min-h-0">
          <div className="w-full h-full bg-white/90 backdrop-blur-xs border border-gray-200/80 rounded-[28px] shadow-xs p-8 md:p-14 lg:p-16 flex items-center justify-center relative transition-all duration-300 overflow-hidden">
            <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              variants={transitionVariants[slideTransition]}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full text-gray-900"
            >
              {/* Dynamic layouts for Normal View */}
              {currentSlide.layoutType === "hero" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
                  <div className={`${textOnlyHero ? "lg:col-span-12 max-w-6xl mx-auto" : "lg:col-span-7"} space-y-6 text-left`}>
                    <div className="space-y-3">
                      {heroLogoSrc && (
                        <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-[28px] border border-gray-200 bg-white shadow-sm">
                          <img src={heroLogoSrc} alt="" className="h-16 w-16 object-contain" />
                        </div>
                      )}
                      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] text-gray-900">
                        {currentSlide.headline}
                      </h1>
                      <p className={`text-xs md:text-sm font-black tracking-wider uppercase ${getAccentTextClass()}`}>
                        {currentSlide.headlineEnglish}
                      </p>
                      {currentSlide.subheader && (
                        <p className={`text-md md:text-lg text-gray-600 leading-relaxed mt-4 ${textOnlyHero ? "max-w-5xl" : "max-w-2xl"}`}>
                          {currentSlide.subheader}
                        </p>
                      )}
                    </div>
                    <motion.div variants={listContainerVariants} initial="hidden" animate="show" className="space-y-4 pt-3">
                      {currentSlide.points.map((pt, k) => (
                        <motion.div key={k} variants={listItemVariants} className="flex items-start space-x-3.5">
                          <span className={`mt-2 w-3.5 h-3.5 rounded-full ${getAccentBgClass()} shrink-0`} />
                          <div>
                            <h4 className="text-md font-bold text-gray-800 uppercase tracking-tight leading-snug">{pt.title}</h4>
                            {pt.description && (
                              <p className="text-xs md:text-sm text-gray-500 leading-relaxed mt-0.5">{pt.description}</p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                  {!textOnlyHero && (
                    <div className="lg:col-span-5 h-[500px] md:h-[580px] lg:h-[640px] xl:h-[680px] flex items-center">
                      {heroScreenshotSrc ? (
                        <div className="w-full rounded-[28px] border border-gray-200 bg-gray-950 p-3 shadow-lg">
                          <img src={heroScreenshotSrc} alt="หน้าจอ Oh My Pi ในเทอร์มินัล" className="w-full rounded-2xl object-contain" />
                        </div>
                      ) : (
                        <SlideDiagrams type={currentSlide.diagramType} accentColor={accentColor} />
                      )}
                    </div>
                  )}
                </div>
              ) : currentSlide.layoutType === "split" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
                  <div className="space-y-5 text-left flex flex-col justify-center">
                    <div className="space-y-2 mb-4">
                      <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-gray-900">{currentSlide.headline}</h1>
                      <p className={`text-xs md:text-sm font-black tracking-wider uppercase ${getAccentTextClass()}`}>{currentSlide.headlineEnglish}</p>
                    </div>
                    <motion.div variants={listContainerVariants} initial="hidden" animate="show" className="space-y-3">
                      {currentSlide.points.map((pt, k) => (
                        <motion.div key={k} variants={listItemVariants} className="p-4 rounded-2xl bg-white hover:shadow-xs border border-gray-200 transition-all flex flex-col space-y-1 text-left">
                          <h4 className="text-sm font-bold text-gray-850 uppercase tracking-wider">{pt.title}</h4>
                          {pt.description && <p className="text-xs text-gray-500 leading-relaxed">{pt.description}</p>}
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                  <div className="h-[500px] md:h-[580px] lg:h-[640px] xl:h-[680px]">
                    <SlideDiagrams type={currentSlide.diagramType} accentColor={accentColor} />
                  </div>
                </div>
              ) : currentSlide.layoutType === "grid" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
                  <div className="lg:col-span-6 space-y-4 text-left">
                    <div className="space-y-2 mb-4">
                      <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-gray-900">{currentSlide.headline}</h1>
                      <p className={`text-xs md:text-sm font-black tracking-wider uppercase ${getAccentTextClass()}`}>{currentSlide.headlineEnglish}</p>
                    </div>
                    <motion.div variants={listContainerVariants} initial="hidden" animate="show" className="space-y-3">
                      {currentSlide.points.map((pt, k) => (
                        <motion.div key={k} variants={listItemVariants} className="p-4 bg-white border border-gray-250 rounded-2xl shadow-2xs space-y-1 text-left">
                          <h4 className="text-sm font-bold text-gray-850 uppercase flex items-center space-x-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${getAccentBgClass()}`} />
                            <span>{pt.title}</span>
                          </h4>
                          {pt.description && <p className="text-xs text-gray-500 leading-relaxed">{pt.description}</p>}
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                  <div className="lg:col-span-6 h-[500px] md:h-[580px] lg:h-[640px] xl:h-[680px]">
                    <SlideDiagrams type={currentSlide.diagramType} accentColor={accentColor} />
                  </div>
                </div>
              ) : currentSlide.layoutType === "benchmark" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
                  <div className="lg:col-span-5 text-left space-y-4">
                    <div className="space-y-2 mb-4">
                      <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-gray-900">{currentSlide.headline}</h1>
                      <p className={`text-xs md:text-sm font-black tracking-wider uppercase ${getAccentTextClass()}`}>{currentSlide.headlineEnglish}</p>
                    </div>
                    <motion.div variants={listContainerVariants} initial="hidden" animate="show" className="space-y-3">
                      {currentSlide.points.map((pt, k) => (
                        <motion.div key={k} variants={listItemVariants} className="p-4 rounded-2xl border border-gray-150 bg-white shadow-xs flex items-start space-x-3 transition-all hover:shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 animate-pulse" style={{ backgroundColor: getAccentHex() }}></div>
                          <div className="space-y-1 text-left">
                            <h4 className="text-xs md:text-sm font-bold text-gray-900">{pt.title}</h4>
                            {pt.description && <p className="text-xs text-gray-655 leading-relaxed">{pt.description}</p>}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                  <div className="lg:col-span-7 h-[500px] md:h-[580px] lg:h-[640px] xl:h-[680px]">
                    <SlideDiagrams type={currentSlide.diagramType} accentColor={accentColor} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
                  <div className="lg:col-span-5 text-left space-y-4 flex flex-col justify-center">
                    <div className="space-y-2 mb-4">
                      <h1 className="text-4xl font-black tracking-tight leading-tight text-gray-900">{currentSlide.headline}</h1>
                      <p className={`text-xs font-black tracking-wider uppercase ${getAccentTextClass()}`}>{currentSlide.headlineEnglish}</p>
                    </div>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">// DETAILS:</p>
                    <motion.div variants={listContainerVariants} initial="hidden" animate="show" className="space-y-2.5">
                      {currentSlide.points.map((pt, k) => (
                        <motion.div key={k} variants={listItemVariants} className="p-3.5 rounded-xl border border-gray-200 bg-white shadow-2xs text-left">
                          <span className="font-bold text-xs text-gray-800 block">{pt.title}</span>
                          {pt.description && <span className="text-xs text-gray-550 block mt-0.5 leading-tight">{pt.description}</span>}
                          {pt.isCode && pt.codeSnippet && (
                            <pre className="block mt-2 p-2 bg-gray-950 rounded text-[10px] text-emerald-450 overflow-x-auto leading-relaxed font-mono">
                              {pt.codeSnippet}
                            </pre>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                  <div className="lg:col-span-7 h-[500px] md:h-[580px] lg:h-[640px] xl:h-[680px]">
                    <SlideDiagrams type={currentSlide.diagramType} accentColor={accentColor} />
                  </div>
                </div>
              )}
            </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Deleted bottom status bar */}

        {/* Floating Bottom Navigation Dock */}
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-gray-200/80 px-4 py-2 rounded-full shadow-lg flex items-center space-x-3 z-40 w-auto">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentSlideIndex(prev => (prev > 0 ? prev - 1 : slides.length - 1))}
              className="p-2 bg-gray-50 hover:bg-gray-150 text-gray-700 rounded-full transition-all active:scale-90"
              title="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="text-xs font-mono text-gray-600 px-3">
              <span className="font-black text-gray-950">{currentSlide.id}</span> / {slides.length}
            </div>
            
            <button
              onClick={() => setCurrentSlideIndex(prev => (prev < slides.length - 1 ? prev + 1 : 0))}
              className="p-2 bg-gray-950 hover:bg-gray-800 text-white rounded-full transition-all active:scale-90"
              title="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-250" />
          
          {/* Autoplay & Action Buttons */}
          <div className="flex items-center space-x-1">
            {(() => {
              const active = "bg-emerald-100 text-emerald-800";
              const inactive = "text-slate-700 hover:text-slate-950 hover:bg-slate-100";
              return (
                <button
                  onClick={() => setIsAutoplayActive(prev => !prev)}
                  className={`p-2 rounded-full transition-all ${isAutoplayActive ? active : inactive}`}
                  title={isAutoplayActive ? "Pause Autoplay" : "Start Autoplay"}
                >
                  {isAutoplayActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              );
            })()}
            {(() => {
              const active = "bg-red-100 text-red-800 animate-pulse";
              const inactive = "text-slate-700 hover:text-slate-950 hover:bg-slate-100";
              return (
                <button
                  onClick={() => setLaserPointerActive(prev => !prev)}
                  className={`p-2 rounded-full transition-all ${laserPointerActive ? active : inactive}`}
                  title="Toggle Laser Pointer"
                >
                  <Cpu className="w-4 h-4" />
                </button>
              );
            })()}
          </div>

          <div className="w-px h-6 bg-gray-250" />

          {/* Action buttons moved from header */}
          <div className="flex items-center space-x-1">
            <button
              onClick={launchPresenter}
              className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-all"
              title="Launch synchronized speaker view in a new tab"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExportOpen(true)}
              className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-all"
              title="Export deck as Markdown, plain text or JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-all"
              title="Open settings pane"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-250 mx-1" />
            
            <button
              onClick={() => {
                window.location.hash = "#/";
              }}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-650 hover:bg-red-50 rounded-full transition-all border border-red-200/50"
              title="Exit presentation"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Panel for Settings & Index List */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white/95 backdrop-blur-md rounded-l-[24px] shadow-2xl z-50 p-6 flex flex-col justify-between border-l border-gray-200/80"
            >
              <div className="space-y-6 flex-grow overflow-y-auto">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <h3 className="text-md font-bold uppercase tracking-tight text-gray-800">Slide Controls</h3>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">TRANSITION</label>
                    <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                      {["slide", "fade", "zoom"].map(item => (
                        <button
                          key={item}
                          onClick={() => setSlideTransition(item as "slide" | "fade" | "zoom")}
                          className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                            slideTransition === item ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">THEME STYLE</label>
                    <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                      {["aura", "io-grid", "clean"].map(s => (
                        <button
                          key={s}
                          onClick={() => setThemeStyle(s as "aura" | "io-grid" | "clean")}
                          className={`py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                            themeStyle === s ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">ACCENT COLOR</label>
                    <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-xl">
                      {["blue", "teal", "mint", "lavender"].map(c => (
                        <button
                          key={c}
                          onClick={() => setAccentColor(c as "blue" | "teal" | "mint" | "lavender")}
                          className={`py-1.5 rounded text-[9px] font-bold uppercase transition-all ${
                            accentColor === c ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Interactive Index</span>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {slides.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setCurrentSlideIndex(idx);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full p-2 text-left rounded-lg text-xs transition-all flex items-center justify-between ${
                          idx === currentSlideIndex ? "bg-gray-100 font-bold text-gray-900" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                      >
                        <span className="truncate pr-2">{s.id}. {s.headline}</span>
                        {idx === currentSlideIndex && <CheckCircle2 className="w-3.5 h-3.5 text-gray-900 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400 font-mono">
                Google Product Design Lab • 2026
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Export overlay modal */}
      <AnimatePresence>
        {isExportOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[2rem] p-8 max-w-xl w-full shadow-2xl z-55 border border-gray-200 text-left"
            >
              <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-6">
                <h3 className="text-xl font-bold tracking-tight text-gray-950">Export Presentation</h3>
                <button onClick={() => setIsExportOpen(false)} className="p-1.5 hover:bg-gray-150 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 block">EXPORT FORMAT</label>
                <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                  {["markdown", "text", "json"].map(f => (
                    <button
                      key={f}
                      onClick={() => setExportFormat(f as "markdown" | "text" | "json")}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        exportFormat === f ? "bg-white text-gray-950 shadow-xs" : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl max-h-56 overflow-y-auto font-mono text-[10px] text-gray-500">
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {getExportContent(exportFormat)}
                  </pre>
                </div>
              </div>

              <div className="flex space-x-3 pt-6 mt-6 border-t border-gray-250">
                <button
                  onClick={handleCopyExport}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl flex-1 text-xs uppercase"
                >
                  {copiedExport ? "Copied" : "Copy to Clipboard"}
                </button>
                <button
                  onClick={handleDownloadExport}
                  className="px-6 py-3 bg-gray-950 hover:bg-gray-900 text-white font-bold rounded-2xl flex-1 text-xs uppercase"
                >
                  Download File
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
