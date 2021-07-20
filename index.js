const github = require("@actions/github");
const core = require("@actions/core");

// github.context.payload // JSON for the trigger event
// core.getInput('who-to-greet');
// core.setOutput("time", time);

try {
  const token = core.getInput("token");
  /* This should be a token with access to your repository scoped in as a secret.
   * The YML workflow will need to set myToken with the GitHub Secret Token
   * myToken: ${{ secrets.GITHUB_TOKEN }}
   * https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
   */

  const octokit = github.getOctokit(token);
  /* You can also pass in additional options as a second parameter to getOctokit
   * const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});
   */

  let title = core.getInput("title");
  const timeBetween = parseInt(core.getInput("time_between"));
  let date = new Date();
  date.setDate(date.getDate() + timeBetween);
  const dateOpts = JSON.parse(core.getInput("date_options"));
  date = date.toLocaleDateString(undefined, dateOpts);

  title = `${title} (${date})`;

  octokit.rest.issues
     .createMilestone({
      ...github.context.repo,
      title,
    })
    .then(({ data: pullRequest }) => {
      console.log(pullRequest);
    });
} catch (err) {
  core.setFailed(err.message);
}
