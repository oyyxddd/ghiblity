'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import StripeBuyButton from '../components/StripeBuyButton';

// 声明全局类型
declare global {
  interface Window {
    gtagEvent?: (action: string, category: string, label: string, value?: number) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Example images data
const examples = [
  {
    before: '/images/example1-before.jpg',
    after: '/images/example1-after.jpg',
    description: 'Transform your portrait into Ghibli magic',
  },
  {
    before: '/images/example2-before.jpg',
    after: '/images/example2-after.jpg',
    description: 'Every avatar becomes a work of art',
  },
  {
    before: '/images/example3-before.jpg',
    after: '/images/example3-after.jpg',
    description: 'Capture the essence of Studio Ghibli',
  },
];

// FAQ data
const faqs = [
  {
    question: 'Is the Ghibli filter really free? Do I need to sign up?',
    answer: 'Yes! Our Ghibli filter is completely free to try and requires no sign up or registration. Simply upload your photo and see the magic happen. You only pay ($0.99) when you want to download the high-quality result.',
  },
  {
    question: 'How does the Spirited Away avatar generation work?',
    answer: 'Our AI analyzes your photo and transforms it into authentic Studio Ghibli art style from Spirited Away (2001). The process captures facial features while applying hand-drawn animation aesthetics.',
  },
  {
    question: 'How long does it take to generate my avatar?',
    answer: 'Your magical transformation takes 80-120 seconds! No waiting for emails - your avatar appears instantly on screen once ready.',
  },
  {
    question: 'What photo should I upload for best results?',
    answer: 'Upload a clear portrait photo (JPG, PNG, or GIF) showing your face clearly. Good lighting and a front-facing angle work best. File size limit is 10MB.',
  },
  {
    question: 'Is the $0.99 payment one-time or recurring?',
    answer: 'It\'s a simple one-time payment of 99¢ per avatar generation. No subscriptions, no hidden fees - just secure payment via Stripe.',
  },
  {
    question: 'Is my photo data safe and private?',
    answer: 'Absolutely! We use encrypted transmission for all uploads. Your photos are processed securely and automatically deleted after generation - we never store personal images.',
  },
  {
    question: 'Can I use my generated avatar commercially?',
    answer: 'Yes! Once generated, you own full rights to your Spirited Away style avatar. Use it for social media, profiles, artwork, or any personal/commercial purpose.',
  },
];

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(80);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [asyncStatus, setAsyncStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 检查是否有待生成的任务 + 添加全局粘贴监听
  useEffect(() => {
    // 检查是否有未完成的生成任务
    const pendingGeneration = localStorage.getItem('pending_generation');
    const pendingImage = localStorage.getItem('pending_image');
    
    console.log('Checking pending tasks:', { pendingGeneration, pendingImage: pendingImage ? 'has image data' : 'no image data' });
    
    if (pendingGeneration === 'true' && pendingImage) {
      console.log('User returned from payment page, showing payment options');
      // 用户从支付页面返回，显示生成选项
      setPreview(pendingImage);
      setPaymentCompleted(true);
    }

    // 添加全局粘贴事件监听
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // 只在页面主要区域处理粘贴，避免干扰表单输入
      if (e.target === document.body || 
          (e.target as HTMLElement)?.closest?.('.space-y-8')) {
        e.preventDefault();
        const items = e.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file) {
                console.log('Global paste detected, processing image...');
                // Google Analytics 事件埋点
                if (typeof window !== 'undefined' && window.gtagEvent) {
                  window.gtagEvent('upload_image', 'engagement', 'paste', 1);
                }
                processImageFile(file);
              }
              break;
            }
          }
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    
    // 添加window focus事件监听（当用户从其他标签页返回时检测）
    const handleWindowFocus = () => {
      const pendingGeneration = localStorage.getItem('pending_generation');
      const pendingImage = localStorage.getItem('pending_image');
      
      if (pendingGeneration === 'true' && pendingImage && !paymentCompleted) {
        console.log('Window focus detected payment return');
        setPreview(pendingImage);
        setPaymentCompleted(true);
      }
    };
    
    window.addEventListener('focus', handleWindowFocus);
    
    // 添加定期检查localStorage的机制（用于检测用户从支付页面返回）
    const checkPaymentReturn = setInterval(() => {
      const pendingGeneration = localStorage.getItem('pending_generation');
      const pendingImage = localStorage.getItem('pending_image');
      
      if (pendingGeneration === 'true' && pendingImage && !paymentCompleted) {
        console.log('Periodic check detected payment return');
        setPreview(pendingImage);
        setPaymentCompleted(true);
        clearInterval(checkPaymentReturn);
      }
    }, 1000);
    
    // 清理事件监听器和定时器
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(checkPaymentReturn);
    };
  }, [paymentCompleted]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Google Analytics 事件埋点
      if (typeof window !== 'undefined' && window.gtagEvent) {
        window.gtagEvent('upload_image', 'engagement', 'file_input', 1);
      }
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    setImage(file);
    setError('');
    setGeneratedImage('');
    
    // 创建图像压缩和优化
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = document.createElement('img');
    
    img.onload = () => {
      // 限制最大尺寸为1024x1024
      const maxSize = 1024;
      let { width, height } = img;
      
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制优化后的图像
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 转换为压缩的base64，降低质量以减小文件大小
      let quality = 0.7; // 默认质量
      let optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // 如果图片仍然太大，进一步降低质量
      while (optimizedDataUrl.length > 1024 * 1024 && quality > 0.3) { // 1MB限制
        quality -= 0.1;
        optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      
      console.log('Compressed image size:', Math.round(optimizedDataUrl.length / 1024), 'KB, quality:', quality);
      setPreview(optimizedDataUrl);
    };
    
    // 如果图像处理失败，使用原始方法
    img.onerror = () => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    };
    
    // 读取图像文件
    const reader = new FileReader();
    reader.onloadend = () => {
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 处理粘贴图片
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            // Google Analytics 事件埋点
            if (typeof window !== 'undefined' && window.gtagEvent) {
              window.gtagEvent('upload_image', 'engagement', 'paste', 1);
            }
            processImageFile(file);
          }
          break;
        }
      }
    }
  };

  // 处理拖拽
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // Google Analytics 事件埋点
        if (typeof window !== 'undefined' && window.gtagEvent) {
          window.gtagEvent('upload_image', 'engagement', 'drag_drop', 1);
        }
        processImageFile(file);
      } else {
        setError('Please drop an image file');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 清空所有状态的函数
  const clearAllStates = () => {
    setPreview('');
    setImage(null);
    setGeneratedImage('');
    setError('');
    setPaymentCompleted(false);
    setIsGenerating(false);
    setCountdown(80);
    setCurrentTaskId(null);
    setAsyncStatus('');
    // 清空 localStorage 中的待处理数据
    localStorage.removeItem('pending_generation');
    localStorage.removeItem('pending_image');
    // 重置文件输入框的值，这样用户可以重新上传同一张图片
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 已替换为 Stripe Buy Button，此函数不再需要
  // const handleGenerate = async () => { ... }

  // 开始生成头像
  const handleStartGeneration = () => {
    setPaymentCompleted(false);
    handleGenerate();
  };

  // 取消生成
  const handleCancelGeneration = () => {
    clearAllStates();
    setError('Generation cancelled. Please try again.');
  };

  // 异步生成头像的主要函数
  const handleGenerate = async () => {
    const pendingImage = localStorage.getItem('pending_image');
    const pendingGeneration = localStorage.getItem('pending_generation');
    
    if (!pendingImage || pendingGeneration !== 'true') {
      return;
    }

    // 恢复图片预览
    setPreview(pendingImage);
    setIsGenerating(true);
    setError('');
    setCountdown(80);
    setAsyncStatus('Starting generation task...');
    
    try {
      // 第一步：启动异步生成任务
      const response = await fetch('/api/generate-avatar-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: pendingImage,
          sessionId: 'no-payment-required',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${data.message || 'Unknown error'}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to start generation task');
      }

      const taskId = data.taskId;
      setCurrentTaskId(taskId);
      setAsyncStatus('Task started, generating in progress...');
      
      // 第二步：开始轮询任务状态
      await pollTaskStatus(taskId);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate avatar. Please try again.');
      setAsyncStatus('');
      
      // 发生错误时也清除存储的数据
      localStorage.removeItem('pending_image');
      localStorage.removeItem('pending_generation');
      setIsGenerating(false);
      setCountdown(80);
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 120; // 最多轮询2分钟（每3秒一次）
    let attempts = 0;
    
    // 启动倒计时
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`/api/check-status?taskId=${taskId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          const status = data.status;
          
          if (status === 'success') {
            // 任务完成
            clearInterval(pollInterval);
            clearInterval(countdownInterval);
            
                         if (data.imageUrl) {
               setGeneratedImage(data.imageUrl);
               setAsyncStatus('Avatar generation completed!');
              
              // Google Analytics 事件埋点
              if (typeof window !== 'undefined' && window.gtagEvent) {
                window.gtagEvent('purchase', 'ecommerce', 'avatar_generation_success', 1);
                window.gtagEvent('generate_avatar', 'conversion', 'success', 1);
              }
              
              // 清除存储的数据
              localStorage.removeItem('pending_image');
              localStorage.removeItem('pending_generation');
            } else {
              throw new Error('No image received from completed task');
            }
            
            setIsGenerating(false);
            setCurrentTaskId(null);
            
          } else if (status === 'failed') {
            // 任务失败
            clearInterval(pollInterval);
            clearInterval(countdownInterval);
            
            setError(data.error || 'Generation failed');
            setAsyncStatus('');
            setIsGenerating(false);
            setCurrentTaskId(null);
            setCountdown(80);
            
            localStorage.removeItem('pending_image');
            localStorage.removeItem('pending_generation');
            
                     } else if (status === 'processing') {
             setAsyncStatus('Generating Studio Ghibli style avatar...');
           } else if (status === 'pending') {
             setAsyncStatus('Task queued, will start generating soon...');
          }
        }
        
        // 检查是否超时
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          clearInterval(countdownInterval);
          
          setError('Generation timeout. Please try again.');
          setAsyncStatus('');
          setIsGenerating(false);
          setCurrentTaskId(null);
          setCountdown(80);
          
          localStorage.removeItem('pending_image');
          localStorage.removeItem('pending_generation');
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        // 继续轮询，除非达到最大尝试次数
      }
    }, 3000); // 每3秒检查一次
  };

  // 生成文件名的工具函数
  const generateFileName = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${month}${day}${hour}${minute}`;
    return `Ghiblity_${timestamp}.png`;
  };

  const downloadImage = async () => {
    if (!generatedImage) {
      return;
    }
    
    // Google Analytics 事件埋点 - 下载图片
    if (typeof window !== 'undefined' && window.gtagEvent) {
      window.gtagEvent('download_image', 'engagement', 'avatar_download', 1);
    }
    
    const fileName = generateFileName();
    console.log('Downloading with filename:', fileName);
    
    try {
      if (generatedImage.startsWith('data:image/')) {
        // 处理 base64 数据 - 直接下载
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Base64 image downloaded successfully with filename:', fileName);
        
      } else if (generatedImage.startsWith('http')) {
        // 对于HTTP URL，使用fetch获取数据并作为blob下载以确保文件名正确
        console.log('Downloading HTTP URL with custom filename:', fileName);
        
        try {
          const response = await fetch('/api/download-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: generatedImage }),
          });
          
          if (!response.ok) {
            throw new Error(`Download API failed: ${response.status}`);
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // 清理blob URL
          window.URL.revokeObjectURL(url);
          console.log('HTTP image downloaded successfully with custom filename:', fileName);
          
        } catch (fetchError) {
          console.warn('Fetch download failed, falling back to direct link:', fetchError);
          
          // 如果fetch失败，使用直接链接方法
          const link = document.createElement('a');
          link.href = generatedImage;
          link.download = fileName;
          link.target = '_blank';
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setTimeout(() => {
            setError(`If the filename is incorrect, please rename the downloaded file to: ${fileName}`);
          }, 2000);
        }
        
      } else {
        // 如果是其他格式，尝试作为base64处理
        console.log('Processing unknown format, trying as base64');
        const dataUrl = `data:image/png;base64,${generatedImage}`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Unknown format download completed successfully with filename:', fileName);
      }
      
    } catch (error) {
      console.error('Download error:', error);
      setError(`Download failed. Please right-click on the image and select "Save image as" and name it: ${fileName}`);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Logo */}
        <div className="mb-12">
        <Image
            src="/images/ghiblity-logo.png"
            alt="Ghiblity Logo"
            width={120}
            height={36}
            className="h-10 w-auto"
          />
        </div>
        {/* Header Section */}
        <div className="text-center mb-20 relative">
          {/* 背景装饰 */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-br from-[#C4A484]/20 to-[#E8D5B7]/20 rounded-full blur-3xl"></div>
            <div className="absolute top-40 right-1/4 w-48 h-48 bg-gradient-to-br from-[#F4E4BC]/30 to-[#C4A484]/30 rounded-full blur-3xl"></div>
          </div>
          
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#C4A484] to-[#E8D5B7] text-white text-sm font-medium rounded-full shadow-lg">
              ✨ Free Ghibli Filter - No Sign Up Required
            </span>
          </div>
          
          <h1 className="heading text-5xl md:text-7xl mb-6 bg-gradient-to-br from-[#2C3E50] via-[#34495E] to-[#C4A484] bg-clip-text text-transparent leading-tight">
            Free Ghibli Filter
            <br />
            <span className="text-[#C4A484] font-bold">No Sign Up Required</span>
          </h1>
          
          <p className="subheading max-w-3xl mx-auto text-xl leading-relaxed mb-8">
            Experience the magic of <span className="font-semibold text-[#C4A484]">Spirited Away</span> with our free Ghibli filter! No registration needed - simply upload and transform your photos into breathtaking hand-drawn animation masterpieces. Professional quality that rivals Studio Ghibli's legendary artists.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex items-center space-x-2 text-[#34495E]">
              <span className="text-green-500">✓</span>
              <span className="text-sm font-medium">Free Ghibli Filter</span>
            </div>
            <div className="flex items-center space-x-2 text-[#34495E]">
              <span className="text-green-500">✓</span>
              <span className="text-sm font-medium">No Sign Up Required</span>
            </div>
            <div className="flex items-center space-x-2 text-[#34495E]">
              <span className="text-green-500">✓</span>
              <span className="text-sm font-medium">Instant Generation</span>
            </div>
          </div>
          
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl shadow-sm">
            <span className="text-amber-600 mr-2">🎨</span>
            <span className="text-amber-800 text-sm font-medium">Over 10,000+ free Ghibli transformations created - no sign up needed!</span>
          </div>
        </div>

                {/* Examples Section */}
        <div className="mx-auto mb-20">

          
          <div className="grid md:grid-cols-3 gap-8">
            {examples.map((example, index) => (
              <div
                key={index}
                className="group relative rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
                style={{ backgroundColor: '#fff8e7' }}
              >
                {/* 装饰性渐变边框 */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#C4A484]/20 to-[#E8D5B7]/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative p-6">
                  <div className="relative h-56 rounded-xl overflow-hidden mb-4 shadow-lg">
            <Image
                      src={example.before}
                      alt="Before transformation"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* 悬停效果叠加层 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-[#34495E] font-medium">{example.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 社会证明 */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-6 text-sm text-[#34495E]">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-1">
                  <img
                    src="/images/customer1.jpg"
                    alt="Happy customer"
                    className="w-6 h-6 rounded-full border-2 border-white object-cover"
                  />
                  <img
                    src="/images/customer2.jpg"
                    alt="Happy customer"
                    className="w-6 h-6 rounded-full border-2 border-white object-cover"
                  />
                  <img
                    src="/images/customer3.jpg"
                    alt="Happy customer"
                    className="w-6 h-6 rounded-full border-2 border-white object-cover"
                  />
                  <img
                    src="/images/customer4.jpg"
                    alt="Happy customer"
                    className="w-6 h-6 rounded-full border-2 border-white object-cover"
                  />
                </div>
                <span className="font-medium">2,000+ happy customers</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                <span className="font-medium">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Side - Instructions */}
              <div className="space-y-6">
                <h2 className="heading text-2xl">
                  How Our Free Ghibli Filter Works
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#C4A484]/10 rounded-full flex items-center justify-center">
                      <span className="text-[#C4A484] font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2C3E50]">Upload Your Photo (Free, No Sign Up)</h3>
                      <p className="text-[#34495E] text-sm">Choose a clear portrait photo - no registration required to start</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#C4A484]/10 rounded-full flex items-center justify-center">
                      <span className="text-[#C4A484] font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2C3E50]">AI Magic Happens</h3>
                      <p className="text-[#34495E] text-sm">Our AI transforms your photo into Ghibli-style art</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#C4A484]/10 rounded-full flex items-center justify-center">
                      <span className="text-[#C4A484] font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2C3E50]">Download & Enjoy</h3>
                      <p className="text-[#34495E] text-sm">Get your beautiful avatar in high resolution</p>
                    </div>
                  </div>
                </div>



                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">💳 Payment & Process</h3>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• Secure payment via Stripe</li>
                    <li>• One-time payment for high-quality generation</li>
                    <li>• Auto-return after payment success and start generation</li>
                    <li>• Your image data is processed securely and not stored</li>
                  </ul>
                </div>


              </div>

              {/* Right Side - Upload Area */}
              <div 
                className="space-y-8" 
                onPaste={handlePaste}
                tabIndex={0}
                style={{ outline: 'none' }}
              >
                <div className="relative">
                  {/* 突出标题 */}
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">
                      Upload Your Photo
                    </h2>
                    <div className="w-16 h-1 bg-gradient-to-r from-[#C4A484] to-[#E8D5B7] mx-auto rounded-full"></div>
                  </div>
                  
                  {/* 智能上传区域 */}
                  <div 
                    className={`relative group ${!isGenerating ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    onDrop={!isGenerating ? handleDrop : undefined}
                    onDragOver={!isGenerating ? handleDragOver : undefined}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={isGenerating}
                    />
                    
                    {/* 主上传区域 */}
                    <div className={`relative border-2 border-dashed border-[#C4A484]/40 rounded-2xl overflow-hidden transition-all duration-200 min-h-[300px] ${!isGenerating ? 'hover:border-[#B8956F] hover:shadow-lg' : 'opacity-60'} ${preview ? 'bg-gray-100' : 'bg-gradient-to-br from-[#fff8e7] to-[#fef3e2] hover:bg-[#efe7d4]'}`}>
                      {preview ? (
                        /* 图片预览模式 */
                        <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
                          <img
                            src={preview}
                            alt="Uploaded Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                          
                          {/* 生成中的遮罩层 */}
                          {isGenerating && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                                <p className="text-[#2C3E50] font-medium text-sm">🎨 Generating your image...</p>
                              </div>
                            </div>
                          )}
                          
                          {/* 图片覆盖层 - 只在非生成状态显示 */}
                          {!isGenerating && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                                  <p className="text-[#2C3E50] font-medium text-sm">Click to change image</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* 删除按钮 - 只在非生成状态显示 */}
                          {!isGenerating && (
                            <div className="absolute top-3 right-3 z-20">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearAllStates();
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg opacity-90 hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* 上传提示模式 */
                        <div className="p-8 text-center h-full flex flex-col justify-center min-h-[300px] group-hover:bg-[#efe7d4] transition-colors duration-200">
                          <div className="space-y-4">
                            {/* 图标 */}
                            <div className="text-[#C4A484] text-4xl transition-transform duration-200 group-hover:scale-110">📸</div>
                            
                            {/* 主要文字 */}
                            <div className="space-y-2">
                              <h3 className="text-xl font-bold text-[#2C3E50] group-hover:text-[#1a252f]">
                                Click, Drag & Drop, or Paste
                              </h3>
                              <p className="text-[#34495E] font-medium group-hover:text-[#2c3e50]">
                                Your magical transformation awaits!
                              </p>
                            </div>
                            
                            {/* 功能标签 */}
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                              <span className="px-3 py-1 bg-white/80 backdrop-blur-sm text-[#C4A484] text-xs font-semibold rounded-full shadow-sm border border-[#C4A484]/20">
                                JPG
                              </span>
                              <span className="px-3 py-1 bg-white/80 backdrop-blur-sm text-[#C4A484] text-xs font-semibold rounded-full shadow-sm border border-[#C4A484]/20">
                                PNG
                              </span>
                              <span className="px-3 py-1 bg-white/80 backdrop-blur-sm text-[#C4A484] text-xs font-semibold rounded-full shadow-sm border border-[#C4A484]/20">
                                GIF
                              </span>
                              <span className="px-3 py-1 bg-white/80 backdrop-blur-sm text-[#C4A484] text-xs font-semibold rounded-full shadow-sm border border-[#C4A484]/20">
                                Max 10MB
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="space-y-3">
                    <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                    {/* 如果有图片但生成失败，提供重新生成选项 */}
                    {preview && !isGenerating && (
                                              <button
                          onClick={() => {
                            setError('');
                            // 如果已经完成过支付，直接重新生成
                            if (paymentCompleted) {
                              handleStartGeneration();
                            } else {
                              // 用户需要先通过支付按钮进行支付
                              setError('Please click the payment button first to complete the payment process.');
                            }
                          }}
                        className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200"
                      >
                        🔄 Try Again
                      </button>
                    )}
                  </div>
                )}

                {paymentCompleted ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-blue-800 font-medium mb-2">
                        💳 Welcome back from payment page!
                      </div>
                      <div className="text-blue-700 text-sm mb-4">
                        How did your payment go? Choose your next step:
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleStartGeneration}
                          className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isGenerating}
                        >
                          {isGenerating 
                            ? (countdown > 0 
                                ? `Generating... ${countdown}s` 
                                : "Almost ready! Applying final touches..."
                              )
                            : '✅ Payment Success - Generate!'
                          }
                        </button>
                        <button
                          onClick={handleCancelGeneration}
                          className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isGenerating}
                        >
                          ❌ Payment Failed - Cancel
                        </button>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Stripe Buy Button */}
                    <div className="relative">
                      {isGenerating && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                          <div className="flex items-center space-x-3 text-[#2c3e50]">
                            <div className="w-6 h-6 border-2 border-[#2c3e50] border-t-transparent rounded-full animate-spin"></div>
                            <span className="font-semibold">
                              {countdown > 0 
                                ? `Generating... ${countdown}s`
                                : "Almost ready! Applying final touches..."
                              }
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <StripeBuyButton 
                        disabled={!image || isGenerating}
                        className="w-full"
                        onPaymentClick={() => {
                          // 存储图片数据到localStorage
                          if (preview) {
                            console.log('Saving image data to localStorage for payment');
                            localStorage.setItem('pending_image', preview);
                            localStorage.setItem('pending_generation', 'true');
                            console.log('localStorage已设置:', {
                              pending_generation: localStorage.getItem('pending_generation'),
                              pending_image: localStorage.getItem('pending_image') ? 'has image data' : 'no image data'
                            });
                          } else {
                            console.log('Warning: No image preview data to save');
                          }
                        }}
                      />
                    </div>
                    
                    {image && !isGenerating && (
                      <div className="text-center">
                        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
                          <span className="text-blue-600 mr-2">💳</span>
                          <span className="text-blue-800 text-sm font-medium">
                            Click to open Stripe payment • Image generate
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}


              </div>
            </div>
          </div>
        </div>

        {/* Generation Preview Area */}
        {(isGenerating || generatedImage) && (
          <div className="max-w-4xl mx-auto mt-12">
            <div className="card">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">
                  {isGenerating ? '✨ Creating Your Ghibli Art' : '🎨 Your Studio Ghibli Avatar'}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-[#C4A484] to-[#E8D5B7] mx-auto rounded-full"></div>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-[#fff8e7] to-[#fef3e2] border border-[#C4A484]/20 rounded-2xl p-6 shadow-lg">
                  
                  {isGenerating ? (
                    /* Generating State */
                    <div className="relative min-h-[350px] bg-white/50 rounded-xl border-2 border-dashed border-[#C4A484]/30 flex flex-col items-center justify-center">
                      {/* Simple Loading Spinner */}
                      <div className="w-12 h-12 border-4 border-[#C4A484]/30 border-t-[#C4A484] rounded-full animate-spin mb-6"></div>
                      
                      {/* Generation Status */}
                      <div className="text-center space-y-3">
                        <h3 className="text-lg font-semibold text-[#2C3E50]">
                          {asyncStatus || 'Generating your image...'}
                        </h3>
                        <p className="text-[#34495E] text-sm max-w-md">
                          AI is transforming your photo into Studio Ghibli style artwork
                        </p>
                        <p className="text-[#C4A484] text-xs font-medium">
                          Please do not refresh the page.
                        </p>
                        
                        {/* Simple Progress */}
                        <div className="bg-white/80 rounded-lg px-4 py-2 inline-block">
                          <span className="text-[#2C3E50] font-medium">
                            {countdown > 0 ? `${countdown}s remaining` : 'Almost ready...'}
                          </span>
                        </div>
                        
                                                 {/* Task ID for debugging */}
                         {currentTaskId && (
                           <p className="text-xs text-gray-400 font-mono">
                             Task ID: {currentTaskId.substring(0, 8)}...
                           </p>
                         )}
                      </div>
                    </div>
                  ) : (
                    /* Generated Result */
                    <div className="space-y-4">
                      {/* Generated Image Display */}
                      <div className="relative rounded-xl overflow-hidden bg-white shadow-sm min-h-[350px]">
                        <img
                          src={generatedImage}
                          alt="Generated Ghibli Avatar"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            console.error('Image load error:', e);
                            setError('Generated image failed to load. Please try again.');
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully');
                          }}
                        />
                      </div>
                      
                      {/* Download Button */}
                      <div className="text-center space-y-2">
                        <button
                          onClick={downloadImage}
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#C4A484] to-[#E8D5B7] hover:from-[#B8956F] hover:to-[#D4C4A0] text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                        >
                          📥 Download Your Avatar
                        </button>
                        
                        {/* Alternative Save Method */}
                        <p className="text-xs text-gray-500">
                          If download fails, right-click image → "Save image as"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="heading text-center">FAQ</h2>
          <div className="grid gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="card">
                <h3 className="font-semibold text-[#2C3E50] mb-2">{faq.question}</h3>
                <p className="text-[#34495E]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-[#2C3E50] to-[#34495E] text-white mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            {/* Brand Section */}
            <div className="mb-6">
              <img
                src="/images/ghiblity-logo.png"
                alt="Ghiblity"
                className="h-8 w-auto filter brightness-0 invert mx-auto mb-4"
              />
              <p className="text-gray-300 max-w-md mx-auto leading-relaxed">
                Transform your photos into magical Studio Ghibli artwork with our AI-powered generator.
              </p>
            </div>

            {/* Contact */}
            <div className="mb-6">
              <a 
                href="mailto:oyyxdd@gmail.com" 
                className="inline-flex items-center text-[#C4A484] hover:text-white transition-colors"
              >
                <span className="text-lg mr-2">📧</span>
                <span>Contact us: oyyxdd@gmail.com</span>
              </a>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-600 pt-6 flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm">
                © 2025 Ghiblity. All rights reserved. Powered by AI magic ✨
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0 text-sm text-gray-400">
                <span>🔒 Secure payments via Stripe</span>
                <span>•</span>
                <span>🚀 Generated in 80-120 seconds</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

