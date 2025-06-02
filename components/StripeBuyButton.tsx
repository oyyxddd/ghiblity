'use client';

interface StripeBuyButtonProps {
  disabled?: boolean;
  className?: string;
  onPaymentClick?: () => void;
}

export default function StripeBuyButton({ 
  disabled = false, 
  className = "",
  onPaymentClick 
}: StripeBuyButtonProps) {
  
  const handleClick = () => {
    if (disabled) return;
    
    // 触发回调函数（用于保存图片数据等）
    if (onPaymentClick) {
      onPaymentClick();
    }
    
    // 跳转到 Stripe 支付页面
    window.open('https://buy.stripe.com/fZu9AS4Td3xA4kY3hC8IU00', '_blank');
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`group relative w-full transition-all duration-300 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'} ${className}`}
    >
      {disabled ? (
        /* 禁用状态 */
        <div className="w-full h-[60px] px-6 text-[18px] font-bold text-white bg-gray-400 rounded-[16px] flex items-center justify-center space-x-2
        sm:h-[56px] sm:text-[16px] sm:rounded-[14px] 
        lg:h-[64px] lg:text-[20px] lg:px-8 lg:rounded-[18px]
        xl:h-[68px] xl:text-[22px] xl:px-10 xl:rounded-[20px]">
          <span>📷</span>
          <span>Upload an image first</span>
        </div>
      ) : (
        /* 正常状态 */
        <div className="w-full bg-gradient-to-r from-[#2c3e50] to-[#34495e] hover:from-[#34495e] hover:to-[#2c3e50] text-white font-bold rounded-[16px] shadow-lg hover:shadow-xl transition-all duration-300
        h-[60px] text-[18px] px-[32px] flex items-center justify-center
        sm:h-[56px] sm:text-[16px] sm:px-[28px] sm:rounded-[14px]
        lg:h-[64px] lg:text-[20px] lg:px-[36px] lg:rounded-[18px]
        xl:h-[68px] xl:text-[22px] xl:px-[40px] xl:rounded-[20px]">
          <span className="flex items-center space-x-3">
            <span>✨</span>
            <span>CREATE ART 99¢</span>
          </span>
        </div>
      )}
    </button>
  );
} 