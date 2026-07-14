import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export interface PresignedUpload {
  storageKey: string;
  uploadUrl: string;
  publicUrl: string;
  expiresIn: number;
}

/**
 * S3 (ou MinIO) com presigned URLs. Sem credenciais configuradas,
 * cai num modo local de desenvolvimento que devolve URLs fake —
 * o fluxo de avaliação continua 100% demonstrável.
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client | null = null;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('s3.bucket') ?? 'priceai-photos';
    const accessKey = this.config.get<string>('s3.accessKey');
    const secretKey = this.config.get<string>('s3.secretKey');
    if (accessKey && secretKey) {
      this.client = new S3Client({
        region: this.config.get<string>('s3.region') ?? 'us-east-1',
        endpoint: this.config.get<string>('s3.endpoint') || undefined,
        forcePathStyle: this.config.get<boolean>('s3.forcePathStyle') ?? true,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      });
    } else {
      this.logger.warn('S3 não configurado — presign em modo local (URLs fake p/ dev).');
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async presignUpload(prefix: string, contentType: string): Promise<PresignedUpload> {
    const ext = contentType.split('/')[1] ?? 'jpg';
    const storageKey = `${prefix}/${randomUUID()}.${ext}`;
    const expiresIn = 900;

    if (!this.client) {
      // Modo dev local: sem storage real, o front pode pular o upload.
      return {
        storageKey,
        uploadUrl: `http://localhost:3001/dev-uploads/${storageKey}`,
        publicUrl: `https://placehold.co/800x600?text=${encodeURIComponent(storageKey.slice(-12))}`,
        expiresIn,
      };
    }

    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: storageKey, ContentType: contentType }),
      { expiresIn },
    );
    const endpoint = this.config.get<string>('s3.endpoint') ?? 'https://s3.amazonaws.com';
    return {
      storageKey,
      uploadUrl,
      publicUrl: `${endpoint}/${this.bucket}/${storageKey}`,
      expiresIn,
    };
  }

  async presignGet(storageKey: string): Promise<string> {
    if (!this.client) {
      return `https://placehold.co/800x600?text=${encodeURIComponent(storageKey.slice(-12))}`;
    }
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      { expiresIn: 3600 },
    );
  }
}
