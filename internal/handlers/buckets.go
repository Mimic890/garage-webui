package handlers

import (
	"Noooste/garage-ui/internal/models"
	"Noooste/garage-ui/internal/services"
	"github.com/gofiber/fiber/v3"
)

// BucketHandler handles bucket-related operations
type BucketHandler struct {
	s3Service *services.S3Service
}

// NewBucketHandler creates a new bucket handler
func NewBucketHandler(s3Service *services.S3Service) *BucketHandler {
	return &BucketHandler{
		s3Service: s3Service,
	}
}

// ListBuckets returns all buckets
// GET /api/v1/buckets
func (h *BucketHandler) ListBuckets(c fiber.Ctx) error {
	ctx := c.Context()

	// List all buckets from Garage
	buckets, err := h.s3Service.ListBuckets(ctx)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeListFailed, "Failed to list buckets: "+err.Error()),
		)
	}

	return c.JSON(models.SuccessResponse(buckets))
}

// CreateBucket creates a new bucket
// POST /api/v1/buckets
func (h *BucketHandler) CreateBucket(c fiber.Ctx) error {
	ctx := c.Context()

	// Parse request body
	var req models.CreateBucketRequest
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "Invalid request body: "+err.Error()),
		)
	}

	// Validate bucket name
	if req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(
			models.ErrorResponse(models.ErrCodeBadRequest, "Bucket name is required"),
		)
	}

	// Check if bucket already exists
	exists, err := h.s3Service.BucketExists(ctx, req.Name)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeInternalError, "Failed to check bucket existence: "+err.Error()),
		)
	}

	if exists {
		return c.Status(fiber.StatusConflict).JSON(
			models.ErrorResponse(models.ErrCodeBucketExists, "Bucket already exists"),
		)
	}

	// Create the bucket
	if err := h.s3Service.CreateBucket(ctx, req.Name); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeInternalError, "Failed to create bucket: "+err.Error()),
		)
	}

	// Return success response
	response := map[string]interface{}{
		"bucket":  req.Name,
		"message": "Bucket created successfully",
	}

	return c.Status(fiber.StatusCreated).JSON(models.SuccessResponse(response))
}

// DeleteBucket deletes a bucket
// DELETE /api/v1/buckets/:name
func (h *BucketHandler) DeleteBucket(c fiber.Ctx) error {
	ctx := c.Context()

	// Get bucket name from URL parameter
	bucketName := c.Params("name")
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

	// Delete the bucket
	if err := h.s3Service.DeleteBucket(ctx, bucketName); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeDeleteFailed, "Failed to delete bucket: "+err.Error()),
		)
	}

	// Return success response
	response := map[string]interface{}{
		"bucket":  bucketName,
		"message": "Bucket deleted successfully",
	}

	return c.JSON(models.SuccessResponse(response))
}

// GetBucketInfo returns information about a specific bucket
// GET /api/v1/buckets/:name
func (h *BucketHandler) GetBucketInfo(c fiber.Ctx) error {
	ctx := c.Context()

	// Get bucket name from URL parameter
	bucketName := c.Params("name")
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

	// List all buckets to find this one and get its info
	buckets, err := h.s3Service.ListBuckets(ctx)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			models.ErrorResponse(models.ErrCodeInternalError, "Failed to get bucket info: "+err.Error()),
		)
	}

	// Find the specific bucket
	for _, bucket := range buckets.Buckets {
		if bucket.Name == bucketName {
			return c.JSON(models.SuccessResponse(bucket))
		}
	}

	return c.Status(fiber.StatusNotFound).JSON(
		models.ErrorResponse(models.ErrCodeBucketNotFound, "Bucket not found"),
	)
}
