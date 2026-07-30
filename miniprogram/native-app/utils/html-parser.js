// utils/html-parser.js - 轻量 HTML 解析器
// 将文章 HTML 解析为节点数组，用于原生组件渲染
//
// 【设计原则】
// 1. 绝不泄漏原始 HTML 标签到输出文本中
// 2. 遇到不认识的标签，剥掉标签保留内容，绝不报错或中断
// 3. 容错优先：格式再乱的 HTML 也能提取出可读文本
//
// 支持的块级标签：p, h1-h3, blockquote, ul, ol, img, hr, div(pull-quote), figure
// 支持的行内标签：strong, em, a, b, i, u, code, span, sup, sub, small, del, mark, br
//
// 输出格式（扁平节点数组）：
// [
//   { type: 'p', children: [{type:'text', content:'...'}], isLede: true },
//   { type: 'h2', children: [...] },
//   { type: 'blockquote', children: [...] },
//   { type: 'ul', items: [[{type:'text',...}], ...] },
//   { type: 'img', src: '...' },
//   { type: 'hr' },
//   { type: 'pull-quote', text: '...', attr: '...' }
// ]

/**
 * 主入口：解析 HTML 为节点数组
 */
function parseArticleHtml(html) {
  if (!html) return [];

  // ============================================================
  // 预处理：清理和规范化
  // ============================================================
  var clean = html;

  // 1. 移除 HTML 注释
  clean = clean.replace(/<!--[\s\S]*?-->/g, '');

  // 2. 规范化换行和多余空白（标签之间的空白压缩）
  clean = clean.replace(/>\s+</g, '><');

  // 3. <br> 统一为 \n（在 text 组件中 \n 会渲染为换行）
  clean = clean.replace(/<br\s*\/?>/gi, '\n');

  // 4. 解码常见 HTML 实体
  clean = decodeHtmlEntities(clean);

  // ============================================================
  // 解析块级元素
  // ============================================================
  var nodes = [];
  var remaining = clean;
  var safetyCounter = 0;
  var maxIterations = 500; // 安全上限，防止极端情况下死循环

  while (remaining.length > 0 && safetyCounter < maxIterations) {
    safetyCounter++;
    var parsed = parseNextBlock(remaining);
    if (parsed.node) {
      nodes.push(parsed.node);
    }
    remaining = parsed.remaining;
    if (!parsed.consumed) {
      // 无法消费，跳过一个字符防止死循环
      if (remaining.length > 0) {
        remaining = remaining.substring(1);
      }
    }
  }

  // ============================================================
  // 后处理
  // ============================================================

  // 1. 过滤空段落
  nodes = nodes.filter(function(n) {
    if (n.type === 'p' && n.children) {
      var text = childrenToText(n.children);
      return text.trim().length > 0;
    }
    return true;
  });

  // 2. 移除文末的 Sources / 参考来源区块
  //    （文章底部结构化来源卡片会替代这部分内容，避免重复）
  nodes = removeTrailingSources(nodes);

  // 3. 标记第一个段落为 lede（首段特殊样式）
  var firstPFound = false;
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].type === 'p' && !firstPFound) {
      nodes[i].isLede = true;
      firstPFound = true;
      break;
    }
  }

  return nodes;
}

/**
 * 提取下一个块级元素
 */
