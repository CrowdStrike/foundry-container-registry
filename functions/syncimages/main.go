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
	"sync"
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

	// When cloud is set to autodiscover, the client will attempt to determine the cloud based on the API response and update the config.
	// When the NewClient function returns, the cloud will be set to the actual cloud used.
	cloud = apiConfig.Cloud.String()

	slog.Debug("Creating Falcon client", "client_id", apiConfig.ClientId, "client_secret", apiConfig.ClientSecret, "cloud", cloud, "access_token", apiConfig.AccessToken, "user_agent", userAgent)

	client, err := falcon.NewClient(apiConfig)

	return client, cloud, err
}

// getImages returns a list of images and tags from the CrowdStrike API.
func getImages(client *client.CrowdStrikeAPISpecification, cloud string) (ImageList, error) {
	slog.Info("Starting image retrieval process", "cloud", cloud)
	startTime := time.Now()
	ctx := context.Background()

	cid, err := falconapi.GetCID(ctx, client)
	if err != nil {
		return ImageList{}, fmt.Errorf("error getting Falcon CID: %v", err)
	}
	slog.Debug("Retrieved CID successfully", "cid", cid)

	type sensorResult struct {
		image Image
		index int
		err   error
	}

	sensorTypes := allSensorTypes()
	resultChan := make(chan sensorResult, len(sensorTypes))
	var wg sync.WaitGroup

	for i, sensorType := range sensorTypes {
		slog.Info("Processing sensor type", "type", sensorType)
		wg.Add(1)
		go func(sensorType falcon.SensorType, index int) {
			defer wg.Done()
			imageInfo := Image{}
			prefix := loginPrefix(sensorType)
			user := falconapi.RegistryLogin(prefix, cid)

			slog.Debug("Getting registry token", "sensor_type", sensorType, "login_prefix", prefix, "user", user)
			pass, err := falconapi.RegistryToken(ctx, client, sensorType)
			if err != nil {
				resultChan <- sensorResult{
					index: index,
					err:   fmt.Errorf("error getting registry token for %v: %v", sensorType, err),
				}
			}

			rc := registry.NewRegistryConfig(user, pass)
			imageInfo.Login = user
			imageInfo.Password = pass

			sensor := falcon.FalconContainerSensorImageURI(falcon.Cloud(cloud), sensorType)
			slog.Debug("Constructed sensor URI", "sensor_type", sensorType, "uri", sensor)

			imageInfo.Registry = strings.Split(sensor, "/")[0]
			imageInfo.Repository = sensor

			dockerConfigJson := rc.DockerConfigJson(imageInfo.Registry)
			slog.Debug("Generated docker config", "registry", imageInfo.Registry, "config_length", len(dockerConfigJson))
			imageInfo.DockerJson = dockerConfigJson

			name, description := sensorImageInfo(sensorType)
			imageInfo.Name = name
			imageInfo.Description = description

			slog.Debug("Getting repository tags", "repository", sensor)
			tags, err := rc.GetRepositoryTags(sensor)
			if err != nil {
				resultChan <- sensorResult{
					index: index,
					err:   fmt.Errorf("error listing repository tags for %v: %v", sensor, err),
				}
			}
			slog.Debug("Retrieved tags", "repository", sensor, "tag_count", len(tags), "tags", tags)

			switch sensorType {
			case falcon.ImageSensor, falcon.FCSCli, falcon.Snapshot, falcon.SHRAController, falcon.SHRAExecutor:
				slog.Debug("Sorting semver tags", "sensor_type", sensorType)
				tags, err = semverSort(tags)
				if err != nil {
					resultChan <- sensorResult{
						index: index,
						err:   fmt.Errorf("error sorting tags: %v", err),
					}
				}

				err := processTagsConcurrently(tags, &imageInfo, rc)
				if err != nil {
					resultChan <- sensorResult{
						index: index,
						err:   fmt.Errorf("error processing tags for %v: %v", sensorType, err),
					}
					return
				}
			case falcon.NodeSensor, falcon.SidecarSensor:
				slog.Debug("Filtering EOS tags < 7.04", "sensor_type", sensorType)

				// Remove tags that are end-of-life (EOL) for the specified sensor type
				tags = removeEOLSensorTags(tags)

				err := processTagsConcurrently(tags, &imageInfo, rc)
				if err != nil {
					resultChan <- sensorResult{
						index: index,
						err:   fmt.Errorf("error processing tags for %v: %v", sensorType, err),
					}
					return
				}
			default:
				err := processTagsConcurrently(tags, &imageInfo, rc)
				if err != nil {
					resultChan <- sensorResult{
						index: index,
						err:   fmt.Errorf("error processing tags for %v: %v", sensorType, err),
					}
					return
				}
			}

			if len(tags) > 0 {
				imageInfo.LatestTag = tags[len(tags)-1]
				slog.Debug("Getting latest tag digest", "repository", imageInfo.Repository, "tag", imageInfo.LatestTag)

				digest, err := rc.GetImageDigest(imageInfo.Repository, imageInfo.LatestTag)
				if err != nil {
					resultChan <- sensorResult{
						index: index,
						err:   fmt.Errorf("error getting digest for %v: %v", sensorType, err),
					}
					return
				}
				imageInfo.LatestDigest = digest
			}

			resultChan <- sensorResult{
				image: imageInfo,
				index: index,
			}
		}(sensorType, i)
	}

	// Close result channel once all goroutines complete
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// Collect and sort results
	results := make([]sensorResult, 0, len(sensorTypes))
	for result := range resultChan {
		if result.err != nil {
			return ImageList{}, result.err
		}
		results = append(results, result)
	}

	// Sort results based on original index
	sort.Slice(results, func(i, j int) bool {
		return results[i].index < results[j].index
	})

	// Extract images in correct order
	images := make([]Image, len(results))
	for i, result := range results {
		images[i] = result.image
	}

	regInfo := ImageList{
		Updated:    time.Now(),
		DurationMs: time.Since(startTime).Milliseconds(),
		Images:     images,
	}

	slog.Info("Completed image retrieval", "duration_ms", regInfo.DurationMs, "image_count", len(regInfo.Images))
	return regInfo, nil
}

