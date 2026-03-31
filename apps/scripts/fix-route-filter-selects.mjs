import fs from 'node:fs';
import path from 'node:path';

const routerRoot = '/Users/zuozuo/Desktop/HY/AppPlatform/Frontend/apps/src/router/routes/modules';
const viewRoot = '/Users/zuozuo/Desktop/HY/AppPlatform/Frontend/apps/src/views';
const boundaryTokens = ['<Table', '<BasicTable', '<el-table', '<VxeGrid', '<ProTable'];
const optionRe = /<SelectOption\b([\s\S]*?)>([\s\S]*?)<\/SelectOption>/g;
const queryStateRe = /v-model:value="(?:query|listQuery|settingQuery|recordQuery|assistQuery)[^"]*"/;

function getRouteViewFiles() {
  const files = fs.readdirSync(routerRoot).filter((file) => file.endsWith('.ts'));
  const views = new Set();
  for (const file of files) {
    const text = fs.readFileSync(path.join(routerRoot, file), 'utf8');
    const re = /component:\s*\(\)\s*=>\s*import\('\#\/views\/([^']+)\.vue'\)/g;
    let match;
    while ((match = re.exec(text))) {
      const full = path.join(viewRoot, `${match[1]}.vue`);
      if (fs.existsSync(full)) {
        views.add(full);
      }
    }
  }
  return [...views];
}

function parseFor(expr) {
  const match = expr
    .trim()
    .match(/^(?:\(([^,)\s]+)(?:\s*,[^\)]*)?\)|([^\s]+))\s+in\s+([\s\S]+)$/);
  if (!match) {
    return null;
  }
  return {
    alias: (match[1] || match[2]).trim(),
    source: match[3].trim(),
  };
}

function getDynamicAttr(attrs, name) {
  return attrs.match(new RegExp(`:${name}="([\\s\\S]*?)"`))?.[1]?.trim() || '';
}

function getStaticAttr(attrs, name) {
  return attrs.match(new RegExp(`${name}="([\\s\\S]*?)"`))?.[1] || '';
}

function toStringLiteral(value) {
  return `'${value.replace(/'/g, "\\'")}'`;
}

function getBodyExpr(body) {
  const mustache = body.match(/\{\{([\s\S]*?)\}\}/);
  if (mustache) {
    return mustache[1].trim();
  }
  const text = body.replace(/<[^>]+>/g, '').trim();
  return text ? toStringLiteral(text) : '';
}

function getLabelExpr(attrs, body) {
  return (
    getDynamicAttr(attrs, 'label') ||
    (getStaticAttr(attrs, 'label') ? toStringLiteral(getStaticAttr(attrs, 'label')) : '') ||
    getBodyExpr(body)
  );
}

function getValueExpr(attrs) {
  return (
    getDynamicAttr(attrs, 'value') ||
    (getStaticAttr(attrs, 'value') ? toStringLiteral(getStaticAttr(attrs, 'value')) : '')
  );
}

function buildOptionsExpr(body) {
  const options = [];
  let match;
  optionRe.lastIndex = 0;
  while ((match = optionRe.exec(body))) {
    options.push({ attrs: match[1], body: match[2] });
  }
  if (!options.length) {
    return '';
  }

  const remains = body.replace(optionRe, '').replace(/<!--[\s\S]*?-->/g, '').trim();
  if (remains) {
    return '';
  }

  const allFor = options.every((option) => /v-for=/.test(option.attrs));
  const noneFor = options.every((option) => !/v-for=/.test(option.attrs));

  if (allFor && options.length === 1) {
    const forExpr = options[0].attrs.match(/v-for="([\s\S]*?)"/)?.[1] || '';
    const forInfo = parseFor(forExpr);
    if (!forInfo) {
      return '';
    }
    const label = getLabelExpr(options[0].attrs, options[0].body);
    const value = getValueExpr(options[0].attrs);
    if (!label || !value) {
      return '';
    }
    return `${forInfo.source}.map((${forInfo.alias}) => ({ label: ${label}, value: ${value} as any }))`;
  }

  if (noneFor) {
    const result = options
      .map((option) => {
        const label = getLabelExpr(option.attrs, option.body);
        const value = getValueExpr(option.attrs);
        if (!label || !value) {
          return '';
        }
        return `{ label: ${label}, value: ${value} as any }`;
      })
      .filter(Boolean);
    return result.length === options.length ? `[${result.join(', ')}]` : '';
  }

  return '';
}

