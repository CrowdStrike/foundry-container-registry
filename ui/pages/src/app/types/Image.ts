export default interface Image {
  name: string;
  description: string;
  latest: string;
  registry: string;
  repository: string;
  digest: string;
  login: string;
  password: string;
  dockerAuthConfig: string;
  tags: {
    name: string;
    arch: string[];
  }[];
}
