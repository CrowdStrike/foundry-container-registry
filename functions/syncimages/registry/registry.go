package registry

import (
	"context"
	"encoding/base64"
	"fmt"

	"github.com/containers/image/v5/docker"
	"github.com/containers/image/v5/docker/reference"
	"github.com/containers/image/v5/types"
)

// Config contains the user, password, and token for the registry.
type Config struct {
	User  string
	Pass  string
	Token string
}

// getImageRef returns a reference to the specified image.
func getImageRef(sensor string) (types.ImageReference, error) {
	ref, err := reference.ParseNormalizedNamed(sensor)
	if err != nil {
		return nil, fmt.Errorf("Error parsing reference: %w", err)
	}

	if !reference.IsNameOnly(ref) {
		return nil, fmt.Errorf("No tag or digest allowed in reference: %v", ref.String())
	}

	return docker.NewReference(reference.TagNameOnly(ref))
}

// dockerConfig returns the context and system context for the Docker client.
func (rc Config) dockerConfig() (context.Context, *types.SystemContext) {
	ctx := context.Background()
	sysCtx := &types.SystemContext{}

	if rc.User != "" {
		sysCtx = &types.SystemContext{
			DockerAuthConfig: &types.DockerAuthConfig{
				Username: rc.User,
				Password: rc.Pass,
			},
		}
	}

	return ctx, sysCtx
}

// GetRepositoryTags returns a list of tags for the specified image.
func (rc Config) GetRepositoryTags(image string) ([]string, error) {
	ctx, sysCtx := rc.dockerConfig()

	imgRef, err := getImageRef(image)
	if err != nil {
		return nil, fmt.Errorf("Error creating image reference: %v", err)
	}

	tags, err := docker.GetRepositoryTags(ctx, sysCtx, imgRef)
	if err != nil {
		return nil, fmt.Errorf("Error listing repository tags: %w", err)
	}

	return tags, nil
}

// GetImageDigest returns the digest for the specified image and tag.
func (rc Config) GetImageDigest(image string, tag string) (string, error) {
	ctx, sysCtx := rc.dockerConfig()

	image = fmt.Sprintf("//%s:%s", image, tag)
	imgRef, err := docker.ParseReference(image)
	if err != nil {
		return "", fmt.Errorf("Error parsing reference: %w", err)
	}

	digest, err := docker.GetDigest(ctx, sysCtx, imgRef)
	if err != nil {
		return "", fmt.Errorf("Error getting digest: %w", err)
	}

	return digest.String(), nil
}

// DockerConfigJson returns the Docker configuration JSON for the registry.
func (rc Config) DockerConfigJson(registry string) string {
	base64EncodedCreds := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(`%s:%s`, rc.User, rc.Pass)))
	base64EncodedAuth := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(`{"auths":{"%s":{"auth": "%s"}}}`, registry, base64EncodedCreds)))
	return base64EncodedAuth
}
