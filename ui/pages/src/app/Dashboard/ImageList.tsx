import { useFoundry } from "@crowdstrike/alloy-react";
import {
  Alert,
  Button,
  DataList,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Grid,
  GridItem,
  Skeleton,
  Timestamp,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import * as React from "react";
import Image from "../types/Image";
import ImageCollectionResponse from "../types/ImageCollectionResponse";
import { ImageItem } from "./ImageItem";

const ImageList: React.FunctionComponent = () => {
  const { falcon, isInitialized } = useFoundry();
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
    if (!falcon || !isInitialized) return;
    falcon
      .collection({ collection: "images" })
      .read("all")
      .then((resp) => {
        const imageResp = resp as ImageCollectionResponse;
        // if (imageResp.errors && imageResp.errors.length > 0) {
        //   if (imageResp.errors[0].code == 404) {
        //     // collection hasn't been synced yet, do that now
        //     syncImages();
        //   } else {
        //     setErrorSafe(imageResp.errors[0].message);
        //   }
        //   return;
        // }
        imageResp.updated && setUpdated(imageResp.updated);
        imageResp.images && setImages(imageResp.images);
      })
      .catch(setErrorSafe)
      .finally(() => {
        setLoading(false);
      });
  }

  function deleteImages() {
    falcon!.collection({ collection: "images" }).delete("all");
  }

  React.useEffect(loadImages, [isInitialized]);

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
        {(images.length == 0 && (
          <EmptyState
            titleText="No images synced"
            headingLevel="h4"
            icon={CubesIcon}
          >
            <EmptyStateBody>
              Images haven't been synced from the CrowdStrike registry yet.
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="primary" onClick={syncImages}>
                  Sync images now
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        )) || (
          <>
            <DataList aria-label="Mixed expandable data list example">
              {images.map((i) => {
                return <ImageItem image={i} key={i.name} />;
              })}
            </DataList>
            <Toolbar>
              <ToolbarContent>
                <ToolbarItem alignSelf="center">
                  <p>
                    Last sync was{" "}
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
                {/* <ToolbarItem hidden={true}>
                  <Button variant="link" onClick={deleteImages}>
                    Delete synced images
                  </Button>
                </ToolbarItem> */}
              </ToolbarContent>
            </Toolbar>
          </>
        )}
      </>
    );
  }
};

export { ImageList };
