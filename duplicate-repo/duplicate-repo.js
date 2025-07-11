require('dotenv').config();
const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SOURCE_REPO = process.env.SOURCE_REPO;
const DEST_REPOS = JSON.parse(process.env.DEST_REPOS);

if (!GITHUB_TOKEN || !SOURCE_REPO || !DEST_REPOS) {
  console.error('❌ Missing required environment variables. Check your .env file.');
  process.exit(1);
}

const HEADERS = {
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  },
};

const GITHUB_API = 'https://api.github.com/repos';

// 🚨 **Milestones to exclude**
const MILESTONES_TO_EXCLUDE = [];

// 🚀 **Milestones to include** (Set to ['*'] to include all except exclusions)
const MILESTONES_TO_INCLUDE = ['1. Learn about Focus Bear and set your goals', '0. Company policies']; // Example: ['Milestone A', 'Milestone B']

const ISSUES_TO_INCLUDE = [7, 12]; // Example: [7, 12] to include specific issue numbers or ['*'] to include all issues

async function fetchAllIssues(repo) {
  let issues = [];
  for (const state of ["open", "closed"]) {
      let page = 1;
      while (true) {
          const { data, headers } = await axios.get(`${GITHUB_API}/${repo}/issues?state=${state}&per_page=100&page=${page}`, HEADERS);
          issues = issues.concat(data);
          if (!headers.link || !headers.link.includes('rel="next"')) break;
          page++;
        }
    }
  return issues;
}

// Helper function to fetch paginated results
async function fetchAll(url) {
  let results = [];
  let page = 1;

  while (true) {
    const { data, headers } = await axios.get(`${url}?per_page=100&page=${page}`, HEADERS);
    results = results.concat(data);

    if (!headers.link || !headers.link.includes('rel="next"')) break;

    page++;
  }

  return results;
}

// Fetch all milestones, applying include/exclude filters
async function copyMilestones(destRepo) {
  try {
    const existingMilestones = await fetchAll(`${GITHUB_API}/${destRepo}/milestones`);
    const existingMilestoneMap = new Map(existingMilestones.map(m => [m.title, m.number]));

    const sourceMilestones = await fetchAll(`${GITHUB_API}/${SOURCE_REPO}/milestones`);
    const milestoneMap = {};

    for (const milestone of sourceMilestones) {
      if (MILESTONES_TO_EXCLUDE.includes(milestone.title)) {
        console.log(`🚫 Skipping excluded milestone: ${milestone.title}`);
        continue;
      }

      if (MILESTONES_TO_INCLUDE[0] !== '*' && !MILESTONES_TO_INCLUDE.includes(milestone.title)) {
        console.log(`🚫 Skipping non-included milestone: ${milestone.title}`);
        continue;
      }

      if (existingMilestoneMap.has(milestone.title)) {
        console.log(`🔄 Skipping existing milestone: ${milestone.title}`);
        milestoneMap[milestone.number] = existingMilestoneMap.get(milestone.title);
        continue;
      }

      const payload = {
        title: milestone.title,
        state: milestone.state,
        description: milestone.description || '',
      };
      if (milestone.due_on) payload.due_on = milestone.due_on;

      const { data: newMilestone } = await axios.post(`${GITHUB_API}/${destRepo}/milestones`, payload, HEADERS);
      milestoneMap[milestone.number] = newMilestone.number;
      console.log(`✅ Created milestone: ${milestone.title} (New ID: ${newMilestone.number})`);
    }

    return milestoneMap;
  } catch (error) {
    console.error('❌ Error copying milestones:', error.response?.data || error.message);
    return {};
  }
}

// Fetch and copy issues
async function copyIssues(milestoneMap, destRepo) {
  try {
    const sourceIssues = await fetchAllIssues(SOURCE_REPO);
    const existingIssues = await fetchAllIssues(destRepo);
    const existingIssueMap = new Map(existingIssues.map(issue => [issue.title, issue]));

    for (const issue of sourceIssues) {
      if (ISSUES_TO_INCLUDE[0] !== '*' && !ISSUES_TO_INCLUDE.includes(issue.number)) {
        console.log(`🚫 Skipping issue: ${issue.title} (Not in include list)`);
        continue;
      }

      if (issue.pull_request) continue; // Skip pull requests

      if (issue.milestone && MILESTONES_TO_EXCLUDE.includes(issue.milestone.title)) {
        console.log(`🚫 Skipping issue: ${issue.title} (Excluded milestone)`);
        continue;
      }

      if (issue.milestone && MILESTONES_TO_INCLUDE[0] !== '*' && !MILESTONES_TO_INCLUDE.includes(issue.milestone.title)) {
        console.log(`🚫 Skipping issue: ${issue.title} (Milestone not in include list)`);
        continue;
      }

      if (existingIssueMap.has(issue.title)) {
        const existingIssue = existingIssueMap.get(issue.title);
        const isBodyChanged = existingIssue.body !== issue.body || (issue.body && !existingIssue.body);
        if (isBodyChanged) {
          console.log(`🔄 Updating body content for issue: ${issue.title}`);
          await axios.patch(`${GITHUB_API}/${destRepo}/issues/${existingIssue.number}`, {
            body: issue.body || '',
          }, HEADERS);
        } else {
          console.log(`🔄 Skipping existing issue body: ${issue.title} (Body is unchanged)`);
        }

        if (
          issue.milestone &&
          milestoneMap[issue.milestone.number] &&
          existingIssue.milestone?.number !== milestoneMap[issue.milestone.number]
        ) {
          console.log(`🔄 Updating milestone for issue: ${issue.title}`);
          await axios.patch(`${GITHUB_API}/${destRepo}/issues/${existingIssue.number}`, {
            milestone: milestoneMap[issue.milestone.number],
          }, HEADERS);
        } else {
          console.log(`🔄 Skipping existing issue milestone: ${issue.title} (Milestone is correct)`);
        }
        continue;
      }

      const payload = {
        title: issue.title,
        body: issue.body || '',
        labels: issue.labels.map(l => l.name),
      };

      if (issue.milestone && milestoneMap[issue.milestone.number]) {
        payload.milestone = milestoneMap[issue.milestone.number];
      }

      const { data: newIssue } = await axios.post(`${GITHUB_API}/${destRepo}/issues`, payload, HEADERS);
      console.log(`✅ Created issue: ${newIssue.title} (Milestone: ${newIssue.milestone?.title || "None"})`);
    }
  } catch (error) {
    console.error('❌ Error copying issues:', error.response?.data || error.message);
  }
}

async function duplicateRepo(destRepo) {
  console.log('🚀 Starting repository duplication...', destRepo);
  const milestoneMap = await copyMilestones(destRepo);
  console.log('milestoneMap:', milestoneMap);
  await copyIssues(milestoneMap, destRepo);
  console.log('✅ Repository duplication completed successfully!');
}

DEST_REPOS.forEach((destRepo) => {
  duplicateRepo(destRepo);  
});
