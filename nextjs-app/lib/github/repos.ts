import { Octokit } from '@octokit/rest';

export async function listRepos(octokit: Octokit) {
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
  });
  return data;
}

export async function getRepo(octokit: Octokit, owner: string, repo: string) {
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data;
}

export async function getReadme(octokit: Octokit, owner: string, repo: string) {
  try {
    const { data } = await octokit.rest.repos.getReadme({ owner, repo });
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
  } catch {
    return null;
  }
}
