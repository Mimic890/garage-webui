package handlers

import (
	"io"
	"time"

	"Noooste/garage-ui/internal/models"
	"Noooste/garage-ui/internal/services"
	"github.com/gofiber/fiber/v3"
)

// ObjectHandler handles object-related operations
type ObjectHandler struct {
	s3Service *services.S3Service
}

// NewObjectHandler creates a new object handler
func NewObjectHandler(s3Service *services.S3Service) *ObjectHandler {
	return &ObjectHandler{
		s3Service: s3Service,
	}
}

// ListObjects returns all objects in a bucket
// GET /api/v1/buckets/:bucket/objects
func (h *ObjectHandler) ListObjects(c fiber.Ctx) error {
	ctx := c.Context()

	// Get bucket name from URL parameter
	bucketName := c.Params("bucket")
	if bucketName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "Bucket name is required"),
		)
	}

	// Get query parameters for filtering
	prefix := c.Query("prefix", "")
	maxKeys := c.QueryInt("max_keys", 1000)

	// Check if bucket exists
	exists, err := h.s3Service.BucketExists(ctx, bucketName)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeInternalError, "Failed to check bucket existence: "+err.Error()),
		)
	}

	if !exists {
		return c.Status(fiber.StatusNotFound).JSON(
			models.ErrorResponse(models.ErrCodeBucketNotFound, "Bucket not found"),
		)
	}

	// List objects in the bucket
	objects, err := h.s3Service.ListObjects(ctx, bucketName, prefix, maxKeys)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeListFailed, "Failed to list objects: "+err.Error()),
		)
	}

	return c.JSON(models.SuccessResponse(objects))
}

// UploadObject uploads a file to a bucket
// POST /api/v1/buckets/:bucket/objects
func (h *ObjectHandler) UploadObject(c fiber.Ctx) error {
	ctx := c.Context()

	// Get bucket name from URL parameter
	bucketName := c.Params("bucket")
	if bucketName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "Bucket name is required"),
		)
	}

	// Check if bucket exists
	exists, err := h.s3Service.BucketExists(ctx, bucketName)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeInternalError, "Failed to check bucket existence: "+err.Error()),
		)
	}

	if !exists {
		return c.Status(fiber.StatusNotFound).JSON(
			models.ErrorResponse(models.ErrCodeBucketNotFound, "Bucket not found"),
		)
	}

	// Get file from multipart form
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "File is required: "+err.Error()),
		)
	}

	// Get object key (path in bucket)
	key := c.FormValue("key")
	if key == "" {
		// Use filename as key if not provided
		key = file.Filename
	}

	// Open the uploaded file
	fileHandle, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeUploadFailed, "Failed to open uploaded file: "+err.Error()),
		)
	}
	defer fileHandle.Close()

	// Get content type
	contentType := file.Header.Get("Content-Type")

	// Upload to Garage
	uploadResult, err := h.s3Service.UploadObject(ctx, bucketName, key, fileHandle, contentType)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeUploadFailed, "Failed to upload object: "+err.Error()),
		)
	}

	return c.Status(fiber.StatusCreated).JSON(models.SuccessResponse(uploadResult))
}

// GetObject downloads an object from a bucket
// GET /api/v1/buckets/:bucket/objects/:key
func (h *ObjectHandler) GetObject(c fiber.Ctx) error {
	ctx := c.Context()

	// Get bucket name and object key from URL parameters
	bucketName := c.Params("bucket")
	key := c.Params("key")

	if bucketName == "" || key == "" {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "Bucket name and object key are required"),
		)
	}

	// Get object from Garage
	body, objectInfo, err := h.s3Service.GetObject(ctx, bucketName, key)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(
			models.ErrorResponse(models.ErrCodeObjectNotFound, "Object not found: "+err.Error()),
		)
	}
	defer body.Close()

	// Set response headers
	c.Set("Content-Type", objectInfo.ContentType)
	c.Set("Content-Length", string(rune(objectInfo.Size)))
	c.Set("ETag", objectInfo.ETag)
	c.Set("Last-Modified", objectInfo.LastModified.Format(time.RFC1123))

	// Check if client wants to download or view inline
	if c.Query("download") == "true" {
		c.Set("Content-Disposition", "attachment; filename=\""+key+"\"")
	}

	// Stream the object body to the client
	return c.SendStream(body)
}

// DeleteObject deletes an object from a bucket
// DELETE /api/v1/buckets/:bucket/objects/:key
func (h *ObjectHandler) DeleteObject(c fiber.Ctx) error {
	ctx := c.Context()

	// Get bucket name and object key from URL parameters
	bucketName := c.Params("bucket")
	key := c.Params("key")

	if bucketName == "" || key == "" {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "Bucket name and object key are required"),
		)
	}

	// Check if object exists
	exists, err := h.s3Service.ObjectExists(ctx, bucketName, key)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeInternalError, "Failed to check object existence: "+err.Error()),
		)
	}

	if !exists {
		return c.Status(fiber.StatusNotFound).JSON(
			models.ErrorResponse(models.ErrCodeObjectNotFound, "Object not found"),
		)
	}

	// Delete the object
	if err := h.s3Service.DeleteObject(ctx, bucketName, key); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeDeleteFailed, "Failed to delete object: "+err.Error()),
		)
	}

	// Return success response
	response := models.ObjectDeleteResponse{
		Bucket:  bucketName,
		Key:     key,
		Deleted: true,
	}

	return c.JSON(models.SuccessResponse(response))
}

