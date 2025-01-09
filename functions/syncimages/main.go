package main

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	falconapi "syncimages/falcon"
	"syncimages/registry"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	"github.com/Masterminds/semver"
	"github.com/crowdstrike/gofalcon/falcon"
	"github.com/crowdstrike/gofalcon/falcon/client"
)

type ImageList struct {
	Updated    time.Time `json:"updated"`
	DurationMs int64     `json:"duration"`
	Images     []Image   `json:"images"`
}

type Image struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	Registry     string `json:"registry"`
	Repository   string `json:"repository"`
	LatestTag    string `json:"latest"`
	LatestDigest string `json:"digest"`
	Login        string `json:"login"`
	Password     string `json:"password"`
	DockerJson   string `json:"dockerAuthConfig"`
	Tags         []Tag  `json:"tags"`
}

type Tag struct {
	Name string   `json:"name"`
	Arch []string `json:"arch"`
}

func main() {
	fdk.Run(context.Background(), newHandler)
}

func newHandler(_ context.Context, logger *slog.Logger, _ fdk.SkipCfg) fdk.Handler {
	debug := false
	var err error
	envDebug := os.Getenv("DEBUG")

	if envDebug != "" {
		debug, err = strconv.ParseBool(envDebug)
		if err != nil {
			log.Fatal(err)
		}
	}

	if debug {
		slog.SetLogLoggerLevel(slog.LevelDebug)
		slog.Debug("DEBUG mode is enabled. DO NOT USE IN PRODUCTION.")
	}

	mux := fdk.NewMux()
	mux.Post("/sync-images", fdk.HandlerFn(func(ctx context.Context, r fdk.Request) fdk.Response {
		accessToken := r.AccessToken

		client, cloud, err := newFalconClient(accessToken)
		if err != nil {
			logger.Error("failed to create falcon client", "error", err)
			return fdk.Response{
				Code: 500,
				Body: fdk.JSON(map[string]interface{}{
					"error": err.Error(),
				}),
			}
		}

		imageData, err := getImages(client, cloud)
		if err != nil {
			logger.Error("failed to get images", "error", err)
			return fdk.Response{
				Code: 500,
				Body: fdk.JSON(map[string]interface{}{
					"error": err.Error(),
				}),
			}
		}

		// TODO: better way to determine we are running in a foundry function?
		if accessToken != "" {
			err = falconapi.WriteToCollection(client, imageData)
			if err != nil {
				return fdk.Response{
					Code: 500,
					Body: fdk.JSON(map[string]interface{}{
						"error": err.Error(),
					}),
				}
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
	cloud := opts.Cloud

	if os.Getenv("FALCON_CLOUD") != "" {
		cloud = os.Getenv("FALCON_CLOUD")
	}

	apiConfig := &falcon.ApiConfig{
		AccessToken:       token,
		Cloud:             falcon.Cloud(cloud),
		Context:           ctx,
		UserAgentOverride: opts.UserAgent,
	}

	if apiConfig.AccessToken == "" {
		apiConfig.ClientId = os.Getenv("FALCON_CLIENT_ID")
		apiConfig.ClientSecret = os.Getenv("FALCON_CLIENT_SECRET")
	}

	slog.Debug("Creating Falcon client", "client_id", apiConfig.ClientId, "client_secret", apiConfig.ClientSecret, "cloud", cloud, "access_token", apiConfig.AccessToken)

	client, err := falcon.NewClient(apiConfig)
	return client, cloud, err
}

// getImages returns a list of images and tags from the CrowdStrike API.
func getImages(client *client.CrowdStrikeAPISpecification, cloud string) (ImageList, error) {
	regInfo := ImageList{}
	startTime := time.Now()
	ctx := context.Background()

	sensorTypes := []falcon.SensorType{falcon.SidecarSensor, falcon.ImageSensor, falcon.KacSensor, falcon.NodeSensor}
	for _, sensorType := range sensorTypes {
		imageInfo := Image{}
		user, err := falconapi.RegistryLogin(ctx, client)
		if err != nil {
			return ImageList{}, fmt.Errorf("Error getting Falcon CID: %v", err)
		}

		pass, err := falconapi.RegistryToken(ctx, client)
		if err != nil {
			return ImageList{}, fmt.Errorf("Error getting registry token: %v", err)
		}

		slog.Debug("Registry access", "user", user, "pass", pass)
		rc := registry.Config{User: user, Pass: pass}
		imageInfo.Login = user
		imageInfo.Password = pass

		sensor := falcon.FalconContainerSensorImageURI(falcon.Cloud(cloud), sensorType)
		slog.Debug("Sensor URI returned from API", "sensor", sensor)

		imageInfo.Registry = strings.Split(sensor, "/")[0]
		imageInfo.Repository = sensor

		dockerConfigJson := rc.DockerConfigJson(imageInfo.Registry)
		slog.Debug("Get DockerConfigJson", "rc.DockerConfigJson", dockerConfigJson)
		imageInfo.DockerJson = dockerConfigJson

		name, description := sensorImageInfo(sensorType)
		imageInfo.Name = name
		imageInfo.Description = description

		tags, err := rc.GetRepositoryTags(sensor)
		if err != nil {
			return ImageList{}, fmt.Errorf("Error listing repository tags for %v: %v", sensor, err)
		}

		switch sensorType {
		case falcon.ImageSensor:
			iarTags, err := semverSort(tags)
			if err != nil {
				return ImageList{}, fmt.Errorf("Error sorting tags: %v", err)
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
		digest, err := rc.GetImageDigest(imageInfo.Repository, imageInfo.LatestTag)
		if err != nil {
			return ImageList{}, fmt.Errorf("Error getting digest: %w", err)
		}

		imageInfo.LatestDigest = digest
		regInfo.Images = append(regInfo.Images, imageInfo)
		slog.Debug("Image info", "name", imageInfo.Name, "description", imageInfo.Description, "registry", imageInfo.Registry, "repository", imageInfo.Repository, "latest_tag", imageInfo.LatestTag, "latest_digest", imageInfo.LatestDigest)
		slog.Debug("Tags", "tags", imageInfo.Tags)
	}

	regInfo.Updated = time.Now()
	regInfo.DurationMs = time.Since(startTime).Milliseconds()

	return regInfo, nil
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
