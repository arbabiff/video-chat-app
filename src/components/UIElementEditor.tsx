import React, { useState, useRef, useEffect } from 'react';
import { Move, Maximize2, Eye, EyeOff, Trash2, Plus, Copy, Layers, Lock, Unlock, Settings, Palette, Type, AlignLeft, AlignCenter, AlignRight, Image } from 'lucide-react';

interface UIElement {
  id: string;
  name: string;
  type: 'button' | 'text' | 'container' | 'image' | 'icon' | 'input' | 'video' | 'chat';
  position: { x: number; y: number };
  size: { width: number; height: number };
  styles: {
    backgroundColor?: string;
    color?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    fontSize?: number;
    fontWeight?: number;
    padding?: number;
    margin?: number;
    opacity?: number;
    zIndex?: number;
    boxShadow?: string;
    textAlign?: 'left' | 'center' | 'right';
  };
  content?: string;
  icon?: string;
  image?: string;
  visible: boolean;
  locked: boolean;
  parent?: string;
  children?: string[];
}

interface UIPage {
  id: string;
  name: string;
  description: string;
  elements: UIElement[];
  backgroundColor: string;
  layoutType: 'fixed' | 'responsive' | 'fluid';
}

const UIElementEditor: React.FC = () => {
  const [pages, setPages] = useState<UIPage[]>([
    {
      id: 'chat',
      name: 'صفحه چت',
      description: 'صفحه اصلی چت ویدیویی',
      backgroundColor: '#111827',
      layoutType: 'responsive',
      elements: [
        {
          id: 'video-container',
          name: 'کانتینر ویدیو',
          type: 'container',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 70 },
          styles: {
            backgroundColor: '#1F2937',
            borderRadius: 12,
            padding: 16
          },
          visible: true,
          locked: false,
          children: ['self-video', 'remote-video']
        },
        {
          id: 'chat-box',
          name: 'باکس چت',
          type: 'chat',
          position: { x: 0, y: 70 },
          size: { width: 100, height: 20 },
          styles: {
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            padding: 12
          },
          visible: true,
          locked: false
        },
        {
          id: 'control-bar',
          name: 'نوار کنترل',
          type: 'container',
          position: { x: 0, y: 90 },
          size: { width: 100, height: 10 },
          styles: {
            backgroundColor: '#374151',
            padding: 8
          },
          visible: true,
          locked: false,
          children: ['next-btn', 'stop-btn', 'lock-btn', 'report-btn']
        },
        {
          id: 'next-btn',
          name: 'دکمه بعدی',
          type: 'button',
          position: { x: 10, y: 92 },
          size: { width: 15, height: 6 },
          styles: {
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            borderRadius: 8,
            fontSize: 14
          },
          content: 'کاربر بعدی',
          icon: 'RotateCcw',
          visible: true,
          locked: false,
          parent: 'control-bar'
        },
        {
          id: 'lock-btn',
          name: 'دکمه قفل',
          type: 'button',
          position: { x: 30, y: 92 },
          size: { width: 10, height: 6 },
          styles: {
            backgroundColor: '#F59E0B',
            color: '#FFFFFF',
            borderRadius: 8,
            fontSize: 14
          },
          content: 'قفل',
          icon: 'Lock',
          visible: true,
          locked: false,
          parent: 'control-bar'
        }
      ]
    },
    {
      id: 'subscription',
      name: 'صفحه اشتراک',
      description: 'صفحه خرید اشتراک و قفل',
      backgroundColor: '#0F172A',
      layoutType: 'responsive',
      elements: [
        {
          id: 'sub-header',
          name: 'هدر اشتراک',
          type: 'container',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 15 },
          styles: {
            backgroundColor: '#1E293B',
            padding: 20,
            textAlign: 'center'
          },
          visible: true,
          locked: false
        },
        {
          id: 'sub-plans',
          name: 'پلن‌های اشتراک',
          type: 'container',
          position: { x: 0, y: 15 },
          size: { width: 100, height: 60 },
          styles: {
            backgroundColor: 'transparent',
            padding: 16
          },
          visible: true,
          locked: false
        },
        {
          id: 'gift-section',
          name: 'بخش هدیه',
          type: 'container',
          position: { x: 0, y: 75 },
          size: { width: 100, height: 25 },
          styles: {
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: 16
          },
          visible: true,
          locked: false
        }
      ]
    }
  ]);

  const [selectedPage, setSelectedPage] = useState<UIPage>(pages[0]);
  const [selectedElement, setSelectedElement] = useState<UIElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [previewMode, setPreviewMode] = useState(false);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const elementTypes = [
    { type: 'button', label: 'دکمه', icon: '🔵' },
    { type: 'text', label: 'متن', icon: '📝' },
    { type: 'container', label: 'کانتینر', icon: '📦' },
    { type: 'image', label: 'تصویر', icon: '🖼️' },
    { type: 'icon', label: 'آیکون', icon: '✨' },
    { type: 'input', label: 'ورودی', icon: '⌨️' },
    { type: 'video', label: 'ویدیو', icon: '📹' },
    { type: 'chat', label: 'چت', icon: '💬' }
  ];

  const handleElementClick = (element: UIElement) => {
    if (!previewMode) {
      setSelectedElement(element);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, element: UIElement) => {
    if (previewMode || element.locked) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setSelectedElement(element);
    setDragStart({
      x: e.clientX - rect.left - (element.position.x * rect.width / 100),
      y: e.clientY - rect.top - (element.position.y * rect.height / 100)
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let newX = ((e.clientX - rect.left - dragStart.x) / rect.width) * 100;
    let newY = ((e.clientY - rect.top - dragStart.y) / rect.height) * 100;

    if (showGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    newX = Math.max(0, Math.min(100 - selectedElement.size.width, newX));
    newY = Math.max(0, Math.min(100 - selectedElement.size.height, newY));

    updateElement(selectedElement.id, {
      position: { x: newX, y: newY }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const updateElement = (elementId: string, updates: Partial<UIElement>) => {
    setSelectedPage(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
    }));
    
    setPages(prevPages =>
      prevPages.map(page =>
        page.id === selectedPage.id
          ? {
              ...page,
              elements: page.elements.map(el =>
                el.id === elementId ? { ...el, ...updates } : el
              )
            }
          : page
      )
    );

    if (selectedElement?.id === elementId) {
      setSelectedElement(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const addNewElement = (type: UIElement['type']) => {
    const newElement: UIElement = {
      id: `element-${Date.now()}`,
      name: `${elementTypes.find(t => t.type === type)?.label} جدید`,
      type,
      position: { x: 20, y: 20 },
      size: { width: 30, height: 10 },
      styles: {
        backgroundColor: type === 'container' ? '#374151' : '#3B82F6',
        color: '#FFFFFF',
        borderRadius: 8,
        padding: 8,
        fontSize: 14,
        opacity: 100,
        zIndex: selectedPage.elements.length + 1
      },
      content: type === 'button' ? 'دکمه جدید' : type === 'text' ? 'متن جدید' : undefined,
      visible: true,
      locked: false
    };

    setSelectedPage(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
    
    setPages(prevPages =>
      prevPages.map(page =>
        page.id === selectedPage.id
          ? { ...page, elements: [...page.elements, newElement] }
          : page
      )
    );
    
    setSelectedElement(newElement);
  };

  const deleteElement = (elementId: string) => {
    setSelectedPage(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId)
    }));
    
    setPages(prevPages =>
      prevPages.map(page =>
        page.id === selectedPage.id
          ? { ...page, elements: page.elements.filter(el => el.id !== elementId) }
          : page
      )
    );
    
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
  };

  const duplicateElement = (element: UIElement) => {
    const newElement: UIElement = {
      ...element,
      id: `element-${Date.now()}`,
      name: `${element.name} (کپی)`,
      position: {
        x: Math.min(element.position.x + 5, 100 - element.size.width),
        y: Math.min(element.position.y + 5, 100 - element.size.height)
      }
    };

    setSelectedPage(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
    
    setPages(prevPages =>
      prevPages.map(page =>
        page.id === selectedPage.id
          ? { ...page, elements: [...page.elements, newElement] }
          : page
      )
    );
    
    setSelectedElement(newElement);
  };

  const exportLayout = () => {
    const layoutData = {
      pages,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const dataStr = JSON.stringify(layoutData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `ui-layout-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          setPages(data.pages);
          setSelectedPage(data.pages[0]);
          setSelectedElement(null);
        } catch (error) {
          alert('خطا در بارگذاری فایل چیدمان');
        }
      };
      reader.readAsText(file);
    }
  };

  const renderElement = (element: UIElement) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.position.x}%`,
      top: `${element.position.y}%`,
      width: `${element.size.width}%`,
      height: `${element.size.height}%`,
      backgroundColor: element.styles.backgroundColor,
      color: element.styles.color,
      borderRadius: element.styles.borderRadius,
      border: element.styles.borderWidth ? `${element.styles.borderWidth}px solid ${element.styles.borderColor}` : undefined,
      fontSize: element.styles.fontSize,
      fontWeight: element.styles.fontWeight,
      padding: element.styles.padding,
      margin: element.styles.margin,
      opacity: (element.styles.opacity || 100) / 100,
      zIndex: element.styles.zIndex,
      boxShadow: element.styles.boxShadow,
      textAlign: element.styles.textAlign,
      display: element.visible ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: previewMode ? 'default' : 'move',
      userSelect: 'none',
      transition: isDragging ? 'none' : 'all 0.2s ease'
    };

    return (
      <div
        key={element.id}
        style={style}
        className={`${selectedElement?.id === element.id && !previewMode ? 'ring-2 ring-blue-500' : ''} ${element.locked ? 'cursor-not-allowed' : ''}`}
        onMouseDown={(e) => handleMouseDown(e, element)}
        onClick={() => handleElementClick(element)}
      >
        {element.type === 'button' && (
          <span className="flex items-center gap-2">
            {element.icon && <span>🔘</span>}
            {element.content}
          </span>
        )}
        {element.type === 'text' && <span>{element.content}</span>}
        {element.type === 'container' && (
          <div className="w-full h-full border-2 border-dashed border-gray-400 opacity-50" />
        )}
        {element.type === 'image' && (
          <div className="flex items-center justify-center">
            <Image className="w-8 h-8 opacity-50" />
          </div>
        )}
        {element.type === 'video' && (
          <div className="flex items-center justify-center">
            <span className="text-2xl">📹</span>
          </div>
        )}
        {element.type === 'chat' && (
          <div className="flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
        )}
        
        {/* Resize Handle */}
        {selectedElement?.id === element.id && !previewMode && !element.locked && (
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-6 h-6" />
          ویرایشگر المان‌های UI
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 ${showGrid ? 'bg-blue-600' : 'bg-gray-700'} text-white rounded-lg hover:opacity-80 transition-colors`}
            title="نمایش گرید"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`p-2 ${previewMode ? 'bg-green-600' : 'bg-gray-700'} text-white rounded-lg hover:opacity-80 transition-colors`}
            title="حالت پیش‌نمایش"
          >
            {previewMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button
            onClick={exportLayout}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="دانلود چیدمان"
          >
            <Move className="w-5 h-5" />
          </button>
          <label className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Maximize2 className="w-5 h-5" />
            <input type="file" accept=".json" onChange={importLayout} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas Area */}
        <div className="lg:col-span-3">
          {/* Page Tabs */}
          <div className="bg-gray-800 rounded-t-xl p-3">
            <div className="flex gap-2 overflow-x-auto">
              {pages.map(page => (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedPage(page);
                    setSelectedElement(null);
                  }}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedPage.id === page.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {page.name}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="relative bg-gray-900 rounded-b-xl overflow-hidden"
            style={{
              height: '600px',
              backgroundColor: selectedPage.backgroundColor,
              backgroundImage: showGrid
                ? `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`
                : undefined,
              backgroundSize: showGrid ? `${gridSize}% ${gridSize}%` : undefined
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {selectedPage.elements.map(renderElement)}
            
            {/* Preview Mode Overlay */}
            {previewMode && (
              <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                حالت پیش‌نمایش
              </div>
            )}
          </div>

          {/* Element Toolbar */}
          {!previewMode && (
            <div className="bg-gray-800 rounded-xl p-4 mt-4">
              <h3 className="text-white font-semibold mb-3">افزودن المان جدید:</h3>
              <div className="flex flex-wrap gap-2">
                {elementTypes.map(type => (
                  <button
                    key={type.type}
                    onClick={() => addNewElement(type.type as UIElement['type'])}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        <div className="space-y-4">
          {/* Element List */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">لیست المان‌ها</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedPage.elements.map(element => (
                <div
                  key={element.id}
                  onClick={() => setSelectedElement(element)}
                  className={`p-2 rounded-lg cursor-pointer flex items-center justify-between ${
                    selectedElement?.id === element.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {element.locked && <Lock className="w-3 h-3" />}
                    {!element.visible && <EyeOff className="w-3 h-3" />}
                    <span className="text-sm">{element.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateElement(element.id, { visible: !element.visible });
                      }}
                      className="p-1 hover:bg-gray-600 rounded"
                    >
                      {element.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateElement(element.id, { locked: !element.locked });
                      }}
                      className="p-1 hover:bg-gray-600 rounded"
                    >
                      {element.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Element Properties */}
          {selectedElement && !previewMode && (
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">ویژگی‌های المان</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => duplicateElement(selectedElement)}
                    className="p-1 text-blue-400 hover:bg-gray-700 rounded"
                    title="کپی"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    className="p-1 text-red-400 hover:bg-gray-700 rounded"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="text-gray-300 text-sm">نام:</label>
                  <input
                    type="text"
                    value={selectedElement.name}
                    onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                    className="w-full bg-gray-700 text-white p-2 rounded mt-1"
                  />
                </div>

                {/* Position */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 text-sm">X:</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.position.x)}
                      onChange={(e) => updateElement(selectedElement.id, {
                        position: { ...selectedElement.position, x: Number(e.target.value) }
                      })}
                      className="w-full bg-gray-700 text-white p-2 rounded mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm">Y:</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.position.y)}
                      onChange={(e) => updateElement(selectedElement.id, {
                        position: { ...selectedElement.position, y: Number(e.target.value) }
                      })}
                      className="w-full bg-gray-700 text-white p-2 rounded mt-1"
                    />
                  </div>
                </div>

                {/* Size */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 text-sm">عرض:</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.size.width)}
                      onChange={(e) => updateElement(selectedElement.id, {
                        size: { ...selectedElement.size, width: Number(e.target.value) }
                      })}
                      className="w-full bg-gray-700 text-white p-2 rounded mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm">ارتفاع:</label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.size.height)}
                      onChange={(e) => updateElement(selectedElement.id, {
                        size: { ...selectedElement.size, height: Number(e.target.value) }
                      })}
                      className="w-full bg-gray-700 text-white p-2 rounded mt-1"
                    />
                  </div>
                </div>

                {/* Content */}
                {(selectedElement.type === 'button' || selectedElement.type === 'text') && (
                  <div>
                    <label className="text-gray-300 text-sm">محتوا:</label>
                    <input
                      type="text"
                      value={selectedElement.content || ''}
                      onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                      className="w-full bg-gray-700 text-white p-2 rounded mt-1"
                    />
                  </div>
                )}

                {/* Colors */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 text-sm">رنگ پس‌زمینه:</label>
                    <input
                      type="color"
                      value={selectedElement.styles.backgroundColor || '#000000'}
                      onChange={(e) => updateElement(selectedElement.id, {
                        styles: { ...selectedElement.styles, backgroundColor: e.target.value }
                      })}
                      className="w-full h-10 rounded mt-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm">رنگ متن:</label>
                    <input
                      type="color"
                      value={selectedElement.styles.color || '#FFFFFF'}
                      onChange={(e) => updateElement(selectedElement.id, {
                        styles: { ...selectedElement.styles, color: e.target.value }
                      })}
                      className="w-full h-10 rounded mt-1 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Border Radius */}
                <div>
                  <label className="text-gray-300 text-sm">گردی گوشه: {selectedElement.styles.borderRadius || 0}px</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={selectedElement.styles.borderRadius || 0}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, borderRadius: Number(e.target.value) }
                    })}
                    className="w-full mt-1"
                  />
                </div>

                {/* Opacity */}
                <div>
                  <label className="text-gray-300 text-sm">شفافیت: {selectedElement.styles.opacity || 100}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedElement.styles.opacity || 100}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, opacity: Number(e.target.value) }
                    })}
                    className="w-full mt-1"
                  />
                </div>

                {/* Z-Index */}
                <div>
                  <label className="text-gray-300 text-sm">لایه (Z-Index):</label>
                  <input
                    type="number"
                    value={selectedElement.styles.zIndex || 1}
                    onChange={(e) => updateElement(selectedElement.id, {
                      styles: { ...selectedElement.styles, zIndex: Number(e.target.value) }
                    })}
                    className="w-full bg-gray-700 text-white p-2 rounded mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UIElementEditor;