// removeEOLSensorTags removes tags that are end-of-life (EOL) for the specified sensor type.
func removeEOLSensorTags(tags []string) []string {
	filteredTags := []string{}
	for _, tag := range tags {
		versionPart := strings.Split(tag, "-")[0]
		if v, err := semver.NewVersion(versionPart); err == nil {
			constraint, _ := semver.NewConstraint(">= 7.04.0")
			if constraint.Check(v) {
				filteredTags = append(filteredTags, tag)
			}
		}
	}

	return filteredTags
}

// processTagsConcurrently processes container image tags concurrently.
func processTagsConcurrently(tags []string, imageInfo *Image, rc registry.Config) error {
	type result struct {
		tag    string
		digest string
		archs  []string
		err    error
		index  int
	}

	resultChan := make(chan result, len(tags))
	var wg sync.WaitGroup

	// Create a semaphore to limit concurrent operations
	maxConcurrent := 10
	semaphore := make(chan struct{}, maxConcurrent)

	// Launch goroutines for each tag
	for i, tag := range tags {
		wg.Add(1)
		go func(tag string, index int) {
			// Acquire semaphore
			semaphore <- struct{}{}
			defer func() {
				// Release semaphore
				<-semaphore
				wg.Done()
			}()

			slog.Debug("Processing image tag", "repository", imageInfo.Repository, "tag", tag)

			digest, err := rc.GetImageDigest(imageInfo.Repository, tag)
			if err != nil {
				resultChan <- result{
					tag:   tag,
					err:   fmt.Errorf("error getting digest for tag: %v", err),
					index: index,
				}
				return
			}

			archs := archInTag(tag, *imageInfo, rc)
			slog.Debug("Image tag details", "tag", tag, "digest", digest, "architectures", archs)

			resultChan <- result{
				tag:    tag,
				digest: digest,
				archs:  archs,
				index:  index,
			}
		}(tag, i)
	}

	// Close result channel once all goroutines complete
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// Collect results
	results := make([]result, 0, len(tags))
	for r := range resultChan {
		if r.err != nil {
			return fmt.Errorf("error getting digest: %w", r.err)
		}
		results = append(results, r)
	}

	// Sort results based on original index
	sort.Slice(results, func(i, j int) bool {
		return results[i].index < results[j].index
	})

	// Append sorted results to imageInfo.Tags
	for _, r := range results {
		imageInfo.Tags = append(imageInfo.Tags, Tag{
			Name:   r.tag,
			Digest: r.digest,
			Arch:   r.archs,
		})
	}

	return nil
}

