-- ===================================================================
-- 修复 MIME 类型限制问题
-- ===================================================================

-- 更新存储桶配置，允许更多 MIME 类型
DO $$
BEGIN
  UPDATE storage.buckets 
  SET 
    file_size_limit = 10485760,  -- 10MB
    allowed_mime_types = ARRAY[
      'image/png', 
      'image/jpeg', 
      'image/jpg', 
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/svg+xml',
      'text/plain',  -- 用于测试
      'application/octet-stream'  -- 通用二进制类型
    ]
  WHERE id = 'feedback-attachments';
  
  RAISE NOTICE '✅ 更新了 MIME 类型限制';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ 更新 MIME 类型失败: %', SQLERRM;
END $$;

-- 或者完全移除 MIME 类型限制（更宽松的方式）
DO $$
BEGIN
  UPDATE storage.buckets 
  SET 
    allowed_mime_types = NULL  -- NULL 表示允许所有类型
  WHERE id = 'feedback-attachments';
  
  RAISE NOTICE '✅ 移除了 MIME 类型限制（允许所有文件类型）';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ 移除 MIME 类型限制失败: %', SQLERRM;
END $$;

-- 验证更新
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  updated_at
FROM storage.buckets 
WHERE id = 'feedback-attachments';

SELECT '✅ MIME 类型限制已修复，请重新测试上传功能！' as status;
