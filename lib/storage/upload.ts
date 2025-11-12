import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  ...(process.env.AWS_ENDPOINT && { endpoint: process.env.AWS_ENDPOINT }),
})

export async function generatePresignedUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME || '',
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  return url
}

export function getPublicUrl(key: string): string {
  const bucket = process.env.AWS_S3_BUCKET_NAME || ''
  const region = process.env.AWS_REGION || 'us-east-1'
  
  // For Cloudflare R2
  if (process.env.AWS_ENDPOINT) {
    return `${process.env.AWS_ENDPOINT}/${bucket}/${key}`
  }
  
  // For AWS S3
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const isVideo = file.type.startsWith('video/')
  const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024 // 50MB for video, 10MB for others
  
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Video formats
    'video/mp4',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
    'video/webm',
  ]

  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: isVideo 
        ? 'Video size must be less than 50MB' 
        : 'File size must be less than 10MB' 
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed: PDF, Images, Word documents, Videos (MP4, MOV, AVI, WebM)',
    }
  }

  return { valid: true }
}

export function generateUniqueKey(
  userId: string,
  assignmentId: string,
  filename: string
): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `submissions/${userId}/${assignmentId}/${timestamp}-${sanitizedFilename}`
}