// sensorImageInfo returns the name and description for the specified sensor type.
func sensorImageInfo(sensorType falcon.SensorType) (string, string) {
	name := ""
	description := ""

	switch sensorType {
	case falcon.ImageSensor:
		name = "Falcon Image Assessment at Runtime (IAR)"
		description = "The Falcon Image Assessment at Runtime (IAR) container image performs real-time vulnerability assessment of container images as they are launched in your Kubernetes environment. It ensures comprehensive container security by scanning all running images, including those from registries not directly connected to CrowdStrike."
	case falcon.SidecarSensor:
		name = "Falcon Container Sensor for Linux"
		description = "The Falcon Container Sensor for Linux container image provides runtime security for containerized workloads in Kubernetes environments by operating as a sidecar container. It's specifically designed to protect pods in environments where kernel-level access isn't available, such as AWS Fargate or Microsoft ACI."
	case falcon.KacSensor:
		name = "Falcon Kubernetes Admission Controller"
		description = "The Falcon Kubernetes Admission Controller container image enforces security policies and validates container images before they are deployed to your Kubernetes cluster. It integrates with CrowdStrike's container security to provide runtime protection and vulnerability management."
	case falcon.NodeSensor:
		name = "Falcon Sensor for Linux (DaemonSet)"
		description = "The Falcon Sensor for Linux container image, deployed as a DaemonSet, provides advanced threat protection and workload visibility across all your Kubernetes nodes. It delivers kernel-level security for both the Linux host operating system and its running containers, with real-time threat detection and prevention capabilities."
	case falcon.Snapshot:
		name = "Snapshot Scanner"
		description = "The Snapshot scanner container image provides agentless protection of Linux AWS EC2 instances by detecting installed applications, OS-level and software composition analysis (SCA) vulnerabilities, malware, and vulnerable running containers."
	case falcon.FCSCli:
		name = "Falcon Cloud Security (FCS) CLI"
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
func archInTag(tag string, imageInfo Image, rc registry.Config) []string {
	archs, err := rc.GetImageArchitecture(imageInfo.Repository, tag)
	if err != nil {
		slog.Warn("Failed to get architectures from manifest", "repository", imageInfo.Repository, "tag", tag, "error", err, "falling_back_to", []string{"unknown"})
		return []string{"unknown"}
	}

	slog.Debug("Got architectures from manifest", "repository", imageInfo.Repository, "tag", tag, "architectures", archs)
	return archs
}

// semverSort sorts the tags in semver order.
func semverSort(tags []string) ([]string, error) {
	sv := make([]*semver.Version, 0, len(tags))

	for _, r := range tags {
		v, err := semver.NewVersion(r)
		if err != nil {
			// Don't fail on invalid semver tags, just log and continue
			slog.Warn("Skipping invalid semver tag", "tag", r, "error", err)
			continue
		}
		sv = append(sv, v)
	}

	if len(sv) == 0 {
		slog.Warn("No valid semver tags found", "tags", tags)
		return tags, nil
	}

	sort.Sort(semver.Collection(sv))

	// Rebuild the sorted tag list
	result := make([]string, len(sv))
	for i, v := range sv {
		result[i] = v.Original()
	}

	slog.Debug("Semver results", "tags", result)

	return result, nil
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
