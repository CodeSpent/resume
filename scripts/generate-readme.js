#!/usr/bin/env node

/**
 * Converts resume.tex to README.md
 * Parses the custom LaTeX commands and generates clean markdown
 */

const fs = require('fs');
const path = require('path');

const texPath = path.join(__dirname, '..', 'resume.tex');
const mdPath = path.join(__dirname, '..', 'Patrick-Hanford-Resume.md');

const tex = fs.readFileSync(texPath, 'utf-8');

// Extract metadata
const getName = () => {
  const match = tex.match(/\\setname\{([^}]*)\}/);
  return match ? match[1].trim() : 'Resume';
};

const getEmail = () => {
  const match = tex.match(/\\setmail\{([^}]*)\}/);
  return match ? match[1].trim() : null;
};

const getLinkedIn = () => {
  const match = tex.match(/\\setlinkedinaccount\{([^}]*)\}/);
  return match ? match[1].trim() : null;
};

const getGitHub = () => {
  const match = tex.match(/\\setgithubaccount\{([^}]*)\}/);
  return match ? match[1].trim() : null;
};

const getWebsite = () => {
  const match = tex.match(/\\setwebsite\{([^}]*)\}/);
  return match ? match[1].trim() : null;
};

// Parse sections
const parseSections = () => {
  const sections = [];
  const sectionRegex = /\\section\{([^}]+)\}([\s\S]*?)(?=\\section\{|\\end\{document\})/g;

  let match;
  while ((match = sectionRegex.exec(tex)) !== null) {
    const name = match[1];
    const content = match[2];
    sections.push({ name, content });
  }

  return sections;
};

// Parse skills section
const parseSkills = (content) => {
  const skills = [];
  const skillRegex = /\\createskill\{([^}]+)\}\{([^}]+)\}/g;

  let match;
  while ((match = skillRegex.exec(content)) !== null) {
    const category = match[1];
    const items = match[2]
        .split(/\\cpshalf/)
        .map(s => s.replace(/\\/g, '').trim())
        .filter(Boolean);
    skills.push({ category, items });
  }

  return skills;
};

// Parse experience/project entries
const parseEntries = (content) => {
  const entries = [];
  const entryRegex = /\\datedexperience\{([^}]*)\}\{([^}]*)\}\s*\\explanation\{([^}]*)\}\{[^}]*\}\s*\\explanationdetail\{([\s\S]*?)\}/g;

  let match;
  while ((match = entryRegex.exec(content)) !== null) {
    const company = match[1];
    const dates = match[2];
    const role = match[3];
    const details = match[4];

    // Parse bullet points
    const bullets = [];
    const bulletRegex = /\\coloredbullet\\\s*%?\s*([\s\S]*?)(?=\\coloredbullet|\\bigskip|\\smallskip\s*\\textit|$)/g;
    let bulletMatch;
    while ((bulletMatch = bulletRegex.exec(details)) !== null) {
      let text = bulletMatch[1]
        .replace(/\\smallskip/g, '')
        .replace(/\\bigskip/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\\%/g, '%')
        .replace(/\\_/g, '_')
        .trim();
      if (text) {
        bullets.push(text);
      }
    }

    // Parse tech stack if present
    const techMatch = details.match(/\\textit\{([^}]+)\}/);
    const tech = techMatch ? techMatch[1].replace(/\s+/g, ' ').trim() : null;

    entries.push({ company, dates, role, bullets, tech });
  }

  return entries;
};

// Generate markdown
const generateMarkdown = () => {
  const name = getName();
  const email = getEmail();
  const linkedin = getLinkedIn();
  const github = getGitHub();
  const website = getWebsite();
  const sections = parseSections();

  let md = `# ${name}\n\n`;

  // Contact info
  const contacts = [];
  if (email) contacts.push(`[${email}](mailto:${email})`);
  if (linkedin) contacts.push(`[LinkedIn](${linkedin})`);
  if (github) contacts.push(`[GitHub](${github})`);
  if (website) contacts.push(`[Website](${website})`);

  if (contacts.length > 0) {
    md += contacts.join(' | ') + '\n\n';
  }

  md += '---\n\n';

  // Process each section
  for (const section of sections) {
    md += `## ${section.name}\n\n`;

    if (section.name === 'Skills') {
      const skills = parseSkills(section.content);
      for (const skill of skills) {
        md += `**${skill.category}:** ${skill.items.join(', ')}\n\n`;
      }
    } else {
      const entries = parseEntries(section.content);
      for (const entry of entries) {
        if (entry.dates) {
          md += `### ${entry.company}\n`;
          md += `**${entry.role}** | ${entry.dates}\n\n`;
        } else {
          md += `### ${entry.company}\n`;
          md += `*${entry.role}*\n\n`;
        }

        for (const bullet of entry.bullets) {
          md += `- ${bullet}\n`;
        }

        if (entry.tech) {
          md += `\n*${entry.tech}*\n`;
        }

        md += '\n';
      }
    }
  }

  return md;
};

const markdown = generateMarkdown();
fs.writeFileSync(mdPath, markdown);
console.log('Generated resume.md');
