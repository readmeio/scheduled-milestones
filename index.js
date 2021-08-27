const github = require('@actions/github');
const core = require('@actions/core');
const datefns = require('date-fns');

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function run() {
  const token = core.getInput('token');
  const octokit = github.getOctokit(token);

  const baseTitle = core.getInput('title');
  const days = core.getInput('days').split(',');
  const dateOpts = JSON.parse(core.getInput('date_options'));

  const promises = [];

  days.forEach(day => {
    promises.push(
      new Promise((resolve, reject) => {
        const date = datefns[`next${capitalize(day)}`](new Date());
        const milestoneDate = date.toLocaleDateString(undefined, dateOpts);

        const title = `${baseTitle} (${milestoneDate})`;

        octokit.rest.issues
          .createMilestone({
            ...github.context.repo,
            title,
            due_on: date,
          })
          .then(({ data }) => {
            resolve(data.html_url);
          })
          .catch(err => {
            // If the milestone already exists `err.message` will look like the following:
            //    'Validation Failed: {"resource":"Milestone","code":"already_exists","field":"title"}'
            if (!err.message.match(/already_exists/)) {
              reject(err);
            }
          });
      })
    );
  });

  const milestones = [];
  await Promise.all(promises).then(url => {
    milestones.push(url);
  });

  core.setOutput('milestones', milestones);
}

try {
  run();
} catch (err) {
  core.setFailed(err.message);
}
