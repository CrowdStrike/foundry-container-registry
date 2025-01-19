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
	"syncimages/version"

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
	Name   string   `json:"name"`
	Digest string   `json:"digest"`
	Arch   []string `json:"arch"`
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
	userAgent := fmt.Sprintf("%s foundry-container-registry/%s", opts.UserAgent, version.Version)

	if os.Getenv("FALCON_CLOUD") != "" {
		cloud = os.Getenv("FALCON_CLOUD")
	}

	apiConfig := &falcon.ApiConfig{
		AccessToken:       token,
		Cloud:             falcon.Cloud(cloud),
		Context:           ctx,
		UserAgentOverride: userAgent,
	}

	if apiConfig.AccessToken == "" {
		apiConfig.ClientId = os.Getenv("FALCON_CLIENT_ID")
		apiConfig.ClientSecret = os.Getenv("FALCON_CLIENT_SECRET")
	}

	slog.Debug("Creating Falcon client", "client_id", apiConfig.ClientId, "client_secret", apiConfig.ClientSecret, "cloud", cloud, "access_token", apiConfig.AccessToken, "user_agent", userAgent)

	client, err := falcon.NewClient(apiConfig)
	return client, cloud, err
}

// getImages returns a list of images and tags from the CrowdStrike API.
func getImages(client *client.CrowdStrikeAPISpecification, cloud string) (ImageList, error) {
	regInfo := ImageList{}
	startTime := time.Now()
	ctx := context.Background()
	// get CID here once
	cid, err := falconapi.GetCID(ctx, client)
	if err != nil {
		return ImageList{}, fmt.Errorf("error getting Falcon CID: %v", err)
	}
	// iterate through each sensor type to get registry tokens and image info
	for _, sensorType := range allSensorTypes() {
		imageInfo := Image{}
		prefix := loginPrefix(sensorType)
		user := falconapi.RegistryLogin(prefix, cid)

		slog.Debug("Sensor type", "sensor", sensorType)
		pass, err := falconapi.RegistryToken(ctx, client, sensorType)
		if err != nil {
			return ImageList{}, fmt.Errorf("error getting registry token: %v", err)
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
			return ImageList{}, fmt.Errorf("error listing repository tags for %v: %v", sensor, err)
		}

		switch sensorType {
		case falcon.ImageSensor, falcon.FCSCli, falcon.Snapshot, falcon.SHRAController, falcon.SHRAExecutor:
			imageTags, err := semverSort(tags)
			if err != nil {
				return ImageList{}, fmt.Errorf("error sorting tags: %v", err)
			}

			for _, tag := range imageTags {
				digest, err := rc.GetImageDigest(imageInfo.Repository, tag)
				if err != nil {
					return ImageList{}, fmt.Errorf("error getting digest: %w", err)
				}

				imageInfo.Tags = append(imageInfo.Tags, Tag{Name: tag, Digest: digest, Arch: archInTag(tag)})
			}
		default:
			for _, tag := range tags {
				digest, err := rc.GetImageDigest(imageInfo.Repository, tag)
				if err != nil {
					return ImageList{}, fmt.Errorf("error getting digest: %w", err)
				}

				imageInfo.Tags = append(imageInfo.Tags, Tag{Name: tag, Digest: digest, Arch: archInTag(tag)})
			}
		}

		imageInfo.LatestTag = tags[len(tags)-1]
		digest, err := rc.GetImageDigest(imageInfo.Repository, imageInfo.LatestTag)
		if err != nil {
			return ImageList{}, fmt.Errorf("error getting digest: %w", err)
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
		description = "The Falcon Image Analyzer container image performs real-time vulnerability assessment of container images as they are launched in your Kubernetes environment. It ensures comprehensive container security by scanning all running images, including those from registries not directly connected to CrowdStrike."
	case falcon.SidecarSensor:
		name = "Falcon Container Sensor"
		description = "The Falcon Container Sensor container image provides runtime security for containerized workloads in Kubernetes environments by operating as a sidecar container. It's specifically designed to protect pods in environments where kernel-level access isn't available, such as AWS Fargate or Microsoft ACI."
	case falcon.KacSensor:
		name = "Falcon Kubernetes Admission Controller"
		description = "The Falcon Kubernetes Admission Controller container image enforces security policies and validates container images before they are deployed to your Kubernetes cluster. It integrates with CrowdStrike's container security to provide runtime protection and vulnerability management."
	case falcon.NodeSensor:
		name = "Falcon Linux Sensor"
		description = "The Falcon Linux Sensor container image, deployed as a DaemonSet, provides advanced threat protection and workload visibility across all your Kubernetes nodes. It delivers kernel-level security for both the Linux host operating system and its running containers, with real-time threat detection and prevention capabilities."
	case falcon.Snapshot:
		name = "Snapshot Scanner"
		description = "The Snapshot scanner container image provides agentless protection of Linux AWS EC2 instances by detecting installed applications, OS-level and software composition analysis (SCA) vulnerabilities, malware, and vulnerable running containers."
	case falcon.FCSCli:
		name = "FCS CLI"
		description = "The Falcon Cloud Security (FCS) CLI container image enables security assessment of Infrastructure as Code (IaC) before deployment, detecting misconfigurations and embedded secrets."
	case falcon.SHRAController:
		name = "Self-hosted Registry Assessment Jobs Controller"
		description = "Self-hosted Registry Assessment (SHRA) Jobs Controller orchestrates and manages image scanning tasks for self-hosted container registries. It coordinates with the Scanner Executor containers to ensure systematic assessment of images, providing vulnerability scanning for private and air-gapped environments."
	case falcon.SHRAExecutor:
		name = "Self-hosted Registry Assessment Executor"
		description = "Self-hosted Registry Assessment (SHRA) Executor performs the actual vulnerability scanning of container images in self-hosted registries. Deployed by the Jobs Controller, it analyzes images for security risks and compliance issues, then reports findings back to the CrowdStrike Cloud."
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
			return []string{}, fmt.Errorf("error parsing version %s: %s", v, err)
		}
		sv[i] = v
	}

	sort.Sort(semver.Collection(sv))
	for i, v := range sv {
		tags[i] = v.Original()
	}

	return tags, nil
}

// allSensorTypes returns all sensor types.
func allSensorTypes() []falcon.SensorType {
	return []falcon.SensorType{
		falcon.NodeSensor,
		falcon.SidecarSensor,
		falcon.ImageSensor,
		falcon.KacSensor,
		falcon.Snapshot,
		falcon.FCSCli,
		falcon.SHRAController,
		falcon.SHRAExecutor,
	}
}

// loginPrefix returns the prefix for the registry login based on the sensor type.
func loginPrefix(sensor falcon.SensorType) string {
	switch sensor {
	case falcon.Snapshot:
		return "fs"
	case falcon.FCSCli:
		return "fh"
	default:
		return "fc"
	}
}
