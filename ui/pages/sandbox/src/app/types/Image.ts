export default interface Image {
  name: string;
  description: string;
  latest: string;
  registry: string;
  repository: string;
  tags: {
    name: string;
    arch: string[];
  }[];
}
