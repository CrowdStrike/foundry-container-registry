import Image from "./Image";

export default interface ImageCollectionResponse {
  duration: number;
  updated: Date;
  images: Image[];
  errors?: {
    code: number;
    message: string;
  }[];
}