function parseNextBlock(html) {
  if (!html || html.length === 0) {
    return { node: null, remaining: '', consumed: false };
  }

  // 找第一个标签的位置和名称
  var firstTagInfo = findFirstTag(html);

  if (!firstTagInfo) {
    // 没有标签了，纯文本当段落处理
    var text = html.trim();
    if (text) {
      return {
        node: { type: 'p', children: [{ type: 'text', content: text }] },
        remaining: '',
        consumed: true
      };
    }
    return { node: null, remaining: '', consumed: false };
  }

  var tagName = firstTagInfo.name;
  var tagIndex = firstTagInfo.index;
  var prefix = html.substring(0, tagIndex);

  // 如果标签前有纯文本，当作段落
  if (prefix && prefix.trim()) {
    return {
      node: { type: 'p', children: parseInline(prefix.trim()) },
      remaining: html.substring(tagIndex),
      consumed: true
    };
  }

  // 如果前面只有空白，跳过
  if (tagIndex > 0) {
    return {
      node: null,
      remaining: html.substring(tagIndex),
      consumed: true
    };
  }

  // 自闭合标签：img, hr
  if (tagName === 'img') {
    var imgMatch = html.match(/^<img\s+([^>]*)\s*\/?\s*>/i);
    if (imgMatch) {
      var attrs = parseAttrs(imgMatch[1]);
      return {
        node: { type: 'img', src: attrs.src || '' },
        remaining: html.substring(imgMatch[0].length),
        consumed: true
      };
    }
  }

  if (tagName === 'hr') {
    var hrMatch = html.match(/^<hr\s*\/?\s*>/i);
    if (hrMatch) {
      return {
        node: { type: 'hr' },
        remaining: html.substring(hrMatch[0].length),
        consumed: true
      };
    }
  }

  // 成对块级标签
  var blockTags = ['p', 'h1', 'h2', 'h3', 'blockquote', 'ul', 'ol', 'div', 'figure', 'figcaption'];
  if (blockTags.indexOf(tagName) >= 0) {
    var tagInfo = findMatchingTag(html, tagName);
    if (tagInfo) {
      var innerHtml = tagInfo.innerHtml;
      var restHtml = tagInfo.restHtml;
      var node = null;

      if (tagName === 'p' || tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
        node = {
          type: tagName,
          children: parseInline(innerHtml)
        };
      } else if (tagName === 'blockquote') {
        node = {
          type: 'blockquote',
          children: parseInline(innerHtml)
        };
      } else if (tagName === 'ul' || tagName === 'ol') {
        var items = parseListItems(innerHtml);
        node = {
          type: tagName,
          items: items
        };
      } else if (tagName === 'div') {
        // 检查是不是 pull-quote
        var divMatch = html.match(/^<div\s+[^>]*class="[^"]*pull-quote[^"]*"[^>]*>/i);
        if (divMatch) {
          node = parsePullQuote(innerHtml);
        } else {
          // 普通 div：展开其内容（递归解析内部的块级元素）
          var innerNodes = parseArticleHtml(innerHtml);
          if (innerNodes.length > 0) {
            // 取第一个节点返回，剩余的下次循环处理
            node = innerNodes[0];
            // 把剩余的 innerNodes 拼回到 restHtml 前面？
            // 更简单的方式：如果 div 内只有一个段落，直接返回
            // 如果有多个，把 div 当作段落容器处理
            if (innerNodes.length === 1) {
              node = innerNodes[0];
            } else {
              // 多个节点的话，把 div 内容合并成一个段落（保守处理）
              node = {
                type: 'p',
                children: parseInline(innerHtml)
              };
            }
          }
        }
      } else if (tagName === 'figure') {
        // figure：提取里面的 img 和 figcaption
        var figImgMatch = innerHtml.match(/<img\s+[^>]*src="([^"]+)"[^>]*>/i);
        var figCapMatch = innerHtml.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
        if (figImgMatch) {
          node = { type: 'img', src: figImgMatch[1] };
          if (figCapMatch) {
            // 有 caption 的话，图片后加个说明段落
            // 简化处理：先返回图片，caption 后续再说
            // 实际上可以返回一个特殊节点，但为了简单先只返回图片
          }
        } else {
          // 没有图片的 figure，当作段落
          node = {
            type: 'p',
            children: parseInline(innerHtml)
          };
        }
      } else if (tagName === 'figcaption') {
        // figcaption 当作段落（斜体、较小字号）
        node = {
          type: 'p',
          children: parseInline(innerHtml),
          isCaption: true
        };
      }

      if (node) {
        return {
          node: node,
          remaining: restHtml,
          consumed: true
        };
      }
    }
  }

  // 不认识的块级标签：跳过开标签，继续处理内容
  // （这样不会因为标签不认识就漏掉内容）
  var skipMatch = html.match(/^<[^>]*>/);
  if (skipMatch) {
    return {
      node: null,
      remaining: html.substring(skipMatch[0].length),
      consumed: true
    };
  }

  // 兜底：跳过第一个字符
  return {
    node: null,
    remaining: html.substring(1),
    consumed: true
  };
}

/**
 * 找到 HTML 字符串中的第一个标签
 * 返回 { name, index } 或 null
 */
function findFirstTag(html) {
  var match = html.match(/<([a-z][a-z0-9-]*)/i);
  if (!match) return null;
  return {
    name: match[1].toLowerCase(),
    index: match.index
  };
}

/**
 * 找到匹配的闭合标签，返回内部内容和剩余 HTML
 * 正确处理同名标签嵌套
 */
