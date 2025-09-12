-- 设置头像存储功能的SQL脚本
-- 1. 创建avatars存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. 创建avatars存储桶的RLS策略
-- 用户只能上传自己的头像
CREATE POLICY "用户只能上传自己的头像" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 用户只能更新自己的头像
CREATE POLICY "用户只能更新自己的头像" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 用户只能删除自己的头像
CREATE POLICY "用户只能删除自己的头像" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 所有人都可以查看头像（公开读取）
CREATE POLICY "所有人都可以查看头像" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 3. 确保profiles表有avatar_url字段
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 4. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url 
ON profiles(avatar_url) WHERE avatar_url IS NOT NULL;

-- 5. 创建函数检查头像文件是否属于当前用户
CREATE OR REPLACE FUNCTION check_avatar_owner(file_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT auth.uid()::text = (storage.foldername(file_path))[1]
  );
END;
$$;