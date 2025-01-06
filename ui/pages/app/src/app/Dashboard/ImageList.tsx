import ImageCollectionResponse from "@app/types/ImageCollectionResponse";
import FalconApi from "@crowdstrike/foundry-js";
import {
  Alert,
  Button,
  DataList,
  Grid,
  GridItem,
  Skeleton,
  Timestamp,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import * as React from "react";
import Image from "../types/Image";
import { ImageItem } from "./ImageItem";

const ImageList: React.FunctionComponent = () => {
  const [falcon, setFalcon] = React.useState<FalconApi | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [images, setImages] = React.useState<Image[]>([]);
  const [updated, setUpdated] = React.useState<Date>();

  function setErrorSafe(e: string | Error | Error[]) {
    if (typeof e == "string") {
      setError(new Error(e));
    } else if (e instanceof Error) {
      setError(e);
    } else {
      setError(e[0]);
    }
  }

  function syncImages() {
    setLoading(true);
    falcon!
      .cloudFunction({
        name: "syncimages",
      })
      .post({
        path: "/sync-images",
      })
      .then(loadImages)
      .catch(setErrorSafe)
      .finally(() => {
        setLoading(false);
      });
  }

  function loadImages() {
    if (falcon == null || !falcon.isConnected) return;
    if (window.location.hostname == "localhost") {
      // collection auth doesn't work in dev mode PLATFORMPG-792212
      setUpdated(new Date());
      setImages([
        {
          name: "Mock Falcon Sensor",
          description:
            "The Mock Falcon Sensor is a placeholder object used to display something in the UI when running in dev mode.",
          latest: "1.23-4567.DEV.mock.us-0",
          registry: "registry.crowdstrike.com",
          repository: "registry.crowdstrike.com/mock/sensor/falcon-mock",
          tags: [
            {
              name: "1.22-4567.DEV.mock.us-0",
              arch: ["x86_64"],
            },
            {
              name: "1.23-4567.DEV.mock.us-0",
              arch: ["x86_64", "aarch64"],
            },
          ],
        },
      ]);
      setTimeout(() => {
        // simulate collection load time so we can test the skelton
        setLoading(false);
      }, 1500);
      return;
    }
    falcon
      .connect()
      .then(() => {
        if (!falcon.isConnected) return;
        return falcon.collection({ collection: "images" }).read("all");
      })
      .then((resp) => {
        console.log(resp);
        const imageResp = resp as ImageCollectionResponse;
        setUpdated(imageResp.updated);
        setImages(imageResp.images);
      })
      .catch(setErrorSafe)
      .finally(() => {
        setLoading(false);
      });
  }

  React.useEffect(() => {
    const f = new FalconApi();
    f.connect()
      .then(() => {
        if (!f.isConnected) {
          setErrorSafe("falcon.connect() completed but not connected");
        } else {
          console.log(f);
          setFalcon(f);
        }
      })
      .catch(setErrorSafe);
  }, []);

  React.useEffect(loadImages, [falcon]);

  if (loading) {
    return (
      <Grid>
        <GridItem span={6}>
          <Skeleton width="80%" fontSize="3xl"></Skeleton>
        </GridItem>
        <GridItem span={6}>
          <Skeleton width="60%" fontSize="3xl"></Skeleton>
        </GridItem>
      </Grid>
    );
  } else {
    return (
      <>
        {error && (
          <Alert variant="danger" title="Unexpected error">
            <p>{error.message}</p>
          </Alert>
        )}
        <DataList aria-label="Mixed expandable data list example">
          {images.map((i) => {
            return <ImageItem image={i} key={i.name} />;
          })}
        </DataList>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem alignSelf="center">
              <p>
                This app periodically syncs image data with the CrowdStrike
                registry. Last sync was{" "}
                <Timestamp
                  date={updated}
                  style={{ fontSize: "var(--pf-v6-c-toolbar--FontSize)" }}
                />
                .
              </p>
            </ToolbarItem>
            <ToolbarItem>
              <Button variant="link" onClick={syncImages}>
                Sync images now
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </>
    );
  }
};

export { ImageList };
