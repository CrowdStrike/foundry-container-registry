package falcon

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"github.com/crowdstrike/gofalcon/falcon"
	"github.com/crowdstrike/gofalcon/falcon/client"
	"github.com/crowdstrike/gofalcon/falcon/client/custom_storage"
	"github.com/crowdstrike/gofalcon/falcon/client/falcon_container"
	"github.com/crowdstrike/gofalcon/falcon/client/sensor_download"
)

// RegistryLogin gets the registry login from the CrowdStrike API using the SensorDownload API.
func RegistryLogin(ctx context.Context, client *client.CrowdStrikeAPISpecification) (string, error) {
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

// RegistryToken gets the registry token from the CrowdStrike API using the FalconContainer API.
func RegistryToken(ctx context.Context, client *client.CrowdStrikeAPISpecification) (string, error) {
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

// WriteToCollection writes the image list to the CrowdStrike API using the CustomStorage API.
func WriteToCollection(client *client.CrowdStrikeAPISpecification, images interface{}) error {
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(images); err != nil {
		return fmt.Errorf("Error encoding image list: %v", err)
	}

	_, err := client.CustomStorage.Upload(&custom_storage.UploadParams{
		CollectionName: "images",
		ObjectKey:      "all",
		Body:           io.NopCloser(&buf),
	})
	if err != nil {
		return fmt.Errorf("Error storing image list in collection: %v", err)
	}

	return nil
}