function cleanupImports(text) {
  if (text.includes('<SelectOption')) {
    return text;
  }
  return text.replace(
    /import\s*\{([\s\S]*?)\}\s*from\s*'antdv-next';/g,
    (full, imports) => {
      const items = imports
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item) => item !== 'SelectOption');
      if (items.length === 0) {
        return full;
      }
      if (imports.includes('\n')) {
        return `import {\n  ${items.join(',\n  ')}\n} from 'antdv-next';`;
      }
      return `import { ${items.join(', ')} } from 'antdv-next';`;
    },
  );
}

function findSelectBlocks(text) {
  const blocks = [];
  let index = 0;
  while (true) {
    const start = text.indexOf('<Select', index);
    if (start === -1) {
      break;
    }
    const openEnd = text.indexOf('>', start);
    if (openEnd === -1) {
      break;
    }
    const openTag = text.slice(start, openEnd + 1);
    const selfClosing = /\/>$/.test(openTag.trim());
    if (selfClosing) {
      index = openEnd + 1;
      continue;
    }
    const closeStart = text.indexOf('</Select>', openEnd + 1);
    if (closeStart === -1) {
      break;
    }
    blocks.push({
      start,
      end: closeStart + '</Select>'.length,
      attrs: text.slice(start + '<Select'.length, openEnd),
      body: text.slice(openEnd + 1, closeStart),
    });
    index = closeStart + '</Select>'.length;
  }
  return blocks;
}

function fixFile(file) {
  let text = fs.readFileSync(file, 'utf8');
  const templateStart = text.indexOf('<template>');
  const templateEnd = text.indexOf('</template>');
  if (templateStart === -1 || templateEnd === -1) {
    return false;
  }

  const template = text.slice(templateStart, templateEnd);
  const boundaryIndexes = boundaryTokens
    .map((token) => template.indexOf(token))
    .filter((index) => index >= 0);
  const boundary = boundaryIndexes.length ? Math.min(...boundaryIndexes) : template.length;
  const prefix = template.slice(0, boundary);
  const suffix = template.slice(boundary);

  let changed = false;
  const blocks = findSelectBlocks(prefix);
  let nextPrefix = prefix;
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const block = blocks[i];
    if (!block.body.includes('SelectOption') || block.attrs.includes(':options=')) {
      continue;
    }
    if (!queryStateRe.test(block.attrs)) {
      continue;
    }
    const optionsExpr = buildOptionsExpr(block.body);
    if (!optionsExpr) {
      continue;
    }
    const lineStart = prefix.lastIndexOf('\n', block.start) + 1;
    const indent = prefix.slice(lineStart, block.start).match(/^\s*/)?.[0] || '';
    let nextAttrs = block.attrs.replace(/option-label-prop="children"/g, 'option-label-prop="label"');
    if (!/option-label-prop=/.test(nextAttrs)) {
      nextAttrs += `\n${indent}  option-label-prop="label"`;
    }
    const replacement = `<Select${nextAttrs}\n${indent}  :options="${optionsExpr}"\n${indent}/>`;
    nextPrefix = `${nextPrefix.slice(0, block.start)}${replacement}${nextPrefix.slice(block.end)}`;
    changed = true;
  }

  if (!changed) {
    return false;
  }

  text = text.slice(0, templateStart) + nextPrefix + suffix + text.slice(templateEnd);
  text = cleanupImports(text);
  fs.writeFileSync(file, text);
  return true;
}

function audit() {
  const unresolved = [];
  for (const file of getRouteViewFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    const templateStart = text.indexOf('<template>');
    const templateEnd = text.indexOf('</template>');
    if (templateStart === -1 || templateEnd === -1) {
      continue;
    }
    const template = text.slice(templateStart, templateEnd);
    const boundaryIndexes = boundaryTokens
      .map((token) => template.indexOf(token))
      .filter((index) => index >= 0);
    const boundary = boundaryIndexes.length ? Math.min(...boundaryIndexes) : template.length;
    const prefix = template.slice(0, boundary);
    if (/<Select[\s\S]*?<SelectOption/.test(prefix) && queryStateRe.test(prefix)) {
      unresolved.push(file);
    }
  }
  console.log(JSON.stringify({ unresolvedCount: unresolved.length, unresolved }, null, 2));
}

function fix() {
  const changed = [];
  for (const file of getRouteViewFiles()) {
    if (fixFile(file)) {
      changed.push(file);
    }
  }
  console.log(JSON.stringify({ changedCount: changed.length, changed }, null, 2));
}

if (process.argv.includes('--fix')) {
  fix();
} else {
  audit();
}
