package registry

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"

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
	slog.Debug("attempting to parse image reference", "sensor", sensor)

	ref, err := reference.ParseNormalizedNamed(sensor)
	if err != nil {
		slog.Error("failed to parse reference", "error", err, "sensor", sensor)
		return nil, fmt.Errorf("error parsing reference: %w", err)
	}

	if !reference.IsNameOnly(ref) {
		slog.Error("reference contains tag or digest", "reference", ref.String())
		return nil, fmt.Errorf("no tag or digest allowed in reference: %v", ref.String())
	}

	taggedRef := reference.TagNameOnly(ref)
	slog.Debug("successfully created image reference", "reference", taggedRef.String())
	return docker.NewReference(taggedRef)
}

// dockerConfig returns the context and system context for the Docker client.
func (rc Config) dockerConfig() (context.Context, *types.SystemContext) {
	slog.Debug("creating docker config",
		"hasUsername", rc.User != "",
		"hasPassword", rc.Pass != "")

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
	slog.Debug("getting repository tags", "image", image)

	ctx, sysCtx := rc.dockerConfig()

	imgRef, err := getImageRef(image)
	if err != nil {
		slog.Error("failed to create image reference", "error", err, "image", image)
		return nil, fmt.Errorf("error creating image reference: %v", err)
	}

	tags, err := docker.GetRepositoryTags(ctx, sysCtx, imgRef)
	if err != nil {
		slog.Error("failed to list repository tags", "error", err, "image", image)
		return nil, fmt.Errorf("error listing repository tags: %w", err)
	}

	slog.Debug("successfully retrieved repository tags", "image", image, "tagCount", len(tags))
	return tags, nil
}

// GetImageDigest returns the digest for the specified image and tag.
func (rc Config) GetImageDigest(image string, tag string) (string, error) {
	slog.Debug("getting image digest", "image", image, "tag", tag)

	ctx, sysCtx := rc.dockerConfig()

	image = fmt.Sprintf("//%s:%s", image, tag)
	imgRef, err := docker.ParseReference(image)
	if err != nil {
		slog.Error("failed to parse reference", "error", err, "image", image)
		return "", fmt.Errorf("error parsing reference: %w", err)
	}

	digest, err := docker.GetDigest(ctx, sysCtx, imgRef)
	if err != nil {
		slog.Error("failed to get digest", "error", err, "image", image)
		return "", fmt.Errorf("error getting digest: %w", err)
	}

	slog.Debug("successfully retrieved image digest", "image", image, "digest", digest.String())
	return digest.String(), nil
}

// GetImageArchitecture returns the architecture for the specified image and tag.
func (rc Config) GetImageArchitecture(image string, tag string) ([]string, error) {
	slog.Debug("getting image architecture", "image", image, "tag", tag)

	ctx, sysCtx := rc.dockerConfig()

	image = fmt.Sprintf("//%s:%s", image, tag)
	imgRef, err := docker.ParseReference(image)
	if err != nil {
		slog.Error("failed to parse reference", "error", err, "image", image)
		return nil, fmt.Errorf("error parsing reference: %w", err)
	}

	src, err := imgRef.NewImageSource(ctx, sysCtx)
	if err != nil {
		slog.Error("failed to create image source", "error", err, "image", image)
		return nil, fmt.Errorf("error creating image source: %w", err)
	}
	defer src.Close()

	manifestBytes, manifestType, err := src.GetManifest(ctx, nil)
	if err != nil {
		slog.Error("failed to get manifest", "error", err, "image", image)
		return nil, fmt.Errorf("error getting manifest: %w", err)
	}

	slog.Debug("retrieved manifest", "manifestType", manifestType)

	translateArch := func(arch string) string {
		translated := arch
		switch arch {
		case "arm64":
			translated = "aarch64"
		case "amd64":
			translated = "x86_64"
		}
		slog.Debug("translated architecture", "original", arch, "translated", translated)
		return translated
	}

	switch manifestType {
	// Multi-arch image
	case "application/vnd.docker.distribution.manifest.list.v2+json":
		var index manifest.Schema2List
		if err := json.Unmarshal(manifestBytes, &index); err != nil {
			slog.Error("failed to parse manifest list", "error", err)
			return nil, fmt.Errorf("error parsing manifest list: %w", err)
		}
		var archs []string
		for _, manifest := range index.Manifests {
			archs = append(archs, translateArch(manifest.Platform.Architecture))
		}
		slog.Debug("found architectures in manifest list", "architectures", archs)
		return archs, nil
	// Single-arch image
	case "application/vnd.docker.distribution.manifest.v2+json":
		img, err := imgRef.NewImage(ctx, sysCtx)
		if err != nil {
			slog.Error("failed to create image instance", "error", err)
			return nil, fmt.Errorf("error creating image instance: %w", err)
		}
		defer img.Close()

		imgInspect, err := img.Inspect(ctx)
		if err != nil {
			slog.Error("failed to inspect image", "error", err)
			return nil, fmt.Errorf("error inspecting image: %w", err)
		}
		arch := translateArch(imgInspect.Architecture)
		slog.Debug("found single architecture", "architecture", arch)
		return []string{arch}, nil

	default:
		slog.Error("unsupported manifest type", "manifestType", manifestType)
		return nil, fmt.Errorf("unsupported manifest type: %s", manifestType)
	}
}

// DockerConfigJson returns the Docker configuration JSON for the registry.
func (rc Config) DockerConfigJson(registry string) string {
	slog.Debug("generating docker config JSON", "registry", registry)

	base64EncodedCreds := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(`%s:%s`, rc.User, rc.Pass)))
	base64EncodedAuth := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(`{"auths":{"%s":{"auth": "%s"}}}`, registry, base64EncodedCreds)))

	slog.Debug("docker config JSON generated successfully")
	return base64EncodedAuth
}
