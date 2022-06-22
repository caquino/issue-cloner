const core = require('@actions/core');
const github = require('@actions/github');;

async function start() {
  try {
    const sourceLabel = core.getInput('sourceLabel');
    const destinationLabel = core.getInput('destinationLabel');
    const targetRepo = core.getInput('targetRepo', { required: true });
    const ghToken = core.getInput('token', { required: true });

    const octokit = new github.getOctokit(ghToken);
    const originalIssue = await getOriginalIssue(octokit);

    if (await hasComment(octokit, originalIssue)) {
      console.log("Issue was already cloned. Skiping");
      return;
    }

    if (!hasLabel(sourceLabel, originalIssue)) {
      console.log(`Label ${label} not present. Will not copy issue`)
      return;
    }
    const clonedIssue = await cloneIssue(octokit, targetRepo, originalIssue, destinationLabel)

    await addComment(octokit, originalIssue, clonedIssue)

    console.log(`Issue cloned successfully`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

start();

async function getOriginalIssue(octokit) {
  const payloadIssue = github.context.payload.issue;
  if (!payloadIssue) {
    throw new Error("No issue in context");
  }
  const issue = await octokit.rest.issues.get({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: payloadIssue.number
  })

  return issue;
}

async function cloneIssue(octokit, targetRepo, original, destinationLabel) {
  const splitted = targetRepo.split('/');
  const owner = splitted[0];
  const repoName = splitted[1];
  
  const issueRegex = /(?<=^|\s)#\d+(?=\s|$)/g; // #12 as a word in the text
  let body = original.data.body.replace(issueRegex, (match) => {
    const issueNumber = match.substr(1);
    return `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/issues/${issueNumber}`;
  });

  body = `Issue cloned from ${original.data.html_url}\n\n${body}`;

  const title = original.data.title;
  const result = await octokit.rest.issues.create({
    owner: owner,
    repo: repoName,
    body: body,
    title: title,
    labels: [destinationLabel]
  });

  // set output to create issue number
  core.setOutput('cloned_issue_id', result.data.number);

  return result;
}

async function addComment(octokit, originalIssue, clonedIssue) {
  const result = await octokit.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: originalIssue.data.number,
    body: `Issue cloned to ${clonedIssue.data.html_url}`
  })
  return result;
}

async function hasComment(octokit, originalIssue) {
  const result = await octokit.rest.issues.listComments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: originalIssue.data.number
  })

  // check all comments for `Issue cloned to`
  for (let comment of result.data) {
    if (comment.body.includes('Issue cloned to')) {
      return true;
    }
  }
  return false;
}

function hasLabel(label, issue) {
  const labels = issue.data.labels;
  for (let l of labels) {
    if (label === l.name) {
      return true;
    }
  }
  return false;
}
