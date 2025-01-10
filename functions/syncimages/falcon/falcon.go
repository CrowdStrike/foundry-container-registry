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
	"github.com/crowdstrike/gofalcon/falcon/client/cloud_snapshots"
	"github.com/crowdstrike/gofalcon/falcon/client/cspg_iacapi"
	"github.com/crowdstrike/gofalcon/falcon/client/custom_storage"
	"github.com/crowdstrike/gofalcon/falcon/client/falcon_container"
	"github.com/crowdstrike/gofalcon/falcon/client/sensor_download"
)

// RegistryLogin gets the registry login from the CrowdStrike API using the SensorDownload API.
func RegistryLogin(prefix string, cid string) string {
	return fmt.Sprintf("%s-%s", prefix, strings.ToLower(strings.Split(cid, "-")[0]))
}

// getCID gets the Falcon CID from the CrowdStrike API using the SensorDownload API.
func GetCID(ctx context.Context, client *client.CrowdStrikeAPISpecification) (string, error) {
	response, err := client.SensorDownload.GetSensorInstallersCCIDByQuery(&sensor_download.GetSensorInstallersCCIDByQueryParams{
		Context: ctx,
	})
	if err != nil {
		return "", fmt.Errorf("could not get Falcon CID from CrowdStrike Falcon API: %v", err)
	}
	payload := response.GetPayload()
	if err = falcon.AssertNoError(payload.Errors); err != nil {
		return "", fmt.Errorf("error reported when getting Falcon CID from CrowdStrike Falcon API: %v", err)
	}
	if len(payload.Resources) != 1 {
		return "", fmt.Errorf("failed to get Falcon CID: Unexpected API response: %v", payload.Resources)
	}

	return payload.Resources[0], nil
}

// getSnapshotToken returns a registry credential for the CrowdStrike Cloud Snapshots API
func getSnapshotToken(ctx context.Context, client *client.CrowdStrikeAPISpecification) (string, error) {
	res, err := client.CloudSnapshots.GetCredentialsMixin0Mixin60(&cloud_snapshots.GetCredentialsMixin0Mixin60Params{
		Context: ctx,
	})
	if err != nil {
		return "", err
	}
	payload := res.GetPayload()
	if err = falcon.AssertNoError(payload.Errors); err != nil {
		return "", err
	}

	resourcesList := payload.Resources
	if len(resourcesList) != 1 {
		return "", fmt.Errorf("expected to receive exactly one token, but got %d", len(resourcesList))
	}

	valueString := *resourcesList[0].Token
	if valueString == "" {
		return "", fmt.Errorf("received empty token")
	}
	return valueString, nil
}

// getFCSCliToken returns a registry credential for the CrowdStrike FCS CLI API
func getFCSCliToken(ctx context.Context, client *client.CrowdStrikeAPISpecification) (string, error) {
	res, err := client.CspgIacapi.GetCredentialsMixin0(&cspg_iacapi.GetCredentialsMixin0Params{
		Context: ctx,
	})
	if err != nil {
		return "", err
	}

	payload := res.GetPayload()
	if err = falcon.AssertNoError(payload.Errors); err != nil {
		return "", err
	}

	if payload.Resources.Resources.Token == nil || *payload.Resources.Resources.Token == "" {
		return "", fmt.Errorf("expected to receive a token, but got none")
	}
	return *payload.Resources.Resources.Token, nil
}

// getDefaultToken returns a registry credential for the CrowdStrike Container Registry API
func getDefaultToken(ctx context.Context, client *client.CrowdStrikeAPISpecification) (string, error) {
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

	resourcesList := payload.Resources
	if len(resourcesList) != 1 {
		return "", fmt.Errorf("expected to receive exactly one token, but got %d", len(resourcesList))
	}

	valueString := *resourcesList[0].Token
	if valueString == "" {
		return "", fmt.Errorf("received empty token")
	}
	return valueString, nil
}

// RegistryToken gets the registry token from the CrowdStrike API using the FalconContainer API.
func RegistryToken(ctx context.Context, client *client.CrowdStrikeAPISpecification, sensor falcon.SensorType) (string, error) {
	switch sensor {
	case falcon.Snapshot:
		return getSnapshotToken(ctx, client)
	case falcon.FCSCli:
		return getFCSCliToken(ctx, client)
	default:
		return getDefaultToken(ctx, client)
	}
}

// WriteToCollection writes the image list to the CrowdStrike API using the CustomStorage API.
func WriteToCollection(client *client.CrowdStrikeAPISpecification, images interface{}) error {
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(images); err != nil {
		return fmt.Errorf("error encoding image list: %v", err)
	}

	_, err := client.CustomStorage.Upload(&custom_storage.UploadParams{
		CollectionName: "images",
		ObjectKey:      "all",
		Body:           io.NopCloser(&buf),
	})
	if err != nil {
		return fmt.Errorf("error storing image list in collection: %v", err)
	}

	return nil
}
