import React, { useState, useEffect, useRef } from 'react';
import { Radar, Play, Pause, RotateCcw, Zap, Palette, Settings, Download, Upload, Eye, EyeOff } from 'lucide-react';

interface RadarConfig {
  // Basic Settings
  type: 'circular' | 'linear' | 'pulse' | 'wave' | 'globe';
  size: number;
  speed: number;
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  accentColor: string;
  glowColor: string;
  
  // Visual Effects
  numberOfRings: number;
  ringSpacing: number;
  dotCount: number;
  dotSize: number;
  lineThickness: number;
  blurAmount: number;
  opacity: number;
  
  // Animation
  rotationSpeed: number;
  pulseSpeed: number;
  pulseIntensity: number;
  fadeIn: boolean;
  fadeOut: boolean;
  fadeInDuration: number;
  fadeOutDuration: number;
  
  // Text
  searchText: string;
  foundText: string;
  textColor: string;
  textSize: number;
  showText: boolean;
  
  // Globe Specific (when type is 'globe')
  globeRotationX: number;
  globeRotationY: number;
  globeRotationSpeed: number;
  showCountries: boolean;
  showGrid: boolean;
  
  // Particles
  showParticles: boolean;
  particleCount: number;
  particleSize: number;
  particleSpeed: number;
  particleColor: string;
}

