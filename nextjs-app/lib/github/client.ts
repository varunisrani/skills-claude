import { Octokit } from '@octokit/rest';

export function createGitHubClient(token: string) {
  return new Octokit({ auth: token });
}
