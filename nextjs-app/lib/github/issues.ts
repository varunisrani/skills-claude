import { Octokit } from '@octokit/rest';

export async function listIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
) {
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state,
    per_page: 100,
  });
  return data;
}

export async function getIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number
) {
  const { data } = await octokit.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });
  return data;
}

export async function createIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  body: string
) {
  const { data } = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body,
  });
  return data;
}

export async function createComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
) {
  const { data } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
  return data;
}

export async function listComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number
) {
  const { data } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
  });
  return data;
}

export async function updateIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  state: 'open' | 'closed'
) {
  const { data } = await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state,
  });
  return data;
}