function findMatchingTag(html, tagName) {
  var openRegex = new RegExp('^<' + tagName + '(\\s[^>]*)?>', 'i');
  var openMatch = html.match(openRegex);
  if (!openMatch) return null;

  var openLen = openMatch[0].length;
  var rest = html.substring(openLen);

  // 找配对的闭合标签（处理嵌套情况）
  var depth = 1;
  var pos = 0;
  var safetyCounter = 0;
  var maxIterations = 200;

  while (depth > 0 && pos < rest.length && safetyCounter < maxIterations) {
    safetyCounter++;

    // 找下一个标签
    var nextTag = rest.substring(pos).match(/<(\/?)('?)([a-z][a-z0-9-]*)/i);
    if (!nextTag) break;

    var tagStr = nextTag[0];
    var tName = nextTag[3].toLowerCase();
    var isClose = nextTag[1] === '/';

    if (tName === tagName) {
      if (isClose) {
        depth--;
        if (depth === 0) {
          var innerEnd = pos + nextTag.index;
          // 找到闭合标签的完整长度
          var closeTagMatch = rest.substring(pos + nextTag.index).match(/^<\/[^>]*>/);
          var closeLen = closeTagMatch ? closeTagMatch[0].length : tagStr.length;
          return {
            innerHtml: rest.substring(0, innerEnd),
            restHtml: rest.substring(innerEnd + closeLen)
          };
        }
      } else {
        depth++;
      }
    }

    pos += nextTag.index + tagStr.length;
  }

  // 没找到闭合标签：返回全部内容作为 innerHtml（容错）
  return {
    innerHtml: rest,
    restHtml: ''
  };
}

/**
 * 解析行内元素为 children 数组
 *
 * 【核心原则】绝不泄漏原始 HTML 标签
 * 策略：扫描所有标签，认识的处理，不认识的直接剥掉
 */
function parseInline(html) {
  if (!html) return [];

  var children = [];
  var remaining = html;
  var safetyCounter = 0;
  var maxIterations = 300;

  while (remaining.length > 0 && safetyCounter < maxIterations) {
    safetyCounter++;

    // 找下一个 HTML 标签（任何标签）
    var tagMatch = remaining.match(/<(\/?)([a-z][a-z0-9-]*)(\s[^>]*)?\s*\/?>/i);

    if (!tagMatch) {
      // 没有更多标签，剩余都是纯文本
      if (remaining.length > 0) {
        children.push({ type: 'text', content: remaining });
      }
      break;
    }

    var tagIndex = tagMatch.index;
    var isClose = tagMatch[1] === '/';
    var tagName = tagMatch[2].toLowerCase();
    var attrsStr = tagMatch[3] || '';

    // 标签前的文本
    if (tagIndex > 0) {
      var beforeText = remaining.substring(0, tagIndex);
      if (beforeText) {
        children.push({ type: 'text', content: beforeText });
      }
    }

    // 自闭合标签（已经在预处理中把 <br> 换成了 \n，
    // 但可能还有其他自闭合标签如 <img> 出现在行内）
    var isSelfClosing = tagMatch[0].indexOf('/>') >= 0 ||
      tagName === 'br' || tagName === 'hr' || tagName === 'img';

    // 如果是闭合标签，跳过（我们用开标签来驱动内容提取）
    if (isClose || isSelfClosing) {
      remaining = remaining.substring(tagIndex + tagMatch[0].length);
      continue;
    }

    // 开标签：找配对的闭合标签，提取内容
    var afterOpen = remaining.substring(tagIndex + tagMatch[0].length);
    var closeRegex = new RegExp('</' + tagName + '\\s*>', 'i');
    var closeMatch = afterOpen.match(closeRegex);

    if (closeMatch) {
      var innerText = afterOpen.substring(0, closeMatch.index);

      // 递归解析内部内容（支持嵌套行内标签）
      var innerChildren = parseInline(innerText);

      // 确定这个标签的类型
      var inlineType = getInlineType(tagName);

      if (inlineType === 'skip') {
        // 不需要的标签，直接展开内部内容
        for (var i = 0; i < innerChildren.length; i++) {
          children.push(innerChildren[i]);
        }
      } else {
        // 有样式的标签
        if (innerChildren.length === 1 && innerChildren[0].type === 'text') {
          // 单个文本节点，直接加类型标记
          children.push({
            type: inlineType,
            content: innerChildren[0].content,
            href: tagName === 'a' ? parseAttrs(attrsStr).href : undefined
          });
        } else if (innerChildren.length > 0) {
          // 多个子节点（嵌套情况），用 wrapper 方式
          // 简化处理：把所有子文本拼起来，用最外层样式
          var combinedText = childrenToText(innerChildren);
          if (combinedText) {
            children.push({
              type: inlineType,
              content: combinedText,
              href: tagName === 'a' ? parseAttrs(attrsStr).href : undefined
            });
          }
        }
      }

      remaining = afterOpen.substring(closeMatch.index + closeMatch[0].length);
    } else {
      // 没有闭合标签，跳过这个开标签（内容继续处理）
      remaining = afterOpen;
    }
  }

  // 合并相邻的纯文本节点
  children = mergeAdjacentText(children);

  return children;
}

/**
 * 获取行内标签的类型
 */
function getInlineType(tagName) {
  switch (tagName) {
    case 'strong':
    case 'b':
      return 'strong';
    case 'em':
    case 'i':
      return 'em';
    case 'a':
      return 'a';
    case 'u':
      return 'u';
    case 'code':
      return 'code';
    case 'del':
    case 's':
    case 'strike':
      return 'del';
    case 'mark':
      return 'mark';
    case 'sup':
      return 'sup';
    case 'sub':
      return 'sub';
    case 'small':
      return 'small';
    // 这些标签直接展开，不保留样式
    case 'span':
    case 'div':
    case 'font':
    case 'label':
    case 'abbr':
    case 'cite':
    case 'q':
    case 'time':
      return 'skip';
    default:
      return 'skip';
  }
}

/**
 * 合并相邻的纯文本节点
 */
function mergeAdjacentText(children) {
  var result = [];
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.type === 'text' && result.length > 0 && result[result.length - 1].type === 'text') {
      result[result.length - 1].content += child.content;
    } else {
      result.push(child);
    }
  }
  return result;
}

