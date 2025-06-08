-- 创建头像生成任务表
CREATE TABLE IF NOT EXISTS avatar_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  original_image_base64 TEXT NOT NULL,
  generated_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用触发器到avatar_generations表
CREATE TRIGGER update_avatar_generations_updated_at 
  BEFORE UPDATE ON avatar_generations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_avatar_generations_status ON avatar_generations(status);
CREATE INDEX IF NOT EXISTS idx_avatar_generations_created_at ON avatar_generations(created_at);

-- 插入示例数据（可选，仅用于测试）
-- INSERT INTO avatar_generations (user_email, original_image_base64, status) 
-- VALUES ('test@example.com', 'data:image/png;base64,test...', 'pending'); 