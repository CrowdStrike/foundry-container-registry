import * as React from "react";
import {
  DataList,
  Grid,
  GridItem,
  PageSection,
  Skeleton,
  Title,
} from "@patternfly/react-core";
import FalconApi from "@crowdstrike/foundry-js";
import { ImageItem } from "./ImageItem";
import ImageCollectionResponse from "@app/types/ImageCollectionResponse";
import Image from "../types/Image";

const ImageList: React.FunctionComponent = () => {
  const falcon = new FalconApi();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [images, setImages] = React.useState<Image[]>([]);

  React.useEffect(() => {
    if (window.location.hostname == "localhost") {
      // collection auth doesn't work in dev mode PLATFORMPG-792212
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
        setImages(imageResp.images);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
      <DataList aria-label="Mixed expandable data list example">
        {images.map((i) => {
          return <ImageItem image={i} key={i.name} />;
        })}
      </DataList>
    );
  }
};

export { ImageList };
