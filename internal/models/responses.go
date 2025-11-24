package models

import "time"

// APIResponse is the standard response structure for all API endpoints
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
}

// APIError represents an error in the API response
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Version   string    `json:"version"`
}

// BucketInfo represents information about a bucket
type BucketInfo struct {
	Name         string    `json:"name"`
	CreationDate time.Time `json:"creation_date"`
	Region       string    `json:"region,omitempty"`
}

// BucketListResponse represents a list of buckets
type BucketListResponse struct {
	Buckets []BucketInfo `json:"buckets"`
	Count   int          `json:"count"`
}

// ObjectInfo represents information about an object
type ObjectInfo struct {
	Key          string    `json:"key"`
	Size         int64     `json:"size"`
	LastModified time.Time `json:"last_modified"`
	ETag         string    `json:"etag"`
	ContentType  string    `json:"content_type,omitempty"`
	StorageClass string    `json:"storage_class,omitempty"`
}

// ObjectListResponse represents a list of objects in a bucket
type ObjectListResponse struct {
	Bucket      string       `json:"bucket"`
	Objects     []ObjectInfo `json:"objects"`
	Count       int          `json:"count"`
	IsTruncated bool         `json:"is_truncated"`
	NextMarker  string       `json:"next_marker,omitempty"`
}

// ObjectUploadResponse represents the response after uploading an object
type ObjectUploadResponse struct {
	Bucket      string `json:"bucket"`
	Key         string `json:"key"`
	ETag        string `json:"etag"`
	Size        int64  `json:"size"`
	ContentType string `json:"content_type"`
}

// ObjectDeleteResponse represents the response after deleting an object
type ObjectDeleteResponse struct {
	Bucket  string `json:"bucket"`
	Key     string `json:"key"`
	Deleted bool   `json:"deleted"`
}

// UserInfo represents information about a Garage user (key pair)
type UserInfo struct {
	AccessKey   string    `json:"access_key"`
	Name        string    `json:"name,omitempty"`
	Permissions []string  `json:"permissions,omitempty"`
	CreatedAt   time.Time `json:"created_at,omitempty"`
}

// UserListResponse represents a list of users/keys
type UserListResponse struct {
	Users []UserInfo `json:"users"`
	Count int        `json:"count"`
}

// Helper functions to create standard responses

// SuccessResponse creates a successful API response
func SuccessResponse(data interface{}) APIResponse {
	return APIResponse{
		Success: true,
		Data:    data,
		Error:   nil,
	}
}

// ErrorResponse creates an error API response
func ErrorResponse(code, message string) APIResponse {
	return APIResponse{
		Success: false,
		Data:    nil,
		Error: &APIError{
			Code:    code,
			Message: message,
		},
	}
}

// Common error codes
const (
	ErrCodeBadRequest          = "BAD_REQUEST"
	ErrCodeUnauthorized        = "UNAUTHORIZED"
	ErrCodeForbidden           = "FORBIDDEN"
	ErrCodeNotFound            = "NOT_FOUND"
	ErrCodeConflict            = "CONFLICT"
	ErrCodeInternalError       = "INTERNAL_ERROR"
	ErrCodeBucketExists        = "BUCKET_ALREADY_EXISTS"
	ErrCodeBucketNotFound      = "BUCKET_NOT_FOUND"
	ErrCodeObjectNotFound      = "OBJECT_NOT_FOUND"
	ErrCodeInvalidBucketName   = "INVALID_BUCKET_NAME"
	ErrCodeInvalidObjectKey    = "INVALID_OBJECT_KEY"
	ErrCodeUploadFailed        = "UPLOAD_FAILED"
	ErrCodeDeleteFailed        = "DELETE_FAILED"
	ErrCodeListFailed          = "LIST_FAILED"
)
