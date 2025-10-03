import React, { useState } from 'react';
import { Palette, Sun, Moon, Sliders, Eye, EyeOff, RotateCcw, Save, Copy, Download, Upload } from 'lucide-react';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

interface ThemeAnimations {
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: string;
  enabled: boolean;
}

interface Theme {
  name: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  animations: ThemeAnimations;
  isDarkMode: boolean;
}

const UIThemeManager: React.FC = () => {
  const [themes, setThemes] = useState<Theme[]>([
    {
      name: 'پیش‌فرض',
      colors: {
        light: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#10B981',
          background: '#FFFFFF',
          surface: '#F3F4F6',
          text: '#111827',
          textSecondary: '#6B7280',
          error: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          info: '#3B82F6'
        },
        dark: {
          primary: '#60A5FA',
          secondary: '#A78BFA',
          accent: '#34D399',
          background: '#111827',
          surface: '#1F2937',
          text: '#F9FAFB',
          textSecondary: '#9CA3AF',
          error: '#F87171',
          warning: '#FCD34D',
          success: '#34D399',
          info: '#60A5FA'
        }
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48
      },
      typography: {
        fontFamily: 'Vazirmatn, system-ui, sans-serif',
        fontSize: {
          xs: 12,
          sm: 14,
          base: 16,
          lg: 18,
          xl: 24,
          xxl: 32
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        }
      },
      borderRadius: {
        none: 0,
        sm: 4,
        md: 8,
        lg: 12,
        full: 9999
      },
      shadows: {
        none: 'none',
        sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.15)'
      },
      animations: {
        duration: {
          fast: 150,
          normal: 300,
          slow: 500
        },
        easing: 'ease-in-out',
        enabled: true
      },
      isDarkMode: false
    }
  ]);

  const [activeTheme, setActiveTheme] = useState(themes[0]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const colorCategories = [
    { key: 'primary', label: 'رنگ اصلی', icon: '🎨' },
    { key: 'secondary', label: 'رنگ ثانویه', icon: '🎭' },
    { key: 'accent', label: 'رنگ تاکید', icon: '✨' },
    { key: 'background', label: 'پس‌زمینه', icon: '📄' },
    { key: 'surface', label: 'سطوح', icon: '📦' },
    { key: 'text', label: 'متن اصلی', icon: '✏️' },
    { key: 'textSecondary', label: 'متن فرعی', icon: '📝' },
    { key: 'error', label: 'خطا', icon: '❌' },
    { key: 'warning', label: 'هشدار', icon: '⚠️' },
    { key: 'success', label: 'موفقیت', icon: '✅' },
    { key: 'info', label: 'اطلاعات', icon: 'ℹ️' }
  ];

  const handleColorChange = (colorKey: string, value: string, mode: 'light' | 'dark') => {
    setActiveTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [mode]: {
          ...prev.colors[mode],
          [colorKey]: value
        }
      }
    }));
  };

  const handleSpacingChange = (key: string, value: number) => {
    setActiveTheme(prev => ({
      ...prev,
      spacing: {
        ...prev.spacing,
        [key]: value
      }
    }));
  };

  const handleTypographyChange = (section: 'fontFamily' | 'fontSize' | 'fontWeight', key: string, value: any) => {
    setActiveTheme(prev => {
      if (section === 'fontFamily') {
        return {
          ...prev,
          typography: {
            ...prev.typography,
            fontFamily: value
          }
        };
      }
      if (section === 'fontSize') {
        return {
          ...prev,
          typography: {
            ...prev.typography,
            fontSize: {
              ...prev.typography.fontSize,
              [key]: value
            }
          }
        };
      }
      return {
        ...prev,
        typography: {
          ...prev.typography,
          fontWeight: {
            ...prev.typography.fontWeight,
            [key]: value
          }
        }
      };
    });
  };

  const exportTheme = () => {
    const dataStr = JSON.stringify(activeTheme, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `theme-${activeTheme.name}-${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const theme = JSON.parse(e.target?.result as string);
          setActiveTheme(theme);
          setThemes(prev => [...prev, theme]);
        } catch (error) {
          alert('خطا در بارگذاری فایل تم');
        }
      };
      reader.readAsText(file);
    }
  };

  const generateCSS = () => {
    const mode = activeTheme.isDarkMode ? 'dark' : 'light';
    const colors = activeTheme.colors[mode];
    const spacing = activeTheme.spacing;
    const typography = activeTheme.typography;
    const borderRadius = activeTheme.borderRadius;
    const shadows = activeTheme.shadows;

    return `
:root {
  /* Colors */
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
  --color-text: ${colors.text};
  --color-text-secondary: ${colors.textSecondary};
  --color-error: ${colors.error};
  --color-warning: ${colors.warning};
  --color-success: ${colors.success};
  --color-info: ${colors.info};

  /* Spacing */
  --spacing-xs: ${spacing.xs}px;
  --spacing-sm: ${spacing.sm}px;
  --spacing-md: ${spacing.md}px;
  --spacing-lg: ${spacing.lg}px;
  --spacing-xl: ${spacing.xl}px;
  --spacing-xxl: ${spacing.xxl}px;

  /* Typography */
  --font-family: ${typography.fontFamily};
  --font-size-xs: ${typography.fontSize.xs}px;
  --font-size-sm: ${typography.fontSize.sm}px;
  --font-size-base: ${typography.fontSize.base}px;
  --font-size-lg: ${typography.fontSize.lg}px;
  --font-size-xl: ${typography.fontSize.xl}px;
  --font-size-xxl: ${typography.fontSize.xxl}px;

  /* Border Radius */
  --border-radius-none: ${borderRadius.none}px;
  --border-radius-sm: ${borderRadius.sm}px;
  --border-radius-md: ${borderRadius.md}px;
  --border-radius-lg: ${borderRadius.lg}px;
  --border-radius-full: ${borderRadius.full}px;

  /* Shadows */
  --shadow-none: ${shadows.none};
  --shadow-sm: ${shadows.sm};
  --shadow-md: ${shadows.md};
  --shadow-lg: ${shadows.lg};
  --shadow-xl: ${shadows.xl};

  /* Animations */
  --animation-duration-fast: ${activeTheme.animations.duration.fast}ms;
  --animation-duration-normal: ${activeTheme.animations.duration.normal}ms;
  --animation-duration-slow: ${activeTheme.animations.duration.slow}ms;
  --animation-easing: ${activeTheme.animations.easing};
}
    `.trim();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Palette className="w-6 h-6" />
          مدیریت تم و ظاهر
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTheme({...activeTheme, isDarkMode: !activeTheme.isDarkMode})}
            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            title="تغییر حالت تاریک/روشن"
          >
            {activeTheme.isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            title="پیش‌نمایش"
          >
            {previewMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          <button
            onClick={exportTheme}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="دانلود تم"
          >
            <Download className="w-5 h-5" />
          </button>
          <label className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            <input type="file" accept=".json" onChange={importTheme} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colors Section */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">رنگ‌ها</h3>
          <div className="space-y-4">
            {colorCategories.map(category => (
              <div key={category.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">روشن:</span>
                      <input
                        type="color"
                        value={activeTheme.colors.light[category.key as keyof ThemeColors]}
                        onChange={(e) => handleColorChange(category.key, e.target.value, 'light')}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">تاریک:</span>
                      <input
                        type="color"
                        value={activeTheme.colors.dark[category.key as keyof ThemeColors]}
                        onChange={(e) => handleColorChange(category.key, e.target.value, 'dark')}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spacing Section */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">فاصله‌گذاری</h3>
          <div className="space-y-4">
            {Object.entries(activeTheme.spacing).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-300">{key.toUpperCase()}</label>
                  <span className="text-white">{value}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="64"
                  value={value}
                  onChange={(e) => handleSpacingChange(key, parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Typography Section */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">تایپوگرافی</h3>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">فونت:</label>
            <select
              value={activeTheme.typography.fontFamily}
              onChange={(e) => handleTypographyChange('fontFamily', '', e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded-lg"
            >
              <option value="Vazirmatn, system-ui, sans-serif">Vazirmatn</option>
              <option value="IRANSans, system-ui, sans-serif">IRANSans</option>
              <option value="Yekan, system-ui, sans-serif">Yekan</option>
              <option value="system-ui, sans-serif">System UI</option>
            </select>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-semibold">اندازه فونت:</h4>
            {Object.entries(activeTheme.typography.fontSize).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <label className="text-gray-300 text-sm">{key}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="8"
                    max="64"
                    value={value}
                    onChange={(e) => handleTypographyChange('fontSize', key, parseInt(e.target.value))}
                    className="w-16 bg-gray-700 text-white p-1 rounded text-sm"
                  />
                  <span className="text-gray-400 text-xs">px</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Border Radius & Shadows */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">گوشه‌ها و سایه‌ها</h3>
          
          <div className="space-y-4 mb-6">
            <h4 className="text-white font-semibold">گردی گوشه‌ها:</h4>
            {Object.entries(activeTheme.borderRadius).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-300 text-sm">{key}</label>
                  <span className="text-white text-sm">{value}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={value === 9999 ? 50 : value}
                  onChange={(e) => setActiveTheme(prev => ({
                    ...prev,
                    borderRadius: {
                      ...prev.borderRadius,
                      [key]: key === 'full' ? 9999 : parseInt(e.target.value)
                    }
                  }))}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-semibold">سایه‌ها:</h4>
            {Object.entries(activeTheme.shadows).map(([key, value]) => (
              <div key={key} className="bg-gray-700 p-3 rounded-lg">
                <label className="text-gray-300 text-sm block mb-1">{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setActiveTheme(prev => ({
                    ...prev,
                    shadows: {
                      ...prev.shadows,
                      [key]: e.target.value
                    }
                  }))}
                  className="w-full bg-gray-600 text-white p-2 rounded text-sm"
                  dir="ltr"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Animations */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">انیمیشن‌ها</h3>
          
          <div className="mb-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={activeTheme.animations.enabled}
                onChange={(e) => setActiveTheme(prev => ({
                  ...prev,
                  animations: {
                    ...prev.animations,
                    enabled: e.target.checked
                  }
                }))}
                className="w-4 h-4"
              />
              <span className="text-white">فعال بودن انیمیشن‌ها</span>
            </label>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold">مدت زمان:</h4>
            {Object.entries(activeTheme.animations.duration).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-300 text-sm">{key}</label>
                  <span className="text-white text-sm">{value}ms</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={value}
                  onChange={(e) => setActiveTheme(prev => ({
                    ...prev,
                    animations: {
                      ...prev.animations,
                      duration: {
                        ...prev.animations.duration,
                        [key]: parseInt(e.target.value)
                      }
                    }
                  }))}
                  className="w-full"
                  disabled={!activeTheme.animations.enabled}
                />
              </div>
            ))}

            <div>
              <label className="block text-gray-300 mb-2">نوع انیمیشن:</label>
              <select
                value={activeTheme.animations.easing}
                onChange={(e) => setActiveTheme(prev => ({
                  ...prev,
                  animations: {
                    ...prev.animations,
                    easing: e.target.value
                  }
                }))}
                className="w-full bg-gray-700 text-white p-2 rounded-lg"
                disabled={!activeTheme.animations.enabled}
              >
                <option value="linear">Linear</option>
                <option value="ease">Ease</option>
                <option value="ease-in">Ease In</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in-out">Ease In Out</option>
              </select>
            </div>
          </div>
        </div>

        {/* CSS Output */}
        <div className="bg-gray-800 rounded-xl p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">خروجی CSS</h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generateCSS());
                alert('کد CSS کپی شد!');
              }}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              کپی CSS
            </button>
          </div>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm" dir="ltr">
            {generateCSS()}
          </pre>
        </div>
      </div>

      {/* Preview Section */}
      {previewMode && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">پیش‌نمایش</h3>
          <div 
            className="p-6 rounded-lg"
            style={{
              backgroundColor: activeTheme.colors[activeTheme.isDarkMode ? 'dark' : 'light'].background,
              color: activeTheme.colors[activeTheme.isDarkMode ? 'dark' : 'light'].text
            }}
          >
            <div className="space-y-4">
              <button 
                style={{
                  backgroundColor: activeTheme.colors[activeTheme.isDarkMode ? 'dark' : 'light'].primary,
                  color: '#fff',
                  padding: `${activeTheme.spacing.sm}px ${activeTheme.spacing.md}px`,
                  borderRadius: `${activeTheme.borderRadius.md}px`,
                  fontSize: `${activeTheme.typography.fontSize.base}px`,
                  fontFamily: activeTheme.typography.fontFamily,
                  boxShadow: activeTheme.shadows.md,
                  transition: activeTheme.animations.enabled ? `all ${activeTheme.animations.duration.normal}ms ${activeTheme.animations.easing}` : 'none'
                }}
              >
                دکمه اصلی
              </button>
              
              <div 
                style={{
                  backgroundColor: activeTheme.colors[activeTheme.isDarkMode ? 'dark' : 'light'].surface,
                  padding: `${activeTheme.spacing.md}px`,
                  borderRadius: `${activeTheme.borderRadius.lg}px`,
                  boxShadow: activeTheme.shadows.lg
                }}
              >
                <h4 style={{ fontSize: `${activeTheme.typography.fontSize.lg}px`, marginBottom: `${activeTheme.spacing.sm}px` }}>
                  عنوان نمونه
                </h4>
                <p style={{ 
                  color: activeTheme.colors[activeTheme.isDarkMode ? 'dark' : 'light'].textSecondary,
                  fontSize: `${activeTheme.typography.fontSize.sm}px`
                }}>
                  این یک متن نمونه برای تست تم است.
                </p>
              </div>

              <div className="flex gap-2">
                <div style={{
                  backgroundColor: activeTheme.colors[activeTheme.isDarkMode ? 'dark' : 'light'].success,
                  color: '#fff',
                  padding: `${activeTheme.spacing.xs}px ${activeTheme.spacing.sm}px`,
                  borderRadius: `${activeTheme.borderRadius.sm}px`,
                  fontSize: `${activeTheme.typography.fontSize.xs}px`
                }}>
                  موفقیت
                </div>
                <div style={{
                  backgroundColor: activeTheme.colors[activeTheme.isDarkMode ? 'dark' : 'light'].warning,
                  color: '#fff',
                  padding: `${activeTheme.spacing.xs}px ${activeTheme.spacing.sm}px`,
                  borderRadius: `${activeTheme.borderRadius.sm}px`,
                  fontSize: `${activeTheme.typography.fontSize.xs}px`
                }}>
                  هشدار
                </div>
                <div style={{
                  backgroundColor: activeTheme.colors[activeTheme.isDarkMode ? 'dark' : 'light'].error,
                  color: '#fff',
                  padding: `${activeTheme.spacing.xs}px ${activeTheme.spacing.sm}px`,
                  borderRadius: `${activeTheme.borderRadius.sm}px`,
                  fontSize: `${activeTheme.typography.fontSize.xs}px`
                }}>
                  خطا
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UIThemeManager;
