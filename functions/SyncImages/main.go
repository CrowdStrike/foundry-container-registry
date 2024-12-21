package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"sort"
	"strings"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	"github.com/Masterminds/semver"
	"github.com/containers/image/docker"
	"github.com/containers/image/types"
	"github.com/crowdstrike/gofalcon/falcon"
	"github.com/crowdstrike/gofalcon/falcon/client"
	"github.com/crowdstrike/gofalcon/falcon/client/falcon_container"
	"github.com/crowdstrike/gofalcon/falcon/client/sensor_download"
	"github.com/distribution/reference"
)

type CSRegistries struct {
	Images []Image `json:""`
}

type Image struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Registry    string `json:"registry"`
	Repository  string `json:"repository"`
	LatestTag   string `json:"latest"`
	Tags        []Tag  `json:"tags"`
}

type Tag struct {
	Name string   `json:"name"`
	Arch []string `json:"arch"`
}

func main() {
	fdk.Run(context.Background(), newHandler)
}

func newHandler(_ context.Context, logger *slog.Logger, _ fdk.SkipCfg) fdk.Handler {
	mux := fdk.NewMux()
	mux.Post("/sync-images", fdk.HandlerFn(func(ctx context.Context, r fdk.Request) fdk.Response {
		client, cloud, err := newFalconClient(r.AccessToken)
		if err != nil {
			return fdk.Response{
				Code: 500,
				Body: fdk.JSON(err),
			}
		}

		imageData, err := getImages(client, cloud)
		if err != nil {
			return fdk.Response{
				Code: 500,
				Body: fdk.JSON(err),
			}
		}

		return fdk.Response{
			Code: 200,
			Body: fdk.JSON(imageData),
		}
	}))
	return mux
}

// newFalconClient creates a new Falcon client.
func newFalconClient(token string) (*client.CrowdStrikeAPISpecification, string, error) {
	ctx := context.Background()
	opts := fdk.FalconClientOpts()

	apiConfig := &falcon.ApiConfig{
		AccessToken:       token,
		Cloud:             falcon.Cloud(opts.Cloud),
		Context:           ctx,
		UserAgentOverride: opts.Cloud,
	}

	if apiConfig.AccessToken == "" {
		apiConfig.ClientId = os.Getenv("FALCON_CLIENT_ID")
		apiConfig.ClientSecret = os.Getenv("FALCON_CLIENT_SECRET")
	}

	client, err := falcon.NewClient(apiConfig)
	return client, opts.Cloud, err
}

// getImages returns a list of images and tags from the CrowdStrike API.
func getImages(client *client.CrowdStrikeAPISpecification, cloud string) ([]byte, error) {
	regInfo := CSRegistries{}
	ctx := context.Background()

	user, err := registryLogin(ctx, client)
	if err != nil {
		return nil, fmt.Errorf("Error getting Falcon CID: %v", err)
	}

	pass, err := registryToken(ctx, client)
	if err != nil {
		return nil, fmt.Errorf("Error getting registry token: %v", err)
	}

	sensorTypes := []falcon.SensorType{falcon.SidecarSensor, falcon.ImageSensor, falcon.KacSensor, falcon.NodeSensor}
	for _, sensorType := range sensorTypes {
		imageInfo := Image{}
		sensor := falcon.FalconContainerSensorImageURI(falcon.Cloud(cloud), sensorType)

		imageInfo.Registry = strings.Split(sensor, "/")[0]
		imageInfo.Repository = sensor

		name, description := sensorImageInfo(sensorType)
		imageInfo.Name = name
		imageInfo.Description = description

		tags, err := getRepositoryTags(registryConfig{User: user, Pass: pass}, sensor)
		if err != nil {
			return nil, fmt.Errorf("Error listing repository tags: %v", err)
		}

		switch sensorType {
		case falcon.ImageSensor:
			iarTags, err := semverSort(tags)
			if err != nil {
				return nil, fmt.Errorf("Error sorting tags: %v", err)
			}

			for _, tag := range iarTags {
				imageInfo.Tags = append(imageInfo.Tags, Tag{Name: tag, Arch: []string{"x86_64"}})
			}
		default:
			for _, tag := range tags {
				imageInfo.Tags = append(imageInfo.Tags, Tag{Name: tag, Arch: archInTag(tag)})
			}
		}

		imageInfo.LatestTag = tags[len(tags)-1]
		regInfo.Images = append(regInfo.Images, imageInfo)
	}

	return json.Marshal(regInfo)
}

