package registry

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"

	"github.com/containers/image/v5/docker"
	"github.com/containers/image/v5/docker/reference"
	"github.com/containers/image/v5/manifest"
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
		return nil, fmt.Errorf("error parsing reference: %w", err)
	}

	if !reference.IsNameOnly(ref) {
		return nil, fmt.Errorf("no tag or digest allowed in reference: %v", ref.String())
	}

	return docker.NewReference(reference.TagNameOnly(ref))
}

// dockerConfig returns the context and system context for the Docker client.
func (rc Config) dockerConfig() (context.Context, *types.SystemContext) {
	ctx := context.Background()
	sysCtx := &types.SystemContext{
		DockerAuthConfig: &types.DockerAuthConfig{
			Username: rc.User,
			Password: rc.Pass,
		},
	}

	return ctx, sysCtx
}

// GetRepositoryTags returns a list of tags for the specified image.
func (rc Config) GetRepositoryTags(image string) ([]string, error) {
	ctx, sysCtx := rc.dockerConfig()

	imgRef, err := getImageRef(image)
	if err != nil {
		return nil, fmt.Errorf("error creating image reference: %v", err)
	}

	tags, err := docker.GetRepositoryTags(ctx, sysCtx, imgRef)
	if err != nil {
		return nil, fmt.Errorf("error listing repository tags: %v", err)
	}

	return tags, nil
}

// GetImageDigest returns the digest for the specified image and tag.
func (rc Config) GetImageDigest(image string, tag string) (string, error) {
	ctx, sysCtx := rc.dockerConfig()

	image = fmt.Sprintf("//%s:%s", image, tag)
	imgRef, err := docker.ParseReference(image)
	if err != nil {
		return "", fmt.Errorf("error parsing reference: %v", err)
	}

	digest, err := docker.GetDigest(ctx, sysCtx, imgRef)
	if err != nil {
		return "", fmt.Errorf("error getting digest: %v", err)
	}

	return digest.String(), nil
}

// GetImageArchitecture returns the architecture for the specified image and tag.
func (rc Config) GetImageArchitecture(image string, tag string) ([]string, error) {
	ctx, sysCtx := rc.dockerConfig()

	image = fmt.Sprintf("//%s:%s", image, tag)
	imgRef, err := docker.ParseReference(image)
	if err != nil {
		return nil, fmt.Errorf("error parsing reference: %w", err)
	}

	src, err := imgRef.NewImageSource(ctx, sysCtx)
	if err != nil {
		return nil, fmt.Errorf("error creating image source: %w", err)
	}
	defer src.Close()

	manifestBytes, manifestType, err := src.GetManifest(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("error getting manifest: %w", err)
	}

	switch manifestType {
	case "application/vnd.docker.distribution.manifest.list.v2+json":
		return getMultiImageArch(manifestBytes)
	case "application/vnd.docker.distribution.manifest.v2+json":
		return rc.getSingleImageArche(imgRef, ctx, sysCtx)
	default:
		return nil, fmt.Errorf("unsupported manifest type: %s", manifestType)
	}
}

// DockerConfigJson returns the Docker configuration JSON for the registry.
func (rc Config) DockerConfigJson(registry string) string {
	base64EncodedCreds := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(`%s:%s`, rc.User, rc.Pass)))
	base64EncodedAuth := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(`{"auths":{"%s":{"auth": "%s"}}}`, registry, base64EncodedCreds)))

	return base64EncodedAuth
}

// getMultiImageArch returns the architecture for each image in a multi-arch image.
func getMultiImageArch(manifestBytes []byte) ([]string, error) {
	var index manifest.Schema2List
	archs := []string{}

	if err := json.Unmarshal(manifestBytes, &index); err != nil {
		return nil, fmt.Errorf("error parsing manifest list: %w", err)
	}

	for _, manifest := range index.Manifests {
		archs = append(archs, translateArch(manifest.Platform.Architecture))
	}

	return archs, nil
}

// translateArch converts the architecture to the format most common with linux architectures.
func translateArch(arch string) string {
	switch arch {
	case "arm64":
		return "aarch64"
	case "amd64":
		return "x86_64"
	default:
		return arch
	}
}

// getSingleImageArche returns the architecture for a single image.
func (rc Config) getSingleImageArche(imgRef types.ImageReference, ctx context.Context, sysCtx *types.SystemContext) ([]string, error) {
	img, err := imgRef.NewImage(ctx, sysCtx)
	if err != nil {
		return nil, fmt.Errorf("error creating image instance: %w", err)
	}
	defer img.Close()

	imgInspect, err := img.Inspect(ctx)
	if err != nil {
		return nil, fmt.Errorf("error inspecting image: %w", err)
	}
	arch := translateArch(imgInspect.Architecture)
	return []string{arch}, nil
}
