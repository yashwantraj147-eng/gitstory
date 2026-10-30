import { NarrativeContext, NarrativeTone } from "./types";
import { StoryNarrative } from "../analytics/types";

export class TemplateNarrativeEngine {
  generate(context: NarrativeContext, tone: NarrativeTone = "storyteller"): StoryNarrative {
    const { repo, metrics, milestones, heatmap, contributors, languages } = context;

    const birthYear = new Date(repo.created_at).getFullYear();
    const primaryLang = languages.primaryLanguage || repo.language || "Code";
    const topAuthor = contributors.topContributors[0]?.login || repo.owner.login;
    const authorCount = contributors.totalUniqueAuthors;
    const totalStars = repo.stargazers_count.toLocaleString();
    const peakDay = heatmap.peakDayName;
    const peakHour = heatmap.peakHourLabel;
    const releasesCount = metrics.releasesCount;

    // Milestone references
    const slumber = milestones.find((m) => m.type === "slumber");
    const goldenEra = milestones.find((m) => m.type === "golden_era");
    const monsterCommit = milestones.find((m) => m.type === "monster_commit");

    switch (tone) {
      case "humorous":
        return {
          title: `The Chaotic Chronicles of ${repo.name}`,
          subtitle: `A caffeine-fueled journey of ${metrics.totalCommitsAnalyzed} commits across ${metrics.lifespanFormatted}.`,
          tone: "humorous",
          generatedBy: "template",
          chapters: [
            {
              id: "ch1",
              title: "Chapter 1: It Seemed Like a Quick Weekend Project",
              timeframe: `Born in ${birthYear}`,
              summary: `When "${repo.name}" was supposed to be finished in two days.`,
              content: `Back in ${birthYear}, somebody thought: "I'll just whip up a clean little ${primaryLang} repo over the weekend." Little did they know, ${metrics.lifespanFormatted} later, it would blossom into ${metrics.totalCommitsAnalyzed.toLocaleString()} commits and amass ${totalStars} stars. The initial commit was pushed with boundless optimism, completely oblivious to the impending dependency updates and Git merge conflicts that lay ahead.`,
              highlightMetric: `${totalStars} Stars Earned`,
            },
            {
              id: "ch2",
              title: "Chapter 2: The Nocturnal Code Machine",
              timeframe: "Peak Coding Hours",
              summary: `Fueling the engine on ${peakDay}s at ${peakHour}.`,
              content: `The commit logs don't lie: ${metrics.nightOwlPercentage}% of the codebase was constructed during prime vampire hours, with development peaking on ${peakDay}s at ${peakHour}. ${metrics.weekendHackerPercentage}% of all pushes happened during weekends when normal humans were touching grass. Clearly, somebody was surviving on espresso and stubbornness.`,
              highlightMetric: `${metrics.nightOwlPercentage}% Night Owl Commits`,
            },
            {
              id: "ch3",
              title: "Chapter 3: The Drama, The Pauses, The Crunch",
              timeframe: "Trials & Tribulations",
              summary: slumber
                ? `A nap lasting ${slumber.metadata?.gapDays ?? 30} days, followed by feverish typing.`
                : "Continuous velocity without looking back.",
              content: slumber
                ? `Every legendary project needs its beauty sleep. For ${slumber.metadata?.gapDays} straight days, the commit graph flatlined into absolute silence. Whispers echoed: "Is it abandoned?" But then, like a phoenix with a compiler, ${goldenEra ? `the team returned with an unhinged sprint of ${goldenEra.metadata?.commitCount} commits in seven days` : "the maintainers stormed back with fresh energy"}!`
                : `Unlike projects that take long snoozes, ${repo.name} kept its foot firmly on the accelerator with an average of ${metrics.averageCommitsPerActiveDay} commits per active day.${monsterCommit ? ` Along the way, a monster commit overhauled ${monsterCommit.metadata?.churn?.toLocaleString()} lines in a single fell swoop.` : ""}`,
              highlightMetric: slumber ? `${slumber.metadata?.gapDays} Day Nap` : `${metrics.commitVelocityPerMonth}/mo Velocity`,
            },
            {
              id: "ch4",
              title: "Chapter 4: The Army of Maintainers",
              timeframe: "Present Day",
              summary: `${authorCount} brave contributors shaping the future.`,
              content: `What began in the hands of ${topAuthor} has now captivated ${authorCount.toLocaleString()} contributors worldwide. With ${releasesCount} releases under its belt, ${repo.name} stands as an unstoppable pillar in open-source. Remember: never deploy on Friday afternoon.`,
              highlightMetric: `${authorCount} Unique Contributors`,
            },
          ],
        };

      case "chronicle":
        return {
          title: `Technical Chronicle: Evolution of ${repo.name}`,
          subtitle: `An architectural retrospective spanning ${metrics.lifespanFormatted} of ${primaryLang} engineering.`,
          tone: "chronicle",
          generatedBy: "template",
          chapters: [
            {
              id: "ch1",
              title: "Architecture Genesis & Foundation",
              timeframe: `Initialized ${birthYear}`,
              summary: `Establishment of core codebase and initial architecture.`,
              content: `The repository ${repo.full_name} was formally established in ${birthYear}. Built predominantly with ${primaryLang} (${languages.languages[0]?.percentage ?? 100}% of codebase), the project laid its architectural foundation with disciplined modularity. Early iterations focused on stability, default branching, and establishing open-source governance under the ${repo.license?.name || "open-source"} license.`,
              highlightMetric: `${languages.languages[0]?.percentage ?? 100}% ${primaryLang}`,
            },
            {
              id: "ch2",
              title: "Development Velocity & Cadence",
              timeframe: "Lifecycle Velocity",
              summary: `Sustained output of ${metrics.commitVelocityPerMonth} commits/month.`,
              content: `Analysis of git history shows a robust commit velocity of ${metrics.commitVelocityPerMonth} commits per month. Activity distribution reveals highest throughput on ${peakDay} at ${peakHour}, with active contributors maintaining a steady ${metrics.averageCommitsPerActiveDay} commits per productive day. ${releasesCount > 0 ? `The release engineering pipeline has successfully shipped ${releasesCount} formal tagged milestones.` : "Continuous deployment practices maintain trunk velocity on the default branch."}`,
              highlightMetric: `${releasesCount} Releases Deployed`,
            },
            {
              id: "ch3",
              title: "Refactoring Milestones & Resilience",
              timeframe: "Codebase Maturity",
              summary: `Navigating major structural updates and iteration cycles.`,
              content: `${monsterCommit ? `Significant architectural evolution was cemented with major refactoring passes, notably committing ${monsterCommit.metadata?.churn?.toLocaleString()} lines of additions and deletions.` : "The codebase has maintained clean incremental changes throughout its lifetime."} ${slumber ? `An intentional research and stabilization interval of ${slumber.metadata?.gapDays} days allowed the core team to evaluate requirements before accelerating forward.` : "Commit intervals show uninterrupted iteration."}`,
              highlightMetric: `${metrics.totalCommitsAnalyzed} Commits Tested`,
            },
            {
              id: "ch4",
              title: "Current State & Community Matrix",
              timeframe: "Present Architecture",
              summary: `Ecosystem health and contributor distribution.`,
              content: `Today, ${repo.name} is maintained by a distributed cohort of ${authorCount} engineers, led in overall commit volume by ${topAuthor} (${contributors.topContributors[0]?.percentage ?? 0}% volume). The repository commands ${totalStars} stargazers and ${repo.forks_count.toLocaleString()} forks, marking it as a critical asset in the modern software landscape.`,
              highlightMetric: `${repo.forks_count.toLocaleString()} Downstream Forks`,
            },
          ],
        };

      case "storyteller":
      default:
        return {
          title: `The Story of ${repo.name}`,
          subtitle: `From its first commit in ${birthYear} to a community of ${authorCount} builders worldwide.`,
          tone: "storyteller",
          generatedBy: "template",
          chapters: [
            {
              id: "ch1",
              title: "The First Spark",
              timeframe: `Born in ${birthYear}`,
              summary: `A humble origin that grew into something extraordinary.`,
              content: `Every great piece of software begins with an empty directory and a quiet stroke of inspiration. In ${birthYear}, ${repo.owner.login} initialized ${repo.name}. Crafting it in ${primaryLang}, the vision took shape one line at a time. What started as an idea quickly gained traction, capturing the imagination of developers worldwide and earning ${totalStars} stars.`,
              highlightMetric: `Born ${birthYear}`,
            },
            {
              id: "ch2",
              title: "The Rhythm of Creation",
              timeframe: "Finding the Flow",
              summary: `Crafting code through the quiet hours and busy weeks.`,
              content: `As momentum built, a distinct rhythm emerged. The repository beat to the pulse of its developers—surging on ${peakDay}s around ${peakHour}. Over ${metrics.lifespanFormatted}, code flowed steadily, averaging ${metrics.commitVelocityPerMonth} commits each month. Whether in midday sprints or late-night sparks of genius (${metrics.nightOwlPercentage}% written under the stars), every commit pushed the boundary forward.`,
              highlightMetric: `${metrics.lifespanFormatted} Active Lifespan`,
            },
            {
              id: "ch3",
              title: "Turning Points & Milestones",
              timeframe: "The Defining Moments",
              summary: `Crucial breakthroughs that propelled the repository forward.`,
              content: `${goldenEra ? `During a standout sprint, the project experienced an explosive wave of creativity, landing ${goldenEra.metadata?.commitCount} commits in just seven days.` : "Consistent dedication kept the repository moving forward with reliable consistency."} ${slumber ? `Following a quiet pause of ${slumber.metadata?.gapDays} days, the team roared back to life.` : "Through every challenge, the codebase evolved with grace and resilience."}`,
              highlightMetric: `${milestones.length} Major Milestones`,
            },
            {
              id: "ch4",
              title: "The Growing Village",
              timeframe: "The Community Today",
              summary: `United by shared code and passion.`,
              content: `Software is built by people. Today, ${repo.name} is shaped by ${authorCount} distinct contributors, with ${topAuthor} leading the charge alongside hundreds of pull requests and issues. With ${releasesCount} releases out in the wild, the story of ${repo.name} is far from over—in fact, its best chapters are still being written.`,
              highlightMetric: `${authorCount} Global Contributors`,
            },
          ],
        };
    }
  }
}

