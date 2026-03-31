import { nextTick, watch } from 'vue';

import { i18n } from '@vben/locales';

const CHINESE_RE = /[\u3400-\u9fff]/;
const SKIP_ATTRIBUTE_SELECTOR =
  '[data-no-runtime-locale], .ace_editor, .monaco-editor, noscript, script, style';
const SKIP_TEXT_SELECTOR = `${SKIP_ATTRIBUTE_SELECTOR}, [contenteditable="true"], code, pre`;
const TRANSLATABLE_ATTRIBUTES = [
  'alt',
  'aria-label',
  'placeholder',
  'title',
] as const;

const elementOriginals = new WeakMap<Element, Map<string, string>>();
const textOriginals = new WeakMap<Text, string>();

let initialized = false;
let observer: MutationObserver | undefined;
let runtimeMatcherCache:
  | {
      dict: Record<string, string>;
      locale: string;
      pattern?: RegExp;
    }
  | undefined;

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getRuntimeDictionary(locale: string) {
  const messages = i18n.global.getLocaleMessage(locale) as Record<string, unknown>;
  const dictionary: Record<string, string> = {};

  for (const [key, value] of Object.entries(messages)) {
    if (typeof value === 'string' && CHINESE_RE.test(key)) {
      dictionary[key] = value;
    }
  }

  return dictionary;
}

function getRuntimeMatcher(locale: string) {
  if (runtimeMatcherCache?.locale === locale) {
    return runtimeMatcherCache;
  }

  const dict = locale === 'en-US' ? getRuntimeDictionary(locale) : {};
  const keys = Object.keys(dict).sort((left, right) => right.length - left.length);

  runtimeMatcherCache = {
    dict,
    locale,
    pattern:
      keys.length > 0
        ? new RegExp(keys.map((key) => escapeRegExp(key)).join('|'), 'g')
        : undefined,
  };

  return runtimeMatcherCache;
}

function getElementOriginalMap(element: Element) {
  let originalMap = elementOriginals.get(element);

  if (!originalMap) {
    originalMap = new Map<string, string>();
    elementOriginals.set(element, originalMap);
  }

  return originalMap;
}

function shouldSkipElement(element: Element) {
  return element.matches(SKIP_ATTRIBUTE_SELECTOR) || !!element.closest(SKIP_ATTRIBUTE_SELECTOR);
}

function shouldSkipTextNode(node: Text) {
  return !!node.parentElement?.closest(SKIP_TEXT_SELECTOR);
}

function getCurrentLocale() {
  return String(i18n.global.locale.value);
}

function translateText(text: string) {
  if (!text || !CHINESE_RE.test(text)) {
    return text;
  }

  const locale = getCurrentLocale();
  if (locale !== 'en-US') {
    return text;
  }

  const { dict, pattern } = getRuntimeMatcher(locale);
  if (!pattern) {
    return text;
  }

  return text.replace(pattern, (matched) => dict[matched] ?? matched);
}

function translateElementAttributes(element: Element) {
  if (shouldSkipElement(element)) {
    return;
  }

  const locale = getCurrentLocale();
  const originals = getElementOriginalMap(element);

  for (const attribute of TRANSLATABLE_ATTRIBUTES) {
    const rawValue = element.getAttribute(attribute);
    if (rawValue == null) {
      continue;
    }

    if (locale === 'en-US') {
      const originalValue = CHINESE_RE.test(rawValue)
        ? rawValue
        : (originals.get(attribute) ?? rawValue);
      if (!CHINESE_RE.test(originalValue)) {
        continue;
      }

      const translatedValue = translateText(originalValue);
      if (translatedValue !== originalValue) {
        originals.set(attribute, originalValue);
        if (rawValue !== translatedValue) {
          element.setAttribute(attribute, translatedValue);
        }
      }
      continue;
    }

    const originalValue = originals.get(attribute);
    if (originalValue !== undefined && rawValue !== originalValue) {
      element.setAttribute(attribute, originalValue);
    }
  }
}

function translateTextNode(node: Text) {
  if (shouldSkipTextNode(node)) {
    return;
  }

  const rawValue = node.nodeValue ?? '';
  const locale = getCurrentLocale();

  if (locale === 'en-US') {
    const originalValue = CHINESE_RE.test(rawValue)
      ? rawValue
      : (textOriginals.get(node) ?? rawValue);
    if (!CHINESE_RE.test(originalValue)) {
      return;
    }

    const translatedValue = translateText(originalValue);
    if (translatedValue !== originalValue) {
      textOriginals.set(node, originalValue);
      if (rawValue !== translatedValue) {
        node.nodeValue = translatedValue;
      }
    }
    return;
  }

  const originalValue = textOriginals.get(node);
  if (originalValue !== undefined && rawValue !== originalValue) {
    node.nodeValue = originalValue;
  }
}

function processNode(root: Node) {
  const stack: Node[] = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) {
      continue;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      translateTextNode(node as Text);
      continue;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const element = node as Element;
    translateElementAttributes(element);

    for (let index = element.childNodes.length - 1; index >= 0; index -= 1) {
      const childNode = element.childNodes[index];
      if (childNode) {
        stack.push(childNode);
      }
    }
  }
}

function refreshRuntimeLocale() {
  if (typeof document === 'undefined' || !document.body) {
    return;
  }

  processNode(document.body);
}

function startObserver() {
  if (
    observer ||
    typeof document === 'undefined' ||
    typeof MutationObserver === 'undefined' ||
    !document.body
  ) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' || mutation.type === 'characterData') {
        processNode(mutation.target);
        continue;
      }

      mutation.addedNodes.forEach((node) => processNode(node));
    }
  });

  observer.observe(document.body, {
    attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  });
}

function setupRuntimeLocaleSync() {
  if (initialized) {
    return;
  }
  initialized = true;

  watch(
    () => getCurrentLocale(),
    async () => {
      runtimeMatcherCache = undefined;
      await nextTick();
      refreshRuntimeLocale();
      startObserver();
    },
    {
      flush: 'post',
      immediate: true,
    },
  );
}

export { setupRuntimeLocaleSync, translateText as translateLocaleText };
