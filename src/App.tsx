import React, { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, RefreshCw, MapPin, Phone, Palette } from 'lucide-react';
import { cn } from './lib/utils';
import { DEFAULT_PASTOR_IMAGE, DEFAULT_POSTER_DATA, THEMES } from './constants';

export default function App() {
  const [data, setData] = useState(DEFAULT_POSTER_DATA);
  const [pastorImage, setPastorImage] = useState(DEFAULT_PASTOR_IMAGE);
  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
  const posterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [scale, setScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.offsetWidth;
        const newScale = Math.min(containerWidth / 1080, 1);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPastorImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadPoster = useCallback(async () => {
    if (!posterRef.current) return;
    setIsExporting(true);
    
    // Small delay to ensure any dynamic styles are applied
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const dataUrl = await toPng(posterRef.current, {
        quality: 1,
        pixelRatio: 3,
        skipFonts: false,
        fontEmbedCSS: '', // Can help with font issues
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `SiyonuSamajaMandhiram_${data.day}${data.month}${data.year}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  }, [data]);

  const renderTeluguVerse = () => {
    const highlights = data.highlightWords.split(',').map(w => w.trim()).filter(Boolean);
    let text = data.teluguVerse;
    if (highlights.length === 0) return text;
    const parts = text.split(new RegExp(`(${highlights.join('|')})`, 'g'));
    return parts.map((part, i) => 
      highlights.includes(part) ? (
        <span 
          key={i} 
          style={{ color: currentTheme.colors.accent, textShadow: `0 0 15px ${currentTheme.colors.glow}` }}
          className="drop-shadow-lg"
        >
          {part}
        </span>
      ) : part
    );
  };

  const SplitLayout = () => (
    <div className="w-full h-full flex flex-row items-stretch">
      {/* Left Side: Text Content */}
      <div className="flex-1 flex flex-col justify-between p-20 z-20">
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="font-display text-lg tracking-[0.5em] whitespace-nowrap" style={{ color: currentTheme.colors.accent }}>SIYONU SAMAJA MANDHIRAM</div>
            <div className="font-telugu text-3xl font-bold tracking-wider whitespace-nowrap" style={{ color: currentTheme.colors.text }}>సీయోను సమాజ మందిరం</div>
          </div>
          
          <div className="space-y-6">
            <div className="inline-flex items-center border-l-4 px-6 py-2" style={{ borderColor: currentTheme.colors.accent, background: `${currentTheme.colors.accent}15` }}>
              <span className="font-telugu text-xl font-bold tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</span>
            </div>
            <div className="font-telugu text-5xl font-extrabold leading-[1.4] drop-shadow-2xl" style={{ color: currentTheme.colors.text }}>
              {renderTeluguVerse()}
            </div>
            <div className="font-serif text-2xl italic leading-relaxed font-light opacity-60 max-w-[450px]" style={{ color: currentTheme.colors.text }}>
              {data.englishVerse}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="w-64 h-[1px]" style={{ background: `linear-gradient(to r, ${currentTheme.colors.accent}, transparent)` }} />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-lg font-telugu opacity-80" style={{ color: currentTheme.colors.text }}>
              <MapPin size={18} style={{ color: currentTheme.colors.accent }} />
              {data.churchAddress}
            </div>
            <div className="flex items-center gap-3 font-display text-base tracking-[0.2em]" style={{ color: currentTheme.colors.accent }}>
              <Phone size={18} />
              {data.phone}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Image and Date */}
      <div className="w-[45%] relative flex items-center justify-center p-10 z-20">
        <div className="absolute inset-0 opacity-10" style={{ background: currentTheme.colors.accent }} />
        
        {/* Date Badge */}
        <div className="absolute top-12 right-12 text-center border-2 p-4 rounded-md min-w-[120px] backdrop-blur-md shadow-2xl" style={{ borderColor: `${currentTheme.colors.accent}80`, background: `${currentTheme.colors.accent}10` }}>
          <div className="font-display text-[12px] tracking-[0.3em] opacity-70" style={{ color: currentTheme.colors.text }}>{data.year}</div>
          <div className="font-display text-[14px] tracking-[0.4em] opacity-90 mt-1" style={{ color: currentTheme.colors.text }}>{data.month}</div>
          <div className="font-display text-6xl font-black leading-none mt-1" style={{ color: currentTheme.colors.accent, textShadow: `0 0 20px ${currentTheme.colors.glow}` }}>{data.day}</div>
        </div>

        {/* Portrait */}
        <div className="relative w-[480px] h-[600px] rounded-2xl overflow-hidden border-4 shadow-2xl" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover object-center" alt="Pastor" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-0 w-full text-center">
            <div className="inline-block border-b-2 px-6 py-2" style={{ borderColor: currentTheme.colors.accent }}>
              <span className="font-telugu text-2xl font-bold tracking-wide" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const MagazineLayout = () => (
    <div className="w-full h-full relative flex flex-col items-center justify-center p-20 z-20">
      {/* Large Background Text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[300px] font-black opacity-[0.03] select-none pointer-events-none whitespace-nowrap" style={{ color: currentTheme.colors.accent }}>
        {data.month} {data.day}
      </div>

      <div className="w-full flex flex-col items-center gap-12">
        <div className="text-center space-y-4">
          <div className="font-display text-2xl tracking-[0.8em] whitespace-nowrap" style={{ color: currentTheme.colors.accent }}>SIYONU SAMAJA MANDHIRAM</div>
          <div className="font-telugu text-4xl font-black tracking-[0.2em] whitespace-nowrap" style={{ color: currentTheme.colors.text }}>సీయోను సమాజ మందిరం</div>
        </div>

        <div className="flex flex-row items-center gap-16 w-full">
          <div className="flex-1 space-y-8">
            <div className="font-telugu text-6xl font-black leading-[1.3] drop-shadow-2xl" style={{ color: currentTheme.colors.text }}>
              {renderTeluguVerse()}
            </div>
            <div className="font-serif text-3xl italic leading-relaxed font-light opacity-70" style={{ color: currentTheme.colors.text }}>
              {data.englishVerse}
            </div>
            <div className="inline-block px-8 py-3 rounded-full border-2 font-display text-xl tracking-widest" style={{ borderColor: currentTheme.colors.accent, color: currentTheme.colors.accent }}>
              {data.scriptureReference}
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-[-20px] border-2 rounded-full opacity-20 animate-pulse" style={{ borderColor: currentTheme.colors.accent }} />
            <div className="w-[450px] h-[450px] rounded-full overflow-hidden border-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10" style={{ borderColor: currentTheme.colors.accent }}>
              <img src={pastorImage} className="w-full h-full object-cover" alt="Pastor" />
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black border-2 px-10 py-4 rounded-xl z-20 shadow-2xl whitespace-nowrap" style={{ borderColor: currentTheme.colors.accent }}>
              <span className="font-telugu text-2xl font-black tracking-wider" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</span>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-row justify-between items-end pt-12 border-t border-white/10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xl font-telugu" style={{ color: currentTheme.colors.text }}>
              <MapPin size={24} style={{ color: currentTheme.colors.accent }} />
              {data.churchAddress}
            </div>
            <div className="flex items-center gap-3 font-display text-lg tracking-[0.3em]" style={{ color: currentTheme.colors.accent }}>
              <Phone size={24} />
              {data.phone}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-8xl font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
            <div className="font-display text-2xl tracking-[0.5em] mt-2" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const TraditionalLayout = () => (
    <div className="w-full h-full flex flex-col items-center justify-between p-16 z-20">
      {/* Top Section */}
      <div className="w-full flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="font-display text-base tracking-[0.6em] whitespace-nowrap" style={{ color: currentTheme.colors.accent }}>SIYONU SAMAJA MANDHIRAM</div>
          <div className="w-64 h-[1px] relative" style={{ background: `linear-gradient(to r, transparent, ${currentTheme.colors.accent}, transparent)` }}>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2" style={{ background: currentTheme.colors.accent }} />
          </div>
          <div className="font-telugu text-3xl font-bold tracking-wider whitespace-nowrap" style={{ color: currentTheme.colors.text }}>సీయోను సమాజ మందిరం</div>
        </div>

        <div className="flex flex-row items-center gap-12 w-full px-10">
          <div className="w-1/3 flex flex-col items-center gap-4">
            <div className="font-display text-7xl font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
            <div className="font-display text-xl tracking-[0.4em]" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
          </div>
          <div className="flex-1 text-center">
            <div className="inline-block border-y-2 py-3 px-10" style={{ borderColor: `${currentTheme.colors.accent}40` }}>
              <span className="font-telugu text-2xl font-bold tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</span>
            </div>
          </div>
          <div className="w-1/3 flex flex-col items-center">
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 shadow-xl" style={{ borderColor: currentTheme.colors.accent }}>
              <img src={pastorImage} className="w-full h-full object-cover" alt="Pastor" />
            </div>
            <div className="mt-4 font-telugu text-lg font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          </div>
        </div>
      </div>

      {/* Middle Section: Verse */}
      <div className="w-full max-w-[850px] text-center space-y-10">
        <div className="font-telugu text-5xl font-extrabold leading-[1.6] drop-shadow-2xl" style={{ color: currentTheme.colors.text }}>
          {renderTeluguVerse()}
        </div>
        <div className="font-serif text-2xl italic leading-relaxed font-light opacity-60" style={{ color: currentTheme.colors.text }}>
          {data.englishVerse}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="w-full flex flex-col items-center gap-6">
        <div className="w-full h-[1px]" style={{ background: `radial-gradient(circle, ${currentTheme.colors.accent}40, transparent)` }} />
        <div className="flex flex-row items-center gap-12">
          <div className="flex items-center gap-3 text-lg font-telugu opacity-80" style={{ color: currentTheme.colors.text }}>
            <MapPin size={20} style={{ color: currentTheme.colors.accent }} />
            {data.churchAddress}
          </div>
          <div className="flex items-center gap-3 font-display text-base tracking-[0.2em]" style={{ color: currentTheme.colors.accent }}>
            <Phone size={20} />
            {data.phone}
          </div>
        </div>
      </div>
    </div>
  );

  const MinimalistLayout = () => (
    <div className="w-full h-full flex flex-col p-24 z-20">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="font-display text-sm tracking-[0.4em]" style={{ color: currentTheme.colors.accent }}>SIYONU SAMAJA MANDHIRAM</div>
          <div className="font-telugu text-xl font-medium whitespace-nowrap" style={{ color: currentTheme.colors.text }}>సీయోను సమాజ మందిరం</div>
        </div>
        <div className="text-right">
          <div className="font-display text-5xl font-light" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="font-display text-xs tracking-widest uppercase" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-[700px] space-y-12">
        <div className="space-y-6">
          <div className="font-display text-xs tracking-[0.3em] uppercase opacity-50" style={{ color: currentTheme.colors.text }}>{data.scriptureReference}</div>
          <div className="font-telugu text-6xl font-light leading-tight" style={{ color: currentTheme.colors.text }}>
            {renderTeluguVerse()}
          </div>
          <div className="font-serif text-xl italic opacity-40" style={{ color: currentTheme.colors.text }}>
            {data.englishVerse}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div className="flex gap-12">
          <div className="space-y-1">
            <div className="font-display text-[10px] tracking-widest uppercase opacity-40" style={{ color: currentTheme.colors.text }}>Location</div>
            <div className="font-telugu text-sm" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
          </div>
          <div className="space-y-1">
            <div className="font-display text-[10px] tracking-widest uppercase opacity-40" style={{ color: currentTheme.colors.text }}>Contact</div>
            <div className="font-display text-sm" style={{ color: currentTheme.colors.text }}>{data.phone}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-display text-[10px] tracking-widest uppercase opacity-40" style={{ color: currentTheme.colors.text }}>Pastor</div>
            <div className="font-telugu text-sm font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          </div>
          <div className="w-16 h-16 rounded-full overflow-hidden border grayscale hover:grayscale-0 transition-all" style={{ borderColor: currentTheme.colors.accent }}>
            <img src={pastorImage} className="w-full h-full object-cover" alt="Pastor" />
          </div>
        </div>
      </div>
    </div>
  );

  const GlassmorphismLayout = () => (
    <div className="w-full h-full flex flex-col items-center justify-center p-20 z-20">
      <div className="w-full h-full backdrop-blur-md bg-white/5 rounded-[40px] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        <div className="h-24 flex items-center justify-between px-12 border-b border-white/10">
          <div className="font-display text-lg tracking-[0.4em]" style={{ color: currentTheme.colors.accent }}>SIYONU SAMAJA MANDHIRAM</div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2" style={{ borderColor: currentTheme.colors.accent }}>
              <img src={pastorImage} className="w-full h-full object-cover" alt="Pastor" />
            </div>
            <span className="font-telugu text-sm font-bold" style={{ color: currentTheme.colors.text }}>{data.pastorName}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-row">
          <div className="flex-1 p-16 flex flex-col justify-center space-y-8">
            <div className="inline-block px-4 py-1 rounded-full bg-white/10 text-xs font-display tracking-widest" style={{ color: currentTheme.colors.accent }}>
              {data.scriptureReference}
            </div>
            <div className="font-telugu text-5xl font-bold leading-snug" style={{ color: currentTheme.colors.text }}>
              {renderTeluguVerse()}
            </div>
            <div className="font-serif text-2xl italic opacity-50" style={{ color: currentTheme.colors.text }}>
              {data.englishVerse}
            </div>
          </div>
          <div className="w-80 border-l border-white/10 flex flex-col items-center justify-center gap-4">
            <div className="font-display text-9xl font-black opacity-20" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
            <div className="font-display text-xl tracking-[0.3em] uppercase" style={{ color: currentTheme.colors.text }}>{data.month}</div>
            <div className="font-display text-sm opacity-50" style={{ color: currentTheme.colors.text }}>{data.year}</div>
          </div>
        </div>

        <div className="h-20 bg-black/20 flex items-center justify-between px-12 text-xs font-display tracking-widest uppercase opacity-60" style={{ color: currentTheme.colors.text }}>
          <div className="flex items-center gap-2"><MapPin size={14} /> {data.churchAddress}</div>
          <div className="flex items-center gap-2"><Phone size={14} /> {data.phone}</div>
        </div>
      </div>
    </div>
  );

  const BrutalistLayout = () => (
    <div className="w-full h-full flex flex-col p-12 z-20">
      <div className="grid grid-cols-4 grid-rows-4 gap-4 w-full h-full">
        <div className="col-span-3 border-4 p-8 flex flex-col justify-between" style={{ borderColor: currentTheme.colors.accent, backgroundColor: `${currentTheme.colors.accent}10` }}>
          <div className="font-display text-2xl font-black tracking-tighter" style={{ color: currentTheme.colors.accent }}>SIYONU SAMAJA MANDHIRAM</div>
          <div className="font-telugu text-7xl font-black leading-none" style={{ color: currentTheme.colors.text }}>
            {renderTeluguVerse()}
          </div>
        </div>
        <div className="col-span-1 border-4 flex flex-col items-center justify-center gap-2" style={{ borderColor: currentTheme.colors.accent }}>
          <div className="font-display text-8xl font-black" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="font-display text-xl font-bold uppercase" style={{ color: currentTheme.colors.text }}>{data.month}</div>
        </div>
        <div className="col-span-1 border-4 overflow-hidden" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover grayscale contrast-125" alt="Pastor" />
        </div>
        <div className="col-span-2 border-4 p-6 flex items-center" style={{ borderColor: currentTheme.colors.accent }}>
          <div className="font-serif text-2xl italic font-bold" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
        </div>
        <div className="col-span-1 border-4 p-4 flex flex-col justify-center" style={{ borderColor: currentTheme.colors.accent, backgroundColor: currentTheme.colors.accent }}>
          <div className="font-display text-xs font-black text-black uppercase tracking-widest">Reference</div>
          <div className="font-telugu text-xl font-black text-black">{data.scriptureReference}</div>
        </div>
        <div className="col-span-2 border-4 p-6 flex flex-col justify-center" style={{ borderColor: currentTheme.colors.accent }}>
          <div className="font-display text-xs font-bold uppercase opacity-50" style={{ color: currentTheme.colors.text }}>Location</div>
          <div className="font-telugu text-lg font-bold" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
        </div>
        <div className="col-span-2 border-4 p-6 flex flex-col justify-center" style={{ borderColor: currentTheme.colors.accent }}>
          <div className="font-display text-xs font-bold uppercase opacity-50" style={{ color: currentTheme.colors.text }}>Pastor</div>
          <div className="font-telugu text-2xl font-black" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
        </div>
      </div>
    </div>
  );

  const VintageLayout = () => (
    <div className="w-full h-full flex flex-col items-center p-20 z-20">
      <div className="w-full h-full border-[12px] p-12 flex flex-col items-center justify-between relative" style={{ borderColor: currentTheme.colors.accent }}>
        {/* Ornate corners */}
        {['top-0 left-0', 'top-0 right-0 rotate-90', 'bottom-0 left-0 -rotate-90', 'bottom-0 right-0 rotate-180'].map((pos, i) => (
          <div key={i} className={`absolute w-16 h-16 ${pos} -m-3 bg-zinc-950 flex items-center justify-center`}>
            <div className="w-10 h-10 border-2 rotate-45" style={{ borderColor: currentTheme.colors.accent }} />
          </div>
        ))}

        <div className="text-center space-y-2">
          <div className="font-display text-xl tracking-[0.4em] font-bold" style={{ color: currentTheme.colors.accent }}>SIYONU SAMAJA MANDHIRAM</div>
          <div className="font-telugu text-2xl opacity-80 whitespace-nowrap" style={{ color: currentTheme.colors.text }}>సీయోను సమాజ మందిరం</div>
        </div>

        <div className="w-full flex flex-row items-center gap-12">
          <div className="w-1/4 h-[1px]" style={{ background: currentTheme.colors.accent }} />
          <div className="font-display text-2xl tracking-widest uppercase" style={{ color: currentTheme.colors.accent }}>{data.month} {data.day}, {data.year}</div>
          <div className="w-1/4 h-[1px]" style={{ background: currentTheme.colors.accent }} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 max-w-[800px]">
          <div className="font-telugu text-5xl font-bold leading-relaxed italic" style={{ color: currentTheme.colors.text }}>
            "{renderTeluguVerse()}"
          </div>
          <div className="w-32 h-[2px]" style={{ background: currentTheme.colors.accent }} />
          <div className="font-serif text-2xl italic opacity-60" style={{ color: currentTheme.colors.text }}>
            {data.englishVerse}
          </div>
          <div className="font-display text-lg tracking-widest uppercase" style={{ color: currentTheme.colors.accent }}>— {data.scriptureReference} —</div>
        </div>

        <div className="w-full flex justify-between items-end">
          <div className="space-y-1 text-xs font-display tracking-widest uppercase opacity-60" style={{ color: currentTheme.colors.text }}>
            <div>{data.churchAddress}</div>
            <div style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-full border-4 p-1 shadow-2xl" style={{ borderColor: currentTheme.colors.accent }}>
              <img src={pastorImage} className="w-full h-full rounded-full object-cover sepia-[0.5]" alt="Pastor" />
            </div>
            <div className="font-telugu text-sm font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const AsymmetricLayout = () => (
    <div className="w-full h-full grid grid-cols-12 grid-rows-12 gap-0 z-20">
      <div className="col-span-7 row-span-8 p-20 flex flex-col justify-center gap-8">
        <div className="font-display text-sm tracking-[0.5em] opacity-50" style={{ color: currentTheme.colors.text }}>SIYONU SAMAJA MANDHIRAM</div>
        <div className="font-telugu text-6xl font-black leading-tight" style={{ color: currentTheme.colors.text }}>
          {renderTeluguVerse()}
        </div>
        <div className="font-serif text-2xl italic opacity-40 max-w-[500px]" style={{ color: currentTheme.colors.text }}>
          {data.englishVerse}
        </div>
      </div>
      <div className="col-span-5 row-span-7 relative overflow-hidden bg-zinc-900">
        <img src={pastorImage} className="w-full h-full object-cover" alt="Pastor" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/60" />
        <div className="absolute bottom-10 left-10">
          <div className="font-display text-xs tracking-widest uppercase opacity-60 mb-1" style={{ color: 'white' }}>Pastor</div>
          <div className="font-telugu text-3xl font-black text-white">{data.pastorName}</div>
        </div>
      </div>
      <div className="col-span-5 row-span-5 p-12 flex flex-col justify-between border-t border-white/10">
        <div className="space-y-2">
          <div className="font-display text-8xl font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="font-display text-2xl tracking-widest uppercase" style={{ color: currentTheme.colors.text }}>{data.month}</div>
        </div>
        <div className="font-display text-sm tracking-widest opacity-40" style={{ color: currentTheme.colors.text }}>{data.year}</div>
      </div>
      <div className="col-span-7 row-span-4 p-12 bg-white/5 border-l border-t border-white/10 flex flex-col justify-between">
        <div className="font-telugu text-2xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-telugu opacity-60" style={{ color: currentTheme.colors.text }}><MapPin size={14} /> {data.churchAddress}</div>
            <div className="flex items-center gap-2 text-sm font-display tracking-widest" style={{ color: currentTheme.colors.accent }}><Phone size={14} /> {data.phone}</div>
          </div>
          <div className="font-telugu text-xl font-black opacity-30 whitespace-nowrap" style={{ color: currentTheme.colors.text }}>సీయోను సమాజ మందిరం</div>
        </div>
      </div>
    </div>
  );

  const HeroLayout = () => (
    <div className="w-full h-full relative z-20">
      <div className="absolute inset-0">
        <img src={pastorImage} className="w-full h-full object-cover brightness-[0.3] saturate-[0.8]" alt="Pastor" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>
      
      <div className="relative h-full flex flex-col justify-between p-24">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="font-display text-xl tracking-[0.6em] font-bold" style={{ color: currentTheme.colors.accent }}>SIYONU SAMAJA MANDHIRAM</div>
            <div className="font-telugu text-2xl opacity-80 whitespace-nowrap" style={{ color: 'white' }}>సీయోను సమాజ మందిరం</div>
          </div>
          <div className="text-right">
            <div className="font-display text-7xl font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
            <div className="font-display text-xl tracking-widest uppercase mt-2" style={{ color: 'white' }}>{data.month} {data.year}</div>
          </div>
        </div>

        <div className="max-w-[900px] space-y-12">
          <div className="space-y-6">
            <div className="inline-block px-6 py-2 border-l-4" style={{ borderColor: currentTheme.colors.accent, backgroundColor: `${currentTheme.colors.accent}20` }}>
              <span className="font-telugu text-2xl font-bold tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</span>
            </div>
            <div className="font-telugu text-7xl font-black leading-tight drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]" style={{ color: 'white' }}>
              {renderTeluguVerse()}
            </div>
            <div className="font-serif text-3xl italic opacity-60 max-w-[700px]" style={{ color: 'white' }}>
              {data.englishVerse}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end pt-12 border-t border-white/20">
          <div className="flex gap-16">
            <div className="flex items-center gap-3 text-lg font-telugu text-white/80">
              <MapPin size={20} style={{ color: currentTheme.colors.accent }} />
              {data.churchAddress}
            </div>
            <div className="flex items-center gap-3 font-display text-lg tracking-widest" style={{ color: currentTheme.colors.accent }}>
              <Phone size={20} />
              {data.phone}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-xs tracking-widest uppercase opacity-40 mb-1" style={{ color: 'white' }}>Pastor</div>
            <div className="font-telugu text-2xl font-black" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const GridLayout = () => (
    <div className="w-full h-full p-12 z-20">
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-6">
        <div className="col-span-2 row-span-1 bg-white/5 border border-white/10 p-10 flex flex-col justify-center">
          <div className="font-display text-lg tracking-[0.5em] mb-2" style={{ color: currentTheme.colors.accent }}>SIYONU SAMAJA MANDHIRAM</div>
          <div className="font-telugu text-3xl font-black whitespace-nowrap" style={{ color: currentTheme.colors.text }}>సీయోను సమాజ మందిరం</div>
        </div>
        <div className="col-span-1 row-span-1 bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2">
          <div className="font-display text-7xl font-black" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="font-display text-xl tracking-widest uppercase" style={{ color: currentTheme.colors.text }}>{data.month}</div>
        </div>
        <div className="col-span-1 row-span-2 relative overflow-hidden rounded-2xl border border-white/10">
          <img src={pastorImage} className="w-full h-full object-cover" alt="Pastor" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-8 left-0 w-full text-center px-4">
            <div className="font-telugu text-xl font-black" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          </div>
        </div>
        <div className="col-span-2 row-span-2 bg-white/5 border border-white/10 p-12 flex flex-col justify-between">
          <div className="space-y-8">
            <div className="font-telugu text-2xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
            <div className="font-telugu text-5xl font-black leading-tight" style={{ color: currentTheme.colors.text }}>
              {renderTeluguVerse()}
            </div>
            <div className="font-serif text-2xl italic opacity-40" style={{ color: currentTheme.colors.text }}>
              {data.englishVerse}
            </div>
          </div>
          <div className="flex justify-between items-end pt-8 border-t border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-telugu opacity-60" style={{ color: currentTheme.colors.text }}><MapPin size={14} /> {data.churchAddress}</div>
              <div className="flex items-center gap-2 text-sm font-display tracking-widest" style={{ color: currentTheme.colors.accent }}><Phone size={14} /> {data.phone}</div>
            </div>
            <div className="font-display text-sm opacity-30" style={{ color: currentTheme.colors.text }}>{data.year}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center gap-8 bg-zinc-950 text-white">
      <div className="w-full max-w-5xl bg-zinc-900/80 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-2xl">
        <h1 className="font-display text-xl sm:text-2xl text-gold-bright text-center tracking-[0.2em] sm:tracking-widest mb-6 border-b border-white/10 pb-4 flex items-center justify-center gap-3">
          <span className="hidden sm:inline">✦</span> 
          SIYONU POSTER STUDIO 
          <span className="hidden sm:inline">✦</span>
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Verse Editor */}
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold-muted font-display">
                <Palette size={12} /> Select Template & Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setCurrentTheme(theme)}
                    className={cn(
                      "px-3 py-3 rounded-lg text-[10px] font-display tracking-wider border transition-all flex flex-col items-center gap-2",
                      currentTheme.id === theme.id 
                        ? "bg-white/10 border-gold-bright text-gold-bright shadow-[0_0_15px_rgba(240,192,96,0.2)]" 
                        : "bg-black/20 border-white/5 text-zinc-400 hover:border-white/20"
                    )}
                  >
                    <div className={cn("w-full h-6 rounded bg-gradient-to-br", theme.colors.bg)} />
                    <span className="truncate w-full text-center">{theme.name}</span>
                    <span className="text-[7px] opacity-40 uppercase tracking-tighter">({theme.layout})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Telugu Verse</label>
                <textarea name="teluguVerse" value={data.teluguVerse} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-gold-bright outline-none min-h-[100px] resize-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Highlight Words</label>
                <input name="highlightWords" value={data.highlightWords} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-gold-bright outline-none" placeholder="Words to glow..." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">English Verse</label>
                <textarea name="englishVerse" value={data.englishVerse} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-gold-bright outline-none min-h-[80px] resize-none" />
              </div>
            </div>
          </div>

          {/* Right Column: Meta Info */}
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Day</label>
                <input name="day" value={data.day} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-center text-sm focus:border-gold-bright outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Month</label>
                <input name="month" value={data.month} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-center text-sm focus:border-gold-bright outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Year</label>
                <input name="year" value={data.year} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-center text-sm focus:border-gold-bright outline-none" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Scripture Ref</label>
                <input name="scriptureReference" value={data.scriptureReference} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Pastor Name</label>
                <input name="pastorName" value={data.pastorName} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Phone</label>
                <input name="phone" value={data.phone} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Pastor Image</label>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-zinc-400 hover:text-gold-bright hover:border-gold-bright transition-all flex items-center justify-center gap-2">
                  <RefreshCw size={14} /> Change Portrait
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Church Address</label>
            <input name="churchAddress" value={data.churchAddress} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm" />
          </div>
          <div className="flex justify-center pt-4">
            <button 
              onClick={downloadPoster} 
              disabled={isExporting} 
              className="group relative flex items-center justify-center gap-3 bg-gradient-to-br from-gold-muted to-gold-bright text-black font-display font-bold py-3 px-6 sm:py-4 sm:px-12 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(240,192,96,0.3)] disabled:opacity-50 w-full sm:w-auto text-xs sm:text-base"
            >
              {isExporting ? <RefreshCw className="animate-spin" /> : <Download size={20} />}
              {isExporting ? "PREPARING..." : "EXPORT POSTER (4K PNG)"}
            </button>
          </div>
        </div>

      {/* Poster Preview Area */}
      <div className="w-full max-w-5xl flex flex-col items-center gap-4 pb-20">
        <div className="flex items-center gap-2 text-gold-muted font-display text-[10px] uppercase tracking-[0.2em]">
          <div className="w-2 h-2 rounded-full bg-gold-bright animate-pulse" />
          Live Preview
        </div>
        
        <div 
          ref={previewContainerRef}
          className="w-full relative flex justify-center items-start overflow-hidden rounded-xl shadow-2xl border border-white/5"
          style={{ height: `${1080 * scale}px` }}
        >
          <div 
            ref={posterRef} 
            className={cn("w-[1080px] h-[1080px] relative overflow-hidden flex flex-col items-center shrink-0 bg-black origin-top")}
            style={{ 
              fontFamily: '"Inter", "Noto Sans Telugu", sans-serif',
              transform: `scale(${scale})`
            }}
          >
          {/* Dynamic Background Layers */}
          <div className={cn("absolute inset-0 bg-gradient-to-br transition-colors duration-700", currentTheme.colors.bg)} />
          
          {/* Common Decorative Elements */}
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:54px_54px]" />
          <div className="absolute inset-[20px] border rounded-sm z-10 opacity-30" style={{ borderColor: currentTheme.colors.accent }} />
          
          {/* Layout Rendering */}
          {currentTheme.layout === 'split' && <SplitLayout />}
          {currentTheme.layout === 'magazine' && <MagazineLayout />}
          {currentTheme.layout === 'traditional' && <TraditionalLayout />}
          {currentTheme.layout === 'minimalist' && <MinimalistLayout />}
          {currentTheme.layout === 'glassmorphism' && <GlassmorphismLayout />}
          {currentTheme.layout === 'brutalist' && <BrutalistLayout />}
          {currentTheme.layout === 'vintage' && <VintageLayout />}
          {currentTheme.layout === 'asymmetric' && <AsymmetricLayout />}
          {currentTheme.layout === 'hero' && <HeroLayout />}
          {currentTheme.layout === 'grid' && <GridLayout />}

          {/* Floating Light Particles */}
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-particle opacity-20"
                style={{
                  width: Math.random() * 8 + 4 + 'px',
                  height: Math.random() * 8 + 4 + 'px',
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                  backgroundColor: currentTheme.colors.accent,
                  animationDelay: Math.random() * 5 + 's',
                  animationDuration: Math.random() * 10 + 10 + 's'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
  );
}
