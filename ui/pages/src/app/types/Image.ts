export default interface Image {
  name: string;
  description: string;
  latest: string;
  registry: string;
  repository: string;
  digest: string;
  tags: {
    name: string;
    digest: string;
    arch: string[];
    buildDate?: string;
  }[];
}
