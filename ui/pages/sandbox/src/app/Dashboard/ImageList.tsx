import * as React from "react";
import { DataList, PageSection, Title } from "@patternfly/react-core";
import FalconApi from "@crowdstrike/foundry-js";
import { ImageItem } from "./ImageItem";
import ImageCollectionResponse from "@app/shared/ImageCollectionResponse";
import Image from "../shared/Image";

const ImageList: React.FunctionComponent = () => {
  const falcon = new FalconApi();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [images, setImages] = React.useState<Image[]>([]);

  React.useEffect(() => {
    console.log("connecting...");
    falcon
      .connect()
      .then(() => {
        if (!falcon.isConnected) return;
        console.log("connected, reading images");
        const imageCol = falcon.collection({ collection: "images" });
        return imageCol.read("all");
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

  return (
    <DataList aria-label="Mixed expandable data list example">
      {images.map((i) => {
        return <ImageItem image={i} key={i.name} />;
      })}
    </DataList>
  );
};

export { ImageList };