const RadarCustomizer: React.FC = () => {
  const [radarConfig, setRadarConfig] = useState<RadarConfig>({
    type: 'circular',
    size: 200,
    speed: 2,
    primaryColor: '#3B82F6',
    secondaryColor: '#60A5FA',
    backgroundColor: '#111827',
    accentColor: '#10B981',
    glowColor: '#3B82F6',
    numberOfRings: 3,
    ringSpacing: 30,
    dotCount: 8,
    dotSize: 4,
    lineThickness: 2,
    blurAmount: 0,
    opacity: 100,
    rotationSpeed: 2,
    pulseSpeed: 1,
    pulseIntensity: 20,
    fadeIn: true,
    fadeOut: true,
    fadeInDuration: 500,
    fadeOutDuration: 500,
    searchText: 'در حال جستجو...',
    foundText: 'کاربر پیدا شد!',
    textColor: '#FFFFFF',
    textSize: 16,
    showText: true,
    globeRotationX: 0,
    globeRotationY: 0,
    globeRotationSpeed: 1,
    showCountries: true,
    showGrid: true,
    showParticles: true,
    particleCount: 20,
    particleSize: 2,
    particleSpeed: 1,
    particleColor: '#60A5FA'
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showPreview, setShowPreview] = useState(true);
  const animationRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const presets = [
    {
      name: 'کلاسیک',
      config: {
        type: 'circular' as const,
        primaryColor: '#3B82F6',
        secondaryColor: '#60A5FA',
        numberOfRings: 3,
        rotationSpeed: 2,
        showParticles: false
      }
    },
    {
      name: 'مدرن',
      config: {
        type: 'pulse' as const,
        primaryColor: '#8B5CF6',
        secondaryColor: '#A78BFA',
        numberOfRings: 5,
        pulseIntensity: 30,
        showParticles: true
      }
    },
    {
      name: 'کره زمین',
      config: {
        type: 'globe' as const,
        primaryColor: '#10B981',
        secondaryColor: '#34D399',
        showCountries: true,
        showGrid: true,
        globeRotationSpeed: 1
      }
    },
    {
      name: 'موج',
      config: {
        type: 'wave' as const,
        primaryColor: '#F59E0B',
        secondaryColor: '#FCD34D',
        numberOfRings: 4,
        pulseSpeed: 2
      }
    },
    {
      name: 'خطی',
      config: {
        type: 'linear' as const,
        primaryColor: '#EF4444',
        secondaryColor: '#F87171',
        lineThickness: 3,
        dotCount: 12
      }
    }
  ];

  useEffect(() => {
    if (isPlaying && canvasRef.current) {
      drawRadarAnimation();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, radarConfig]);

  const drawRadarAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.001;

    // Clear canvas
    ctx.fillStyle = radarConfig.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply opacity
    ctx.globalAlpha = radarConfig.opacity / 100;

    // Draw based on type
    switch (radarConfig.type) {
      case 'circular':
        drawCircularRadar(ctx, centerX, centerY, time);
        break;
      case 'pulse':
        drawPulseRadar(ctx, centerX, centerY, time);
        break;
      case 'wave':
        drawWaveRadar(ctx, centerX, centerY, time);
        break;
      case 'linear':
        drawLinearRadar(ctx, centerX, centerY, time);
        break;
      case 'globe':
        drawGlobeRadar(ctx, centerX, centerY, time);
        break;
    }

    // Draw particles
    if (radarConfig.showParticles) {
      drawParticles(ctx, centerX, centerY, time);
    }

    // Draw text
    if (radarConfig.showText) {
      ctx.fillStyle = radarConfig.textColor;
      ctx.font = `${radarConfig.textSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(radarConfig.searchText, centerX, centerY + radarConfig.size / 2 + 40);
    }

    animationRef.current = requestAnimationFrame(drawRadarAnimation);
  };

  const drawCircularRadar = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
    // Draw rings
    for (let i = 0; i < radarConfig.numberOfRings; i++) {
      const radius = (i + 1) * radarConfig.ringSpacing;
      
      ctx.strokeStyle = radarConfig.primaryColor;
      ctx.lineWidth = radarConfig.lineThickness;
      ctx.globalAlpha = (radarConfig.opacity / 100) * (1 - i / radarConfig.numberOfRings);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw rotating line
    const angle = time * radarConfig.rotationSpeed;
    ctx.strokeStyle = radarConfig.secondaryColor;
    ctx.lineWidth = radarConfig.lineThickness * 2;
    ctx.globalAlpha = radarConfig.opacity / 100;

    // Add glow effect
    if (radarConfig.blurAmount > 0) {
      ctx.shadowBlur = radarConfig.blurAmount;
      ctx.shadowColor = radarConfig.glowColor;
    }

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * radarConfig.size / 2,
      centerY + Math.sin(angle) * radarConfig.size / 2
    );
    ctx.stroke();

    // Draw dots
    for (let i = 0; i < radarConfig.dotCount; i++) {
      const dotAngle = (Math.PI * 2 / radarConfig.dotCount) * i;
      const dotX = centerX + Math.cos(dotAngle) * radarConfig.size / 2;
      const dotY = centerY + Math.sin(dotAngle) * radarConfig.size / 2;
      
      ctx.fillStyle = radarConfig.accentColor;
      ctx.beginPath();
      ctx.arc(dotX, dotY, radarConfig.dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawPulseRadar = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
    const pulse = Math.sin(time * radarConfig.pulseSpeed) * radarConfig.pulseIntensity;
    
    for (let i = 0; i < radarConfig.numberOfRings; i++) {
      const radius = (i + 1) * radarConfig.ringSpacing + pulse;
      const alpha = (radarConfig.opacity / 100) * (1 - i / radarConfig.numberOfRings);
      
      ctx.strokeStyle = radarConfig.primaryColor;
      ctx.lineWidth = radarConfig.lineThickness;
      ctx.globalAlpha = alpha;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const drawWaveRadar = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
    ctx.strokeStyle = radarConfig.primaryColor;
    ctx.lineWidth = radarConfig.lineThickness;
    
    for (let i = 0; i < radarConfig.numberOfRings; i++) {
      ctx.globalAlpha = (radarConfig.opacity / 100) * (1 - i / radarConfig.numberOfRings);
      ctx.beginPath();
      
      for (let x = -radarConfig.size / 2; x <= radarConfig.size / 2; x++) {
        const y = Math.sin((x * 0.05) + time * radarConfig.speed + i) * 20;
        if (x === -radarConfig.size / 2) {
          ctx.moveTo(centerX + x, centerY + y);
        } else {
          ctx.lineTo(centerX + x, centerY + y);
        }
      }
      
      ctx.stroke();
    }
  };

  const drawLinearRadar = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
    const scanPosition = ((time * radarConfig.speed * 50) % radarConfig.size) - radarConfig.size / 2;
    
    // Draw grid
    ctx.strokeStyle = radarConfig.primaryColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    
    for (let i = -radarConfig.size / 2; i <= radarConfig.size / 2; i += 20) {
      ctx.beginPath();
      ctx.moveTo(centerX + i, centerY - radarConfig.size / 4);
      ctx.lineTo(centerX + i, centerY + radarConfig.size / 4);
      ctx.stroke();
    }
    
    // Draw scan line
    ctx.strokeStyle = radarConfig.secondaryColor;
    ctx.lineWidth = radarConfig.lineThickness * 2;
    ctx.globalAlpha = radarConfig.opacity / 100;
    
    ctx.beginPath();
    ctx.moveTo(centerX + scanPosition, centerY - radarConfig.size / 4);
    ctx.lineTo(centerX + scanPosition, centerY + radarConfig.size / 4);
    ctx.stroke();
  };

  const drawGlobeRadar = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
    const rotation = time * radarConfig.globeRotationSpeed;
    
    // Draw globe outline
    ctx.strokeStyle = radarConfig.primaryColor;
    ctx.lineWidth = radarConfig.lineThickness;
    ctx.globalAlpha = radarConfig.opacity / 100;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radarConfig.size / 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw latitude lines
    if (radarConfig.showGrid) {
      ctx.globalAlpha = 0.3;
      for (let i = 1; i < 4; i++) {
        const y = (i * radarConfig.size) / 4 - radarConfig.size / 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + y, radarConfig.size / 2 * Math.cos(y / (radarConfig.size / 2)), 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    // Draw longitude lines
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i + rotation;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, Math.abs(Math.cos(angle)) * radarConfig.size / 2, radarConfig.size / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw scanning dot
    ctx.fillStyle = radarConfig.accentColor;
    ctx.globalAlpha = radarConfig.opacity / 100;
    const dotX = centerX + Math.cos(rotation) * radarConfig.size / 3;
    const dotY = centerY + Math.sin(rotation * 0.7) * radarConfig.size / 3;
    ctx.beginPath();
    ctx.arc(dotX, dotY, radarConfig.dotSize * 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
    ctx.fillStyle = radarConfig.particleColor;
    
    for (let i = 0; i < radarConfig.particleCount; i++) {
      const angle = (Math.PI * 2 / radarConfig.particleCount) * i + time * radarConfig.particleSpeed;
      const radius = radarConfig.size / 2 + Math.sin(time + i) * 20;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.globalAlpha = (Math.sin(time * 2 + i) + 1) / 2 * (radarConfig.opacity / 100);
      ctx.beginPath();
      ctx.arc(x, y, radarConfig.particleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setRadarConfig(prev => ({
      ...prev,
      ...preset.config
    }));
    setSelectedPreset(preset.name);
  };

  const exportConfig = () => {
    const dataStr = JSON.stringify(radarConfig, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `radar-config-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          setRadarConfig(config);
        } catch (error) {
          alert('خطا در بارگذاری فایل تنظیمات');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Radar className="w-6 h-6" />
          سفارشی‌سازی انیمیشن رادار
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 ${showPreview ? 'bg-blue-600' : 'bg-gray-700'} text-white rounded-lg hover:opacity-80 transition-colors`}
            title="پیش‌نمایش"
          >
            {showPreview ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button
            onClick={exportConfig}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="دانلود تنظیمات"
          >
            <Download className="w-5 h-5" />
          </button>
          <label className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            <input type="file" accept=".json" onChange={importConfig} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview Canvas */}
        {showPreview && (
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">پیش‌نمایش</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-2 ${isPlaying ? 'bg-red-600' : 'bg-green-600'} text-white rounded-lg hover:opacity-80 transition-colors`}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setTimeout(() => setIsPlaying(true), 100);
                  }}
                  className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full"
                style={{ backgroundColor: radarConfig.backgroundColor }}
              />
            </div>
          </div>
        )}

        {/* Settings Panel */}
        <div className="space-y-4">
          {/* Presets */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">قالب‌های آماده</h3>
            <div className="grid grid-cols-3 gap-2">
              {presets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedPreset === preset.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Settings */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">تنظیمات اصلی</h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-300 text-sm">نوع انیمیشن:</label>
                <select
                  value={radarConfig.type}
                  onChange={(e) => setRadarConfig({...radarConfig, type: e.target.value as RadarConfig['type']})}
                  className="w-full bg-gray-700 text-white p-2 rounded mt-1"
                >
                  <option value="circular">دایره‌ای</option>
                  <option value="pulse">پالس</option>
                  <option value="wave">موج</option>
                  <option value="linear">خطی</option>
                  <option value="globe">کره زمین</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 text-sm">اندازه: {radarConfig.size}px</label>
                <input
                  type="range"
                  min="100"
                  max="400"
                  value={radarConfig.size}
                  onChange={(e) => setRadarConfig({...radarConfig, size: Number(e.target.value)})}
                  className="w-full mt-1"
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm">سرعت: {radarConfig.speed}</label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={radarConfig.speed}
                  onChange={(e) => setRadarConfig({...radarConfig, speed: Number(e.target.value)})}
                  className="w-full mt-1"
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm">تعداد حلقه: {radarConfig.numberOfRings}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={radarConfig.numberOfRings}
                  onChange={(e) => setRadarConfig({...radarConfig, numberOfRings: Number(e.target.value)})}
                  className="w-full mt-1"
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">رنگ‌ها</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-300 text-sm">رنگ اصلی:</label>
                <input
                  type="color"
                  value={radarConfig.primaryColor}
                  onChange={(e) => setRadarConfig({...radarConfig, primaryColor: e.target.value})}
                  className="w-full h-10 rounded mt-1 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm">رنگ ثانویه:</label>
                <input
                  type="color"
                  value={radarConfig.secondaryColor}
                  onChange={(e) => setRadarConfig({...radarConfig, secondaryColor: e.target.value})}
                  className="w-full h-10 rounded mt-1 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm">رنگ پس‌زمینه:</label>
                <input
                  type="color"
                  value={radarConfig.backgroundColor}
                  onChange={(e) => setRadarConfig({...radarConfig, backgroundColor: e.target.value})}
                  className="w-full h-10 rounded mt-1 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm">رنگ تاکید:</label>
                <input
                  type="color"
                  value={radarConfig.accentColor}
                  onChange={(e) => setRadarConfig({...radarConfig, accentColor: e.target.value})}
                  className="w-full h-10 rounded mt-1 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Effects */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">افکت‌ها</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={radarConfig.showParticles}
                  onChange={(e) => setRadarConfig({...radarConfig, showParticles: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-white">نمایش ذرات</span>
              </label>

              {radarConfig.showParticles && (
                <>
                  <div>
                    <label className="text-gray-300 text-sm">تعداد ذرات: {radarConfig.particleCount}</label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={radarConfig.particleCount}
                      onChange={(e) => setRadarConfig({...radarConfig, particleCount: Number(e.target.value)})}
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm">رنگ ذرات:</label>
                    <input
                      type="color"
                      value={radarConfig.particleColor}
                      onChange={(e) => setRadarConfig({...radarConfig, particleColor: e.target.value})}
                      className="w-full h-10 rounded mt-1 cursor-pointer"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-gray-300 text-sm">میزان تاری: {radarConfig.blurAmount}px</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={radarConfig.blurAmount}
                  onChange={(e) => setRadarConfig({...radarConfig, blurAmount: Number(e.target.value)})}
                  className="w-full mt-1"
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm">شفافیت: {radarConfig.opacity}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={radarConfig.opacity}
                  onChange={(e) => setRadarConfig({...radarConfig, opacity: Number(e.target.value)})}
                  className="w-full mt-1"
                />
              </div>
            </div>
          </div>

          {/* Text Settings */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">تنظیمات متن</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={radarConfig.showText}
                  onChange={(e) => setRadarConfig({...radarConfig, showText: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-white">نمایش متن</span>
              </label>

              {radarConfig.showText && (
                <>
                  <div>
                    <label className="text-gray-300 text-sm">متن جستجو:</label>
                    <input
                      type="text"
                      value={radarConfig.searchText}
                      onChange={(e) => setRadarConfig({...radarConfig, searchText: e.target.value})}
                      className="w-full bg-gray-700 text-white p-2 rounded mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm">متن یافت شد:</label>
                    <input
                      type="text"
                      value={radarConfig.foundText}
                      onChange={(e) => setRadarConfig({...radarConfig, foundText: e.target.value})}
                      className="w-full bg-gray-700 text-white p-2 rounded mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm">رنگ متن:</label>
                    <input
                      type="color"
                      value={radarConfig.textColor}
                      onChange={(e) => setRadarConfig({...radarConfig, textColor: e.target.value})}
                      className="w-full h-10 rounded mt-1 cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadarCustomizer;
