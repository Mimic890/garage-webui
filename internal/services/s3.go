package services

import (
	"context"
	"fmt"
	"io"
	"time"

	"Noooste/garage-ui/internal/config"
	"Noooste/garage-ui/internal/models"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// S3Service handles all S3 operations with Garage
type S3Service struct {
	client *s3.Client
	config *config.GarageConfig
}

// NewS3Service creates a new S3 service instance
func NewS3Service(cfg *config.GarageConfig) *S3Service {
	// Create AWS credentials from Garage config
	creds := credentials.NewStaticCredentialsProvider(
		cfg.AccessKey,
		cfg.SecretKey,
		"", // session token (not used for Garage)
	)

	// Configure S3 client for Garage
	s3Config := aws.Config{
		Region:      cfg.Region,
		Credentials: creds,
	}

	// Create S3 client with custom endpoint resolver for Garage
	client := s3.NewFromConfig(s3Config, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(cfg.Endpoint)
		o.UsePathStyle = cfg.ForcePathStyle
	})

	return &S3Service{
		client: client,
		config: cfg,
	}
}

// ListBuckets retrieves all buckets from Garage
func (s *S3Service) ListBuckets(ctx context.Context) (*models.BucketListResponse, error) {
	// Call S3 ListBuckets API
	result, err := s.client.ListBuckets(ctx, &s3.ListBucketsInput{})
	if err != nil {
		return nil, fmt.Errorf("failed to list buckets: %w", err)
	}

	// Convert S3 buckets to our model
	buckets := make([]models.BucketInfo, 0, len(result.Buckets))
	for _, bucket := range result.Buckets {
		buckets = append(buckets, models.BucketInfo{
			Name:         aws.ToString(bucket.Name),
			CreationDate: aws.ToTime(bucket.CreationDate),
		})
	}

	return &models.BucketListResponse{
		Buckets: buckets,
		Count:   len(buckets),
	}, nil
}

// CreateBucket creates a new bucket in Garage
func (s *S3Service) CreateBucket(ctx context.Context, bucketName string) error {
	// Create bucket input
	input := &s3.CreateBucketInput{
		Bucket: aws.String(bucketName),
	}

	// Call S3 CreateBucket API
	_, err := s.client.CreateBucket(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to create bucket %s: %w", bucketName, err)
	}

	return nil
}

// DeleteBucket deletes a bucket from Garage
func (s *S3Service) DeleteBucket(ctx context.Context, bucketName string) error {
	// Call S3 DeleteBucket API
	_, err := s.client.DeleteBucket(ctx, &s3.DeleteBucketInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		return fmt.Errorf("failed to delete bucket %s: %w", bucketName, err)
	}

	return nil
}

// BucketExists checks if a bucket exists
func (s *S3Service) BucketExists(ctx context.Context, bucketName string) (bool, error) {
	_, err := s.client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		// Check if it's a "not found" error
		return false, nil
	}
	return true, nil
}

// ListObjects lists objects in a bucket with optional prefix filter
func (s *S3Service) ListObjects(ctx context.Context, bucketName, prefix string, maxKeys int) (*models.ObjectListResponse, error) {
	// Set default max keys if not specified
	if maxKeys <= 0 {
		maxKeys = 1000
	}

	// Create list objects input
	input := &s3.ListObjectsV2Input{
		Bucket:  aws.String(bucketName),
		MaxKeys: aws.Int32(int32(maxKeys)),
	}

	if prefix != "" {
		input.Prefix = aws.String(prefix)
	}

	// Call S3 ListObjectsV2 API
	result, err := s.client.ListObjectsV2(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to list objects in bucket %s: %w", bucketName, err)
	}

	// Convert S3 objects to our model
	objects := make([]models.ObjectInfo, 0, len(result.Contents))
	for _, obj := range result.Contents {
		objects = append(objects, models.ObjectInfo{
			Key:          aws.ToString(obj.Key),
			Size:         aws.ToInt64(obj.Size),
			LastModified: aws.ToTime(obj.LastModified),
			ETag:         aws.ToString(obj.ETag),
			StorageClass: string(obj.StorageClass),
		})
	}

	return &models.ObjectListResponse{
		Bucket:      bucketName,
		Objects:     objects,
		Count:       len(objects),
		IsTruncated: aws.ToBool(result.IsTruncated),
		NextMarker:  aws.ToString(result.NextContinuationToken),
	}, nil
}

