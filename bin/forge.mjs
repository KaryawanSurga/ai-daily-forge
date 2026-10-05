#!/usr/bin/env node
/**
 * AI Daily Forge — scaffold, audit, and track daily AI project work.
 *
 * Zero dependencies. Node >= 20.
 *
 * Commands:
 *   forge doctor                 Check every prerequisite that decides whether
 *                                your commits actually appear on the graph.
 *   forge new <tpl> <slug>       Scaffold a ready-to-publish project.
 *   forge audit [dir]            Score a repository for publish-readiness.
 *   forge streak [--days N]      Real contribution heatmap from local git history.
 *   forge log <text>             Append today's real entry to the daily log.
 *   forge ideas [--md]           Print the ranked backlog / emit its markdown table.
 *   forge templates              List available templates.
 *
 * Exit codes: 0 ok, 1 problem found (doctor/audit/validate), 2 bad usage.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ utils */

const NO_COLOR = Boolean(process.env.NO_COLOR) || !process.stdout.isTTY;
const c = (code) => (s) => (NO_COLOR ? String(s) : `\x1b[${code}m${s}\x1b[0m`);
const bold = c('1');
const dim = c('2');
const red = c('31');
const green = c('32');
const yellow = c('33');
const cyan = c('36');

const OK = green('  ok  ');
const BAD = red(' fail ');
const WARN = yellow(' warn ');
const SKIP = dim(' skip ');

/** Run a command, return { code, stdout, stderr }. Never throws. */
function run(cmd, args, opts = {}) {
  try {
    const stdout = execFileSync(cmd, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      ...opts,
    });
    return { code: 0, stdout: stdout ?? '', stderr: '' };
  } catch (err) {
    return {
      code: typeof err.status === 'number' ? err.status : 1,
      stdout: err.stdout ? String(err.stdout) : '',
      stderr: err.stderr ? String(err.stderr) : '',
    };
  }
}

const has = (cmd) => run(cmd, ['--version']).code === 0;

/** git config lookup that degrades to '' instead of throwing. */
const gitConfig = (key) => run('git', ['config', '--get', key]).stdout.trim();

function die(msg, code = 2) {
  console.error(red('forge: ') + msg);
  process.exit(code);
}

/** Parse `--flag value` / `--flag=value` / boolean flags out of argv. */
function parseFlags(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      rest.push(a);
      continue;
    }
    const eq = a.indexOf('=');
    if (eq !== -1) {
      flags[a.slice(2, eq)] = a.slice(eq + 1);
    } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      flags[a.slice(2)] = argv[++i];
    } else {
      flags[a.slice(2)] = true;
    }
  }
  return { flags, rest };
}

/* --------------------------------------------------------------- timeline */

/**
 * GitHub groups commits by the DATE IN THE COMMIT'S OWN TIMEZONE, but renders
 * the graph in UTC. Both readings agree inside a window: for a UTC+7 author the
 * safe window is 07:00-23:59 local, because that maps onto one calendar date
 * under either interpretation. Outside it, a commit can land on the wrong day.
 */
const pad = (n) => String(n).padStart(2, '0');

