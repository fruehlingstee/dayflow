(function () {
  const previousBind = bind;
  const toolItems = [
    ['bookmarks', '⌑', 'ブックマーク'],
    ['calculator', '±', '計算・単位変換'],
    ['qr', '▦', 'QRコード生成'],
    ['diff', '≠', '差分比較']
  ];
  const unitGroups = {
    length: {
      label: '長さ',
      units: {
        mm: { label: 'ミリメートル (mm)', factor: 0.001 },
        cm: { label: 'センチメートル (cm)', factor: 0.01 },
        m: { label: 'メートル (m)', factor: 1 },
        km: { label: 'キロメートル (km)', factor: 1000 },
        inch: { label: 'インチ (in)', factor: 0.0254 },
        foot: { label: 'フィート (ft)', factor: 0.3048 },
        yard: { label: 'ヤード (yd)', factor: 0.9144 },
        mile: { label: 'マイル (mi)', factor: 1609.344 }
      }
    },
    weight: {
      label: '重さ',
      units: {
        mg: { label: 'ミリグラム (mg)', factor: 0.001 },
        g: { label: 'グラム (g)', factor: 1 },
        kg: { label: 'キログラム (kg)', factor: 1000 },
        oz: { label: 'オンス (oz)', factor: 28.349523125 },
        lb: { label: 'ポンド (lb)', factor: 453.59237 }
      }
    },
    area: {
      label: '面積',
      units: {
        sqm: { label: '平方メートル (m²)', factor: 1 },
        sqkm: { label: '平方キロメートル (km²)', factor: 1000000 },
        hectare: { label: 'ヘクタール (ha)', factor: 10000 },
        tsubo: { label: '坪', factor: 3.305785124 },
        sqft: { label: '平方フィート (ft²)', factor: 0.09290304 },
        acre: { label: 'エーカー (ac)', factor: 4046.8564224 }
      }
    },
    volume: {
      label: '容量',
      units: {
        ml: { label: 'ミリリットル (mL)', factor: 0.001 },
        l: { label: 'リットル (L)', factor: 1 },
        cubicm: { label: '立方メートル (m³)', factor: 1000 },
        tsp: { label: '小さじ (tsp)', factor: 0.00492892159375 },
        tbsp: { label: '大さじ (tbsp)', factor: 0.01478676478125 },
        cup: { label: 'カップ (US)', factor: 0.2365882365 },
        gallon: { label: 'ガロン (US)', factor: 3.785411784 }
      }
    },
    temperature: {
      label: '温度',
      units: {
        c: { label: '摂氏 (°C)', toBase: function (value) { return value; }, fromBase: function (value) { return value; } },
        f: { label: '華氏 (°F)', toBase: function (value) { return (value - 32) * 5 / 9; }, fromBase: function (value) { return value * 9 / 5 + 32; } },
        k: { label: 'ケルビン (K)', toBase: function (value) { return value - 273.15; }, fromBase: function (value) { return value + 273.15; } }
      }
    },
    speed: {
      label: '速度',
      units: {
        mps: { label: 'メートル毎秒 (m/s)', factor: 1 },
        kmh: { label: 'キロメートル毎時 (km/h)', factor: 0.277777777777778 },
        mph: { label: 'マイル毎時 (mph)', factor: 0.44704 },
        knot: { label: 'ノット (kn)', factor: 0.514444444444444 }
      }
    },
    data: {
      label: 'データ容量',
      units: {
        byte: { label: 'バイト (B)', factor: 1 },
        kb: { label: 'キロバイト (KB)', factor: 1000 },
        mb: { label: 'メガバイト (MB)', factor: 1000000 },
        gb: { label: 'ギガバイト (GB)', factor: 1000000000 },
        kib: { label: 'キビバイト (KiB)', factor: 1024 },
        mib: { label: 'メビバイト (MiB)', factor: 1048576 },
        gib: { label: 'ギビバイト (GiB)', factor: 1073741824 }
      }
    }
  };

  let activeTool = 'bookmarks';
  let bookmarkQuery = '';
  let calcExpression = '';
  let calcResult = '';
  let converterState = { category: 'length', value: '1', from: 'm', to: 'km' };
  let qrState = {
    text: 'https://fruehlingstee.github.io/dayflow/',
    level: 'M',
    size: 280,
    foreground: '#0b0c0e',
    background: '#ffffff'
  };
  let qrTimer = null;
  let diffState = { before: '', after: '', view: 'split', result: null };

  data.bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks.map(function (item) {
    return {
      id: item.id || Date.now() + Math.random(),
      title: String(item.title || ''),
      url: String(item.url || ''),
      tags: Array.isArray(item.tags) ? item.tags : [],
      created: item.created || new Date().toISOString()
    };
  }) : [];
  data.calculatorHistory = Array.isArray(data.calculatorHistory) ? data.calculatorHistory.slice(0, 10) : [];
  save();

  window.toolbox = function () {
    const selected = toolItems.find(function (item) { return item[0] === activeTool; });
    return '<main class="page tools-page">' +
      '<div class="page-head"><div><p class="kicker">05 / TOOLKIT</p><h1 class="title">便利ツール</h1>' +
      '<p class="subtitle">日常の小さな作業を、ここで素早く。</p></div>' +
      '<div class="privacy-badge">端末内で処理</div></div>' +
      '<nav class="tool-tabs" aria-label="便利ツール">' +
      toolItems.map(function (item) {
        return '<button class="' + (activeTool === item[0] ? 'active' : '') + '" data-tool="' + item[0] + '" aria-pressed="' + (activeTool === item[0]) + '">' +
          '<span>' + item[1] + '</span>' + item[2] + '</button>';
      }).join('') +
      '</nav><div id="toolStatus" class="tool-status" role="status" aria-live="polite"></div>' +
      '<section class="tool-pane" aria-label="' + esc(selected[2]) + '">' + activeToolMarkup() + '</section></main>';
  };

  function activeToolMarkup() {
    if (activeTool === 'bookmarks') return bookmarksMarkup();
    if (activeTool === 'calculator') return calculatorMarkup();
    if (activeTool === 'qr') return qrMarkup();
    return diffMarkup();
  }

  function bookmarksMarkup() {
    return '<div class="tool-heading"><div><span class="tool-eyebrow">BOOKMARKS</span><h2>よく使う場所を、すぐ近くに。</h2></div>' +
      '<span class="tool-count" id="bookmarkCount">' + filteredBookmarks().length + '件</span></div>' +
      '<form class="bookmark-form panel" id="bookmarkForm">' +
      '<div class="field"><label for="bookmarkTitle">名前</label><input class="input" id="bookmarkTitle" maxlength="80" placeholder="例：ニュース"></div>' +
      '<div class="field field-wide"><label for="bookmarkUrl">URL</label><input class="input" id="bookmarkUrl" inputmode="url" required maxlength="2048" placeholder="example.com"></div>' +
      '<div class="field"><label for="bookmarkTags">タグ</label><input class="input" id="bookmarkTags" maxlength="120" placeholder="仕事, 読み物"></div>' +
      '<button class="button" type="submit">追加</button></form>' +
      '<div class="tool-actions"><input class="input" id="bookmarkSearch" value="' + esc(bookmarkQuery) + '" placeholder="名前・URL・タグを検索" aria-label="ブックマークを検索">' +
      '<button class="ghost" id="bookmarkClearSearch" type="button">検索をクリア</button></div>' +
      '<div class="bookmark-grid" id="bookmarkList">' + bookmarkListMarkup() + '</div>';
  }

  function filteredBookmarks() {
    const needle = bookmarkQuery.trim().toLowerCase();
    return data.bookmarks.filter(function (item) {
      return !needle || (item.title + ' ' + item.url + ' ' + item.tags.join(' ')).toLowerCase().includes(needle);
    });
  }

  function bookmarkListMarkup() {
    const items = filteredBookmarks();
    if (!items.length) {
      return '<div class="empty tool-empty">' + (bookmarkQuery ? '検索条件に一致するブックマークはありません' : '最初のブックマークを追加しましょう') + '</div>';
    }
    return items.map(function (item) {
      let host = item.url;
      try { host = new URL(item.url).hostname.replace(/^www\./, ''); } catch (_) {}
      const initial = (item.title || host || '?').trim().charAt(0).toUpperCase();
      return '<article class="bookmark-card">' +
        '<div class="bookmark-icon" aria-hidden="true">' + esc(initial) + '</div>' +
        '<div class="bookmark-copy"><h3>' + esc(item.title || host) + '</h3><p title="' + esc(item.url) + '">' + esc(host) + '</p>' +
        (item.tags.length ? '<div class="bookmark-tags">' + item.tags.map(function (tag) { return '<span>' + esc(tag) + '</span>'; }).join('') + '</div>' : '') +
        '</div><div class="bookmark-actions">' +
        '<a class="button compact-button" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">開く</a>' +
        '<button class="ghost" data-bookmark-copy="' + item.id + '" type="button">コピー</button>' +
        '<button class="ghost" data-bookmark-edit="' + item.id + '" type="button">編集</button>' +
        '<button class="ghost danger-text" data-bookmark-delete="' + item.id + '" type="button">削除</button>' +
        '</div></article>';
    }).join('');
  }

  function calculatorMarkup() {
    const group = unitGroups[converterState.category];
    return '<div class="tool-heading"><div><span class="tool-eyebrow">CALCULATOR</span><h2>計算と変換を、ひと続きに。</h2></div></div>' +
      '<div class="calculator-layout">' +
      '<section class="panel calculator-card"><h3>電卓</h3>' +
      '<form id="calculatorForm"><label class="sr-only" for="calcExpression">計算式</label>' +
      '<input class="calc-display" id="calcExpression" autocomplete="off" inputmode="decimal" value="' + esc(calcExpression) + '" placeholder="例：(1200 + 800) * 1.1">' +
      '<output class="calc-result" id="calcResult" aria-live="polite">' + esc(calcResult || '0') + '</output></form>' +
      '<div class="calc-keypad">' +
      ['C','(',')','⌫','7','8','9','÷','4','5','6','×','1','2','3','−','0','.','%','+'].map(function (key) {
        const action = key === 'C' ? 'clear' : key === '⌫' ? 'backspace' : '';
        return '<button type="button" class="' + (/^[÷×−+%]$/.test(key) ? 'operator' : '') + '" data-calc-key="' + esc(key) + '"' + (action ? ' data-calc-action="' + action + '"' : '') + '>' + esc(key) + '</button>';
      }).join('') +
      '<button type="button" class="equals" id="calcEquals">=</button></div>' +
      '<p class="tool-hint">使用可能：+ − × ÷ % ^ ( )。% は剰余です。</p>' +
      '<div class="calc-history"><div class="section-label">HISTORY</div><div id="calcHistory">' + calculatorHistoryMarkup() + '</div></div></section>' +
      '<section class="panel converter-card"><h3>単位変換</h3>' +
      '<div class="field"><label for="unitCategory">種類</label><select class="select" id="unitCategory">' +
      Object.keys(unitGroups).map(function (key) { return '<option value="' + key + '"' + (key === converterState.category ? ' selected' : '') + '>' + unitGroups[key].label + '</option>'; }).join('') +
      '</select></div><div class="field"><label for="unitValue">値</label><input class="input converter-value" id="unitValue" inputmode="decimal" value="' + esc(converterState.value) + '"></div>' +
      '<div class="converter-flow"><div class="field"><label for="unitFrom">変換元</label><select class="select" id="unitFrom">' + unitOptions(group, converterState.from) + '</select></div>' +
      '<button class="swap-button" id="swapUnits" type="button" aria-label="変換元と変換先を入れ替える">⇄</button>' +
      '<div class="field"><label for="unitTo">変換先</label><select class="select" id="unitTo">' + unitOptions(group, converterState.to) + '</select></div></div>' +
      '<div class="conversion-result"><span>変換結果</span><strong id="unitResult">' + esc(conversionResult()) + '</strong></div>' +
      '<button class="button dim copy-result" id="copyUnitResult" type="button">結果をコピー</button></section></div>';
  }

  function unitOptions(group, selected) {
    return Object.keys(group.units).map(function (key) {
      return '<option value="' + key + '"' + (key === selected ? ' selected' : '') + '>' + group.units[key].label + '</option>';
    }).join('');
  }

  function calculatorHistoryMarkup() {
    if (!data.calculatorHistory.length) return '<span class="history-empty">計算履歴はまだありません</span>';
    return data.calculatorHistory.map(function (item, index) {
      return '<button type="button" data-history-index="' + index + '"><span>' + esc(item.expression) + '</span><strong>' + esc(item.result) + '</strong></button>';
    }).join('');
  }

  function normalizeUrl(value) {
    let candidate = String(value || '').trim();
    if (!candidate) throw new Error('URLを入力してください。');
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) candidate = 'https://' + candidate;
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('http または https のURLを入力してください。');
    return parsed.href;
  }

  function parseTags(value) {
    return Array.from(new Set(String(value || '').split(/[,、]/).map(function (tag) { return tag.trim(); }).filter(Boolean))).slice(0, 8);
  }

  function setToolStatus(message, kind) {
    const status = document.querySelector('#toolStatus');
    if (!status) return;
    status.textContent = message;
    status.className = 'tool-status visible ' + (kind || 'success');
    window.clearTimeout(setToolStatus.timer);
    setToolStatus.timer = window.setTimeout(function () {
      status.className = 'tool-status';
      status.textContent = '';
    }, 2600);
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const helper = document.createElement('textarea');
    helper.value = value;
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
  }

  function drawBookmarks() {
    const list = document.querySelector('#bookmarkList');
    const count = document.querySelector('#bookmarkCount');
    if (list) list.innerHTML = bookmarkListMarkup();
    if (count) count.textContent = filteredBookmarks().length + '件';
    bindBookmarkCards();
  }

  function bindBookmarks() {
    document.querySelector('#bookmarkForm').onsubmit = function (event) {
      event.preventDefault();
      try {
        const url = normalizeUrl(document.querySelector('#bookmarkUrl').value);
        const titleInput = document.querySelector('#bookmarkTitle').value.trim();
        const fallbackTitle = new URL(url).hostname.replace(/^www\./, '');
        data.bookmarks.unshift({
          id: Date.now(),
          title: titleInput || fallbackTitle,
          url: url,
          tags: parseTags(document.querySelector('#bookmarkTags').value),
          created: new Date().toISOString()
        });
        save();
        render();
        setToolStatus('ブックマークを追加しました。');
      } catch (error) {
        setToolStatus(error.message, 'error');
      }
    };
    document.querySelector('#bookmarkSearch').oninput = function (event) {
      bookmarkQuery = event.target.value;
      drawBookmarks();
    };
    document.querySelector('#bookmarkClearSearch').onclick = function () {
      bookmarkQuery = '';
      document.querySelector('#bookmarkSearch').value = '';
      drawBookmarks();
      document.querySelector('#bookmarkSearch').focus();
    };
    bindBookmarkCards();
  }

  function bindBookmarkCards() {
    document.querySelectorAll('[data-bookmark-copy]').forEach(function (button) {
      button.onclick = async function () {
        const item = data.bookmarks.find(function (bookmark) { return bookmark.id == button.dataset.bookmarkCopy; });
        if (!item) return;
        try {
          await copyText(item.url);
          setToolStatus('URLをコピーしました。');
        } catch (_) {
          setToolStatus('コピーできませんでした。', 'error');
        }
      };
    });
    document.querySelectorAll('[data-bookmark-edit]').forEach(function (button) {
      button.onclick = function () { editBookmark(button.dataset.bookmarkEdit); };
    });
    document.querySelectorAll('[data-bookmark-delete]').forEach(function (button) {
      button.onclick = function () {
        const item = data.bookmarks.find(function (bookmark) { return bookmark.id == button.dataset.bookmarkDelete; });
        if (!item) return;
        confirmDelete('「' + esc(item.title) + '」を削除しますか？', function () {
          data.bookmarks = data.bookmarks.filter(function (bookmark) { return bookmark.id != item.id; });
          save();
          closeModal();
          render();
          setToolStatus('ブックマークを削除しました。');
        });
      };
    });
  }

  function editBookmark(id) {
    const item = data.bookmarks.find(function (bookmark) { return bookmark.id == id; });
    if (!item) return;
    modal('<h2>ブックマークを編集</h2>' +
      '<label for="editBookmarkTitle">名前</label><input class="input" id="editBookmarkTitle" maxlength="80" value="' + esc(item.title) + '">' +
      '<label for="editBookmarkUrl">URL</label><input class="input" id="editBookmarkUrl" inputmode="url" maxlength="2048" value="' + esc(item.url) + '">' +
      '<label for="editBookmarkTags">タグ</label><input class="input" id="editBookmarkTags" maxlength="120" value="' + esc(item.tags.join(', ')) + '">' +
      '<div class="modal-actions"><button class="button dim" id="cancelBookmarkEdit">キャンセル</button><button class="button" id="saveBookmarkEdit">保存</button></div>');
    document.querySelector('#cancelBookmarkEdit').onclick = closeModal;
    document.querySelector('#saveBookmarkEdit').onclick = function () {
      try {
        item.url = normalizeUrl(document.querySelector('#editBookmarkUrl').value);
        item.title = document.querySelector('#editBookmarkTitle').value.trim() || new URL(item.url).hostname.replace(/^www\./, '');
        item.tags = parseTags(document.querySelector('#editBookmarkTags').value);
        save();
        closeModal();
        render();
        setToolStatus('変更を保存しました。');
      } catch (error) {
        closeModal();
        setToolStatus(error.message, 'error');
      }
    };
  }

  function tokenizeExpression(input) {
    const normalized = String(input || '').replace(/[×xX]/g, '*').replace(/÷/g, '/').replace(/−/g, '-').trim();
    if (!normalized) throw new Error('計算式を入力してください。');
    const tokens = [];
    let index = 0;
    while (index < normalized.length) {
      const character = normalized[index];
      if (/\s/.test(character)) {
        index++;
        continue;
      }
      const number = normalized.slice(index).match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
      if (number) {
        tokens.push(Number(number[0]));
        index += number[0].length;
        continue;
      }
      if ('+-*/%^()'.includes(character)) {
        tokens.push(character);
        index++;
        continue;
      }
      throw new Error('使用できない文字があります。');
    }
    return tokens;
  }

  function calculateExpression(input) {
    const tokens = tokenizeExpression(input);
    const output = [];
    const operators = [];
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, 'u+': 4, 'u-': 4, '^': 4 };
    const rightAssociative = { '^': true, 'u+': true, 'u-': true };
    let previous = 'start';

    tokens.forEach(function (token) {
      if (typeof token === 'number') {
        if (previous === 'number' || previous === 'close') throw new Error('演算子が必要です。');
        output.push(token);
        previous = 'number';
        return;
      }
      if (token === '(') {
        if (previous === 'number' || previous === 'close') {
          while (operators.length && operators[operators.length - 1] !== '(' && precedence['*'] <= precedence[operators[operators.length - 1]]) {
            output.push(operators.pop());
          }
          operators.push('*');
        }
        operators.push(token);
        previous = 'open';
        return;
      }
      if (token === ')') {
        if (previous === 'operator' || previous === 'open' || previous === 'start') throw new Error('括弧の中を確認してください。');
        while (operators.length && operators[operators.length - 1] !== '(') output.push(operators.pop());
        if (!operators.length) throw new Error('括弧が対応していません。');
        operators.pop();
        previous = 'close';
        return;
      }
      let operator = token;
      if ((token === '+' || token === '-') && (previous === 'start' || previous === 'operator' || previous === 'open')) operator = 'u' + token;
      else if (previous !== 'number' && previous !== 'close') throw new Error('演算子の位置を確認してください。');
      while (operators.length && operators[operators.length - 1] !== '(') {
        const top = operators[operators.length - 1];
        const shouldPop = rightAssociative[operator] ? precedence[operator] < precedence[top] : precedence[operator] <= precedence[top];
        if (!shouldPop) break;
        output.push(operators.pop());
      }
      operators.push(operator);
      previous = 'operator';
    });

    if (previous === 'operator' || previous === 'open') throw new Error('計算式が途中です。');
    while (operators.length) {
      const operator = operators.pop();
      if (operator === '(') throw new Error('括弧が対応していません。');
      output.push(operator);
    }

    const stack = [];
    output.forEach(function (token) {
      if (typeof token === 'number') {
        stack.push(token);
        return;
      }
      if (token === 'u+' || token === 'u-') {
        if (!stack.length) throw new Error('計算式を確認してください。');
        const value = stack.pop();
        stack.push(token === 'u-' ? -value : value);
        return;
      }
      if (stack.length < 2) throw new Error('計算式を確認してください。');
      const right = stack.pop();
      const left = stack.pop();
      if ((token === '/' || token === '%') && right === 0) throw new Error('0では割れません。');
      if (token === '+') stack.push(left + right);
      if (token === '-') stack.push(left - right);
      if (token === '*') stack.push(left * right);
      if (token === '/') stack.push(left / right);
      if (token === '%') stack.push(left % right);
      if (token === '^') stack.push(Math.pow(left, right));
    });
    if (stack.length !== 1 || !Number.isFinite(stack[0])) throw new Error('計算結果が範囲外です。');
    return stack[0];
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return '—';
    if (value === 0) return '0';
    const absolute = Math.abs(value);
    if (absolute >= 1e12 || absolute < 1e-9) return value.toExponential(10).replace(/\.?0+e/, 'e');
    return Number(value.toPrecision(12)).toLocaleString('ja-JP', { maximumFractionDigits: 12, useGrouping: false });
  }

  function conversionResult() {
    const value = Number(String(converterState.value).replace(/,/g, ''));
    if (!Number.isFinite(value)) return '値を入力してください';
    const group = unitGroups[converterState.category];
    const from = group.units[converterState.from];
    const to = group.units[converterState.to];
    if (!from || !to) return '単位を選択してください';
    const baseValue = from.toBase ? from.toBase(value) : value * from.factor;
    const result = to.fromBase ? to.fromBase(baseValue) : baseValue / to.factor;
    return formatNumber(result) + ' ' + to.label.replace(/^.*\((.*?)\).*$/, '$1');
  }

  function runCalculation() {
    try {
      const value = calculateExpression(calcExpression);
      calcResult = formatNumber(value);
      data.calculatorHistory.unshift({ expression: calcExpression, result: calcResult });
      data.calculatorHistory = data.calculatorHistory.slice(0, 10);
      save();
      document.querySelector('#calcResult').textContent = calcResult;
      document.querySelector('#calcHistory').innerHTML = calculatorHistoryMarkup();
      bindCalculatorHistory();
    } catch (error) {
      calcResult = '';
      document.querySelector('#calcResult').textContent = error.message;
      document.querySelector('#calcResult').classList.add('error');
      window.setTimeout(function () {
        const result = document.querySelector('#calcResult');
        if (result) result.classList.remove('error');
      }, 1600);
    }
  }

  function bindCalculatorHistory() {
    document.querySelectorAll('[data-history-index]').forEach(function (button) {
      button.onclick = function () {
        const item = data.calculatorHistory[Number(button.dataset.historyIndex)];
        if (!item) return;
        calcExpression = item.expression;
        calcResult = item.result;
        document.querySelector('#calcExpression').value = calcExpression;
        document.querySelector('#calcResult').textContent = calcResult;
      };
    });
  }

  function bindCalculator() {
    const expressionInput = document.querySelector('#calcExpression');
    document.querySelector('#calculatorForm').onsubmit = function (event) {
      event.preventDefault();
      calcExpression = expressionInput.value;
      runCalculation();
    };
    expressionInput.oninput = function (event) { calcExpression = event.target.value; };
    document.querySelectorAll('[data-calc-key]').forEach(function (button) {
      button.onclick = function () {
        const action = button.dataset.calcAction;
        if (action === 'clear') calcExpression = '';
        else if (action === 'backspace') calcExpression = calcExpression.slice(0, -1);
        else {
          const key = button.dataset.calcKey.replace('×', '*').replace('÷', '/').replace('−', '-');
          calcExpression += key;
        }
        expressionInput.value = calcExpression;
        expressionInput.focus();
      };
    });
    document.querySelector('#calcEquals').onclick = function () {
      calcExpression = expressionInput.value;
      runCalculation();
    };
    bindCalculatorHistory();

    document.querySelector('#unitCategory').onchange = function (event) {
      converterState.category = event.target.value;
      const keys = Object.keys(unitGroups[converterState.category].units);
      converterState.from = keys[0];
      converterState.to = keys[1] || keys[0];
      render();
    };
    document.querySelector('#unitValue').oninput = function (event) {
      converterState.value = event.target.value;
      document.querySelector('#unitResult').textContent = conversionResult();
    };
    document.querySelector('#unitFrom').onchange = function (event) {
      converterState.from = event.target.value;
      document.querySelector('#unitResult').textContent = conversionResult();
    };
    document.querySelector('#unitTo').onchange = function (event) {
      converterState.to = event.target.value;
      document.querySelector('#unitResult').textContent = conversionResult();
    };
    document.querySelector('#swapUnits').onclick = function () {
      const previous = converterState.from;
      converterState.from = converterState.to;
      converterState.to = previous;
      document.querySelector('#unitFrom').value = converterState.from;
      document.querySelector('#unitTo').value = converterState.to;
      document.querySelector('#unitResult').textContent = conversionResult();
    };
    document.querySelector('#copyUnitResult').onclick = async function () {
      try {
        await copyText(conversionResult());
        setToolStatus('変換結果をコピーしました。');
      } catch (_) {
        setToolStatus('コピーできませんでした。', 'error');
      }
    };
  }

  function qrMarkup() {
    return '<div class="tool-heading"><div><span class="tool-eyebrow">QR GENERATOR</span><h2>文字とリンクを、その場でQRに。</h2></div>' +
      '<span class="local-note">入力内容は送信されません</span></div>' +
      '<div class="qr-layout"><section class="panel qr-controls">' +
      '<div class="field"><label for="qrText">QRにする内容</label><textarea id="qrText" rows="7" maxlength="4000" placeholder="URLやテキストを入力">' + esc(qrState.text) + '</textarea>' +
      '<div class="field-meta"><span id="qrCharacterCount">' + qrState.text.length + ' / 4000</span><button class="ghost" id="pasteQrText" type="button">貼り付け</button></div></div>' +
      '<div class="qr-options"><div class="field"><label for="qrLevel">誤り訂正</label><select class="select" id="qrLevel">' +
      [['L','低（容量優先）'],['M','標準'],['Q','高'],['H','最高']].map(function (item) { return '<option value="' + item[0] + '"' + (qrState.level === item[0] ? ' selected' : '') + '>' + item[1] + '</option>'; }).join('') +
      '</select></div><div class="field"><label for="qrSize">画像サイズ</label><select class="select" id="qrSize">' +
      [200,280,360,480,640].map(function (size) { return '<option value="' + size + '"' + (qrState.size === size ? ' selected' : '') + '>' + size + ' px</option>'; }).join('') +
      '</select></div></div>' +
      '<div class="color-options"><label>前景色<input type="color" id="qrForeground" value="' + esc(qrState.foreground) + '"></label>' +
      '<label>背景色<input type="color" id="qrBackground" value="' + esc(qrState.background) + '"></label></div>' +
      '<div class="tool-actions bottomless"><button class="button" id="generateQr" type="button">生成</button><button class="button dim" id="resetQr" type="button">リセット</button></div></section>' +
      '<section class="panel qr-preview"><div class="qr-stage" id="qrStage"><canvas id="qrCanvas" aria-label="生成されたQRコード"></canvas><div class="qr-placeholder" id="qrPlaceholder">内容を入力するとQRコードを生成します</div></div>' +
      '<div class="qr-meta" id="qrMeta"></div><div class="tool-actions qr-downloads"><button class="button" id="downloadQr" type="button" disabled>PNGを保存</button>' +
      '<button class="button dim" id="copyQr" type="button" disabled>画像をコピー</button></div></section></div>';
  }

  function drawQr() {
    const canvas = document.querySelector('#qrCanvas');
    const placeholder = document.querySelector('#qrPlaceholder');
    const meta = document.querySelector('#qrMeta');
    const download = document.querySelector('#downloadQr');
    const copy = document.querySelector('#copyQr');
    if (!canvas) return;
    const text = qrState.text.trim();
    if (!text) {
      canvas.hidden = true;
      placeholder.hidden = false;
      placeholder.textContent = '内容を入力するとQRコードを生成します';
      meta.textContent = '';
      download.disabled = true;
      copy.disabled = true;
      return;
    }
    if (typeof window.qrcode !== 'function') {
      canvas.hidden = true;
      placeholder.hidden = false;
      placeholder.textContent = 'QR生成ライブラリを読み込めませんでした。通信状態を確認してください。';
      meta.textContent = '';
      download.disabled = true;
      copy.disabled = true;
      return;
    }
    try {
      const qr = window.qrcode(0, qrState.level);
      qr.addData(text, 'Byte');
      qr.make();
      const modules = qr.getModuleCount();
      const quietZone = 4;
      const cellSize = Math.max(1, Math.floor(qrState.size / (modules + quietZone * 2)));
      const actualSize = cellSize * (modules + quietZone * 2);
      canvas.width = actualSize;
      canvas.height = actualSize;
      const context = canvas.getContext('2d', { alpha: false });
      context.fillStyle = qrState.background;
      context.fillRect(0, 0, actualSize, actualSize);
      context.fillStyle = qrState.foreground;
      for (let row = 0; row < modules; row++) {
        for (let column = 0; column < modules; column++) {
          if (qr.isDark(row, column)) {
            context.fillRect((column + quietZone) * cellSize, (row + quietZone) * cellSize, cellSize, cellSize);
          }
        }
      }
      canvas.hidden = false;
      placeholder.hidden = true;
      meta.textContent = modules + ' × ' + modules + ' modules · ' + actualSize + ' px · ' + text.length + '文字';
      download.disabled = false;
      copy.disabled = false;
    } catch (error) {
      canvas.hidden = true;
      placeholder.hidden = false;
      placeholder.textContent = '内容が長すぎます。文字数を減らすか、誤り訂正レベルを下げてください。';
      meta.textContent = '';
      download.disabled = true;
      copy.disabled = true;
    }
  }

  function scheduleQrDraw() {
    window.clearTimeout(qrTimer);
    qrTimer = window.setTimeout(drawQr, 180);
  }

  function canvasBlob(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('画像を作成できませんでした。'));
      }, 'image/png');
    });
  }

  function bindQr() {
    const text = document.querySelector('#qrText');
    text.oninput = function (event) {
      qrState.text = event.target.value;
      document.querySelector('#qrCharacterCount').textContent = qrState.text.length + ' / 4000';
      scheduleQrDraw();
    };
    document.querySelector('#qrLevel').onchange = function (event) {
      qrState.level = event.target.value;
      drawQr();
    };
    document.querySelector('#qrSize').onchange = function (event) {
      qrState.size = Number(event.target.value);
      drawQr();
    };
    document.querySelector('#qrForeground').oninput = function (event) {
      qrState.foreground = event.target.value;
      drawQr();
    };
    document.querySelector('#qrBackground').oninput = function (event) {
      qrState.background = event.target.value;
      drawQr();
    };
    document.querySelector('#generateQr').onclick = drawQr;
    document.querySelector('#resetQr').onclick = function () {
      qrState = { text: '', level: 'M', size: 280, foreground: '#0b0c0e', background: '#ffffff' };
      render();
    };
    document.querySelector('#pasteQrText').onclick = async function () {
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error();
        qrState.text = await navigator.clipboard.readText();
        text.value = qrState.text;
        document.querySelector('#qrCharacterCount').textContent = qrState.text.length + ' / 4000';
        drawQr();
      } catch (_) {
        setToolStatus('クリップボードを読み取れませんでした。', 'error');
      }
    };
    document.querySelector('#downloadQr').onclick = async function () {
      try {
        const canvas = document.querySelector('#qrCanvas');
        const blob = await canvasBlob(canvas);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'dayflow-qr.png';
        anchor.click();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        setToolStatus('QRコードを保存しました。');
      } catch (_) {
        setToolStatus('画像を保存できませんでした。', 'error');
      }
    };
    document.querySelector('#copyQr').onclick = async function () {
      try {
        if (!navigator.clipboard || typeof window.ClipboardItem !== 'function' || !window.isSecureContext) throw new Error();
        const blob = await canvasBlob(document.querySelector('#qrCanvas'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setToolStatus('QRコード画像をコピーしました。');
      } catch (_) {
        setToolStatus('このブラウザでは画像をコピーできません。PNG保存をお使いください。', 'error');
      }
    };
    drawQr();
  }

  function diffMarkup() {
    return '<div class="tool-heading"><div><span class="tool-eyebrow">DIFF CHECKER</span><h2>2つの文章から、違いだけを見る。</h2></div></div>' +
      '<div class="diff-inputs"><div class="field"><label for="diffBefore">変更前</label><textarea id="diffBefore" rows="12" spellcheck="false" placeholder="変更前の文章">' + esc(diffState.before) + '</textarea></div>' +
      '<div class="diff-swap"><button class="swap-button" id="swapDiff" type="button" aria-label="変更前と変更後を入れ替える">⇄</button></div>' +
      '<div class="field"><label for="diffAfter">変更後</label><textarea id="diffAfter" rows="12" spellcheck="false" placeholder="変更後の文章">' + esc(diffState.after) + '</textarea></div></div>' +
      '<div class="diff-toolbar"><div class="tool-actions bottomless"><button class="button" id="compareDiff" type="button">比較する</button><button class="button dim" id="clearDiff" type="button">クリア</button>' +
      '<button class="button dim" id="copyDiff" type="button"' + (!diffState.result ? ' disabled' : '') + '>差分をコピー</button></div>' +
      '<div class="view-toggle" role="group" aria-label="差分表示形式"><button type="button" data-diff-view="split" class="' + (diffState.view === 'split' ? 'active' : '') + '">横並び</button>' +
      '<button type="button" data-diff-view="unified" class="' + (diffState.view === 'unified' ? 'active' : '') + '">統合</button></div></div>' +
      '<div id="diffResult">' + diffResultMarkup() + '</div>';
  }

  function splitLines(value) {
    const normalized = String(value || '').replace(/\r\n?/g, '\n');
    return normalized === '' ? [] : normalized.split('\n');
  }

  function mapValue(map, key) {
    return map.has(key) ? map.get(key) : -Infinity;
  }

  function diffLines(before, after) {
    const left = splitLines(before);
    const right = splitLines(after);
    if (left.length + right.length > 6000 || before.length + after.length > 600000) {
      throw new Error('比較できる上限は合計6,000行または60万文字です。');
    }
    const maximum = left.length + right.length;
    let vector = new Map();
    vector.set(1, 0);
    const trace = [];

    for (let distance = 0; distance <= maximum; distance++) {
      if (distance > 2000) {
        throw new Error('差分が大きすぎます。文章を分割して比較してください。');
      }
      trace.push(new Map(vector));
      for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
        let x;
        if (diagonal === -distance || (diagonal !== distance && mapValue(vector, diagonal - 1) < mapValue(vector, diagonal + 1))) {
          x = mapValue(vector, diagonal + 1);
          if (!Number.isFinite(x)) x = 0;
        } else {
          x = mapValue(vector, diagonal - 1) + 1;
        }
        let y = x - diagonal;
        while (x < left.length && y < right.length && left[x] === right[y]) {
          x++;
          y++;
        }
        vector.set(diagonal, x);
        if (x >= left.length && y >= right.length) return backtrackDiff(trace, left, right, distance);
      }
    }
    return [];
  }

  function backtrackDiff(trace, left, right, maximumDistance) {
    let x = left.length;
    let y = right.length;
    const operations = [];
    for (let distance = maximumDistance; distance >= 0; distance--) {
      const vector = trace[distance];
      const diagonal = x - y;
      let previousDiagonal;
      if (diagonal === -distance || (diagonal !== distance && mapValue(vector, diagonal - 1) < mapValue(vector, diagonal + 1))) {
        previousDiagonal = diagonal + 1;
      } else {
        previousDiagonal = diagonal - 1;
      }
      let previousX = mapValue(vector, previousDiagonal);
      if (!Number.isFinite(previousX)) previousX = 0;
      const previousY = previousX - previousDiagonal;
      while (x > previousX && y > previousY) {
        operations.push({ type: 'same', text: left[x - 1], left: x, right: y });
        x--;
        y--;
      }
      if (distance === 0) break;
      if (x === previousX) {
        operations.push({ type: 'add', text: right[y - 1], right: y });
        y--;
      } else {
        operations.push({ type: 'remove', text: left[x - 1], left: x });
        x--;
      }
    }
    return operations.reverse();
  }

  function diffSummary(operations) {
    return operations.reduce(function (summary, operation) {
      summary[operation.type]++;
      return summary;
    }, { add: 0, remove: 0, same: 0 });
  }

  function lineCell(text, number, type) {
    if (text === undefined) return '<div class="diff-cell blank"></div>';
    return '<div class="diff-cell ' + type + '"><span class="line-number">' + (number || '') + '</span><code>' + (text === '' ? '&nbsp;' : esc(text)) + '</code></div>';
  }

  function splitDiffRows(operations) {
    let html = '';
    let index = 0;
    while (index < operations.length) {
      if (operations[index].type === 'same') {
        const item = operations[index];
        html += '<div class="diff-row">' + lineCell(item.text, item.left, 'same') + lineCell(item.text, item.right, 'same') + '</div>';
        index++;
        continue;
      }
      const removed = [];
      const added = [];
      while (index < operations.length && operations[index].type !== 'same') {
        if (operations[index].type === 'remove') removed.push(operations[index]);
        else added.push(operations[index]);
        index++;
      }
      const rows = Math.max(removed.length, added.length);
      for (let row = 0; row < rows; row++) {
        const leftItem = removed[row];
        const rightItem = added[row];
        html += '<div class="diff-row">' +
          lineCell(leftItem && leftItem.text, leftItem && leftItem.left, leftItem ? 'remove' : 'blank') +
          lineCell(rightItem && rightItem.text, rightItem && rightItem.right, rightItem ? 'add' : 'blank') + '</div>';
      }
    }
    return html;
  }

  function unifiedDiffRows(operations) {
    return operations.map(function (item) {
      const symbol = item.type === 'add' ? '+' : item.type === 'remove' ? '−' : ' ';
      return '<div class="diff-unified-line ' + item.type + '"><span class="diff-symbol">' + symbol + '</span>' +
        '<span class="line-number">' + (item.left || '') + '</span><span class="line-number">' + (item.right || '') + '</span>' +
        '<code>' + (item.text === '' ? '&nbsp;' : esc(item.text)) + '</code></div>';
    }).join('');
  }

  function diffResultMarkup() {
    if (!diffState.result) return '<div class="empty diff-empty">2つの文章を入力して「比較する」を押してください</div>';
    const summary = diffSummary(diffState.result);
    const noChanges = summary.add === 0 && summary.remove === 0;
    return '<div class="diff-summary">' +
      '<span class="summary-chip same">' + summary.same + ' 同一</span>' +
      '<span class="summary-chip add">+' + summary.add + ' 追加</span>' +
      '<span class="summary-chip remove">−' + summary.remove + ' 削除</span>' +
      (noChanges ? '<strong>差分はありません</strong>' : '') + '</div>' +
      '<div class="diff-table ' + diffState.view + '">' +
      (diffState.view === 'split'
        ? '<div class="diff-header"><span>変更前</span><span>変更後</span></div>' + splitDiffRows(diffState.result)
        : unifiedDiffRows(diffState.result)) +
      '</div>';
  }

  function drawDiffResult() {
    const result = document.querySelector('#diffResult');
    if (result) result.innerHTML = diffResultMarkup();
    const copyButton = document.querySelector('#copyDiff');
    if (copyButton) copyButton.disabled = !diffState.result;
    document.querySelectorAll('[data-diff-view]').forEach(function (button) {
      button.classList.toggle('active', button.dataset.diffView === diffState.view);
    });
  }

  function compareDiff() {
    diffState.before = document.querySelector('#diffBefore').value;
    diffState.after = document.querySelector('#diffAfter').value;
    try {
      diffState.result = diffLines(diffState.before, diffState.after);
      drawDiffResult();
    } catch (error) {
      diffState.result = null;
      drawDiffResult();
      setToolStatus(error.message, 'error');
    }
  }

  function bindDiff() {
    const before = document.querySelector('#diffBefore');
    const after = document.querySelector('#diffAfter');
    before.oninput = function (event) { diffState.before = event.target.value; };
    after.oninput = function (event) { diffState.after = event.target.value; };
    document.querySelector('#compareDiff').onclick = compareDiff;
    document.querySelector('#swapDiff').onclick = function () {
      const previous = before.value;
      before.value = after.value;
      after.value = previous;
      diffState.before = before.value;
      diffState.after = after.value;
      if (diffState.result) compareDiff();
    };
    document.querySelector('#clearDiff').onclick = function () {
      diffState = { before: '', after: '', view: diffState.view, result: null };
      before.value = '';
      after.value = '';
      drawDiffResult();
      before.focus();
    };
    document.querySelector('#copyDiff').onclick = async function () {
      if (!diffState.result) return;
      const content = diffState.result.map(function (item) {
        return (item.type === 'add' ? '+' : item.type === 'remove' ? '-' : ' ') + item.text;
      }).join('\n');
      try {
        await copyText(content);
        setToolStatus('差分をコピーしました。');
      } catch (_) {
        setToolStatus('コピーできませんでした。', 'error');
      }
    };
    document.querySelectorAll('[data-diff-view]').forEach(function (button) {
      button.onclick = function () {
        diffState.view = button.dataset.diffView;
        drawDiffResult();
      };
    });
  }

  bind = function () {
    if (page !== 'tools') {
      previousBind();
      return;
    }
    document.querySelectorAll('[data-tool]').forEach(function (button) {
      button.onclick = function () {
        activeTool = button.dataset.tool;
        render();
      };
    });
    if (activeTool === 'bookmarks') bindBookmarks();
    if (activeTool === 'calculator') bindCalculator();
    if (activeTool === 'qr') bindQr();
    if (activeTool === 'diff') bindDiff();
  };

  render();
})();
