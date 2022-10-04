const github = require('@actions/github');
const core = require('@actions/core');
const datefns = require('date-fns');
const moment = require('moment');

const WEEK = 7;

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function addDate(date, count) {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
}

async function run() {
  const token = core.getInput('token');
  const octokit = github.getOctokit(token);

  const baseTitle = core.getInput('title');
  const days = core.getInput('days').split(',');
  const dateOpts = core.getInput('date_options') && JSON.parse(core.getInput('date_options'));

  const count = core.getInput('count');
  const format = core.getInput('format');

  const promises = [];

  for (let i = 0; i < count; i += 1) {
    const d = addDate(new Date(), WEEK * i);
    d.setHours(23);
    d.setMinutes(59);
    d.setSeconds(59);

    days.forEach(day => {
      promises.push(
        new Promise((resolve, reject) => {
          const date = datefns[`next${capitalize(day)}`](d);

          let title = baseTitle;
          if (dateOpts) {
            title += ` (${date.toLocaleDateString(undefined, dateOpts)})`;
          } else {
            title += moment(date).format(format);
          }

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
  }

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
