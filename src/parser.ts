export interface SlidePoint {
  title: string;
  description: string;
  isCode?: boolean;
  codeSnippet?: string;
}

export interface Slide {
  id: number;
  category: string;
  categoryThai: string;
  headline: string;
  headlineEnglish: string;
  subheader: string;
  accentColor: "blue" | "teal" | "mint" | "lavender";
  layoutType: "hero" | "split" | "grid" | "interactive-diagram" | "benchmark";
  points: SlidePoint[];
  diagramType: "intro" | "motivation" | "lobotomy" | "benchmark" | "tools" | "self-mod" | "clankers" | "ourobouros" | "friction" | "summary" | "kafka-story" | "kafka-log" | "kafka-partitions" | "kafka-brokers" | "kafka-consumers" | "kafka-replication" | "kafka-retention";
  speakerNotes: string[];
  readingTime: string;
}

export function parseMarkdownToSlides(
  markdown: string, 
  defaultAccent: "blue" | "teal" | "mint" | "lavender" = "lavender"
): Slide[] {
  const slides: Slide[] = [];
  const slideBlocks = markdown.split(/\n---\r?\n/);
  
  slideBlocks.forEach((block, index) => {
    const cleanBlock = block.trim();
    if (!cleanBlock) return;
    
    // Initial slide object
    const slide: Slide = {
      id: index + 1,
      category: "PRESENTATION",
      categoryThai: "การนำเสนอ",
      headline: "",
      headlineEnglish: "",
      subheader: "",
      accentColor: defaultAccent,
      layoutType: "hero",
      points: [],
      diagramType: "intro",
      speakerNotes: [],
      readingTime: "1 min read"
    };
    
    // Parse comments for layout options
    const diagramMatch = cleanBlock.match(/<!--\s*diagram:\s*([\w-]+)\s*-->/);
    if (diagramMatch) {
      slide.layoutType = "interactive-diagram";
      const diagramVal = diagramMatch[1].toLowerCase();
      if (
        diagramVal === "intro" ||
        diagramVal === "motivation" ||
        diagramVal === "lobotomy" ||
        diagramVal === "benchmark" ||
        diagramVal === "tools" ||
        diagramVal === "self-mod" ||
        diagramVal === "clankers" ||
        diagramVal === "ourobouros" ||
        diagramVal === "friction" ||
        diagramVal === "summary" ||
        diagramVal === "kafka-story" ||
        diagramVal === "kafka-log" ||
        diagramVal === "kafka-partitions" ||
        diagramVal === "kafka-brokers" ||
        diagramVal === "kafka-consumers" ||
        diagramVal === "kafka-replication" ||
        diagramVal === "kafka-retention"
      ) {
        slide.diagramType = diagramVal;
      }
    }
    
    const layoutMatch = cleanBlock.match(/<!--\s*layout:\s*([\w-]+)\s*-->/);
    if (layoutMatch) {
      const layoutVal = layoutMatch[1].toLowerCase();
      if (
        layoutVal === "hero" ||
        layoutVal === "split" ||
        layoutVal === "grid" ||
        layoutVal === "interactive-diagram" ||
        layoutVal === "benchmark"
      ) {
        slide.layoutType = layoutVal;
      }
    }
    
    const categoryMatch = cleanBlock.match(/<!--\s*category:\s*([^\r\n|]+)(?:\|([^\r\n]+))?\s*-->/);
    if (categoryMatch) {
      slide.category = categoryMatch[1].trim();
      if (categoryMatch[2]) {
        slide.categoryThai = categoryMatch[2].trim();
      }
    }
    
    const accentMatch = cleanBlock.match(/<!--\s*accent:\s*(\w+)\s*-->/);
    if (accentMatch) {
      const accent = accentMatch[1].toLowerCase();
      if (accent === "green" || accent === "mint") slide.accentColor = "mint";
      else if (accent === "blue") slide.accentColor = "blue";
      else if (accent === "teal") slide.accentColor = "teal";
      else if (accent === "lavender" || accent === "gemini") slide.accentColor = "lavender";
    }

    // Extract speaker notes
    const notesMatch = cleanBlock.match(/(?:Note:|<aside class="notes">)\s*([\s\S]*?)(?:<\/aside>|$)/i);
    if (notesMatch) {
      slide.speakerNotes = notesMatch[1].trim().split(/\r?\n/).map(n => n.trim()).filter(n => n);
    }
    
    // Remove notes and comments from text before parsing content
    const textToParse = cleanBlock
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/(?:Note:|<aside class="notes">)[\s\S]*?(?:<\/aside>|$)/i, '');
      
    const lines = textToParse.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    
    let currentCodeSnippet = "";
    let isInsideCodeBlock = false;
    
    lines.forEach(line => {
      // Check for code blocks
      if (line.startsWith("```")) {
        if (isInsideCodeBlock) {
          // Close code block and add to points
          slide.points.push({
            title: "Code Snippet",
            description: "",
            isCode: true,
            codeSnippet: currentCodeSnippet.trim()
          });
          currentCodeSnippet = "";
          isInsideCodeBlock = false;
        } else {
          isInsideCodeBlock = true;
        }
        return;
      }
      
      if (isInsideCodeBlock) {
        currentCodeSnippet += line + "\n";
        return;
      }
      
      // Parse headers and points
      if (line.startsWith("# ")) {
        slide.headline = line.slice(2).trim();
      } else if (line.startsWith("## ")) {
        // Subheading or english title
        const val = line.slice(3).trim();
        const hasEnglishChars = /[a-zA-Z]/.test(val);
        if (hasEnglishChars && !slide.headlineEnglish) {
          slide.headlineEnglish = val;
        } else {
          slide.subheader = val;
        }
      } else if (line.startsWith("### ")) {
        slide.points.push({
          title: line.slice(4).trim(),
          description: ""
        });
      } else if (line.startsWith("* ") || line.startsWith("- ")) {
        const listContent = line.slice(2).trim();
        const boldMatch = listContent.match(/^\*\*(.*?)\*\*:(.*)/);
        if (boldMatch) {
          if (slide.points.length > 0 && !slide.points[slide.points.length - 1].description && slide.layoutType === "grid") {
            slide.points[slide.points.length - 1].description = boldMatch[2].trim();
          } else {
            slide.points.push({
              title: boldMatch[1].trim(),
              description: boldMatch[2].trim()
            });
          }
        } else {
          slide.points.push({
            title: listContent,
            description: ""
          });
        }
      } else {
        // Plain text
        const lastPoint = slide.points[slide.points.length - 1];
        if (lastPoint && !lastPoint.description) {
          lastPoint.description = line;
        } else if (!slide.subheader) {
          slide.subheader = line;
        } else {
          slide.points.push({
            title: line,
            description: ""
          });
        }
      }
    });
    
    // Fallback for missing fields
    if (!slide.headlineEnglish && slide.headline) {
      slide.headlineEnglish = slide.headline;
    }
    
    // Calculate reading time based on word count
    const words = cleanBlock.split(/\s+/).length;
    slide.readingTime = `${Math.max(1, Math.round(words / 100))} min read`;
    
    slides.push(slide);
  });
  
  return slides;
}