// GetObjectMetadata returns metadata for an object without downloading it
// HEAD /api/v1/buckets/:bucket/objects/:key
func (h *ObjectHandler) GetObjectMetadata(c fiber.Ctx) error {
	ctx := c.Context()

	// Get bucket name and object key from URL parameters
	bucketName := c.Params("bucket")
	key := c.Params("key")

	if bucketName == "" || key == "" {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "Bucket name and object key are required"),
		)
	}

	// Get object metadata
	metadata, err := h.s3Service.GetObjectMetadata(ctx, bucketName, key)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(
			models.ErrorResponse(models.ErrCodeObjectNotFound, "Object not found: "+err.Error()),
		)
	}

	return c.JSON(models.SuccessResponse(metadata))
}

// GetPresignedURL generates a temporary pre-signed URL for an object
// POST /api/v1/buckets/:bucket/objects/:key/presign
func (h *ObjectHandler) GetPresignedURL(c fiber.Ctx) error {
	ctx := c.Context()

	// Get bucket name and object key from URL parameters
	bucketName := c.Params("bucket")
	key := c.Params("key")

	if bucketName == "" || key == "" {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "Bucket name and object key are required"),
		)
	}

	// Get expiration time from query parameter (default: 1 hour)
	expiresIn := c.QueryInt("expires_in", 3600)
	if expiresIn <= 0 || expiresIn > 604800 { // Max 7 days
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "Invalid expiration time (must be between 1 and 604800 seconds)"),
		)
	}

	// Check if object exists
	exists, err := h.s3Service.ObjectExists(ctx, bucketName, key)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeInternalError, "Failed to check object existence: "+err.Error()),
		)
	}

	if !exists {
		return c.Status(fiber.StatusNotFound).JSON(
			models.ErrorResponse(models.ErrCodeObjectNotFound, "Object not found"),
		)
	}

	// Generate pre-signed URL
	url, err := h.s3Service.GetPresignedURL(ctx, bucketName, key, time.Duration(expiresIn)*time.Second)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeInternalError, "Failed to generate pre-signed URL: "+err.Error()),
		)
	}

	response := map[string]interface{}{
		"url":        url,
		"expires_in": expiresIn,
		"bucket":     bucketName,
		"key":        key,
	}

	return c.JSON(models.SuccessResponse(response))
}

// DeleteMultipleObjects deletes multiple objects from a bucket
// DELETE /api/v1/buckets/:bucket/objects
func (h *ObjectHandler) DeleteMultipleObjects(c fiber.Ctx) error {
	ctx := c.Context()

	// Get bucket name from URL parameter
	bucketName := c.Params("bucket")
	if bucketName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "Bucket name is required"),
		)
	}

	// Parse request body to get keys
	var req struct {
		Keys []string `json:"keys"`
	}
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "Invalid request body: "+err.Error()),
		)
	}

	if len(req.Keys) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "At least one key is required"),
		)
	}

	// Delete multiple objects
	if err := h.s3Service.DeleteMultipleObjects(ctx, bucketName, req.Keys); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeDeleteFailed, "Failed to delete objects: "+err.Error()),
		)
	}

	response := map[string]interface{}{
		"bucket":  bucketName,
		"deleted": len(req.Keys),
		"keys":    req.Keys,
	}

	return c.JSON(models.SuccessResponse(response))
}

// UploadObjectStream uploads an object from request body stream (for large files)
// PUT /api/v1/buckets/:bucket/objects/:key
func (h *ObjectHandler) UploadObjectStream(c fiber.Ctx) error {
	ctx := c.Context()

	// Get bucket name and object key from URL parameters
	bucketName := c.Params("bucket")
	key := c.Params("key")

	if bucketName == "" || key == "" {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "Bucket name and object key are required"),
		)
	}

	// Check if bucket exists
	exists, err := h.s3Service.BucketExists(ctx, bucketName)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeInternalError, "Failed to check bucket existence: "+err.Error()),
		)
	}

	if !exists {
		return c.Status(fiber.StatusNotFound).JSON(
			models.ErrorResponse(models.ErrCodeBucketNotFound, "Bucket not found"),
		)
	}

	// Get content type from header
	contentType := c.Get("Content-Type", "application/octet-stream")

	// Get request body as reader
	bodyReader := c.Request().BodyStream()

	// Upload to Garage
	uploadResult, err := h.s3Service.UploadObject(ctx, bucketName, key, io.NopCloser(bodyReader), contentType)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeUploadFailed, "Failed to upload object: "+err.Error()),
		)
	}

	return c.Status(fiber.StatusCreated).JSON(models.SuccessResponse(uploadResult))
}
