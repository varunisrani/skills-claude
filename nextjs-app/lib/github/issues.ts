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
  
  // Filter out pull requests - GitHub API includes PRs in issues endpoint
  // Pull requests have a 'pull_request' property
  return data.filter(item => !item.pull_request);
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
    per_page: 100, // Increase to ensure we get all comments
  });
  
  // Log raw comment data to help debug bot comments
  console.log('Raw GitHub Comments:', data.map(comment => ({
    id: comment.id,
    user: comment.user?.login,
    user_type: comment.user?.type,
    performed_via_github_app: !!comment.performed_via_github_app,
    created_at: comment.created_at,
    body_preview: comment.body?.substring(0, 100)
  })));
  
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

export async function listIssueEvents(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number
) {
  const { data } = await octokit.rest.issues.listEvents({
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  });
  return data;
}

export async function listIssueTimeline(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number
) {
  try {
    // Timeline API gives us all events including comments, cross-references, etc.
    const { data } = await octokit.rest.issues.listEventsForTimeline({
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 100,
    });
    return data;
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return [];
  }
}
