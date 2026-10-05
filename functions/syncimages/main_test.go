package main

import (
	"encoding/json"
	"errors"
	"reflect"
	"strings"
	"testing"
	"time"

	fdk "github.com/CrowdStrike/foundry-fn-go"
	"github.com/crowdstrike/gofalcon/falcon"
	"github.com/crowdstrike/gofalcon/falcon/client"
)

func TestIsFoundryRequest(t *testing.T) {
	tests := []struct {
		name    string
		request fdk.Request
		want    bool
	}{
		{name: "local request", request: fdk.Request{}, want: false},
		{name: "local request with token", request: fdk.Request{AccessToken: "test-token"}, want: false},
		{name: "function request with token", request: fdk.Request{FnID: "test-function", AccessToken: "test-token"}, want: true},
		{name: "function request without token", request: fdk.Request{FnID: "test-function"}, want: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := isFoundryRequest(test.request); got != test.want {
				t.Fatalf("isFoundryRequest() = %t, want %t", got, test.want)
			}
		})
	}
}

func TestCollectImageResults(t *testing.T) {
	sources := []imageSource{
		{sensorType: falcon.NodeSensor},
		{sensorType: falcon.NodeSensor, regional: true},
	}
	unified := Image{Repository: imageRepository("us-2", sources[0]), Tags: []Tag{{Name: "8.10.0-19403-1"}}}
	regional := Image{Repository: imageRepository("us-2", sources[1]), Tags: []Tag{{Name: "7.30.0-18400-1.falcon-linux.Release.US-2"}}}
	unavailable := errors.New("repository unavailable")
	tests := []struct {
		name    string
		results []sensorResult
		want    []Image
		wantErr bool
	}{
		{"both layouts", []sensorResult{{image: regional, index: 1}, {image: unified, index: 0}}, []Image{unified, regional}, false},
		{"unavailable legacy first", []sensorResult{{err: unavailable, index: 1}, {image: unified, index: 0}}, []Image{unified}, false},
		{"unavailable legacy last", []sensorResult{{image: unified, index: 0}, {err: unavailable, index: 1}}, []Image{unified}, false},
		{"unavailable multi-cloud", []sensorResult{{err: unavailable, index: 0}, {image: regional, index: 1}}, []Image{regional}, false},
		{"both unavailable", []sensorResult{{err: unavailable, index: 0}, {err: unavailable, index: 1}}, nil, true},
		{"empty legacy repository", []sensorResult{{image: unified, index: 0}, {image: Image{}, index: 1}}, []Image{unified}, false},
		{"empty does not mask failure", []sensorResult{{err: unavailable, index: 0}, {image: Image{}, index: 1}}, nil, true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			results := make(chan sensorResult, len(test.results))
			for _, result := range test.results {
				results <- result
			}
			close(results)
			got, err := collectImageResults(sources, results)
			if len(results) != 0 {
				t.Fatalf("collectImageResults() left %d worker results unread", len(results))
			}
			if (err != nil) != test.wantErr {
				t.Fatalf("collectImageResults() error = %v, wantErr %t", err, test.wantErr)
			}
			if !reflect.DeepEqual(got, test.want) {
				t.Fatalf("collectImageResults() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestCollectImageResultsMissingComponent(t *testing.T) {
	sources := []imageSource{{sensorType: falcon.NodeSensor}, {sensorType: falcon.Snapshot}}
	unavailable := errors.New("snapshot repository unavailable")
	results := make(chan sensorResult, 2)
	results <- sensorResult{index: 0, image: Image{Tags: []Tag{{Name: "8.10.0-19403-1"}}}}
	results <- sensorResult{index: 1, err: unavailable}
	close(results)
	images, err := collectImageResults(sources, results)
	if !errors.Is(err, unavailable) || images != nil {
		t.Fatalf("collectImageResults() = %v, %v, want missing component error", images, err)
	}
}

func TestFilterSensorTags(t *testing.T) {
	tags := []string{"7.15.0-15501-1.falcon-linux.Release.US-1", "7.29.0-15501-1.container.Release.US-1", "7.31.18410-1", "7.31.9", "7.31.9-1", "7.32.0", "7.32.0-1", "7.33.0"}
	want := tags

	if got := filterSensorTags(append(tags, "latest", "invalid")); !reflect.DeepEqual(got, want) {
		t.Fatalf("filterSensorTags(%v) = %v, want %v", tags, got, want)
	}
}

func TestImageSources(t *testing.T) {
	sources := allImageSources()
	if len(sources) != 12 {
		t.Fatalf("allImageSources() has %d entries, want 12", len(sources))
	}

	tests := []struct {
		sensorType falcon.SensorType
		unified    string
		regional   string
	}{
		{falcon.NodeSensor, "registry.crowdstrike.com/falcon-sensor/release/falcon-sensor", "registry.crowdstrike.com/falcon-sensor/us-2/release/falcon-sensor"},
		{falcon.SidecarSensor, "registry.crowdstrike.com/falcon-container/release/falcon-container", "registry.crowdstrike.com/falcon-container/us-2/release/falcon-sensor"},
		{falcon.KacSensor, "registry.crowdstrike.com/falcon-kac/release/falcon-kac", "registry.crowdstrike.com/falcon-kac/us-2/release/falcon-kac"},
		{falcon.ImageSensor, "registry.crowdstrike.com/falcon-imageanalyzer/release/falcon-imageanalyzer", "registry.crowdstrike.com/falcon-imageanalyzer/us-2/release/falcon-imageanalyzer"},
		{falcon.Snapshot, "registry.crowdstrike.com/falcon-snapshot/us-2/release/cs-snapshotscanner", ""},
		{falcon.FCSCli, "registry.crowdstrike.com/fcs/us-2/release/cs-fcs", ""},
		{falcon.SHRAController, "registry.crowdstrike.com/falcon-selfhostedregistryassessment/release/falcon-jobcontroller", ""},
		{falcon.SHRAExecutor, "registry.crowdstrike.com/falcon-selfhostedregistryassessment/release/falcon-registryassessmentexecutor", ""},
	}

	for _, test := range tests {
		for _, cloud := range []string{"us-1", "us-2", "eu-1", "us-gov-1", "gov2"} {
			for _, regional := range []bool{false, true} {
				if regional && test.regional == "" {
					continue
				}
				var found bool
				for _, source := range sources {
					if source.sensorType != test.sensorType || source.regional != regional {
						continue
					}
					found = true
					namespace := cloud
					if cloud == "us-gov-1" {
						namespace = "gov1"
					}
					want := strings.Replace(test.unified, "/us-2/", "/"+namespace+"/", 1)
					if regional {
						want = strings.Replace(test.regional, "/us-2/", "/"+namespace+"/", 1)
					}
					if cloud == "us-gov-1" {
						want = strings.Replace(want, "registry.crowdstrike.com", "registry.laggar.gcw.crowdstrike.com", 1)
					} else if cloud == "gov2" {
						want = strings.Replace(want, "registry.crowdstrike.com", "registry.us-gov-2.crowdstrike.mil", 1)
					}
					if got := imageRepository(cloud, source); got != want {
						t.Errorf("imageRepository(%s, %+v) = %q, want %q", cloud, source, got, want)
					}
				}
				if !found {
					t.Errorf("missing source for %s (regional=%t)", test.sensorType, regional)
				}
			}
		}
	}
}

func TestNewFalconClientReturnsDiscoveredCloud(t *testing.T) {
	t.Setenv("FALCON_CLOUD", "autodiscover")
	t.Setenv("FALCON_CLIENT_ID", "test-client")
	t.Setenv("FALCON_CLIENT_SECRET", "test-secret")

	_, gotCloud, err := newFalconClientWithFactory("", func(apiConfig *falcon.ApiConfig) (*client.CrowdStrikeAPISpecification, error) {
		apiConfig.Cloud = falcon.CloudUs2
		return nil, nil
	})
	if err != nil {
		t.Fatalf("newFalconClientWithFactory() error = %v", err)
	}
	if gotCloud != "us-2" {
		t.Fatalf("newFalconClientWithFactory() cloud = %q, want %q", gotCloud, "us-2")
	}
}

func TestUnifiedSensorTagsLatest(t *testing.T) {
	tags := []string{"8.10.0-19402-1", "7.31.0-18410-1", "8.10.0-19403-1", "7.40.0-19312-1"}
	got := semverSort(filterSensorTags(tags))
	want := []string{"7.31.0-18410-1", "7.40.0-19312-1", "8.10.0-19402-1", "8.10.0-19403-1"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("sorted supported unified tags = %v, want %v", got, want)
	}
}

func TestRegionalSensorTagsAreSortedByVersion(t *testing.T) {
	tags := []string{
		"7.30.0-18400-1.falcon-linux.Release.US-2",
		"7.31.18410-1",
		"7.15.0-15501-1.falcon-linux.Release.US-2",
	}
	want := []string{
		"7.15.0-15501-1.falcon-linux.Release.US-2",
		"7.30.0-18400-1.falcon-linux.Release.US-2",
		"7.31.18410-1",
	}
	if got := sortedSensorTags(tags); !reflect.DeepEqual(got, want) {
		t.Fatalf("sortedSensorTags(%v) = %v, want %v", tags, got, want)
	}
}

func TestImageListDoesNotSerializeRegistryCredentials(t *testing.T) {
	data, err := json.Marshal(ImageList{Images: []Image{{}}})
	if err != nil {
		t.Fatalf("json.Marshal(ImageList) error = %v", err)
	}

	for _, field := range []string{`"login"`, `"password"`, `"dockerAuthConfig"`} {
		if strings.Contains(string(data), field) {
			t.Errorf("image list unexpectedly serializes credential field %s", field)
		}
	}
}

func TestTagSerializesOptionalBuildDate(t *testing.T) {
	created := time.Date(2026, time.October, 5, 12, 30, 0, 0, time.UTC)
	data, err := json.Marshal(Tag{
		Name:      "8.10.0",
		BuildDate: &created,
	})
	if err != nil {
		t.Fatalf("json.Marshal(Tag) error = %v", err)
	}

	var got map[string]interface{}
	if err := json.Unmarshal(data, &got); err != nil {
		t.Fatalf("json.Unmarshal(Tag) error = %v", err)
	}
	if got["buildDate"] != "2026-10-05T12:30:00Z" {
		t.Fatalf("Tag buildDate = %v, want %q", got["buildDate"], "2026-10-05T12:30:00Z")
	}

	data, err = json.Marshal(Tag{Name: "8.9.0"})
	if err != nil {
		t.Fatalf("json.Marshal(Tag without build date) error = %v", err)
	}
	if strings.Contains(string(data), "buildDate") {
		t.Fatalf("Tag without build date serialized buildDate: %s", data)
	}
}