/**
 * 解析列表项
 */
function parseListItems(html) {
  var items = [];
  var remaining = html;
  var safetyCounter = 0;

  while (remaining.length > 0 && safetyCounter < 100) {
    safetyCounter++;

    var liMatch = remaining.match(/<li(\s[^>]*)?\s*>/i);
    if (!liMatch) break;

    // 跳过 li 之前的内容
    if (liMatch.index > 0) {
      remaining = remaining.substring(liMatch.index);
    }

    var afterLiOpen = remaining.substring(liMatch[0].length);

    // 找 </li>
    var closeLiMatch = afterLiOpen.match(/<\/li\s*>/i);

    if (closeLiMatch) {
      var liContent = afterLiOpen.substring(0, closeLiMatch.index);
      items.push(parseInline(liContent));
      remaining = afterLiOpen.substring(closeLiMatch.index + closeLiMatch[0].length);
    } else {
      // 没有闭合标签，把剩余内容全部当作这个 li 的内容
      items.push(parseInline(afterLiOpen));
      break;
    }
  }

  return items;
}

/**
 * 解析 pull-quote
 */
function parsePullQuote(html) {
  var text = '';
  var attr = '';

  var textMatch = html.match(/class="[^"]*pull-quote-text[^"]*"[^>]*>([\s\S]*?)<\/(p|div|span)>/i);
  if (textMatch) {
    text = stripHtmlTags(textMatch[1]);
  } else {
    // 没找到特定 class，提取全部文本
    text = stripHtmlTags(html);
  }

  var attrMatch = html.match(/class="[^"]*pull-quote-attr[^"]*"[^>]*>([\s\S]*?)<\/(p|div|span)>/i);
  if (attrMatch) {
    attr = stripHtmlTags(attrMatch[1]).replace(/^-\s*/, '').trim();
  }

  return {
    type: 'pull-quote',
    text: text,
    attr: attr
  };
}

/**
 * 解析标签属性（支持双引号和单引号）
 */
function parseAttrs(attrStr) {
  var attrs = {};
  if (!attrStr) return attrs;

  // 双引号属性
  var doubleRegex = /([a-z-]+)\s*=\s*"([^"]*)"/gi;
  var match;
  while ((match = doubleRegex.exec(attrStr)) !== null) {
    attrs[match[1].toLowerCase()] = match[2];
  }

  // 单引号属性
  var singleRegex = /([a-z-]+)\s*=\s*'([^']*)'/gi;
  while ((match = singleRegex.exec(attrStr)) !== null) {
    attrs[match[1].toLowerCase()] = match[2];
  }

  return attrs;
}

/**
 * 解码 HTML 实体
 */