// sensorImageInfo returns the name and description for the specified sensor type.
func sensorImageInfo(sensorType falcon.SensorType) (string, string) {
	name := ""
	description := ""

	switch sensorType {
	case falcon.ImageSensor:
		name = "Falcon Image Analyzer"
		description = "The Image Sensor is a container image that can be deployed to scan container images for vulnerabilities and misconfigurations."
	case falcon.SidecarSensor:
		name = "Falcon Container Sensor"
		description = "The Falcon Container Sensor is a container image that can be deployed as a sidecar to monitor pods and containers."
	case falcon.KacSensor:
		name = "Falcon Kubernetes Admission Controller"
		description = "The Kubernetes Agentless Container Sensor is a container image that can be deployed as a Kubernetes Admission Controller to monitor the container runtime and the containers running in a Kubernetes cluster."
	case falcon.NodeSensor:
		name = "Falcon Linux Sensor"
		description = "The Node Sensor is a container image that can be deployed as a daemonset to monitor the container runtime and the containers running on the host."
	}
	return name, description
}

// archInTag returns the architecture from the tag.
func archInTag(tag string) []string {
	arch := []string{}
	switch {
	case strings.Contains(tag, "x86_64"):
		arch = append(arch, "x86_64")
	case strings.Contains(tag, "aarch64"):
		arch = append(arch, "aarch64")
	default:
		arch = append(arch, "x86_64", "aarch64")
	}
	return arch
}

// semverSort sorts the tags in semver order.
func semverSort(tags []string) ([]string, error) {
	sv := make([]*semver.Version, len(tags))
	for i, r := range tags {
		v, err := semver.NewVersion(r)
		if err != nil {
			return []string{}, fmt.Errorf("Error parsing version: %s", err)
		}
		sv[i] = v
	}

	sort.Sort(semver.Collection(sv))
	for i, v := range sv {
		tags[i] = v.Original()
	}

	return tags, nil
}

// registryLogin gets the registry login from the CrowdStrike API using the SensorDownload API.
func registryLogin(ctx context.Context, client *client.CrowdStrikeAPISpecification) (string, error) {
	user, err := getCID(ctx, client)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("fc-%s", strings.ToLower(strings.Split(user, "-")[0])), nil
}

// getCID gets the Falcon CID from the CrowdStrike API using the SensorDownload API.
func getCID(ctx context.Context, client *client.CrowdStrikeAPISpecification) (string, error) {
	response, err := client.SensorDownload.GetSensorInstallersCCIDByQuery(&sensor_download.GetSensorInstallersCCIDByQueryParams{
		Context: ctx,
	})
	if err != nil {
		return "", fmt.Errorf("Could not get Falcon CID from CrowdStrike Falcon API: %v", err)
	}
	payload := response.GetPayload()
	if err = falcon.AssertNoError(payload.Errors); err != nil {
		return "", fmt.Errorf("Error reported when getting Falcon CID from CrowdStrike Falcon API: %v", err)
	}
	if len(payload.Resources) != 1 {
		return "", fmt.Errorf("Failed to get Falcon CID: Unexpected API response: %v", payload.Resources)
	}

	return payload.Resources[0], nil
}

// registryToken gets the registry token from the CrowdStrike API using the FalconContainer API.
func registryToken(ctx context.Context, client *client.CrowdStrikeAPISpecification) (string, error) {
	res, err := client.FalconContainer.GetCredentials(&falcon_container.GetCredentialsParams{
		Context: ctx,
	})
	if err != nil {
		return "", err
	}
	payload := res.GetPayload()
	if err = falcon.AssertNoError(payload.Errors); err != nil {
		return "", err
	}
	resources := payload.Resources
	resourcesList := resources
	if len(resourcesList) != 1 {
		return "", fmt.Errorf("Expected to receive exactly one token, but got %d\n", len(resourcesList))
	}
	valueString := *resourcesList[0].Token
	if valueString == "" {
		return "", fmt.Errorf("Received empty token")
	}
	return valueString, nil
}

// registryConfig contains the user, password, and token for the registry.
type registryConfig struct {
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
		return nil, errors.New("No tag or digest allowed in reference")
	}

	return docker.NewReference(reference.TagNameOnly(ref))
}

// getRepositoryTags returns a list of tags for the specified image.
func getRepositoryTags(rc registryConfig, image string) ([]string, error) {
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
