package main

import (
	"context"
	"log/slog"

	fdk "github.com/CrowdStrike/foundry-fn-go"
)

func main() {
	fdk.Run(context.Background(), newHandler)
}

func newHandler(_ context.Context, logger *slog.Logger, _ fdk.SkipCfg) fdk.Handler {
	mux := fdk.NewMux()
	mux.Post("/sync-images", fdk.HandlerFn(func(ctx context.Context, r fdk.Request) fdk.Response {
		return fdk.Response{
			Code: 200,
			Body: fdk.JSON("DID IT WORK?"),
		}
		// client, err := newFalconClient(ctx, r.AccessToken)
		// if err != nil {
		// 	return fdk.Response{
		// 		Code: 500,
		// 		Errors: []fdk.APIError{{
		// 			Code:    505,
		// 			Message: err.Error(),
		// 		}},
		// 	}
		// 	// some other error - see gofalcon documentation
		// }
		// res, err := client.FalconContainer.GetCredentials(&falcon_container.GetCredentialsParams{
		// 	Context: context.Background(),
		// })

		// if err != nil {
		// 	return fdk.Response{
		// 		Code: 500,
		// 		Body: fdk.JSON(err),
		// 	}
		// 	// some other error - see gofalcon documentation
		// }
		// return fdk.Response{
		// 	Code: 200,
		// 	Body: fdk.JSON(*res.GetPayload().Resources[0].Token),
		// }
	}))
	return mux
}

// func newFalconClient(ctx context.Context, token string) (*client.CrowdStrikeAPISpecification, error) {
// 	opts := fdk.FalconClientOpts()
// 	_ = token
// 	return falcon.NewClient(&falcon.ApiConfig{
// 		ClientId:          os.Getenv("FALCON_CLIENT_ID"),
// 		ClientSecret:      os.Getenv("FALCON_CLIENT_SECRET"),
// 		Cloud:             falcon.Cloud(opts.Cloud),
// 		Context:           ctx,
// 		UserAgentOverride: opts.UserAgent,
// 	})
// }

// type config struct {
// 	Int int    `json:"integer"`
// 	Str string `json:"string"`
// }

// func (c config) OK() error {
// 	var errs []error
// 	if c.Int < 1 {
// 		errs = append(errs, errors.New("integer must be greater than 0"))
// 	}
// 	if c.Str == "" {
// 		errs = append(errs, errors.New("non empty string must be provided"))
// 	}
// 	return errors.Join(errs...)
// }
