import { useRef, useEffect, useState } from "react";

export interface VideoSettings {
  src: string;
  startTime?: number;
  endTime?: number;
  loop?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  posterImage?: string; // Optional custom poster image path
  // New responsive positioning options
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  responsivePosition?: 
    | {
        x: number; // -1 to 1 (left to right)
        y: number; // -1 to 1 (top to bottom)
      }
    | {
        xs?: { x: number; y: number };
        sm?: { x: number; y: number };
        md?: { x: number; y: number };
        lg?: { x: number; y: number };
        xl?: { x: number; y: number };
        '2xl'?: { x: number; y: number };
      };
  // True responsive positioning with viewport units
  responsivePositionVW?: {
    x: string; // e.g., "-72%"
    y: string; // e.g., "calc(51px + 2vw)" for truly responsive
  };
  // Alternative: Use CSS transforms for problematic videos
  transformPosition?: {
    translateX: string; // e.g., "-50px" or "-10vw"
    translateY: string; // e.g., "20px" or "5vh"
  };
}

interface VideoPlayerProps {
  settings: VideoSettings;
}

const VideoPlayer = ({ settings }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('md');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [posterError, setPosterError] = useState(false);

  // Get the poster image path by replacing .mp4 with .png in the video src
  const posterImagePath = settings.posterImage || settings.src.replace('.mp4', '.png').replace('/videos/', '/images/');

  // Breakpoint detection for responsive positioning
  useEffect(() => {
    const detectBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 425) setCurrentBreakpoint('xs');       // xs: < 425px (includes 320px)
      else if (width < 768) setCurrentBreakpoint('sm');  // sm: 425px - 767px
      else if (width < 1024) setCurrentBreakpoint('md'); // md: 768px - 1023px
      else if (width < 1440) setCurrentBreakpoint('lg'); // lg: 1024px - 1439px
      else if (width < 2560) setCurrentBreakpoint('xl'); // xl: 1440px - 2559px
      else setCurrentBreakpoint('2xl');                  // 2xl: 2560px+
    };

    detectBreakpoint();
    window.addEventListener('resize', detectBreakpoint);
    
    return () => window.removeEventListener('resize', detectBreakpoint);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      if (settings.startTime !== undefined) {
        video.currentTime = settings.startTime;
      }
    };

    const handlePlaying = () => {
      // Video has started playing
      setIsVideoPlaying(true);
    };

    const handleTimeUpdate = () => {
      if (settings.endTime !== undefined && settings.startTime !== undefined) {
        if (video.currentTime >= settings.endTime) {
          video.currentTime = settings.startTime;
        }
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('playing', handlePlaying);
    
    if (settings.loop && settings.startTime !== undefined && settings.endTime !== undefined) {
      video.addEventListener('timeupdate', handleTimeUpdate);
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [settings]);

  // Calculate responsive object position or transform
  const getResponsiveStyle = () => {
    let style = { ...settings.style };
    
    // Priority 1: Use CSS transforms (for problematic videos)
    if (settings.transformPosition) {
      const { translateX, translateY } = settings.transformPosition;
      style.transform = `${style.transform || ''} translateX(${translateX}) translateY(${translateY})`.trim();
      style.objectPosition = 'center center'; // Keep object position neutral
    }
    // Priority 2: Use viewport-based responsive positioning
    else if (settings.responsivePositionVW) {
      style.objectPosition = `${settings.responsivePositionVW.x} ${settings.responsivePositionVW.y}`;
    }
    // Priority 3: Use coordinate-based responsive positioning
    else if (settings.responsivePosition) {
      // Check if it's the old format (simple x, y) or new format (breakpoints)
      const isOldFormat = 'x' in settings.responsivePosition && 'y' in settings.responsivePosition;
      
      if (isOldFormat) {
        // Handle old format
        const { x, y } = settings.responsivePosition as { x: number; y: number };
        
        // For scaled videos, use calc() with viewport units for true responsiveness
        if (settings.className?.includes('scale-[2]')) {
          const xCalc = x < 0 ? `calc(${50 + (x * 50)}% - ${Math.abs(x) * 2}vw)` : `calc(${50 + (x * 50)}% + ${x * 2}vw)`;
          const yCalc = y < 0 ? `calc(${50 + (y * 50)}% - ${Math.abs(y) * 3}vh)` : `calc(${50 + (y * 50)}% + ${y * 3}vh)`;
          style.objectPosition = `${xCalc} ${yCalc}`;
        } else {
          // Standard percentage positioning for non-scaled videos
          const xPercent = ((x + 1) / 2) * 100;
          const yPercent = ((y + 1) / 2) * 100;
          style.objectPosition = `${xPercent}% ${yPercent}%`;
        }
      } else {
        // Handle new responsive format with breakpoints
        const responsivePos = settings.responsivePosition as {
          xs?: { x: number; y: number };
          sm?: { x: number; y: number };
          md?: { x: number; y: number };
          lg?: { x: number; y: number };
          xl?: { x: number; y: number };
          '2xl'?: { x: number; y: number };
        };
        
        // Get position for current breakpoint with fallback cascade
        const getPositionForBreakpoint = (breakpoint: string) => {
          const breakpointOrder = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
          const currentIndex = breakpointOrder.indexOf(breakpoint);
          
          // Try current breakpoint and fall back to smaller ones
          for (let i = currentIndex; i < breakpointOrder.length; i++) {
            const bp = breakpointOrder[i] as keyof typeof responsivePos;
            if (responsivePos[bp]) {
              return responsivePos[bp];
            }
          }
          
          // If no smaller breakpoint found, try larger ones
          for (let i = currentIndex - 1; i >= 0; i--) {
            const bp = breakpointOrder[i] as keyof typeof responsivePos;
            if (responsivePos[bp]) {
              return responsivePos[bp];
            }
          }
          
          return null;
        };
        
        const currentPos = getPositionForBreakpoint(currentBreakpoint);
        
        if (currentPos) {
          const { x, y } = currentPos;
          
          // For scaled videos, use calc() with viewport units for true responsiveness
          if (settings.className?.includes('scale-[2]')) {
            const xCalc = x < 0 ? `calc(${50 + (x * 50)}% - ${Math.abs(x) * 2}vw)` : `calc(${50 + (x * 50)}% + ${x * 2}vw)`;
            const yCalc = y < 0 ? `calc(${50 + (y * 50)}% - ${Math.abs(y) * 3}vh)` : `calc(${50 + (y * 50)}% + ${y * 3}vh)`;
            style.objectPosition = `${xCalc} ${yCalc}`;
          } else {
            // Standard percentage positioning for non-scaled videos
            const xPercent = ((x + 1) / 2) * 100;
            const yPercent = ((y + 1) / 2) * 100;
            style.objectPosition = `${xPercent}% ${yPercent}%`;
          }
        }
      }
    }
    
    return style;
  };

  // Special handling for problematic videos or responsive positioning
  if (settings.responsivePosition || settings.responsivePositionVW || settings.transformPosition) {
    return (
      <div ref={containerRef} className="w-full h-full overflow-hidden relative">
        {/* Poster image shown while video is loading */}
        {!isVideoPlaying && !posterError && (
          <img
            src={posterImagePath}
            alt="Video thumbnail"
            className={settings.className || "object-cover w-full h-full"}
            style={getResponsiveStyle()}
            onError={() => setPosterError(true)}
          />
        )}
        {/* Video element - hidden until it starts playing */}
        <video
          ref={videoRef}
          className={`${settings.className || "object-cover w-full h-full"} ${!isVideoPlaying ? 'opacity-0 absolute inset-0' : ''}`}
          style={getResponsiveStyle()}
          autoPlay={settings.autoPlay}
          muted={settings.muted}
          loop={settings.loop}
          playsInline={settings.playsInline}
        >
          <source src={settings.src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden relative">
      {/* Poster image shown while video is loading */}
      {!isVideoPlaying && !posterError && (
        <img
          src={posterImagePath}
          alt="Video thumbnail"
          className={settings.className || "object-cover w-full h-full"}
          style={settings.style}
          onError={() => setPosterError(true)}
        />
      )}
      {/* Video element - hidden until it starts playing */}
      <video
        ref={videoRef}
        className={`${settings.className || "object-cover w-full h-full"} ${!isVideoPlaying ? 'opacity-0 absolute inset-0' : ''}`}
        style={settings.style}
        autoPlay={settings.autoPlay}
        muted={settings.muted}
        loop={settings.loop}
        playsInline={settings.playsInline}
      >
        <source src={settings.src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
