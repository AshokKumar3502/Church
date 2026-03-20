import React, { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, RefreshCw, MapPin, Phone, Palette, Type as TypeIcon } from 'lucide-react';
import { cn } from './lib/utils';
import { DEFAULT_PASTOR_IMAGE, DEFAULT_POSTER_DATA, THEMES, MONTHS, DAYS, YEARS } from './constants';
import { getVerseForDay } from './data/dailyVerses';

function App() {
  const [data, setData] = useState({
    ...DEFAULT_POSTER_DATA,
    teluguFontSize: 60,
    pastorImageScale: 1,
    pastorImageX: 0,
    pastorImageY: 0
  });
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
        const newScale = Math.min(containerWidth / 690, 1);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const getDayOfYear = (day: string, month: string) => {
    const monthIndex = MONTHS.indexOf(month);
    const dayNum = parseInt(day);
    if (monthIndex === -1 || isNaN(dayNum)) return 1;
    
    const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let dayOfYear = dayNum;
    for (let i = 0; i < monthIndex; i++) {
      dayOfYear += daysInMonths[i];
    }
    return dayOfYear;
  };

  const pastorImageStyle = {
    transform: `scale(${data.pastorImageScale}) translate(${data.pastorImageX}px, ${data.pastorImageY}px)`,
    transition: 'transform 0.1s ease-out'
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-populate verse if day or month changes
      if (name === 'day' || name === 'month') {
        const dayOfYear = getDayOfYear(
          name === 'day' ? value : prev.day,
          name === 'month' ? value : prev.month
        );
        const dailyVerse = getVerseForDay(dayOfYear);
        newData.teluguVerse = dailyVerse.telugu;
        newData.englishVerse = dailyVerse.english;
        newData.scriptureReference = dailyVerse.reference;
      }
      
      return newData;
    });
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
    
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const dataUrl = await toPng(posterRef.current, {
        quality: 1,
        pixelRatio: 3,
        width: 690,
        height: 1260,
        skipFonts: false,
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
    <div className="w-full h-full flex flex-col items-stretch text-center">
      <div className="h-[50%] relative flex flex-col items-center justify-center p-12 z-20">
        <div className="absolute inset-0 opacity-10" style={{ background: currentTheme.colors.accent }} />
        <div className="text-center space-y-4 mb-8">
          <div className="font-display text-2xl tracking-[0.5em] uppercase" style={{ color: currentTheme.colors.accent }}>{data.churchName}</div>
          <div className="font-telugu text-4xl font-bold tracking-wider" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
        </div>
        <div className="relative w-[450px] h-[500px] rounded-2xl overflow-hidden border-4 shadow-2xl" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-0 w-full text-center">
            <div className="inline-block border-b-2 px-8 py-3" style={{ borderColor: currentTheme.colors.accent }}>
              <span className="font-telugu text-3xl font-bold tracking-wide" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between p-12 z-20 bg-black/20 items-center">
        <div className="space-y-6 w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center border-y-4 px-8 py-2" style={{ borderColor: currentTheme.colors.accent, background: `${currentTheme.colors.accent}15` }}>
              <span className="font-telugu text-2xl font-bold tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</span>
            </div>
            <div className="text-center border-2 p-4 rounded-md min-w-[180px] backdrop-blur-md" style={{ borderColor: `${currentTheme.colors.accent}80`, background: `${currentTheme.colors.accent}10` }}>
              <div className="font-display text-lg tracking-[0.3em] opacity-70" style={{ color: currentTheme.colors.text }}>{data.year}</div>
              <div className="font-display text-xl tracking-[0.4em] opacity-90 mt-1" style={{ color: currentTheme.colors.text }}>{data.month}</div>
              <div className="font-display text-6xl font-black leading-none mt-2" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
            </div>
          </div>
          <div className="space-y-6 text-center">
            <div className="font-telugu font-extrabold leading-[1.2] drop-shadow-2xl break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>
              {renderTeluguVerse()}
            </div>
            <div className="font-serif text-3xl italic leading-relaxed font-light opacity-60 mx-auto max-w-[90%]" style={{ color: currentTheme.colors.text }}>
              {data.englishVerse}
            </div>
          </div>
        </div>
        <div className="space-y-4 pt-6 border-t border-white/10 w-full flex flex-col items-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4 text-2xl font-telugu opacity-80" style={{ color: currentTheme.colors.text }}>
              <MapPin size={32} style={{ color: currentTheme.colors.accent }} />
              {data.churchAddress}
            </div>
            <div className="flex items-center gap-4 font-display text-xl tracking-[0.2em]" style={{ color: currentTheme.colors.accent }}>
              <Phone size={32} />
              {data.phone}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const MagazineLayout = () => (
    <div className="w-full h-full relative flex flex-col items-center p-12 z-20 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[400px] font-black opacity-[0.03] select-none pointer-events-none whitespace-nowrap rotate-90" style={{ color: currentTheme.colors.accent }}>
        {data.month} {data.day}
      </div>
      <div className="w-full flex flex-col items-center gap-12">
        <div className="text-center space-y-4">
          <div className="font-display text-2xl tracking-[0.6em]" style={{ color: currentTheme.colors.accent }}>{data.churchName}</div>
          <div className="font-telugu text-4xl font-black tracking-[0.1em]" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
        </div>
        <div className="relative group">
          <div className="absolute inset-[-30px] border-2 rounded-full opacity-20 animate-pulse" style={{ borderColor: currentTheme.colors.accent }} />
          <div className="w-[450px] h-[450px] rounded-full overflow-hidden border-4 shadow-2xl relative z-10" style={{ borderColor: currentTheme.colors.accent }}>
            <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black border-2 px-8 py-3 rounded-xl z-20 shadow-2xl whitespace-nowrap" style={{ borderColor: currentTheme.colors.accent }}>
            <span className="font-telugu text-3xl font-black tracking-wider" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</span>
          </div>
        </div>
        <div className="flex-1 space-y-10 text-center mt-8">
          <div className="font-telugu font-black leading-[1.2] drop-shadow-2xl break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>
            {renderTeluguVerse()}
          </div>
          <div className="font-serif text-3xl italic leading-relaxed font-light opacity-70" style={{ color: currentTheme.colors.text }}>
            {data.englishVerse}
          </div>
          <div className="inline-block px-10 py-3 rounded-full border-2 font-display text-2xl tracking-widest" style={{ borderColor: currentTheme.colors.accent, color: currentTheme.colors.accent }}>
            {data.scriptureReference}
          </div>
        </div>
        <div className="w-full flex flex-col items-center gap-8 pt-10 border-t border-white/10 mt-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4 text-2xl font-telugu" style={{ color: currentTheme.colors.text }}>
              <MapPin size={32} style={{ color: currentTheme.colors.accent }} />
              {data.churchAddress}
            </div>
            <div className="flex items-center gap-4 font-display text-xl tracking-[0.2em]" style={{ color: currentTheme.colors.accent }}>
              <Phone size={32} />
              {data.phone}
            </div>
          </div>
          <div className="text-center">
            <div className="font-display text-[8rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
            <div className="font-display text-3xl tracking-[0.4em] mt-4" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const TraditionalLayout = () => (
    <div className="w-full h-full flex flex-col items-center justify-between p-10 z-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full border-[15px] border-double" style={{ borderColor: currentTheme.colors.accent }} />
      </div>
      <div className="w-full flex flex-col items-center gap-8 mt-8 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <div className="font-display text-xl tracking-[0.8em] font-black drop-shadow-lg" style={{ color: currentTheme.colors.accent }}>{data.churchName}</div>
          <div className="w-[450px] h-[1px] relative" style={{ background: `linear-gradient(to r, transparent, ${currentTheme.colors.accent}, transparent)` }}>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-4 h-4 border-2" style={{ background: currentTheme.colors.accent, borderColor: currentTheme.colors.bg }} />
          </div>
          <div className="font-telugu text-4xl font-black tracking-widest drop-shadow-2xl" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-6 w-full">
          <div className="flex flex-col items-center gap-2">
            <div className="font-display text-[7rem] font-black leading-none drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
            <div className="font-display text-3xl tracking-[0.6em] font-black uppercase drop-shadow-lg" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
          </div>
          <div className="relative w-[280px] h-[280px] rounded-full overflow-hidden border-[6px] shadow-2xl" style={{ borderColor: currentTheme.colors.accent }}>
            <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
          </div>
          <div className="font-telugu text-3xl font-black drop-shadow-xl" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
        </div>
      </div>
      <div className="w-full max-w-[600px] text-center space-y-8 flex-1 flex flex-col justify-center relative z-10 px-6">
        <div className="inline-block border-y-[3px] py-4 px-10 self-center" style={{ borderColor: `${currentTheme.colors.accent}80` }}>
          <span className="font-telugu text-3xl font-black tracking-[0.1em] uppercase" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</span>
        </div>
        <div className="font-telugu font-black leading-[1.2] drop-shadow-xl break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>
          {renderTeluguVerse()}
        </div>
        <div className="font-serif text-2xl italic leading-relaxed font-medium opacity-80 max-w-[95%] mx-auto" style={{ color: currentTheme.colors.text }}>
          {data.englishVerse}
        </div>
      </div>
      <div className="w-full flex flex-col items-center gap-6 mb-8 relative z-10">
        <div className="w-[70%] h-[2px] rounded-full" style={{ background: `radial-gradient(circle, ${currentTheme.colors.accent}, transparent)` }} />
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 text-2xl font-telugu font-black drop-shadow-lg" style={{ color: currentTheme.colors.text }}>
            <MapPin size={28} style={{ color: currentTheme.colors.accent }} />
            {data.churchAddress}
          </div>
          <div className="flex items-center gap-4 font-display text-3xl tracking-[0.3em] font-black drop-shadow-xl" style={{ color: currentTheme.colors.accent }}>
            <Phone size={32} />
            {data.phone}
          </div>
        </div>
      </div>
    </div>
  );

  const MinimalistLayout = () => (
    <div className="w-full h-full flex flex-col p-10 z-20 justify-between items-center text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border-[1px] border-black/5 rounded-full pointer-events-none" />
      <div className="flex flex-col items-center gap-8 relative z-10 w-full">
        <div className="space-y-3">
          <div className="font-display text-5xl font-black tracking-tighter" style={{ color: currentTheme.colors.accent }}>{data.churchName.split(' ')[0]}</div>
          <div className="font-telugu text-3xl font-black opacity-90" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
        </div>
        <div className="text-center">
          <div className="font-display text-[9rem] font-black leading-none drop-shadow-2xl" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="font-display text-3xl font-black tracking-[0.2em] uppercase opacity-40 -mt-4" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center space-y-10 relative z-10 items-center">
        <div className="space-y-6 w-full">
          <div className="font-display text-xl tracking-[0.6em] uppercase opacity-40 font-black" style={{ color: currentTheme.colors.text }}>{data.scriptureReference}</div>
          <div className="font-telugu font-black leading-[1.2] tracking-tighter drop-shadow-xl break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>
            {renderTeluguVerse()}
          </div>
          <div className="font-serif text-3xl italic opacity-40 leading-relaxed max-w-xl mx-auto" style={{ color: currentTheme.colors.text }}>
            {data.englishVerse}
          </div>
        </div>
        <div className="flex flex-col items-center gap-8">
          <div className="w-32 h-32 rounded-[25px] overflow-hidden grayscale hover:grayscale-0 transition-all duration-1000 border-2 border-black/5 shadow-2xl">
            <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
          </div>
          <div className="space-y-2">
            <div className="font-display text-lg tracking-widest uppercase opacity-40 font-black" style={{ color: currentTheme.colors.text }}>Senior Pastor</div>
            <div className="font-telugu text-4xl font-black drop-shadow-lg" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-8 border-t-[2px] border-black/5 pt-10 mb-2 relative z-10 w-full">
        <div className="space-y-2">
          <div className="font-display text-lg tracking-widest uppercase opacity-40 font-black" style={{ color: currentTheme.colors.text }}>Location</div>
          <div className="font-telugu text-2xl font-black" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
        </div>
        <div className="space-y-2">
          <div className="font-display text-lg tracking-widest uppercase opacity-40 font-black" style={{ color: currentTheme.colors.text }}>Contact</div>
          <div className="font-display text-4xl font-black tracking-widest drop-shadow-xl" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
        </div>
      </div>
    </div>
  );

  const GlassmorphismLayout = () => (
    <div className="w-full h-full flex flex-col p-6 z-20 items-center text-center overflow-hidden">
      <div className="flex-1 backdrop-blur-3xl bg-white/10 border-[3px] rounded-[35px] p-10 flex flex-col justify-between relative overflow-hidden shadow-2xl w-full" style={{ borderColor: `${currentTheme.colors.accent}60`, boxShadow: `inset 0 0 50px ${currentTheme.colors.accent}20` }}>
        <div className="absolute top-0 right-0 w-[250px] h-[250px] -mr-20 -mt-20 rounded-full blur-[80px]" style={{ backgroundColor: `${currentTheme.colors.accent}30` }} />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] -ml-20 -mb-20 rounded-full blur-[80px]" style={{ backgroundColor: `${currentTheme.colors.accentMuted}30` }} />
        <div className="flex flex-col items-center gap-8 relative z-10">
          <div className="space-y-3">
            <div className="font-display text-4xl font-black tracking-tighter drop-shadow-2xl" style={{ color: currentTheme.colors.accent }}>{data.churchName.split(' ')[0]}</div>
            <div className="font-telugu text-2xl font-black opacity-90 drop-shadow-xl" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
          </div>
          <div className="w-28 h-28 rounded-xl overflow-hidden border-[2px] shadow-2xl" style={{ borderColor: currentTheme.colors.accent }}>
            <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
          </div>
        </div>
        <div className="space-y-10 relative z-10 items-center">
          <div className="font-telugu font-black leading-[1.2] tracking-tighter drop-shadow-2xl break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>
            {renderTeluguVerse()}
          </div>
          <div className="flex items-center gap-6 w-full">
            <div className="h-[2px] flex-1 rounded-full" style={{ backgroundColor: currentTheme.colors.accent }} />
            <div className="font-display text-2xl font-black tracking-[0.4em] uppercase drop-shadow-lg" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
            <div className="h-[2px] flex-1 rounded-full" style={{ backgroundColor: currentTheme.colors.accent }} />
          </div>
          <div className="font-serif text-3xl italic opacity-80 leading-relaxed drop-shadow-lg mx-auto max-w-[95%]" style={{ color: currentTheme.colors.text }}>
            {data.englishVerse}
          </div>
        </div>
        <div className="flex flex-col items-center gap-8 pt-10 border-t border-white/20 relative z-10 mb-2">
          <div className="space-y-4">
            <div className="font-telugu text-4xl font-black drop-shadow-xl" style={{ color: currentTheme.colors.text }}>{data.pastorName}</div>
            <div className="flex flex-col items-center gap-3 text-xl font-display tracking-widest uppercase opacity-90 font-bold" style={{ color: currentTheme.colors.text }}>
              <div className="flex items-center gap-3"><MapPin size={28} /> {data.churchAddress}</div>
              <div className="text-4xl font-black" style={{ color: currentTheme.colors.accent }}><Phone size={36} /> {data.phone}</div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-display text-[9rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
            <div className="font-display text-3xl font-black uppercase tracking-widest" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const BrutalistLayout = () => (
    <div className="w-full h-full flex flex-col p-12 z-20 items-center text-center">
      <div className="flex-1 border-[16px] p-12 flex flex-col justify-between relative shadow-[20px_20px_0_rgba(0,0,0,1)] w-full items-center" style={{ borderColor: currentTheme.colors.accent, backgroundColor: currentTheme.colors.bg }}>
        <div className="flex flex-col items-center gap-10 w-full">
          <div className="bg-black text-white p-8 border-[8px] shadow-[10px_10px_0_rgba(0,0,0,0.5)] w-full" style={{ borderColor: currentTheme.colors.accent }}>
            <div className="font-display text-7xl font-black tracking-tighter italic">{data.churchName.split(' ')[0]}</div>
            <div className="font-telugu text-3xl font-black tracking-widest uppercase mt-3">{data.churchNameTelugu}</div>
          </div>
          <div className="w-48 h-48 border-[10px] bg-black shadow-[10px_10px_0_rgba(0,0,0,0.5)]" style={{ borderColor: currentTheme.colors.accent }}>
            <img src={pastorImage} className="w-full h-full object-cover object-center grayscale contrast-150" style={pastorImageStyle} alt="Pastor" />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-16 mt-16 items-center w-full">
          <div className="font-telugu font-black leading-none tracking-tighter drop-shadow-2xl uppercase break-words" style={{ color: currentTheme.colors.text, textShadow: `8px 8px 0 ${currentTheme.colors.accent}`, fontSize: `${data.teluguFontSize}px` }}>
            {renderTeluguVerse()}
          </div>
          <div className="font-serif text-3xl italic font-black border-y-[10px] py-6 leading-relaxed text-center w-full" style={{ borderColor: currentTheme.colors.accent, color: currentTheme.colors.text }}>
            {data.englishVerse}
          </div>
          <div className="font-display text-4xl font-black tracking-[0.4em] uppercase bg-black text-white px-12 py-6 inline-block shadow-[8px_8px_0_rgba(0,0,0,0.5)]" style={{ backgroundColor: currentTheme.colors.accent }}>
            {data.scriptureReference}
          </div>
        </div>
        <div className="flex flex-col items-center gap-10 pt-16 border-t-[10px] w-full" style={{ borderColor: currentTheme.colors.accent }}>
          <div className="space-y-8 w-full">
            <div className="font-telugu text-5xl font-black bg-black text-white px-10 py-5 inline-block w-full" style={{ color: currentTheme.colors.text }}>{data.pastorName}</div>
            <div className="space-y-4 text-3xl font-display tracking-widest uppercase font-black flex flex-col items-center" style={{ color: currentTheme.colors.text }}>
              <div className="flex items-center gap-5"><MapPin size={40} /> {data.churchAddress}</div>
              <div className="text-5xl font-black" style={{ color: currentTheme.colors.accent }}><Phone size={48} className="inline mr-5" /> {data.phone}</div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-display text-[15rem] font-black leading-none drop-shadow-2xl" style={{ color: currentTheme.colors.accent, textShadow: `10px 10px 0 black` }}>{data.day}</div>
            <div className="font-display text-5xl font-black uppercase tracking-widest" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const VintageLayout = () => (
    <div className="w-full h-full flex flex-col items-center justify-between p-16 z-20 relative text-center">
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
      <div className="w-full border-[6px] p-10 flex flex-col items-center gap-8" style={{ borderColor: currentTheme.colors.accent }}>
        <div className="font-display text-3xl tracking-[0.5em] uppercase" style={{ color: currentTheme.colors.accent }}>{data.churchName}</div>
        <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
      </div>
      <div className="flex flex-col items-center gap-12">
        <div className="relative">
          <div className="absolute inset-0 border-[6px] -m-6 rotate-3" style={{ borderColor: currentTheme.colors.accent }} />
          <div className="w-80 h-80 overflow-hidden border-[6px] shadow-2xl" style={{ borderColor: currentTheme.colors.accent }}>
            <img src={pastorImage} className="w-full h-full object-cover object-center sepia" style={pastorImageStyle} alt="Pastor" />
          </div>
        </div>
        <div className="text-center space-y-8">
          <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
          <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
          <div className="font-serif text-3xl italic opacity-70 mx-auto max-w-[90%]" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
        </div>
      </div>
      <div className="w-full flex flex-col items-center gap-6 border-t-[6px] pt-12" style={{ borderColor: currentTheme.colors.accent }}>
        <div className="space-y-4">
          <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          <div className="flex items-center justify-center gap-4 text-2xl font-telugu" style={{ color: currentTheme.colors.text }}><MapPin size={32} /> {data.churchAddress}</div>
          <div className="flex items-center justify-center gap-4 font-display text-2xl" style={{ color: currentTheme.colors.accent }}><Phone size={32} /> {data.phone}</div>
        </div>
        <div className="text-center">
          <div className="font-display text-[10rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="font-display text-4xl tracking-widest uppercase" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
        </div>
      </div>
    </div>
  );

  const AsymmetricLayout = () => (
    <div className="w-full h-full flex flex-col z-20 relative text-center">
      <div className="h-[40%] relative overflow-hidden">
        <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="flex-1 flex flex-col justify-between p-12 bg-black/20 backdrop-blur-sm items-center">
        <div className="space-y-12 w-full">
          <div className="space-y-4">
            <div className="font-display text-2xl tracking-[0.4em]" style={{ color: currentTheme.colors.accent }}>{data.churchName}</div>
            <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
          </div>
          <div className="space-y-8">
            <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
            <div className="font-serif text-3xl italic opacity-60 mx-auto max-w-[90%]" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
          </div>
        </div>
        <div className="space-y-12 w-full">
          <div className="flex flex-col items-center gap-8">
            <div className="space-y-4">
              <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
              <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
            </div>
            <div className="text-center">
              <div className="font-display text-[9rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
              <div className="font-display text-4xl tracking-widest uppercase" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 space-y-4 flex flex-col items-center">
            <div className="flex items-center gap-4 text-2xl font-telugu" style={{ color: currentTheme.colors.text }}><MapPin size={32} /> {data.churchAddress}</div>
            <div className="flex items-center gap-4 font-display text-2xl" style={{ color: currentTheme.colors.accent }}><Phone size={32} /> {data.phone}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const HeroLayout = () => (
    <div className="w-full h-full flex flex-col z-20 relative text-center">
      <div className="h-[55%] relative overflow-hidden">
        <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 space-y-6 text-center">
          <div className="font-display text-2xl tracking-[0.6em]" style={{ color: currentTheme.colors.accent }}>{data.churchName}</div>
          <div className="font-telugu text-3xl font-bold" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
          <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
        </div>
      </div>
      <div className="flex-1 p-12 flex flex-col justify-between items-center">
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="space-y-4">
            <div className="font-telugu text-5xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
            <div className="font-serif text-3xl italic opacity-60 max-w-2xl mx-auto" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
          </div>
          <div className="text-center">
            <div className="font-display text-[10rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
            <div className="font-display text-4xl tracking-widest uppercase" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-6 pt-10 border-t border-white/10 w-full">
          <div className="space-y-3">
            <div className="font-telugu text-3xl" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
            <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
          </div>
          <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        </div>
      </div>
    </div>
  );

  const GridLayout = () => (
    <div className="w-full h-full flex flex-col p-10 z-20 gap-6 text-center">
      <div className="grid grid-cols-2 gap-6 h-[40%]">
        <div className="border-[6px] p-8 flex flex-col justify-center items-center gap-4" style={{ borderColor: currentTheme.colors.accent }}>
          <div className="font-display text-2xl tracking-[0.4em]" style={{ color: currentTheme.colors.accent }}>{data.churchName.split(' ')[0]}</div>
          <div className="font-telugu text-xl font-bold" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
          <div className="font-display text-[8rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="font-display text-2xl tracking-widest uppercase" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
        </div>
        <div className="relative overflow-hidden border-[6px]" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
        </div>
      </div>
      <div className="flex-1 border-[6px] p-10 flex flex-col justify-center gap-8 items-center" style={{ borderColor: currentTheme.colors.accent }}>
        <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
        <div className="font-serif text-3xl italic opacity-60 max-w-2xl mx-auto" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
      </div>
      <div className="flex flex-col items-center gap-8 pt-6">
        <div className="space-y-4">
          <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          <div className="font-telugu text-2xl opacity-70" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
          <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        </div>
      </div>
    </div>
  );

  const RoyalLayout = () => (
    <div className="w-full h-full flex flex-col items-center justify-between p-16 z-20 relative">
      <div className="absolute inset-0 border-[20px] border-double opacity-20" style={{ borderColor: currentTheme.colors.accent }} />
      <div className="text-center space-y-6">
        <div className="font-display text-2xl tracking-[1em]" style={{ color: currentTheme.colors.accent }}>{data.churchName}</div>
        <div className="font-telugu text-4xl font-black" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
      </div>
      <div className="flex flex-col items-center gap-12">
        <div className="w-80 h-80 rounded-full overflow-hidden border-[10px] shadow-2xl" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
        </div>
        <div className="text-center space-y-8">
          <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
          <div className="font-serif text-3xl italic opacity-70" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
        </div>
      </div>
      <div className="w-full flex flex-col items-center gap-6 px-16">
        <div className="space-y-4 text-center">
          <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          <div className="font-telugu text-2xl opacity-60" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
          <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
        </div>
        <div className="text-center">
          <div className="font-display text-[10rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="font-display text-4xl tracking-widest uppercase" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
        </div>
      </div>
    </div>
  );

  const OceanLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between items-center text-center">
      <div className="flex flex-col items-center gap-10 w-full">
        <div className="space-y-4">
          <div className="font-display text-5xl font-black tracking-tighter" style={{ color: currentTheme.colors.accent }}>{data.churchName.split(' ')[0]}</div>
          <div className="font-telugu text-2xl opacity-80" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
        </div>
        <div className="w-48 h-48 rounded-2xl overflow-hidden border-[6px]" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
        </div>
      </div>
      <div className="space-y-10 w-full">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
        <div className="font-serif text-3xl italic opacity-60 mx-auto max-w-[90%]" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
      </div>
      <div className="flex flex-col items-center gap-10 w-full">
        <div className="space-y-6">
          <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          <div className="space-y-3">
            <div className="font-telugu text-2xl" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
            <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
          </div>
        </div>
        <div className="text-center">
          <div className="font-display text-[12rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="font-display text-4xl tracking-widest uppercase" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
        </div>
      </div>
    </div>
  );

  const SunsetLayout = () => (
    <div className="w-full h-full flex flex-col items-center p-16 z-20 justify-center gap-16">
      <div className="text-center space-y-4">
        <div className="font-display text-2xl tracking-[0.8em]" style={{ color: currentTheme.colors.accent }}>{data.churchName}</div>
        <div className="font-telugu text-4xl opacity-80" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
      </div>
      <div className="relative w-80 h-80 rounded-full overflow-hidden border-[10px] shadow-2xl" style={{ borderColor: currentTheme.colors.accent }}>
        <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="text-center space-y-10">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
        <div className="font-serif text-3xl italic opacity-60 mx-auto max-w-[90%]" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
        <div className="font-display text-[11rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
        <div className="font-display text-4xl tracking-widest uppercase" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
      </div>
      <div className="w-full flex flex-col items-center gap-4 pt-12 border-t border-white/10">
        <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
        <div className="font-telugu text-2xl opacity-60" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
      </div>
    </div>
  );

  const ForestLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between items-center text-center">
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="font-display text-3xl tracking-[0.5em]" style={{ color: currentTheme.colors.accent }}>{data.churchName.split(' ')[0]}</div>
        <div className="font-telugu text-2xl font-bold" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
      </div>
      <div className="flex flex-col items-center gap-10 w-full">
        <div className="w-64 h-80 rounded-[40px] overflow-hidden shadow-2xl">
          <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
        </div>
        <div className="space-y-6 w-full">
          <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
          <div className="font-serif text-3xl italic opacity-60 mx-auto max-w-[90%]" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-10 w-full">
        <div className="space-y-6">
          <div className="font-telugu text-5xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          <div className="space-y-3">
            <div className="font-telugu text-2xl" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
            <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
          </div>
        </div>
        <div className="text-center">
          <div className="font-display text-[11rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="font-display text-3xl tracking-widest uppercase" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
        </div>
      </div>
    </div>
  );

  const NeonLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between items-center text-center">
      <div className="space-y-4">
        <div className="font-display text-2xl tracking-[1em] blur-[1px]" style={{ color: currentTheme.colors.accent }}>{data.churchName.split(' ')[0]}</div>
        <div className="font-telugu text-4xl font-black" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
      </div>
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-3xl opacity-50" style={{ backgroundColor: currentTheme.colors.accent }} />
        <div className="w-80 h-80 rounded-full overflow-hidden border-[6px] relative z-10" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
        </div>
      </div>
      <div className="space-y-10">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="font-telugu font-black leading-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
        <div className="font-serif text-3xl italic opacity-60 mx-auto max-w-[90%]" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
        <div className="font-display text-[12rem] font-black leading-none" style={{ color: currentTheme.colors.accent, textShadow: `0 0 40px ${currentTheme.colors.glow}` }}>{data.day}</div>
        <div className="font-display text-3xl tracking-[0.5em] uppercase" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
      </div>
      <div className="w-full flex flex-col items-center gap-6 pt-12 border-t border-white/10">
        <div className="font-telugu text-4xl font-black" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
        <div className="font-telugu text-2xl opacity-60" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
      </div>
    </div>
  );

  const EarthyLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between items-center text-center">
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="space-y-4">
          <div className="font-display text-2xl tracking-[0.3em]" style={{ color: currentTheme.colors.accent }}>{data.churchName}</div>
          <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
        </div>
        <div className="font-display text-[10rem] font-black" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-12 w-full">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
        <div className="w-full h-96 rounded-[40px] overflow-hidden border-[6px]" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
        </div>
        <div className="font-serif text-3xl italic opacity-60 mx-auto max-w-[90%]" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
      </div>
      <div className="flex flex-col items-center gap-6 border-t border-white/10 pt-12 w-full">
        <div className="space-y-4">
          <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          <div className="font-telugu text-2xl opacity-70" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
        </div>
        <div className="text-center space-y-4">
          <div className="font-display text-3xl tracking-widest uppercase" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
          <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
        </div>
      </div>
    </div>
  );

  const SlateLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between items-center text-center">
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="font-display text-[12rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
        <div className="space-y-4">
          <div className="font-display text-4xl font-black tracking-[0.5em]" style={{ color: currentTheme.colors.accent }}>{data.churchName.split(' ')[0]}</div>
          <div className="font-telugu text-2xl opacity-70" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
          <div className="font-display text-2xl tracking-widest uppercase opacity-60" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-12 w-full">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
        <div className="w-full h-3 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" style={{ backgroundColor: currentTheme.colors.accent }} />
        <div className="font-serif text-3xl italic opacity-50 mx-auto max-w-[90%]" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
      </div>
      <div className="flex flex-col items-center gap-10 w-full">
        <div className="w-48 h-48 rounded-full overflow-hidden border-[6px]" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover" style={pastorImageStyle} alt="Pastor" />
        </div>
        <div className="space-y-6 w-full">
          <div className="space-y-4">
            <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
            <div className="font-telugu text-2xl opacity-60" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
          </div>
          <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
        </div>
      </div>
    </div>
  );

  const RoseLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between items-center text-center">
      <div className="space-y-4">
        <div className="font-display text-2xl tracking-[0.8em]" style={{ color: currentTheme.colors.accent }}>{data.churchName}</div>
        <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
      </div>
      <div className="w-80 h-[450px] rounded-[50px] overflow-hidden border-[6px] shadow-2xl" style={{ borderColor: currentTheme.colors.accent }}>
        <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
      </div>
      <div className="space-y-8">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
        <div className="font-serif text-3xl italic opacity-60 mx-auto max-w-[90%]" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
        <div className="font-display text-4xl tracking-widest uppercase" style={{ color: currentTheme.colors.accent }}>{data.month} {data.day}, {data.year}</div>
      </div>
      <div className="w-full flex flex-col items-center gap-4 pt-12 border-t border-white/10">
        <div className="space-y-4 text-center">
          <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          <div className="font-telugu text-2xl opacity-60" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
        </div>
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
      </div>
    </div>
  );

  const AmberLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between items-center text-center">
      <div className="flex flex-col items-center gap-10 w-full">
        <div className="font-display text-[10rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
        <div className="w-48 h-48 rounded-full overflow-hidden border-[6px]" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover" style={pastorImageStyle} alt="Pastor" />
        </div>
      </div>
      <div className="space-y-10 w-full">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="font-display text-2xl tracking-[0.5em]" style={{ color: currentTheme.colors.accent }}>{data.churchName}</div>
        <div className="font-telugu text-2xl opacity-70" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
        <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
        <div className="font-serif text-3xl italic opacity-60 mx-auto max-w-[90%]" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
      </div>
      <div className="flex flex-col items-center gap-8 pt-12 border-t border-white/10 w-full">
        <div className="space-y-4">
          <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          <div className="font-telugu text-2xl opacity-70" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
        </div>
        <div className="space-y-4">
          <div className="font-display text-4xl tracking-widest uppercase" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
          <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
        </div>
      </div>
    </div>
  );

  const TealLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between items-center text-center">
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="font-display text-4xl font-black tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.churchName.split(' ')[0]}</div>
        <div className="font-telugu text-2xl opacity-60" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
        <div className="font-display text-2xl tracking-widest uppercase opacity-60" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-12 w-full">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="relative">
          <div className="absolute -inset-6 border-[6px] opacity-30" style={{ borderColor: currentTheme.colors.accent }} />
          <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
        </div>
        <div className="flex flex-col items-center gap-10">
          <div className="w-full h-80 rounded-3xl overflow-hidden shadow-2xl">
            <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
          </div>
          <div className="font-serif text-3xl italic opacity-60 mx-auto max-w-[90%]" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-8 w-full">
        <div className="space-y-6">
          <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          <div className="font-telugu text-2xl opacity-70" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
        </div>
        <div className="space-y-4">
          <div className="font-display text-[10rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
        </div>
      </div>
    </div>
  );

  const CyberpunkLayout = () => (
    <div className="w-full h-full flex flex-col p-24 z-20 justify-between relative overflow-hidden text-center items-center">
      <div className="absolute top-0 left-0 w-full h-3 bg-cyan-400 shadow-[0_0_30px_#00f2ff]" />
      <div className="flex flex-col items-center gap-10 w-full">
        <div className="space-y-6">
          <div className="font-display text-7xl font-black italic tracking-tighter" style={{ color: currentTheme.colors.accent }}>{data.churchName.split(' ')[0]}_SYSTEM</div>
          <div className="font-telugu text-5xl opacity-70" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
        </div>
        <div className="font-display text-4xl tracking-widest border-[6px] px-8 py-6" style={{ borderColor: currentTheme.colors.accent, color: currentTheme.colors.accent }}>
          {data.month} {data.day} // {data.year}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-20 w-full">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="font-telugu font-black leading-none tracking-tighter break-words" style={{ color: currentTheme.colors.text, textShadow: `6px 6px 0 ${currentTheme.colors.accentMuted}`, fontSize: `${data.teluguFontSize}px` }}>
          {renderTeluguVerse()}
        </div>
        <div className="w-full h-[6px] bg-white/20 relative">
          <div className="absolute top-0 left-0 h-full w-1/2" style={{ backgroundColor: currentTheme.colors.accent }} />
        </div>
        <div className="font-serif text-3xl italic opacity-50 mx-auto max-w-[90%]" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
      </div>
      <div className="flex flex-col items-center gap-12 w-full">
        <div className="w-96 h-96 border-[10px] overflow-hidden" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover object-center grayscale contrast-125" style={pastorImageStyle} alt="Pastor" />
        </div>
        <div className="space-y-8 w-full">
          <div className="space-y-6">
            <div className="font-telugu text-7xl font-black uppercase" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
            <div className="font-telugu text-4xl opacity-60" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
          </div>
          <div className="font-display text-5xl font-black tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
        </div>
      </div>
    </div>
  );

  const MonochromeLayout = () => (
    <div className="w-full h-full flex flex-col p-20 z-20 justify-between bg-black items-center text-center">
      <div className="border-b-[6px] pb-10 flex flex-col items-center gap-4 w-full" style={{ borderColor: currentTheme.colors.accent }}>
        <div className="font-display text-7xl font-black tracking-tighter">{data.churchName.split(' ')[0]}</div>
        <div className="font-telugu text-3xl font-black tracking-widest uppercase">{data.churchNameTelugu}</div>
        <div className="font-display text-2xl tracking-[0.5em] uppercase opacity-60">{data.month} {data.year}</div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-16 w-full items-center">
        <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 mb-8" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover object-center grayscale" style={pastorImageStyle} alt="Pastor" />
        </div>
        <div className="font-telugu font-black leading-none tracking-tighter break-words" style={{ fontSize: `${data.teluguFontSize}px` }}>
          {renderTeluguVerse()}
        </div>
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="w-48 h-3 bg-white" />
          <div className="font-display text-4xl font-black tracking-widest uppercase">{data.scriptureReference}</div>
        </div>
        <div className="font-serif text-3xl italic opacity-50 leading-relaxed max-w-6xl mx-auto">
          {data.englishVerse}
        </div>
      </div>
      <div className="flex flex-col items-center gap-10 pt-12 border-t-[6px] w-full" style={{ borderColor: currentTheme.colors.accent }}>
        <div className="space-y-4">
          <div className="font-telugu text-5xl font-black">{data.pastorName}</div>
          <div className="font-telugu text-2xl opacity-60">{data.churchAddress}</div>
        </div>
        <div className="text-center space-y-4">
          <div className="font-display text-[14rem] font-black leading-none">{data.day}</div>
          <div className="font-display text-2xl tracking-widest uppercase">{data.phone}</div>
        </div>
      </div>
    </div>
  );

  const PaperLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between relative items-center text-center">
      <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]" />
      <div className="text-center space-y-6 border-b-[3px] pb-10 relative z-10 w-full" style={{ borderColor: currentTheme.colors.accent }}>
        <div className="font-display text-2xl tracking-[0.8em] uppercase" style={{ color: currentTheme.colors.accent }}>{data.churchName}</div>
        <div className="font-telugu text-4xl font-bold opacity-80" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-16 relative z-10 w-full items-center">
        <div className="flex flex-col items-center gap-10">
          <div className="w-80 h-80 rounded-3xl overflow-hidden border-[6px] shadow-2xl rotate-[-2deg]" style={{ borderColor: currentTheme.colors.accent }}>
            <img src={pastorImage} className="w-full h-full object-cover object-center sepia-[0.5]" style={pastorImageStyle} alt="Pastor" />
          </div>
          <div className="space-y-6">
            <div className="font-display text-[10rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
            <div className="font-display text-3xl tracking-widest uppercase opacity-60" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
          </div>
        </div>
        <div className="space-y-10 w-full">
          <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
          <div className="font-serif text-3xl italic opacity-70 border-y-[3px] py-6" style={{ borderColor: currentTheme.colors.accent, color: currentTheme.colors.text }}>{data.englishVerse}</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-8 pt-10 border-t-[3px] relative z-10 w-full" style={{ borderColor: currentTheme.colors.accent }}>
        <div className="space-y-4">
          <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          <div className="font-telugu text-2xl opacity-70" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
        </div>
        <div className="space-y-4">
          <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
          <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        </div>
      </div>
    </div>
  );

  const ModernistLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between bg-white text-black items-center text-center">
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="font-display text-2xl tracking-[0.5em] uppercase mb-4">{data.churchName}</div>
        <div className="font-telugu text-4xl font-black mb-6">{data.churchNameTelugu}</div>
        <div className="font-display text-[11rem] font-black leading-none tracking-tighter" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
        <div className="space-y-4">
          <div className="font-display text-3xl font-black tracking-widest uppercase">{data.month}</div>
          <div className="font-display text-2xl tracking-widest opacity-40">{data.year}</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-12 w-full items-center">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="font-telugu font-black leading-none tracking-tighter uppercase break-words" style={{ fontSize: `${data.teluguFontSize}px` }}>
          {renderTeluguVerse()}
        </div>
        <div className="w-48 h-6" style={{ backgroundColor: currentTheme.colors.accent }} />
        <div className="font-serif text-3xl italic opacity-40 leading-relaxed max-w-5xl mx-auto">
          {data.englishVerse}
        </div>
      </div>
      <div className="flex flex-col items-center gap-10 w-full">
        <div className="w-56 h-56 bg-gray-100 overflow-hidden">
          <img src={pastorImage} className="w-full h-full object-cover object-center grayscale" style={pastorImageStyle} alt="Pastor" />
        </div>
        <div className="space-y-6 w-full">
          <div className="space-y-4">
            <div className="font-telugu text-4xl font-black uppercase" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
            <div className="font-telugu text-2xl opacity-40">{data.churchAddress}</div>
          </div>
          <div className="font-display text-2xl font-black tracking-widest">{data.phone}</div>
        </div>
      </div>
    </div>
  );

  const BotanicalLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between items-center text-center">
      <div className="space-y-6 w-full">
        <div className="font-serif text-3xl tracking-[0.5em] uppercase italic opacity-60" style={{ color: currentTheme.colors.text }}>{data.churchName.split(' ')[0]}</div>
        <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
      </div>
      <div className="relative">
        <div className="absolute -inset-16 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full fill-current" style={{ color: currentTheme.colors.accent }}>
            <path d="M100,20 C120,60 180,80 180,120 C180,160 140,180 100,180 C60,180 20,160 20,120 C20,80 80,60 100,20" />
          </svg>
        </div>
        <div className="w-80 h-[450px] rounded-full overflow-hidden border-[6px] shadow-2xl relative z-10" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
        </div>
      </div>
      <div className="space-y-10 w-full">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="font-telugu font-black leading-tight break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
        <div className="font-serif text-3xl italic opacity-60 max-w-5xl mx-auto" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
      </div>
      <div className="w-full flex flex-col items-center gap-10 pt-10 border-t border-black/5">
        <div className="space-y-4">
          <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          <div className="font-telugu text-2xl opacity-60" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
        </div>
        <div className="text-center">
          <div className="font-display text-[10rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="font-display text-2xl tracking-widest uppercase opacity-60" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
          <div className="font-display text-2xl tracking-widest uppercase opacity-60" style={{ color: currentTheme.colors.text }}>{data.phone}</div>
        </div>
      </div>
    </div>
  );

  const ArchitecturalLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between relative overflow-hidden items-center text-center">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]" />
      <div className="flex flex-col items-center gap-6 border-b-[3px] pb-10 relative z-10 w-full" style={{ borderColor: currentTheme.colors.accent }}>
        <div className="space-y-4">
          <div className="font-display text-4xl font-black tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.churchName.split(' ')[0]}.ARCH</div>
          <div className="font-telugu text-2xl opacity-70" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
        </div>
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>REF: {data.scriptureReference}</div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-12 relative z-10 w-full items-center">
        <div className="font-telugu font-black leading-none tracking-tighter border-y-[10px] py-8 break-words" style={{ borderColor: currentTheme.colors.accent, color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>
          {renderTeluguVerse()}
        </div>
        <div className="font-serif text-3xl italic opacity-50 leading-relaxed max-w-6xl mx-auto">
          {data.englishVerse}
        </div>
      </div>
      <div className="flex flex-col items-center gap-10 relative z-10 w-full">
        <div className="w-full h-80 bg-white/5 border-[3px] p-3" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover object-center grayscale" style={pastorImageStyle} alt="Pastor" />
        </div>
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="text-center">
            <div className="font-display text-[11rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
            <div className="font-display text-3xl tracking-widest uppercase opacity-60" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
          </div>
          <div className="space-y-4">
            <div className="font-telugu text-4xl font-black" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
            <div className="font-telugu text-2xl opacity-60" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
            <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>TEL: {data.phone}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const CelestialLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between items-center text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      <div className="space-y-6 w-full">
        <div className="font-display text-2xl tracking-[1.2em] opacity-60" style={{ color: currentTheme.colors.accent }}>{data.churchName.split(' ')[0]}</div>
        <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
      </div>
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse" style={{ backgroundColor: currentTheme.colors.accent }} />
        <div className="w-80 h-80 rounded-full overflow-hidden border-[6px] relative z-10 shadow-[0_0_60px_rgba(255,215,0,0.3)]" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
        </div>
      </div>
      <div className="space-y-10 w-full">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="font-telugu font-black leading-tight drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
        <div className="font-serif text-3xl italic opacity-60 max-w-5xl mx-auto" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
      </div>
      <div className="w-full flex flex-col items-center gap-10 pt-10 border-t border-white/10">
        <div className="text-center">
          <div className="font-display text-[10rem] font-black leading-none" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="font-display text-3xl tracking-widest uppercase opacity-60" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
        </div>
        <div className="space-y-4">
          <div className="font-telugu text-4xl font-bold" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
          <div className="font-telugu text-2xl opacity-60" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
          <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
        </div>
      </div>
    </div>
  );

  const RetroLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between relative overflow-hidden items-center text-center">
      <div className="absolute bottom-0 left-0 w-full h-[40%] opacity-20 bg-[linear-gradient(transparent_0%,#ff0055_100%),repeating-linear-gradient(90deg,transparent_0%,transparent_5%,rgba(255,255,255,0.1)_5.1%,rgba(255,255,255,0.1)_5.2%)]" />
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="font-display text-6xl font-black italic tracking-tighter drop-shadow-[6px_6px_0_#ff00ff]" style={{ color: currentTheme.colors.accent }}>RETRO_{data.churchName.split(' ')[0]}</div>
        <div className="font-telugu text-3xl font-light tracking-widest">{data.churchNameTelugu}</div>
        <div className="space-y-2">
          <div className="font-display text-2xl font-black tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.month} {data.year}</div>
          <div className="font-display text-xl opacity-60" style={{ color: currentTheme.colors.text }}>VOL. {data.day}</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-12 w-full items-center">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        <div className="font-telugu font-black leading-none tracking-tighter drop-shadow-[10px_10px_0_#2b0057] break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>
          {renderTeluguVerse()}
        </div>
        <div className="font-serif text-3xl italic opacity-70 bg-black/40 p-6" style={{ color: currentTheme.colors.text }}>{data.englishVerse}</div>
      </div>
      <div className="flex flex-col items-center gap-10 w-full">
        <div className="w-72 h-96 border-[10px] shadow-[20px_20px_0_#ff0055]" style={{ borderColor: currentTheme.colors.accent }}>
          <img src={pastorImage} className="w-full h-full object-cover object-center contrast-150 brightness-110" style={pastorImageStyle} alt="Pastor" />
        </div>
        <div className="space-y-8 w-full">
          <div className="font-display text-[12rem] font-black leading-none opacity-20" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
          <div className="space-y-4">
            <div className="font-telugu text-5xl font-black italic" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
            <div className="font-telugu text-2xl opacity-70" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
            <div className="font-display text-2xl font-black tracking-[0.3em]" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const ZenLayout = () => (
    <div className="w-full h-full flex flex-col p-20 z-20 justify-between items-center text-center bg-white text-black">
      <div className="w-32 h-[1px] bg-black/10" />
      <div className="space-y-8">
        <div className="font-display text-2xl tracking-[1em] opacity-30">{data.churchName.split(' ')[0]}</div>
        <div className="font-telugu text-4xl font-light tracking-widest">{data.churchNameTelugu}</div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-16">
        <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.text }}>{data.scriptureReference}</div>
        <div className="font-telugu font-light leading-relaxed tracking-widest break-words" style={{ fontSize: `${data.teluguFontSize}px` }}>
          {renderTeluguVerse()}
        </div>
        <div className="w-20 h-[1px] bg-black/20 self-center" />
        <div className="font-serif text-3xl italic opacity-30 max-w-5xl mx-auto leading-relaxed">
          {data.englishVerse}
        </div>
      </div>
      <div className="space-y-12">
        <div className="w-48 h-48 rounded-full overflow-hidden grayscale opacity-80 mx-auto">
          <img src={pastorImage} className="w-full h-full object-cover object-center" style={pastorImageStyle} alt="Pastor" />
        </div>
        <div className="space-y-4">
          <div className="font-telugu text-4xl font-light tracking-widest">{data.pastorName}</div>
          <div className="font-telugu text-2xl opacity-60">{data.churchAddress}</div>
          <div className="font-display text-2xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
          <div className="font-display text-2xl tracking-[0.5em] opacity-20">{data.day} . {data.month} . {data.year}</div>
        </div>
      </div>
      <div className="w-32 h-[1px] bg-black/10" />
    </div>
  );

  const IndustrialLayout = () => (
    <div className="w-full h-full flex flex-col p-16 z-20 justify-between relative overflow-hidden items-center text-center">
      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      <div className="flex flex-col items-center gap-6 border-y-[10px] py-10 w-full" style={{ borderColor: currentTheme.colors.accent }}>
        <div className="space-y-4">
          <div className="font-display text-5xl font-black tracking-tighter" style={{ color: currentTheme.colors.text }}>{data.churchName.split(' ')[0]}_IND</div>
          <div className="font-telugu text-2xl opacity-60" style={{ color: currentTheme.colors.text }}>{data.churchNameTelugu}</div>
        </div>
        <div className="font-display text-[8rem] font-black leading-none opacity-20" style={{ color: currentTheme.colors.text }}>{data.day}</div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-12 w-full items-center">
        <div className="font-telugu font-black leading-none tracking-tighter uppercase break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>
          {renderTeluguVerse()}
        </div>
        <div className="flex flex-col items-center gap-10 w-full">
          <div className="w-full h-6 bg-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-full" style={{ backgroundColor: currentTheme.colors.accent }} />
          </div>
          <div className="font-display text-2xl font-black tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.scriptureReference}</div>
        </div>
        <div className="font-serif text-3xl italic opacity-40 leading-relaxed max-w-6xl mx-auto">
          {data.englishVerse}
        </div>
      </div>
      <div className="flex flex-col items-center gap-10 w-full">
        <div className="w-full h-96 border-[16px] border-zinc-800 relative">
          <img src={pastorImage} className="w-full h-full object-cover object-center grayscale contrast-125" style={pastorImageStyle} alt="Pastor" />
          <div className="absolute top-6 right-6 bg-black/80 px-6 py-3 font-display text-sm tracking-widest" style={{ color: currentTheme.colors.accent }}>PRT_01</div>
        </div>
        <div className="space-y-8 w-full">
          <div className="space-y-4">
            <div className="font-telugu text-5xl font-black uppercase" style={{ color: currentTheme.colors.accent }}>{data.pastorName}</div>
            <div className="font-telugu text-2xl opacity-50" style={{ color: currentTheme.colors.text }}>{data.churchAddress}</div>
          </div>
          <div className="space-y-4">
            <div className="font-display text-2xl tracking-widest opacity-40" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
            <div className="font-display text-3xl font-black tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.phone}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Placeholder for other layouts to keep file size manageable
  const DefaultLayout = () => (
    <div className="w-full h-full flex flex-col items-center justify-center p-20 z-20">
      <div className="text-center space-y-8">
        <div className="font-display text-4xl tracking-widest" style={{ color: currentTheme.colors.accent }}>{data.churchName}</div>
        <div className="font-telugu font-black break-words" style={{ color: currentTheme.colors.text, fontSize: `${data.teluguFontSize}px` }}>{renderTeluguVerse()}</div>
        <div className="font-display text-9xl font-black" style={{ color: currentTheme.colors.accent }}>{data.day}</div>
        <div className="font-display text-4xl uppercase" style={{ color: currentTheme.colors.text }}>{data.month} {data.year}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center gap-8 bg-zinc-950 text-white">
      <div className="w-full max-w-5xl bg-zinc-900/80 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-2xl">
        <h1 className="font-display text-xl sm:text-2xl text-gold-bright text-center tracking-[0.2em] sm:tracking-widest mb-6 border-b border-white/10 pb-4 flex items-center justify-center gap-3">
          ✦ SIYONU POSTER STUDIO ✦
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold-muted font-display">
                <Palette size={12} /> Select Template & Theme
              </label>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gold-muted scrollbar-track-white/5">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setCurrentTheme(theme)}
                    className={cn(
                      "flex-shrink-0 px-4 py-3 rounded-lg text-[10px] font-display tracking-wider border transition-all flex flex-col items-center gap-2 min-w-[120px]",
                      currentTheme.id === theme.id 
                        ? "bg-white/10 border-gold-bright text-gold-bright shadow-[0_0_15px_rgba(240,192,96,0.2)]" 
                        : "bg-black/20 border-white/5 text-zinc-400 hover:border-white/20"
                    )}
                  >
                    <div className={cn("w-full h-6 rounded bg-gradient-to-br", theme.colors.bg)} />
                    <span className="truncate w-full text-center">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Church Name (English)</label>
                <input name="churchName" value={data.churchName} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-gold-bright outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Church Name (Telugu)</label>
                <input name="churchNameTelugu" value={data.churchNameTelugu} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-gold-bright outline-none" />
              </div>
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

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Day</label>
                <select
                  name="day"
                  value={data.day}
                  onChange={handleInputChange}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-center text-sm focus:border-gold-bright outline-none appearance-none cursor-pointer hover:bg-black/60 transition-colors"
                >
                  {DAYS.map(day => (
                    <option key={day} value={day} className="bg-zinc-900">{day}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Month</label>
                <select
                  name="month"
                  value={data.month}
                  onChange={handleInputChange}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-center text-sm focus:border-gold-bright outline-none appearance-none cursor-pointer hover:bg-black/60 transition-colors"
                >
                  {MONTHS.map(month => (
                    <option key={month} value={month} className="bg-zinc-900">{month}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gold-muted font-display">Year</label>
                <select
                  name="year"
                  value={data.year}
                  onChange={handleInputChange}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-center text-sm focus:border-gold-bright outline-none appearance-none cursor-pointer hover:bg-black/60 transition-colors"
                >
                  {YEARS.map(year => (
                    <option key={year} value={year} className="bg-zinc-900">{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gold-muted font-display">
                <div className="flex items-center gap-2">
                  <span>Main Text Size</span>
                  <button 
                    onClick={() => setData(prev => ({ ...prev, teluguFontSize: 60 }))}
                    className="text-[8px] px-1.5 py-0.5 rounded border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    RESET
                  </button>
                </div>
                <span className="text-gold-bright">{data.teluguFontSize}px</span>
              </label>
              <div className="flex items-center gap-3">
                <TypeIcon size={14} className="text-zinc-500" />
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={data.teluguFontSize}
                  onChange={(e) => setData(prev => ({ ...prev, teluguFontSize: parseInt(e.target.value) }))}
                  className="flex-1 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-gold-bright"
                />
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

              <div className="space-y-4 pt-2 border-t border-white/5">
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gold-muted font-display">
                    <span>Portrait Zoom</span>
                    <span className="text-gold-bright">{Math.round(data.pastorImageScale * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.01"
                    value={data.pastorImageScale}
                    onChange={(e) => setData(prev => ({ ...prev, pastorImageScale: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-gold-bright"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gold-muted font-display">
                      <span>Move X</span>
                      <span className="text-gold-bright">{data.pastorImageX}px</span>
                    </label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={data.pastorImageX}
                      onChange={(e) => setData(prev => ({ ...prev, pastorImageX: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-gold-bright"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gold-muted font-display">
                      <span>Move Y</span>
                      <span className="text-gold-bright">{data.pastorImageY}px</span>
                    </label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={data.pastorImageY}
                      onChange={(e) => setData(prev => ({ ...prev, pastorImageY: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-gold-bright"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setData(prev => ({ ...prev, pastorImageScale: 1, pastorImageX: 0, pastorImageY: 0 }))}
                  className="w-full py-1.5 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border border-white/5 rounded"
                >
                  Reset Alignment
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
              className="group relative flex items-center justify-center gap-3 bg-gradient-to-br from-gold-muted to-gold-bright text-black font-display font-bold py-4 px-12 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(240,192,96,0.3)] disabled:opacity-50 w-full sm:w-auto"
            >
              {isExporting ? <RefreshCw className="animate-spin" /> : <Download size={20} />}
              {isExporting ? "PREPARING..." : "EXPORT POSTER (4K PNG)"}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl flex flex-col items-center gap-4 pb-20">
        <div className="flex items-center gap-2 text-gold-muted font-display text-[10px] uppercase tracking-[0.2em]">
          <div className="w-2 h-2 rounded-full bg-gold-bright animate-pulse" />
          Live Preview
        </div>
        
        <div 
          ref={previewContainerRef}
          className="w-full relative flex justify-center items-start overflow-hidden rounded-xl shadow-2xl border border-white/5"
          style={{ height: `${1260 * scale}px` }}
        >
          <div 
            ref={posterRef} 
            className={cn("w-[690px] h-[1260px] relative overflow-hidden flex flex-col items-center shrink-0 bg-black origin-top")}
            style={{ 
              fontFamily: '"Inter", "Noto Sans Telugu", sans-serif',
              transform: `scale(${scale})`
            }}
          >
            <div className={cn("absolute inset-0 bg-gradient-to-br transition-colors duration-700", currentTheme.colors.bg)} />
            <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:54px_54px]" />
            <div className="absolute inset-[20px] border rounded-sm z-10 opacity-30" style={{ borderColor: currentTheme.colors.accent }} />
            
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
            {currentTheme.layout === 'royal' && <RoyalLayout />}
            {currentTheme.layout === 'ocean' && <OceanLayout />}
            {currentTheme.layout === 'sunset' && <SunsetLayout />}
            {currentTheme.layout === 'forest' && <ForestLayout />}
            {currentTheme.layout === 'neon' && <NeonLayout />}
            {currentTheme.layout === 'earthy' && <EarthyLayout />}
            {currentTheme.layout === 'slate' && <SlateLayout />}
            {currentTheme.layout === 'rose' && <RoseLayout />}
            {currentTheme.layout === 'amber' && <AmberLayout />}
            {currentTheme.layout === 'teal' && <TealLayout />}
            {currentTheme.layout === 'cyberpunk' && <CyberpunkLayout />}
            {currentTheme.layout === 'monochrome' && <MonochromeLayout />}
            {currentTheme.layout === 'paper' && <PaperLayout />}
            {currentTheme.layout === 'modernist' && <ModernistLayout />}
            {currentTheme.layout === 'botanical' && <BotanicalLayout />}
            {currentTheme.layout === 'architectural' && <ArchitecturalLayout />}
            {currentTheme.layout === 'celestial' && <CelestialLayout />}
            {currentTheme.layout === 'retro' && <RetroLayout />}
            {currentTheme.layout === 'zen' && <ZenLayout />}
            {currentTheme.layout === 'industrial' && <IndustrialLayout />}
            {!['split', 'magazine', 'traditional', 'minimalist', 'glassmorphism', 'brutalist', 'vintage', 'asymmetric', 'hero', 'grid', 'royal', 'ocean', 'sunset', 'forest', 'neon', 'earthy', 'slate', 'rose', 'amber', 'teal', 'cyberpunk', 'monochrome', 'paper', 'modernist', 'botanical', 'architectural', 'celestial', 'retro', 'zen', 'industrial'].includes(currentTheme.layout) && <DefaultLayout />}

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
  );
}

export default App;