function decodeHtmlEntities(text) {
  if (!text) return '';
  var result = text;

  // 命名字符实体
  var entities = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&hellip;': '…',
    '&mdash;': '—',
    '&ndash;': '–',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&times;': '×',
    '&divide;': '÷',
    '&plusmn;': '±',
    '&bull;': '·',
    '&middot;': '·',
    '&rsquo;': '’',
    '&lsquo;': '‘',
    '&rdquo;': '”',
    '&ldquo;': '“',
    '&laquo;': '«',
    '&raquo;': '»'
  };

  for (var entity in entities) {
    if (entities.hasOwnProperty(entity)) {
      // 不区分大小写替换（提取实体名部分，加 i 标志）
      var entityName = entity.substring(1, entity.length - 1); // 去掉 & 和 ;
      var regex = new RegExp('&' + entityName + ';', 'gi');
      result = result.replace(regex, entities[entity]);
    }
  }

  // 数字字符实体 &#123; 和 &#x1A;
  result = result.replace(/&#(\d+);/g, function(match, num) {
    return String.fromCharCode(parseInt(num, 10));
  });
  result = result.replace(/&#x([0-9a-fA-F]+);/g, function(match, hex) {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return result;
}

/**
 * 去除 HTML 标签，保留纯文本
 */
function stripHtmlTags(html) {
  if (!html) return '';
  var text = html.replace(/<[^>]+>/g, '');
  return decodeHtmlEntities(text);
}

/**
 * 将 children 数组转为纯文本（用于空段落判断等）
 */
function childrenToText(children) {
  if (!children || children.length === 0) return '';
  var text = '';
  for (var i = 0; i < children.length; i++) {
    if (children[i].content) {
      text += children[i].content;
    }
  }
  return text;
}

/**
 * 移除文末的 Sources / 参考来源区块
 *
 * 策略：从末尾往前扫描，找到"来源/Sources"相关的标题/段落作为起点，
 * 从该节点开始到末尾全部移除。
 *
 * 识别关键词（匹配标题或段落首句）：
 *   - Sources, SOURCES, 来源, 参考来源, 参考资料, References
 *
 * 注意：只移除文末连续的来源区块，不影响正文中间的来源引用。
 */
function removeTrailingSources(nodes) {
  if (!nodes || nodes.length === 0) return nodes;

  // 来源关键词（不区分大小写）
  var sourceKeywords = [
    'sources',
    '参考来源',
    '参考资料',
    '来源链接',
    'references',
    '资料来源'
  ];

  // 免责声明关键词（来源区块后面通常跟着免责声明，一起移除）
  var disclaimerKeywords = [
    '免责声明',
    '仅供参考',
    '不构成任何投资建议',
    '如有侵权',
    '本文为',
    '基于公开信息'
  ];

  // 从末尾往前找来源区块起点
  var startIndex = -1;

  for (var i = nodes.length - 1; i >= 0; i--) {
    var node = nodes[i];
    var text = '';

    if (node.children) {
      text = childrenToText(node.children);
    } else if (node.text) {
      text = node.text;
    } else if (node.items) {
      // 列表的话，拼一下
      for (var j = 0; j < node.items.length; j++) {
        text += childrenToText(node.items[j]) + ' ';
      }
    }

    text = text.trim().toLowerCase();
    if (!text) continue;

    // 检查是否匹配来源关键词
    var isSourceNode = false;
    for (var k = 0; k < sourceKeywords.length; k++) {
      if (text.indexOf(sourceKeywords[k].toLowerCase()) >= 0 && text.length < 80) {
        isSourceNode = true;
        break;
      }
    }

    if (isSourceNode) {
      startIndex = i;
      break;
    }

    // 如果遇到了免责声明类的文字，继续往前找（可能来源在免责声明前面）
    var isDisclaimer = false;
    for (var k = 0; k < disclaimerKeywords.length; k++) {
      if (text.indexOf(disclaimerKeywords[k]) >= 0) {
        isDisclaimer = true;
        break;
      }
    }
    if (isDisclaimer) {
      // 免责声明本身也要被移除，但继续往前找来源起点
      startIndex = i;
      continue;
    }

    // 遇到了非来源、非免责的正常内容，停止往前找
    // （但如果 startIndex 已经被设置了，说明我们已经在来源区块内了）
    if (startIndex >= 0) {
      // 检查这个节点是否还是来源列表的一部分
      // （比如来源列表可能是多个 p 或 ul）
      // 如果是链接密集的段落，也可能是来源列表的延续
      var linkCount = 0;
      if (node.children) {
        for (var j = 0; j < node.children.length; j++) {
          if (node.children[j].type === 'a') linkCount++;
        }
      }
      if (linkCount > 0 || node.type === 'ul' || node.type === 'ol') {
        startIndex = i;
        continue;
      }
      // 不是来源相关，停止
      break;
    }
  }

  if (startIndex >= 0) {
    return nodes.slice(0, startIndex);
  }

  return nodes;
}

module.exports = {
  parseArticleHtml: parseArticleHtml
};