function localIso(d) {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function offsetLabel(d) {
  const mins = -d.getTimezoneOffset();
  const sign = mins < 0 ? '-' : '+';
  const abs = Math.abs(mins);
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** Date (YYYY-MM-DD) a commit made at `d` would be attributed to. */
function attributionDays(d) {
  const local = localIso(d).slice(0, 10);
  const utc = new Date(d.getTime()).toISOString().slice(0, 10);
  return { local, utc, agree: local === utc };
}

/** First local hour at which both attribution readings agree all day. */
function safeWindowStart(offsetMinutes) {
  // Local clock must be ahead of UTC-date boundaries by at least the offset.
  const ahead = Math.max(0, offsetMinutes);
  return { startHour: Math.ceil(ahead / 60), endHour: 23 };
}

/* ----------------------------------------------------------------- config */

function loadConfig(flags) {
  const candidates = [
    flags.config,
    process.env.FORGE_CONFIG,
    path.join(process.cwd(), 'forge.config.json'),
    path.join(ROOT, 'forge.config.json'),
  ].filter(Boolean);

  let cfg = {};
  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      try {
        cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (err) {
        die(`cannot parse ${p}: ${err.message}`);
      }
      break;
    }
  }

  return {
    author: cfg.author || gitConfig('user.name') || '',
    email: cfg.email || gitConfig('user.email') || '',
    githubUser: cfg.githubUser || gitConfig('github.user') || '',
    license: cfg.license || 'MIT',
    templatesDir: cfg.templatesDir || path.join(ROOT, 'templates'),
    outputDir: cfg.outputDir || process.cwd(),
    ideasFile: cfg.ideasFile || path.join(ROOT, 'ideas.json'),
  };
}

/* --------------------------------------------------------------- gh helpers */

function ghAuthed() {
  const r = run('gh', ['auth', 'status']);
  return r.code === 0;
}

/** Account emails GitHub knows about, or null when unauthenticated. */
function ghAccountEmails() {
  const r = run('gh', ['api', 'user/emails', '--paginate', '--jq', '.[].email']);
  if (r.code !== 0) return null;
  return r.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

function ghJson(args, opts = {}) {
  const r = run('gh', [...args, '--jq', '.'], opts);
  if (r.code !== 0) return null;
  try {
    return JSON.parse(r.stdout);
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- doctor */

function cmdDoctor(cfg) {
  const problems = [];
  const now = new Date();
  const { local, utc, agree } = attributionDays(now);
  const offsetMinutes = -now.getTimezoneOffset();
  const { startHour } = safeWindowStart(offsetMinutes);

  console.log(bold('\n  AI Daily Forge — doctor'));
  console.log(dim('  Every check below decides whether your work reaches the graph.\n'));

  // 1. toolchain
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  console.log(
    (nodeMajor >= 20 ? OK : BAD) +
      ` node ${process.versions.node}` +
      dim('  (>= 20 required)'),
  );
  if (nodeMajor < 20) problems.push('Upgrade Node to >= 20.');

  const git = run('git', ['--version']).stdout.trim() || 'not found';
  console.log((git.startsWith('git version') ? OK : BAD) + ` ${git}`);
  if (!git.startsWith('git version')) problems.push('Install git.');

  const gh = run('gh', ['--version']).stdout.split(/\r?\n/)[0] || 'not found';
  console.log((gh.startsWith('gh version') ? OK : WARN) + ` ${gh}`);
  if (!gh.startsWith('gh version')) {
    console.log(dim('       gh unlocks repo creation, topic checks, and remote verification.'));
  }

  // 2. git identity — the single most common reason commits do not count
  console.log('');
  const name = cfg.author;
  const email = cfg.email;
  console.log((name ? OK : BAD) + ` git user.name  ${name || dim('(unset)')}`);
  console.log((email ? OK : BAD) + ` git user.email ${email || dim('(unset)')}`);
  if (!name || !email) {
    problems.push(
      'Set your identity: git config --global user.name "..." && git config --global user.email "..."',
    );
  }

  if (email && /@(localhost|.*\.local)$/i.test(email)) {
    console.log(BAD + ' that email is generic; GitHub cannot link it to your account.');
    problems.push('Generic/local emails are rejected by GitHub. Use a real address.');
  }

  // 3. is that email actually attached to the GitHub account?
  console.log('');
  if (!ghAuthed()) {
    console.log(WARN + ' gh is not authenticated — cannot verify the email against your account.');
    problems.push('Run: gh auth login');
  } else {
    const emails = ghAccountEmails();
    if (emails === null) {
      console.log(WARN + ' could not read account emails (token may lack user:email scope).');
      problems.push('Grant the user:email scope: gh auth refresh -s user:email');
    } else if (email && emails.some((e) => e.toLowerCase() === email.toLowerCase())) {
      console.log(OK + ` ${email} is attached to your GitHub account.`);
    } else {
      console.log(BAD + ` ${email || '(unset)'} is NOT attached to your GitHub account.`);
      console.log(dim(`       account has: ${emails.join(', ') || '(none)'}`));
      problems.push(`Add ${email} at github.com/settings/emails, or switch to your noreply address.`);
    }

    const user = ghJson(['api', 'user', '--jq', '{login: .login, name: .name}']);
    if (user) console.log(OK + ` signed in as ${bold(user.login)}${user.name ? dim(` (${user.name})`) : ''}`);
  }

  // 4. the repo you are standing in
  console.log('');
  const inRepo = run('git', ['rev-parse', '--is-inside-work-tree']).stdout.trim() === 'true';
  if (!inRepo) {
    console.log(SKIP + ' not inside a git repository.');
  } else {
    const branch = run('git', ['branch', '--show-current']).stdout.trim();
    const remote = run('git', ['remote', 'get-url', 'origin']).stdout.trim();
    console.log(OK + ` branch ${bold(branch || '(detached)')}`);
    if (!remote) {
      console.log(WARN + ' no origin remote — commits stay local and never reach the graph.');
      problems.push('Create the remote: gh repo create <name> --public --source=. --push');
    } else {
      console.log(OK + ` origin ${remote}`);
      if (ghAuthed()) {
        const repo = ghJson(['repo', 'view', '--json', 'isFork,defaultBranchRef,visibility,description,repositoryTopics']);
        if (repo) {
          if (repo.isFork) {
            console.log(BAD + ' this repository is a FORK — commits here never count.');
            problems.push('Commits in forks do not count. Clone it and re-init as a standalone repo.');
          } else {
            console.log(OK + ' standalone repository (commits are eligible).');
          }
          const def = repo.defaultBranchRef?.name;
          if (def && def !== branch) {
            console.log(WARN + ` you are on ${branch}, default branch is ${def}.`);
            console.log(dim('       Commits count only on the default branch or gh-pages.'));
            console.log(dim('       Feature work must be merged the same day, or squashed onto the default branch.'));
          }
          if (!repo.description) {
            console.log(WARN + ' no repository description set (hurts search discovery).');
          }
          if (!repo.repositoryTopics?.length) {
            console.log(WARN + ' no topics set (hurts search discovery).');
          }
        }
      }
    }
  }

  // 5. timing
  console.log('');
  console.log(`  local time   ${bold(localIso(now))} ${dim(`(${offsetLabel(now)})`)}`);
  console.log(`  utc time     ${bold(now.toISOString().slice(0, 19).replace('T', ' '))}`);
  console.log(
    `  today is     local ${bold(local)}, utc ${bold(utc)}  ` +
      (agree ? green('aligned') : yellow('SPLIT')),
  );
  console.log(
    `  safe window  commit between ${bold(`${pad(startHour)}:00`)} and ${bold('23:59')} local ` +
      dim('— maps to one date under both readings'),
  );
  if (!agree) {
    console.log(yellow('  A commit right now would be attributed to a different date than your local calendar day.'));
  }

  // 6. templates
  console.log('');
  const templates = listTemplates(cfg);
  console.log(
    (templates.length ? OK : BAD) + ` templates: ${templates.map((t) => t.name).join(', ') || dim('none')}`,
  );
  if (!templates.length) problems.push(`No templates found in ${cfg.templatesDir}`);

  // verdict
  console.log('');
  if (problems.length === 0) {
    console.log(green('  All clear. Build, commit on the default branch, push.\n'));
    return 0;
  }
  console.log(bold(`  ${problems.length} thing(s) to fix:`));
  problems.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
  console.log('');
  return 1;
}

/* -------------------------------------------------------------- templates */

function listTemplates(cfg) {
  if (!fs.existsSync(cfg.templatesDir)) return [];
  return fs
    .readdirSync(cfg.templatesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const dir = path.join(cfg.templatesDir, e.name);
      const metaPath = path.join(dir, '.template.json');
      let meta = {};
      if (fs.existsSync(metaPath)) {
        try {
          meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        } catch {
          meta = {};
        }
      }
      return {
        name: e.name,
        dir,
        description: meta.description || '',
        language: meta.language || '',
        postCreate: Array.isArray(meta.postCreate) ? meta.postCreate : [],
        gitignore: meta.gitignore !== false,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function cmdTemplates(cfg) {
  const templates = listTemplates(cfg);
  if (!templates.length) die(`no templates in ${cfg.templatesDir}`, 1);
  console.log(bold('\n  Available templates\n'));
  for (const t of templates) {
    console.log(`  ${bold(t.name.padEnd(16))} ${dim((t.language || '').padEnd(12))} ${t.description}`);
  }
  console.log(
    dim('\n  Usage: forge new <template> <slug> [--title "Human Title"] [--desc "one line"]\n'),
  );
  return 0;
}

/* -------------------------------------------------------------- new (scaffold) */

const TEXT_EXT = new Set([
  '.md', '.txt', '.json', '.jsonc', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx',
  '.py', '.toml', '.yml', '.yaml', '.cfg', '.ini', '.sh', '.bash', '.ps1', '.html',
  '.css', '.sql', '.env', '.gitignore', '.npmignore', '.tmpl', '',
]);

const slugToTitle = (slug) =>
  slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');

function substitute(text, vars) {
  return text.replace(/\{\{([A-Z_]+)\}\}/g, (whole, key) =>
    Object.hasOwn(vars, key) ? vars[key] : whole,
  );
}

function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.venv') continue;
      walk(full, base, out);
    } else {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

function cmdNew(cfg, flags, rest) {
  const [templateName, slug] = rest;
  if (!templateName || !slug) {
    die('usage: forge new <template> <slug> [--title "..."] [--desc "..."] [--push]');
  }
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(slug)) {
    die(`invalid slug "${slug}" — use lowercase letters, digits, dots, dashes.`);
  }

  const templates = listTemplates(cfg);
  const template = templates.find((t) => t.name === templateName);
  if (!template) {
    die(
      `unknown template "${templateName}". available: ${templates.map((t) => t.name).join(', ') || 'none'}`,
    );
  }

  const dest = path.resolve(cfg.outputDir, slug);
  if (fs.existsSync(dest)) die(`destination already exists: ${dest}`, 1);

  const title = flags.title || slugToTitle(slug);
  const description =
    flags.desc ||
    `${title} — a focused AI developer tool. Replace this description with a real one before publishing.`;

  const vars = {
    SLUG: slug,
    SNAKE: slug.replace(/[.-]/g, '_'),
    TITLE: title,
    DESCRIPTION: description,
    YEAR: String(new Date().getFullYear()),
    AUTHOR: cfg.author || 'Your Name',
    EMAIL: cfg.email || 'you@example.com',
    GITHUB_USER: cfg.githubUser || 'your-github-username',
    LICENSE: cfg.license,
  };

  // copy + substitute
  const files = walk(template.dir);
  let written = 0;
  for (const rel of files) {
    if (rel === '.template.json') continue;
    const src = path.join(template.dir, rel);
    const relOut = substitute(
      rel.endsWith('.tmpl') ? rel.slice(0, -'.tmpl'.length) : rel,
      vars,
    );
    const out = path.join(dest, relOut);
    fs.mkdirSync(path.dirname(out), { recursive: true });

    const ext = path.extname(relOut).toLowerCase();
    const isText = TEXT_EXT.has(ext) || !path.basename(relOut).includes('.');
    if (isText) {
      fs.writeFileSync(out, substitute(fs.readFileSync(src, 'utf8'), vars), 'utf8');
    } else {
      fs.copyFileSync(src, out);
    }
    written++;
  }

  // unreplaced placeholders are a template bug, not a user error — surface it
  const leftovers = new Set();
  for (const rel of walk(dest)) {
    const ext = path.extname(rel).toLowerCase();
    if (!TEXT_EXT.has(ext) && path.basename(rel).includes('.')) continue;
    const txt = fs.readFileSync(path.join(dest, rel), 'utf8');
    for (const m of txt.matchAll(/\{\{[A-Z_]+\}\}/g)) leftovers.add(`${rel}: ${m[0]}`);
  }

  // git init on the default branch, with a real identity
  run('git', ['init', '-b', 'main'], { cwd: dest });
  if (cfg.author) run('git', ['config', 'user.name', cfg.author], { cwd: dest });
  if (cfg.email) run('git', ['config', 'user.email', cfg.email], { cwd: dest });
  run('git', ['add', '-A'], { cwd: dest });
  run('git', ['commit', '-m', `feat: initial scaffold of ${slug}`], { cwd: dest });

  console.log(bold(`\n  Created ${dest}`));
  console.log(`  ${dim('template ')} ${template.name} ${dim(`(${template.language || 'n/a'})`)}`);
  console.log(`  ${dim('files    ')} ${written}`);
  console.log(`  ${dim('branch   ')} main, initial commit made`);

  if (leftovers.size) {
    console.log(yellow(`\n  ${leftovers.size} unresolved placeholder(s) — template bug:`));
    for (const l of leftovers) console.log(`    ${l}`);
  }

  if (flags.push) {
    if (!ghAuthed()) die('--push requires an authenticated gh. run: gh auth login', 1);
    const args = ['repo', 'create', slug, '--public', '--source=.', '--remote=origin', '--push'];
    if (description) args.push('--description', description.slice(0, 340));
    const r = run('gh', args, { cwd: dest, stdio: 'inherit' });
    if (r.code !== 0) {
      console.log(red('\n  push failed — repo exists locally at ') + dest);
      return 1;
    }
    console.log(green('\n  Pushed to GitHub.'));
  }

  console.log(bold('\n  Next steps'));
  if (!flags.push) {
    console.log(dim('  1. cd ') + slug);
    console.log(dim('  2. gh repo create ') + slug + dim(' --public --source=. --remote=origin --push'));
  }
  console.log(dim(`  ${flags.push ? '1' : '3'}. set topics so people can actually find it:`));
  console.log(
    dim('     gh repo edit --add-topic ai,mcp,llm,developer-tools '),
  );
  console.log(dim(`  ${flags.push ? '2' : '4'}. forge audit  `) + dim('(score publish-readiness)'));
  console.log('');
  return 0;
}

/* ------------------------------------------------------------------- audit */

function readIf(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function cmdAudit(cfg, flags, rest) {
  const dir = path.resolve(rest[0] || '.');
  if (!fs.existsSync(dir)) die(`no such directory: ${dir}`, 1);

  const checks = [];
  const add = (weight, label, pass, fix) => checks.push({ weight, label, pass, fix });

  const readme = readIf(path.join(dir, 'README.md'));
  add(12, 'README.md exists', readme !== null, 'Create README.md');
  if (readme !== null) {
    add(6, 'README has an H1 title', /^#\s+\S/m.test(readme), 'Add a `# Title` line');
    add(8, 'README is substantial (>1500 chars)', readme.length > 1500, 'Explain why, install, usage, config');
    add(6, 'README has an Install section', /^##+\s+install/im.test(readme), 'Add `## Install`');
    add(8, 'README has a Usage section', /^##+\s+usage/im.test(readme), 'Add `## Usage` with runnable examples');
    add(4, 'README mentions the license', /licen[cs]e/i.test(readme), 'Add a license section');
    add(4, 'README has no dangling TODO', !/\bTODO\b/i.test(readme), 'Finish or delete TODOs');
  }

  add(8, 'LICENSE exists', fs.existsSync(path.join(dir, 'LICENSE')), 'Add a LICENSE file');
  add(3, '.gitignore exists', fs.existsSync(path.join(dir, '.gitignore')), 'Add a .gitignore');

  const workflows = path.join(dir, '.github', 'workflows');
  const wf = fs.existsSync(workflows) ? fs.readdirSync(workflows).filter((f) => /\.ya?ml$/.test(f)) : [];
  add(8, 'CI workflow present', wf.length > 0, 'Add .github/workflows/ci.yml');
  if (wf.length) {
    const text = wf.map((f) => readIf(path.join(workflows, f)) || '').join('\n');
    add(5, 'workflow runs tests', /pytest|npm test|npm run test|node --test|go test|cargo test/.test(text), 'Make CI actually run the tests');
    add(5, 'a publish workflow exists', /publish|release/i.test(text), 'Add a publish-on-tag workflow');
  }

  const all = walk(dir).map((p) => p.replace(/\\/g, '/'));
  const tests = all.filter((p) => /(^|\/)(tests?|__tests__)\//.test(p) || /\.(test|spec)\.[a-z]+$/.test(p));
  add(10, 'tests exist', tests.length > 0, 'Add at least one real test');

  const pkgRaw = readIf(path.join(dir, 'package.json'));
  const pyRaw = readIf(path.join(dir, 'pyproject.toml'));
  if (pkgRaw || pyRaw) {
    const text = pkgRaw || pyRaw || '';
    add(6, 'package metadata has a description', /"?description"?\s*[:=]/i.test(text), 'Add a description');
    add(8, 'package metadata has keywords', /"?keywords"?\s*[:=]/i.test(text), 'Add 8-12 search keywords');
  } else {
    add(14, 'is an installable package (package.json / pyproject.toml)', false, 'Make it installable so people can use it');
  }

  const inRepo = run('git', ['rev-parse', '--is-inside-work-tree'], { cwd: dir }).stdout.trim() === 'true';
  add(3, 'is a git repository', inRepo, 'Run git init -b main');

  // remote-side signals
  let remoteChecked = false;
  if (inRepo && ghAuthed()) {
    const repo = ghJson(['repo', 'view', '--json', 'description,repositoryTopics,isFork,defaultBranchRef'], {
      cwd: dir,
    });
    if (repo) {
      remoteChecked = true;
      add(6, 'repository description is set', Boolean(repo.description), 'gh repo edit --description "..."');
      add(8, 'repository topics are set', Boolean(repo.repositoryTopics?.length), 'gh repo edit --add-topic ai,llm,mcp');
      add(4, 'repository is not a fork', !repo.isFork, 'Commits in forks never count toward your graph');
    }
  }

  const earned = checks.filter((x) => x.pass).reduce((s, x) => s + x.weight, 0);
  const total = checks.reduce((s, x) => s + x.weight, 0);
  const score = Math.round((earned / total) * 100);
  const color = score >= 85 ? green : score >= 60 ? yellow : red;

  console.log(bold(`\n  Publish-readiness: ${color(score + '/100')}  ${dim(dir)}`));
  if (!remoteChecked && ghAuthed()) {
    console.log(dim('  (run this inside the repo after pushing to include remote metadata checks)'));
  }
  console.log('');
  for (const x of checks) {
    console.log(`  ${x.pass ? OK : BAD} ${x.label}${x.pass ? '' : dim(`  -> ${x.fix}`)}`);
  }
  console.log('');
  return score >= 85 ? 0 : 1;
}

/* ------------------------------------------------------------------- streak */

function cmdStreak(cfg, flags, rest) {
  const days = Number(flags.days || 180);
  const root = path.resolve(rest[0] || flags.root || '.');
  const useUtc = Boolean(flags.utc);

  // discover repositories one level down (plus the root itself)
  const repos = [];
  const isRepo = (p) => fs.existsSync(path.join(p, '.git'));
  if (isRepo(root)) repos.push(root);
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = path.join(root, e.name);
    if (isRepo(p)) repos.push(p);
  }
  if (!repos.length) die(`no git repositories found under ${root}`, 1);

  const counts = new Map();
  const perRepo = new Map();
  const seen = new Set();

  for (const repo of repos) {
    const r = run('git', ['log', '--all', '--no-merges', '--date=iso-strict', '--pretty=format:%H|%ad|%an'], {
      cwd: repo,
    });
    if (r.code !== 0) continue;
    let n = 0;
    for (const line of r.stdout.split(/\r?\n/)) {
      if (!line) continue;
      const [sha, iso] = line.split('|');
      if (!sha || !iso) continue;
      if (seen.has(sha)) continue; // a commit reachable from several refs counts once
      seen.add(sha);
      const day = useUtc ? new Date(iso).toISOString().slice(0, 10) : iso.slice(0, 10);
      counts.set(day, (counts.get(day) || 0) + 1);
      n++;
    }
    perRepo.set(path.relative(root, repo) || '.', n);
  }

  // build the day axis ending today
  const today = new Date();
  const axis = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    axis.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }

  const GREEN = [dim('·'), green('▁'), green('▃'), green('▅'), green('▇'), green('█')];
  const cell = (n) => (n === 0 ? GREEN[0] : GREEN[Math.min(5, 1 + Math.floor(n / 2))]);

  console.log(bold(`\n  Contribution streak  `) + dim(`${repos.length} repo(s) under ${root}`));
  console.log(dim(`  grouped by ${useUtc ? 'UTC date' : "each commit's own timezone"}\n`));

  // weeks as columns, Monday-first rows
  const byDay = new Map(axis.map((d) => [d, counts.get(d) || 0]));
  const weeks = [];
  let week = new Array(7).fill(null);
  for (const day of axis) {
    const dow = (new Date(day + 'T00:00:00').getDay() + 6) % 7; // Mon = 0
    week[dow] = day;
    if (dow === 6) {
      weeks.push(week);
      week = new Array(7).fill(null);
    }
  }
  if (week.some(Boolean)) weeks.push(week);

  const labels = ['Mon', '   ', 'Wed', '   ', 'Fri', '   ', 'Sun'];
  for (let row = 0; row < 7; row++) {
    let line = '  ' + labels[row] + ' ';
    for (const w of weeks) {
      const day = w[row];
      line += day ? (byDay.get(day) ? cell(byDay.get(day)) + ' ' : dim('·') + ' ') : '  ';
    }
    console.log(line);
  }

  const active = axis.filter((d) => byDay.get(d) > 0);
  const totalCommits = [...byDay.values()].reduce((a, b) => a + b, 0);

  // current streak: walk back from today, allow today to be empty
  let streak = 0;
  for (let i = 0; i < axis.length; i++) {
    const d = axis[axis.length - 1 - i];
    if (byDay.get(d) > 0) streak++;
    else if (i === 0) continue; // today not over yet
    else break;
  }
  let longest = 0;
  let span = 0;
  for (const d of axis) {
    span = byDay.get(d) > 0 ? span + 1 : 0;
    longest = Math.max(longest, span);
  }

  console.log('');
  console.log(`  current streak  ${bold(String(streak))} day(s)`);
  console.log(`  longest (${days}d) ${bold(String(longest))} day(s)`);
  console.log(`  active days     ${bold(`${active.length}/${days}`)}`);
  console.log(`  commits         ${bold(String(totalCommits))}`);
  console.log('');
  const top = [...perRepo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  for (const [name, n] of top) console.log(`  ${dim(String(n).padStart(5))}  ${name}`);
  console.log('');
  return 0;
}

/* ---------------------------------------------------------------------- log */

function cmdLog(cfg, flags, rest) {
  const text = rest.join(' ').trim();
  if (!text) die('usage: forge log "what you actually built today"');

  const dir = path.resolve(flags.dir || process.cwd(), flags.out || 'daily-log');
  fs.mkdirSync(dir, { recursive: true });
  const day = localIso(new Date()).slice(0, 10);
  const file = path.join(dir, `${day}.md`);

  const kind = flags.kind || 'build';
  const line = `- **${kind}** ${text}`;
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `# ${day}\n\n<!-- newest first -->\n\n${line}\n`, 'utf8');
  } else {
    const body = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, body.replace(/\n<!-- newest first -->\n\n/, `\n<!-- newest first -->\n\n${line}\n`), 'utf8');
  }
  console.log(green('  logged ') + dim(file));
  console.log(dim('  commit it on the default branch to make it count.'));
  return 0;
}

/* -------------------------------------------------------------------- ideas */

function loadIdeas(cfg) {
  const raw = readIf(cfg.ideasFile);
  if (!raw) die(`no ideas file at ${cfg.ideasFile}`, 1);
  try {
    return JSON.parse(raw);
  } catch (err) {
    die(`cannot parse ${cfg.ideasFile}: ${err.message}`, 1);
  }
}

const EFFORT = { S: 1, M: 2, L: 3 };
const SCORE = (i) => i.impact * 3 + i.stars * 2 + (6 - (EFFORT[i.tier] || 2)) + (i.registry !== 'none' ? 3 : 0);

function cmdIdeas(cfg, flags) {
  const data = loadIdeas(cfg);
  const ideas = data.ideas || data;
  const open = ideas.filter((i) => (i.status || 'todo') !== 'done');
  const filtered = flags.category ? open.filter((i) => i.category === flags.category) : open;
  const ranked = filtered.sort((a, b) => SCORE(b) - SCORE(a));
  const limit = Number(flags.limit || (flags.md ? ranked.length : 15));

  if (flags.md) {
    console.log(`| # | Idea | Category | Effort | Impact | Stars | Publish |`);
    console.log(`|---|---|---|---|---|---|---|`);
    ranked.slice(0, limit).forEach((i, n) => {
      console.log(
        `| ${n + 1} | \`${i.slug}\` | ${i.category} | ${i.tier} | ${'*'.repeat(i.impact)} | ${'*'.repeat(i.stars)} | ${i.registry} |`,
      );
    });
    return 0;
  }

  console.log(bold(`\n  Next up  `) + dim(`${ranked.length} open, ranked by score\n`));
  ranked.slice(0, limit).forEach((i, n) => {
    console.log(
      `  ${String(n + 1).padStart(2)}. ${bold(cyan(i.slug))} ${dim(`[${i.category} · ${i.tier} · impact ${i.impact}/5 · stars ${i.stars}/5 · ${i.registry}]`)}`,
    );
    console.log(`      ${i.oneLiner}`);
  });
  console.log(dim('\n  forge new <template> <slug>   to start one\n'));
  return 0;
}

/* --------------------------------------------------------------------- main */

const USAGE = `
  ${bold('AI Daily Forge')} ${dim('— ship one useful AI project a day, without gaming the graph')}

  ${bold('Usage')}
    forge doctor                  verify everything that decides if your commits count
    forge new <tpl> <slug>        scaffold a publish-ready project
    forge audit [dir]             score a repo for publish-readiness (0-100)
    forge streak [dir]            real contribution heatmap from local git history
    forge log "<what you did>"    append today's entry to the daily log
    forge ideas [--md]            ranked backlog, or its markdown table
    forge templates               list templates

  ${bold('Common flags')}
    --title "..."     human title for the new project
    --desc "..."      one-line description (used for the GitHub repo too)
    --push            create the GitHub repo and push immediately
    --days 180        streak window
    --utc             group streak days strictly by UTC
    --category mcp    filter ideas
    --config <path>   use a specific forge.config.json

  ${bold('Setup')}
    forge.config.json in the repo root (or your cwd):
    { "author": "Your Name", "email": "you@example.com", "githubUser": "you" }
`;

function main() {
  const argv = process.argv.slice(2);
  const { flags, rest } = parseFlags(argv);
  const cmd = rest.shift();

  if (!cmd || cmd === 'help' || flags.help) {
    console.log(USAGE);
    return 0;
  }

  const cfg = loadConfig(flags);

  switch (cmd) {
    case 'doctor':
      return cmdDoctor(cfg);
    case 'new':
      return cmdNew(cfg, flags, rest);
    case 'audit':
      return cmdAudit(cfg, flags, rest);
    case 'streak':
      return cmdStreak(cfg, flags, rest);
    case 'log':
      return cmdLog(cfg, flags, rest);
    case 'ideas':
      return cmdIdeas(cfg, flags);
    case 'templates':
      return cmdTemplates(cfg);
    default:
      die(`unknown command "${cmd}". run: forge help`);
  }
}

process.exit(main());