// UploadObject uploads an object to a bucket
func (s *S3Service) UploadObject(ctx context.Context, bucketName, key string, body io.Reader, contentType string) (*models.ObjectUploadResponse, error) {
	// Create put object input
	input := &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
		Body:   body,
	}

	if contentType != "" {
		input.ContentType = aws.String(contentType)
	}

	// Call S3 PutObject API
	result, err := s.client.PutObject(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to upload object %s to bucket %s: %w", key, bucketName, err)
	}

	// Get object metadata to return size
	headResult, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})

	var size int64
	if err == nil {
		size = aws.ToInt64(headResult.ContentLength)
	}

	return &models.ObjectUploadResponse{
		Bucket:      bucketName,
		Key:         key,
		ETag:        aws.ToString(result.ETag),
		Size:        size,
		ContentType: contentType,
	}, nil
}

// GetObject retrieves an object from a bucket
func (s *S3Service) GetObject(ctx context.Context, bucketName, key string) (io.ReadCloser, *models.ObjectInfo, error) {
	// Call S3 GetObject API
	result, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get object %s from bucket %s: %w", key, bucketName, err)
	}

	// Create object info
	objectInfo := &models.ObjectInfo{
		Key:          key,
		Size:         aws.ToInt64(result.ContentLength),
		LastModified: aws.ToTime(result.LastModified),
		ETag:         aws.ToString(result.ETag),
		ContentType:  aws.ToString(result.ContentType),
	}

	return result.Body, objectInfo, nil
}

// DeleteObject deletes an object from a bucket
func (s *S3Service) DeleteObject(ctx context.Context, bucketName, key string) error {
	// Call S3 DeleteObject API
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("failed to delete object %s from bucket %s: %w", key, bucketName, err)
	}

	return nil
}

// ObjectExists checks if an object exists in a bucket
func (s *S3Service) ObjectExists(ctx context.Context, bucketName, key string) (bool, error) {
	_, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return false, nil
	}
	return true, nil
}

// GetObjectMetadata retrieves metadata for an object without downloading it
func (s *S3Service) GetObjectMetadata(ctx context.Context, bucketName, key string) (*models.ObjectInfo, error) {
	result, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get metadata for object %s in bucket %s: %w", key, bucketName, err)
	}

	return &models.ObjectInfo{
		Key:          key,
		Size:         aws.ToInt64(result.ContentLength),
		LastModified: aws.ToTime(result.LastModified),
		ETag:         aws.ToString(result.ETag),
		ContentType:  aws.ToString(result.ContentType),
	}, nil
}

// DeleteMultipleObjects deletes multiple objects from a bucket
func (s *S3Service) DeleteMultipleObjects(ctx context.Context, bucketName string, keys []string) error {
	if len(keys) == 0 {
		return nil
	}

	// Create delete objects for batch deletion
	objects := make([]types.ObjectIdentifier, len(keys))
	for i, key := range keys {
		objects[i] = types.ObjectIdentifier{
			Key: aws.String(key),
		}
	}

	// Call S3 DeleteObjects API (batch delete)
	_, err := s.client.DeleteObjects(ctx, &s3.DeleteObjectsInput{
		Bucket: aws.String(bucketName),
		Delete: &types.Delete{
			Objects: objects,
			Quiet:   aws.Bool(false),
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete multiple objects from bucket %s: %w", bucketName, err)
	}

	return nil
}

// GetPresignedURL generates a pre-signed URL for temporary access to an object
// This is useful for sharing files without exposing credentials
func (s *S3Service) GetPresignedURL(ctx context.Context, bucketName, key string, expiresIn time.Duration) (string, error) {
	// Create presign client
	presignClient := s3.NewPresignClient(s.client)

	// Generate presigned GET request
	presignResult, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = expiresIn
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL for %s/%s: %w", bucketName, key, err)
	}

	return presignResult.URL, nil
}
