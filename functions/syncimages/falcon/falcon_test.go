package falcon

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/crowdstrike/gofalcon/falcon"
)

func TestWriteToCollectionReturnsPayloadErrors(t *testing.T) {
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"errors":[{"code":400,"message":"collection validation failed"}],"meta":{},"resources":[]}`))
	}))
	defer server.Close()

	client, err := falcon.NewClient(&falcon.ApiConfig{
		AccessToken:  "test-token",
		Context:      context.Background(),
		HostOverride: strings.TrimPrefix(server.URL, "https://"),
		TransportDecorator: func(http.RoundTripper) http.RoundTripper {
			return server.Client().Transport
		},
	})
	if err != nil {
		t.Fatalf("falcon.NewClient() error = %v", err)
	}

	err = WriteToCollection(client, map[string]string{"updated": "2026-10-01T00:00:00Z"})
	if err == nil || !strings.Contains(err.Error(), "collection validation failed") {
		t.Fatalf("WriteToCollection() error = %v, want collection validation error", err)
	}
}
