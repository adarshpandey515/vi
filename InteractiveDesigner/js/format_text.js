function addFormattedRichTextComponent(editor) {
  const formulaEngine = HyperFormula.buildEmpty({
    licenseKey: 'gpl-v3'
  });

  const formatConfigs = {
    text: {
      label: 'Text',
      patterns: ['None'],
      defaultPattern: 'None',
      icon: '📝'
    },
    number: {
      label: 'Number',
      patterns: ['0', '0.0', '0.00', '#,###', '#,###.##', '#,##,###', '#,##,###.##', '#,##,###.###'],
      defaultPattern: '#,##,###',
      icon: '🔢'
    },
    currency: {
      label: 'Currency',
      patterns: [
        '$ 0', '$ 0.00',           // USA, Canada
        '₹ 0.00', '₹ 0',           // India
        '¥ 0', '£ 0.00', '€ 0.00', // Existing
        'IDR 0.000',               // Indonesia
        'OMR 0.000',               // Oman
        'R 0.00',                  // South Africa
        '¥ 0.00',                  // China
        'S$ 0.00',                 // Singapore
        'RM 0.00',                 // Malaysia
        'Rs. 0.00',                // Sri Lanka
        'AED 0.00',                // UAE/Dubai
        'SR 0.00',                 // Saudi Arabia
        '₽ 0.00'                   // Russia
      ],
      defaultPattern: '₹ 0.00',
      icon: '💰'
    },

    date: {
      label: 'Date',
      patterns: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MMM DD, YYYY', 'DD MMM YYYY'],
      defaultPattern: 'MM/DD/YYYY',
      icon: '📅'
    }
  };

  const formatHelpers = {
    canConvertToNumber(value) {
      if (typeof value === 'number') return true;
      const cleanValue = String(value).replace(/[^\d.-]/g, '');
      return cleanValue !== '' && !isNaN(parseFloat(cleanValue));
    },

    canConvertToDate(value) {
      if (value instanceof Date) return true;
      const str = String(value).trim();
      return !isNaN(Date.parse(str)) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str);
    },

    extractTextContent(htmlContent) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      return tempDiv.textContent || tempDiv.innerText || '';
    },

    preserveRichTextStructure(htmlContent, newTextContent) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;

      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.trim()) {
          textNodes.push(node);
        }
      }

      if (textNodes.length === 1) {
        textNodes[0].textContent = newTextContent;
      } else if (textNodes.length === 0) {
        tempDiv.textContent = newTextContent;
      }

      return tempDiv.innerHTML;
    },

    isNumberCondition(condition) {
      const conditionPattern = /^(<|<=|>|>=|=|!=)\s*\d+(\.\d+)?$|^\d+(\.\d+)?\s*<\s*\(\s*value\s*\)\s*<\s*\d+(\.\d+)?$|^\d+(\.\d+)?\s*<=\s*\(\s*value\s*\)\s*<=\s*\d+(\.\d+)?$|^\d+(\.\d+)?\s*<\s*value\s*<\s*\d+(\.\d+)?$|^\d+(\.\d+)?\s*<=\s*value\s*<=\s*\d+(\.\d+)?$/;
      return conditionPattern.test(condition.trim());
    },

    parseNumberCondition(condition) {
      const trimmed = condition.trim();

      const rangePattern = /^(\d+(?:\.\d+)?)\s*(<|<=)\s*(?:\(?\s*value\s*\)?)\s*(<|<=)\s*(\d+(?:\.\d+)?)$/;
      const rangeMatch = trimmed.match(rangePattern);

      if (rangeMatch) {
        const [, min, minOp, maxOp, max] = rangeMatch;
        const minValue = parseFloat(min);
        const maxValue = parseFloat(max);
        const minInclusive = minOp === '<=';
        const maxInclusive = maxOp === '<=';

        return {
          type: 'range',
          min: minValue,
          max: maxValue,
          minInclusive,
          maxInclusive,
          evaluate: (value) => {
            const num = parseFloat(value);
            if (isNaN(num)) return false;

            const minCondition = minInclusive ? num >= minValue : num > minValue;
            const maxCondition = maxInclusive ? num <= maxValue : num < maxValue;

            return minCondition && maxCondition;
          }
        };
      }

      const simplePattern = /^(<|<=|>|>=|=|!=)\s*(\d+(?:\.\d+)?)$/;
      const simpleMatch = trimmed.match(simplePattern);

      if (simpleMatch) {
        const [, operator, valueStr] = simpleMatch;
        const conditionValue = parseFloat(valueStr);

        return {
          type: 'simple',
          operator,
          value: conditionValue,
          evaluate: (value) => {
            const num = parseFloat(value);
            if (isNaN(num)) return false;

            switch (operator) {
              case '<': return num < conditionValue;
              case '<=': return num <= conditionValue;
              case '>': return num > conditionValue;
              case '>=': return num >= conditionValue;
              case '=': return num === conditionValue;
              case '!=': return num !== conditionValue;
              default: return false;
            }
          }
        };
      }

      return null;
    },

    extractNumbers(content) {
      const text = this.extractTextContent(content);
      const numberPattern = /\b\d+(?:\.\d+)?\b/g;
      const matches = text.match(numberPattern);
      return matches ? matches.map(match => parseFloat(match)) : [];
    },

    evaluateNumberCondition(content, condition) {
      const conditionObj = this.parseNumberCondition(condition);
      if (!conditionObj) return false;

      const numbers = this.extractNumbers(content);
      return numbers.some(num => conditionObj.evaluate(num));
    },

    validateFormat(value, formatType) {
      const textContent = this.extractTextContent(value);

      if (formatType.includes('+')) {
        const [primary] = formatType.split('+');
        return this.validateFormat(textContent, primary);
      }

      switch (formatType) {
        case 'text':
          return { valid: true };
        case 'number':
        case 'currency':
        case 'percentage':
          if (!this.canConvertToNumber(textContent)) {
            return {
              valid: false,
              error: `"${textContent}" cannot be converted to ${formatType}. Please enter a valid number.`
            };
          }
          return { valid: true };
        case 'date':
          if (!this.canConvertToDate(textContent)) {
            return {
              valid: false,
              error: `"${textContent}" cannot be converted to date.`
            };
          }
          return { valid: true };
        default:
          return { valid: true };
      }
    },

    parseNumber(value) {
      const textContent = this.extractTextContent(value);
      if (typeof textContent === 'number') return textContent;

      const str = String(textContent).trim();
      const cleanValue = str.replace(/[^\d.,-]/g, '');

      if (cleanValue.includes('.') && cleanValue.includes(',')) {
        const lastComma = cleanValue.lastIndexOf(',');
        const lastDot = cleanValue.lastIndexOf('.');

        if (lastComma > lastDot) {
          const parsed = parseFloat(cleanValue.replace(/\./g, '').replace(',', '.'));
          return isNaN(parsed) ? 0 : parsed;
        }
      }

      if (cleanValue.includes(',') && !cleanValue.includes('.')) {
        const parsed = parseFloat(cleanValue.replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
      }

      const standardClean = cleanValue.replace(/,/g, '');
      const parsed = parseFloat(standardClean);
      return isNaN(parsed) ? 0 : parsed;
    },

    parseDate(value) {
      const textContent = this.extractTextContent(value);
      if (textContent instanceof Date) return textContent;
      const parsed = new Date(textContent);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    },

    formatNumber(value, pattern) {
      const num = this.parseNumber(value);

      switch (pattern) {
        case '0':
          return Math.round(num).toString();
        case '0.0':
          return num.toFixed(1);
        case '0.00':
          return num.toFixed(2);
        case '#,###':
          return new Intl.NumberFormat('en-US').format(num);
        case '#,###.##':
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(num);
        case '#,##,###':
          return new Intl.NumberFormat('en-IN').format(num);
        case '#,##,###.##':
          return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(num);
        case '#,##,###.###':
          return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 3 }).format(num);
        default:
          return num.toString();
      }
    },

    formatCurrency(value, pattern) {
      const num = this.parseNumber(value);
      const symbolMatch = pattern.match(/^([^\d\s]+|[A-Z]{2,3})\s*/);
      const currencySymbol = symbolMatch ? symbolMatch[1] : '';
      const decimalsMatch = pattern.match(/\.0+/);
      const decimals = decimalsMatch ? decimalsMatch[0].length - 1 : 0;

      let locale;
      let options = {
        minimumFractionDigits: decimals > 0 ? decimals : 0,
        maximumFractionDigits: decimals > 0 ? decimals : 0,
        useGrouping: true
      };

      if (currencySymbol === '₹') {
        locale = 'en-IN';
      } else if (currencySymbol === 'IDR') {
        locale = 'id-ID';
      } else if (currencySymbol === 'R') {
        locale = 'en-ZA';
      } else if (currencySymbol === '¥' && decimals === 2) {
        locale = 'zh-CN';
      } else if (currencySymbol === '¥' && decimals === 0) {
        locale = 'ja-JP';
      } else if (currencySymbol === 'S$') {
        locale = 'en-SG';
      } else if (currencySymbol === 'RM') {
        locale = 'ms-MY';
      } else if (currencySymbol === 'Rs.') {
        locale = 'si-LK';
      } else if (currencySymbol === 'AED') {
        locale = 'ar-AE';
      } else if (currencySymbol === 'SR') {
        locale = 'ar-SA';
      } else if (currencySymbol === '₽') {
        locale = 'ru-RU';
      } else if (currencySymbol === 'OMR') {
        locale = 'ar-OM';
      } else if (currencySymbol === '£') {
        locale = 'en-GB';
      } else if (currencySymbol === '€') {
        locale = 'de-DE';
      } else {
        locale = 'en-US';
      }

      let formattedNumber;

      if (currencySymbol === 'IDR') {
        if (decimals > 0) {
          const integerPart = Math.floor(num);
          const decimalPart = (num - integerPart).toFixed(decimals).substring(2);

          const integerFormatted = integerPart.toLocaleString('de-DE');
          formattedNumber = integerFormatted + ',' + decimalPart;
        } else {
          formattedNumber = Math.floor(num).toLocaleString('de-DE');
        }
      } else {
        formattedNumber = new Intl.NumberFormat(locale, options).format(num);
      }

      const separator = ' ';
      return currencySymbol + separator + formattedNumber;
    },

    formatPercentage(value, pattern) {
      const num = this.parseNumber(value);
      const decimals = (pattern.match(/\.0+/) || [''])[0].length - 1;
      const percentage = num * 100;
      return percentage.toFixed(Math.max(0, decimals)) + '%';
    },

    formatDate(value, pattern) {
      const textContent = this.extractTextContent(value);
      let date;

      if (textContent instanceof Date) {
        date = textContent;
      } else {
        date = new Date(textContent);
        if (isNaN(date.getTime())) {
          const parts = textContent.split(/[/-]/);
          if (parts.length === 3) {
            date = new Date(parts[2], parts[0] - 1, parts[1]);
            if (isNaN(date.getTime())) {
              date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
          }
        }
      }

      if (isNaN(date.getTime())) {
        date = new Date();
      }

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      switch (pattern) {
        case 'MM/DD/YYYY':
          return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
        case 'DD/MM/YYYY':
          return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        case 'YYYY-MM-DD':
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        case 'MMM DD, YYYY':
          return `${monthNames[month - 1]} ${day}, ${year}`;
        case 'DD MMM YYYY':
          return `${day} ${monthNames[month - 1]} ${year}`;
        default:
          return date.toLocaleDateString();
      }
    },

    applyFormat(value, formatType, pattern) {
      if (formatType.includes('+')) {
        const formattedText = this.formatCombined(value, pattern);
        return this.preserveRichTextStructure(value, formattedText);
      }

      let formattedText;
      switch (formatType) {
        case 'number':
          formattedText = this.formatNumber(value, pattern);
          break;
        case 'currency':
          formattedText = this.formatCurrency(value, pattern);
          break;
        case 'percentage':
          formattedText = this.formatPercentage(value, pattern);
          break;
        case 'date':
          formattedText = this.formatDate(value, pattern);
          break;
        default:
          return value;
      }

      return this.preserveRichTextStructure(value, formattedText);
    },
    evaluateFormula(formulaString) {
      try {
        const cleanFormula = formulaString.trim();

        if (!formulaEngine.isItPossibleToAddSheet('temp_sheet')) {
          formulaEngine.addSheet('temp_sheet');
          formulaEngine.removeSheet(formulaEngine.getSheetId('temp_sheet'));
        }

        formulaEngine.addSheet('calculations');
        const sheetId = formulaEngine.getSheetId('calculations');
        let processedFormula = cleanFormula;
        const numToWordPattern = /NUMTOWORD\(([^)]+)\)/gi;

        if (numToWordPattern.test(cleanFormula)) {
          processedFormula = cleanFormula.replace(numToWordPattern, (match, value) => {
            try {
              const num = eval(value.replace(/=/g, ''));
              return `"${numberToWords.toWords(parseFloat(num))}"`;
            } catch (e) {
              return '"#ERROR: Invalid NUMTOWORD"';
            }
          });
        }

        processedFormula = processedFormula.replace(/(\d+(?:\.\d+)?)\s*%/g, (match, num) => {
          return (parseFloat(num) / 100).toString();
        });

        formulaEngine.setCellContents({
          row: 0,
          col: 0,
          sheet: sheetId
        }, processedFormula);

        const result = formulaEngine.getCellValue({
          row: 0,
          col: 0,
          sheet: sheetId
        });

        formulaEngine.removeSheet(sheetId);

        return result;
      } catch (error) {
        DL.error('Formula evaluation error:', error);
        return `#ERROR: ${error.message}`;
      }
    },

    numberToWords(num) {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

      if (num === 0) return 'Zero';
      if (num < 0) return 'Minus ' + this.numberToWords(Math.abs(num));

      let words = '';

      if (num >= 1000000) {
        words += this.numberToWords(Math.floor(num / 1000000)) + ' Million ';
        num %= 1000000;
      }
      if (num >= 1000) {
        words += this.numberToWords(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
      }
      if (num >= 100) {
        words += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      if (num >= 20) {
        words += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      }
      if (num >= 10) {
        words += teens[num - 10] + ' ';
        return words.trim();
      }
      if (num > 0) {
        words += ones[num] + ' ';
      }

      return words.trim();
    },

    isFormula(content) {
      const textContent = this.extractTextContent(content);
      return typeof textContent === 'string' && textContent.trim().startsWith('=');
    },

    processFormulaContent(content, isFormulaEnabled) {
      if (!isFormulaEnabled) {
        return content;
      }

      const textContent = this.extractTextContent(content);

      if (this.isFormula(textContent)) {
        const formulaString = textContent.trim();
        const result = this.evaluateFormula(formulaString);

        if (typeof result === 'string' && result.startsWith('#ERROR')) {
          return this.preserveRichTextStructure(content, `${formulaString} → ${result}`);
        } else {
          return this.preserveRichTextStructure(content, String(result));
        }
      }

      return content;
    },

  };

  function getAllFormatOptions() {
    const options = Object.keys(formatConfigs).map(key => ({
      value: key,
      label: `${formatConfigs[key].icon} ${formatConfigs[key].label}`
    }));

    return options;
  }

  function getFormatLabel(formatType) {
    if (formatConfigs[formatType]) {
      return formatConfigs[formatType].label;
    }
    return 'Text';
  }

  const customRteActions = [
    {
      name: "bold",
      icon: "<b>B</b>",
      attributes: { title: "Bold" },
      result: function (rte) {
        return rte.exec("bold");
      }
    },
    {
      name: "italic",
      icon: "<i>I</i>",
      attributes: { title: "Italic" },
      result: function (rte) {
        return rte.exec("italic");
      }
    },
    {
      name: "underline",
      icon: "<u>U</u>",
      attributes: { title: "Underline" },
      result: function (rte) {
        return rte.exec("underline");
      }
    },
    {
      name: "strikethrough",
      icon: "<s>S</s>",
      attributes: { title: "Strike-through" },
      result: function (rte) {
        return rte.exec("strikeThrough");
      }
    },
  ];

  function initializeConditionManager(component, initialConditions) {
    const conditionTypeSelect = document.getElementById('condition-type');
    const singleValueInput = document.getElementById('single-value-input');
    const rangeInputs = document.getElementById('range-inputs');
    const conditionValue = document.getElementById('condition-value');
    const minValue = document.getElementById('min-value');
    const maxValue = document.getElementById('max-value');
    const caseSensitive = document.getElementById('case-sensitive');
    const highlightBgColor = document.getElementById('highlight-bg-color');
    const highlightTextColor = document.getElementById('highlight-text-color');
    const highlightFontFamily = document.getElementById('highlight-font-family');
    const addBtn = document.getElementById('add-condition-btn');
    const closeBtn = document.getElementById('close-manager-btn');
    const applyBtn = document.getElementById('apply-conditions-btn');
    const conditionsList = document.getElementById('conditions-list');

    let currentConditions = [...initialConditions];

    highlightBgColor.value = component.get('highlight-color') || '#ffff00';
    highlightTextColor.value = component.get('highlight-text-color') || '#000000';
    highlightFontFamily.value = component.get('highlight-font-family') || 'Default';

    conditionTypeSelect.addEventListener('change', function () {
      const selectedType = this.value;

      if (selectedType === 'between') {
        singleValueInput.style.display = 'none';
        rangeInputs.style.display = 'block';
        caseSensitive.disabled = true;
        caseSensitive.checked = false;
      } else {
        singleValueInput.style.display = 'block';
        rangeInputs.style.display = 'none';
        caseSensitive.disabled = false;
      }

      if (['>', '>=', '<', '<=', '=', '!='].includes(selectedType)) {
        conditionValue.placeholder = 'Enter number';
        conditionValue.type = 'number';
        caseSensitive.disabled = true;
        caseSensitive.checked = false;
      } else if (selectedType === 'once-if') {
        conditionValue.placeholder = 'Enter letters, numbers, or spaces to highlight';
        conditionValue.type = 'text';
      } else {
        conditionValue.placeholder = 'Enter text';
        conditionValue.type = 'text';
      }
    });

    addBtn.addEventListener('click', function () {
      const type = conditionTypeSelect.value;

      if (!type) {
        alert('Please select a condition type');
        return;
      }

      let newCondition;

      if (type === 'between') {
        const min = parseFloat(minValue.value);
        const max = parseFloat(maxValue.value);

        if (isNaN(min) || isNaN(max)) {
          alert('Please enter valid numbers for min and max values');
          return;
        }

        if (min >= max) {
          alert('Min value must be less than max value');
          return;
        }

        newCondition = {
          type: 'between',
          minValue: min,
          maxValue: max,
          label: `Between ${min} and ${max}`,
          caseSensitive: false
        };

        minValue.value = '';
        maxValue.value = '';
      } else {
        const value = conditionValue.value;

        if (!value && value !== ' ') {
          alert('Please enter a value');
          return;
        }

        const typeLabels = {
          'contains': 'Contains',
          'starts-with': 'Starts with',
          'ends-with': 'Ends with',
          'exact': 'Exact match',
          'once-if': 'Once if',
          '>': 'Greater than',
          '>=': 'Greater than or equal to',
          '<': 'Less than',
          '<=': 'Less than or equal to',
          '=': 'Equal to',
          '!=': 'Not equal to'
        };

        const isCaseSensitive = caseSensitive.checked && !['>', '>=', '<', '<=', '=', '!='].includes(type);
        const displayValue = value === ' ' ? 'space' : `"${value}"`;

        newCondition = {
          type: type,
          value: value,
          caseSensitive: isCaseSensitive,
          label: `${typeLabels[type]}: ${displayValue}${isCaseSensitive ? ' (case sensitive)' : ''}`
        };

        conditionValue.value = '';
      }

      currentConditions.push(newCondition);
      renderConditionsList();

      conditionTypeSelect.value = '';
      singleValueInput.style.display = 'block';
      rangeInputs.style.display = 'none';
      caseSensitive.checked = false;
      caseSensitive.disabled = false;
    });

    function renderConditionsList() {
      if (currentConditions.length === 0) {
        conditionsList.innerHTML = '<p style="color: #bbb;">No conditions added yet.</p>';
        return;
      }

      const conditionsHtml = currentConditions.map((condition, index) => `
        <div class="condition-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #555;">
          <span style="color: #f8f9fa;">${condition.label}</span>
          <button onclick="removeCondition(${index})" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">Remove</button>
        </div>
      `).join('');

      conditionsList.innerHTML = conditionsHtml;
    }

    window.removeCondition = function (index) {
      currentConditions.splice(index, 1);
      renderConditionsList();
    };

    applyBtn.addEventListener('click', function () {
      component.set('highlight-color', highlightBgColor.value);
      component.set('highlight-text-color', highlightTextColor.value);
      component.set('highlight-font-family', highlightFontFamily.value);
      component.setHighlightConditions(currentConditions);
      editor.Modal.close();
    });

    closeBtn.addEventListener('click', function () {
      editor.Modal.close();
    });

    renderConditionsList();
  }

  function tokenizeDatasourcePath(path) {
    if (path === null || path === undefined) return [];

    const normalizedPath = String(path)
      .trim()
      .replace(/\[\s*(\d+)\s*\]/g, '.$1')
      .replace(/\[\s*['"]([^'"\]]+)['"]\s*\]/g, '.$1')
      .replace(/^\./, '');

    if (!normalizedPath) return [];

    return normalizedPath
      .split('.')
      .map(token => token.trim())
      .filter(Boolean)
      .map(token => (/^\d+$/.test(token) ? Number(token) : token));
  }

  function resolveDatasourcePathValue(source, path) {
    const tokens = tokenizeDatasourcePath(path);
    if (!tokens.length) return undefined;

    return tokens.reduce((currentValue, token) => {
      if (currentValue === null || currentValue === undefined) {
        return undefined;
      }

      return currentValue[token];
    }, source);
  }

  function getPlaceholderCandidatesFromPath(path) {
    const tokens = tokenizeDatasourcePath(path);
    if (tokens.length <= 1) return [];

    const nestedTokens = tokens.slice(1);
    const lastNamedToken = [...nestedTokens]
      .reverse()
      .find(token => typeof token === 'string' && token.trim());

    const candidates = [];

    if (lastNamedToken) {
      candidates.push(lastNamedToken);
    }

    const normalizedNestedPath = nestedTokens.map(token => String(token)).join('.');
    if (normalizedNestedPath) {
      candidates.push(normalizedNestedPath);
    }

    const originalNestedPath = String(path).trim().split('.').slice(1).join('.');
    if (originalNestedPath) {
      candidates.push(originalNestedPath);
    }

    return [...new Set(candidates.filter(Boolean))];
  }

  editor.DomComponents.addType('formatted-rich-text', {
    model: {
      defaults: {
        tagName: 'div',
        draggable: true,
        droppable: false,
        editable: false,
        content: 'Insert your text here',
        traits: [
          {
            type: 'checkbox',
            name: 'formula-label',
            label: 'Enable Formula',
            changeProp: 1
          },
          {
            type: 'select',
            name: 'format-type',
            label: 'Format Type',
            options: getAllFormatOptions(),
            changeProp: 1
          },
          {
            type: 'select',
            name: 'format-pattern',
            label: 'Format Pattern',
            options: [{ value: 'None', label: 'None' }],
            changeProp: 1
          },
          {
            type: 'text',
            name: 'hide-words',
            label: 'Hide Words/Conditions',
            placeholder: 'Examples: word1, word2, <1000, >=500',
            changeProp: 1
          },
          {
            type: 'button',
            name: 'manage-highlight-conditions',
            label: 'Manage Highlight Conditions',
            text: 'Add/Edit Conditions',
            full: true,
            command: 'open-condition-manager',
            changeProp: 1
          },
        ],
        'format-type': 'text',
        'format-pattern': 'None',
        'raw-content': 'Insert your text here',
        'is-editing': false,
        'formula-label': false,
        'templateText': '',
        'hide-words': '',
        'highlight-conditions': [],
        'highlight-condition-type': '',
        'highlight-words': '',
        'highlight-color': '#ffff00'
      },

      init() {
        this.on('change:format-type', this.handleFormatTypeChange);
        this.on('change:format-pattern', this.updateContent);
        this.on('change:hide-words', this.updateContent);
        this.on('change:highlight-words', this.updateContent);
        this.on('change:highlight-color', this.updateContent);
        this.on('change:my-input-json', this.handleJsonPathChange);
        this.on('change:highlight-condition-type', this.updateContent);
        this.on('change:formula-label', this.updateContent);
        this.updateFormatPattern();
        this.updateTooltip();
      },

      updateTooltip() {
        const formatType = this.get('format-type') || 'text';
        const label = getFormatLabel(formatType);
        this.set('custom-name', label, { silent: true });
      },

      handleFormatTypeChange() {
        const newFormatType = this.get('format-type');
        const previousFormatType = this.previous('format-type');
        const rawContent = this.get('raw-content') || '';

        const validation = formatHelpers.validateFormat(rawContent, newFormatType);

        if (!validation.valid) {
          alert(validation.error);
          this.set('format-type', previousFormatType);
          const trait = this.getTrait('format-type');
          if (trait && trait.view) {
            trait.set('value', previousFormatType);
            const selectEl = trait.view.el.querySelector('select');
            if (selectEl) {
              selectEl.value = previousFormatType;
            }
          }

          return;
        }

        this.updateFormatPattern();
        this.updateContent();
        this.updateTooltip();
      },

      handleJsonPathChange() {
        const jsonPath = this.get('my-input-json');

        // Stop RTE safely
        if (this.view && this.view.rteActive) {
          this.view.forceStopRTE();
        }

        if (!jsonPath || !jsonPath.trim()) return;

        try {
          /* ===============================
             FILE INDEX RESOLUTION
          =============================== */
          let fileIndex = this.get('json-file-index') || '0';
          const currentEditor = this.em && this.em.get ? this.em.get('Editor') : null;
          const selectedComponent =
            currentEditor && typeof currentEditor.getSelected === 'function'
              ? currentEditor.getSelected()
              : null;

          // Sync from trait UI only for the actively selected component.
          if (selectedComponent === this) {
            const fileIndexSelect = document.querySelector(
              '.i_designer-sm-property__json-file-index select'
            );
            if (fileIndexSelect) {
              fileIndex = fileIndexSelect.value || '0';
            }
          }
          this.set('json-file-index', fileIndex, { silent: true });
          this.addAttributes({
            'my-input-json': jsonPath,
            'data-json-file-index': fileIndex
          });

          /* ===============================
             JSON SOURCE RESOLUTION
          =============================== */
          let commonJson = null;

          if (fileIndex !== '0') {
            const fileNames = (localStorage.getItem('common_json_files') || '')
              .split(',')
              .map(f => f.trim());

            const selectedFile = fileNames[parseInt(fileIndex, 10) - 1];
            const jsonString = selectedFile
              ? localStorage.getItem(`common_json_${selectedFile}`)
              : null;

            if (jsonString) {
              commonJson = JSON.parse(jsonString);
            }
          } else {
            const jsonString = localStorage.getItem('common_json');
            if (jsonString) {
              commonJson = JSON.parse(jsonString);
            }
          }

          if (!commonJson) return;

          /* ===============================
             CONTENT RESOLUTION
          =============================== */
          const jsonPaths = jsonPath.split(',').map(p => p.trim()).filter(Boolean);
          const storedTemplateText =
            typeof getComponentTemplateText === 'function'
              ? getComponentTemplateText(this)
              : (this.get('templateText') || '');
          const rawContent =
            storedTemplateText ||
            this.get('raw-content') ||
            this.get('content') ||
            '';

          // 🔁 TEMPLATE MODE
          if (rawContent.includes('{') && rawContent.includes('}')) {
            const templateSource = storedTemplateText || String(rawContent);
            if (typeof setComponentTemplateText === 'function') {
              setComponentTemplateText(this, templateSource);
            } else {
              this.set('templateText', templateSource, { silent: true });
            }

            let updatedContent = templateSource;

            jsonPaths.forEach(path => {
              try {
                const value = resolveDatasourcePathValue(commonJson, path);

                if (value !== undefined && value !== null) {
                  const placeholderCandidates = getPlaceholderCandidatesFromPath(path);

                  placeholderCandidates.forEach((placeholderToken) => {
                    const placeholder = `{${placeholderToken}}`;
                    const escaped = placeholder.replace(
                      /[.*+?^${}()|[\]\\]/g,
                      '\\$&'
                    );

                    updatedContent = updatedContent.replace(
                      new RegExp(escaped, 'g'),
                      String(value)
                    );
                  });
                }
              } catch (e) {
                DL.warn(`Error evaluating path ${path}`, e);
              }
            });

            this.set('raw-content', updatedContent, { silent: true });
            this.updateContent?.();

          }
          else {
            const firstPath = jsonPaths[0];

            if (firstPath) {
              try {
                const value = resolveDatasourcePathValue(commonJson, firstPath);

                if (value !== undefined && value !== null) {
                  this.set('raw-content', String(value), { silent: true });
                  this.updateContent?.();
                }
              } catch (e) {
                DL.warn(`Error evaluating path ${firstPath}`, e);
              }
            }
          }

          if (this.view && this.view.el) {
            this.view.render();
            this.em?.trigger('change:canvasOffset');
          }

        } catch (e) {
          DL.error('Error evaluating DataSource path:', e);
        }
      },

      getHighlightConditions() {
        return this.get('highlight-conditions') || [];
      },

      setHighlightConditions(conditions) {
        this.set('highlight-conditions', conditions);
        const conditionStrings = conditions.map(cond => {
          if (cond.type === 'once-if') {
            return `once-if:${cond.value}`;
          } else if (['>', '>=', '<', '<=', '=', '!='].includes(cond.type)) {
            return `${cond.type}${cond.value}`;
          } else if (cond.type === 'between') {
            return `${cond.minValue}<value<${cond.maxValue}`;
          } else {
            return `${cond.type}:${cond.value}`;
          }
        });
        this.set('highlight-words', conditionStrings.join(', '), { silent: true });
        this.updateContent();
      },

      addHighlightCondition(condition) {
        const conditions = this.getHighlightConditions();
        conditions.push(condition);
        this.setHighlightConditions(conditions);
      },

      removeHighlightCondition(index) {
        const conditions = this.getHighlightConditions();
        conditions.splice(index, 1);
        this.setHighlightConditions(conditions);
      },
      updateFormatPattern() {
        const formatType = this.get('format-type') || 'text';
        const config = formatConfigs[formatType];

        if (config) {
          const patternTrait = this.getTrait('format-pattern');
          if (patternTrait) {
            patternTrait.set('options', config.patterns.map(pattern => ({
              value: pattern,
              label: pattern
            })));

            const defaultPattern = config.defaultPattern || config.patterns[0];
            this.set('format-pattern', defaultPattern);
          }
        }
      },

      escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      },

      applyOnceIfHighlight(content, condition, highlightColor, textColor, fontFamily, caseSensitive) {
        const characters = condition.split('');

        characters.forEach(char => {
          if (char || char === ' ') {
            const escapedChar = this.escapeRegex(char);
            let regex;

            if (char === ' ') {
              regex = /(\s)/g;
            } else if (/\d/.test(char)) {
              regex = new RegExp(`(?!<[^>]*?>)(${escapedChar})(?![^<]*?<\/span>)`, caseSensitive ? 'g' : 'gi');
            } else if (/[a-zA-Z]/.test(char)) {
              regex = new RegExp(`(?!<[^>]*?>)(${escapedChar})(?![^<]*?<\/span>)`, caseSensitive ? 'g' : 'gi');
            } else {
              regex = new RegExp(`(?!<[^>]*?>)(${escapedChar})(?![^<]*?<\/span>)`, 'g');
            }

            if (regex) {
              const fontStyle = fontFamily && fontFamily !== 'Default' ? `font-family: ${fontFamily};` : '';
              const colorStyle = textColor ? `color: ${textColor};` : '';
              const replacement = char === ' ' ?
                `<span class="highlighted-word" style="background-color: ${highlightColor};  border-radius: 2px; ${fontStyle} ${colorStyle}">&nbsp;</span>` :
                `<span class="highlighted-word" style="background-color: ${highlightColor};  border-radius: 2px; ${fontStyle} ${colorStyle}">$1</span>`;

              content = content.replace(regex, replacement);
            }
          }
        });

        return content;
      },
      applyHighlightCondition(content, condition, highlightColor, textColor, fontFamily) {
        const conditionType = condition.type;
        const conditionValue = condition.value;
        const caseSensitive = condition.caseSensitive || false;

        if (conditionType === 'once-if') {
          return this.applyOnceIfHighlight(content, conditionValue, highlightColor, textColor, fontFamily, caseSensitive);
        }

        const fontStyle = fontFamily && fontFamily !== 'Default' ? `font-family: ${fontFamily};` : '';
        const colorStyle = textColor ? `color: ${textColor};` : '';
        const styleString = `background-color: ${highlightColor}; padding: 1px 2px; border-radius: 2px; ${fontStyle} ${colorStyle}`;

        if (['>', '>=', '<', '<=', '=', '!='].includes(conditionType)) {
          const conditionString = conditionType + conditionValue;

          if (formatHelpers.isNumberCondition(conditionString)) {
            if (formatHelpers.evaluateNumberCondition(content, conditionString)) {
              const numbers = formatHelpers.extractNumbers(content);
              const conditionObj = formatHelpers.parseNumberCondition(conditionString);

              if (conditionObj) {
                numbers.forEach(num => {
                  if (conditionObj.evaluate(num)) {
                    const escapedNum = this.escapeRegex(num.toString());
                    const regex = new RegExp(`(?!<[^>]*>)\\b(${escapedNum})\\b(?![^<]*<\\/span>)`, 'g');
                    content = content.replace(regex,
                      `<span class="highlighted-word" style="${styleString}">$1</span>`
                    );
                  }
                });
              }
            }
          }
          return content;
        }

        if (conditionType === 'between') {
          const betweenCondition = `${condition.minValue}<value<${condition.maxValue}`;
          if (formatHelpers.isNumberCondition(betweenCondition)) {
            if (formatHelpers.evaluateNumberCondition(content, betweenCondition)) {
              const numbers = formatHelpers.extractNumbers(content);
              const conditionObj = formatHelpers.parseNumberCondition(betweenCondition);

              if (conditionObj) {
                numbers.forEach(num => {
                  if (conditionObj.evaluate(num)) {
                    const escapedNum = this.escapeRegex(num.toString());
                    const regex = new RegExp(`(?!<[^>]*>)\\b(${escapedNum})\\b(?![^<]*<\\/span>)`, 'g');
                    content = content.replace(regex,
                      `<span class="highlighted-word" style="${styleString}">$1</span>`
                    );
                  }
                });
              }
            }
          }
          return content;
        }

        let regex;
        const flags = caseSensitive ? 'g' : 'gi';

        if (conditionType === 'contains') {
          const escapedWord = this.escapeRegex(conditionValue);
          regex = new RegExp(`(?!<[^>]*?>)(\\w*${escapedWord}\\w*)(?![^<]*?<\\/span>)`, flags);
        } else if (conditionType === 'starts-with') {
          const escapedWord = this.escapeRegex(conditionValue);
          regex = new RegExp(`(?!<[^>]*?>)(${escapedWord}\\w*)(?![^<]*?<\/span>)`, flags);
        } else if (conditionType === 'ends-with') {
          const escapedWord = this.escapeRegex(conditionValue);
          regex = new RegExp(`(?!<[^>]*?>)(\\w*${escapedWord})\\b(?![^<]*?<\\/span>)`, flags);
        } else if (conditionType === 'exact') {
          const escapedWord = this.escapeRegex(conditionValue);
          regex = new RegExp(`(?!<[^>]*?>)\\b(${escapedWord})\\b(?![^<]*?<\/span>)`, flags);
        }

        if (regex) {
          content = content.replace(regex,
            `<span class="highlighted-word" style="${styleString}">$1</span>`
          );
        }

        return content;
      },
      applyConditionalFormatting(content) {
        if (!content || typeof content !== 'string') {
          return content || '';
        }

        let processedContent = content;
        const hideWords = this.get('hide-words') || '';
        const highlightConditions = this.getHighlightConditions();
        const highlightColor = this.get('highlight-color') || '#ffff00';
        const highlightTextColor = this.get('highlight-text-color') || '#000000';
        const highlightFontFamily = this.get('highlight-font-family') || 'Default';
        processedContent = processedContent.replace(/<span class="hidden-word"[^>]*>.*?<\/span>/gi, '');
        processedContent = processedContent.replace(/<span class="highlighted-word"[^>]*>(.*?)<\/span>/gi, '$1');
        const hasHideConditions = hideWords.trim().length > 0;
        const hasHighlightConditions = highlightConditions.length > 0;

        if (!hasHideConditions && !hasHighlightConditions) {
          return processedContent;
        }

        if (hasHideConditions) {
          const conditions = hideWords.split(',').map(cond => cond.trim()).filter(cond => cond);

          conditions.forEach(condition => {
            if (condition) {
              if (formatHelpers.isNumberCondition(condition)) {
                if (formatHelpers.evaluateNumberCondition(processedContent, condition)) {
                  processedContent = `<span class="hidden-word" style="display: none;">${processedContent}</span>`;
                }
              } else {
                const escapedWord = this.escapeRegex(condition);
                const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
                processedContent = processedContent.replace(regex,
                  `<span class="hidden-word" style="display: none;">${condition}</span>`
                );
              }
            }
          });
        }

        if (hasHighlightConditions) {
          highlightConditions.forEach(condition => {
            processedContent = this.applyHighlightCondition(processedContent, condition, highlightColor, highlightTextColor, highlightFontFamily);
          });
        }

        return processedContent;
      },
      updateContent() {
        const formatType = this.get('format-type') || 'text';
        const pattern = this.get('format-pattern') || 'None';
        const isFormulaEnabled = this.get('formula-label') || false;
        let rawContent = this.get('raw-content') || '';

        if (typeof rawContent !== 'string') {
          rawContent = String(rawContent);
        }

        const previousContent = this.get('content');
        let formattedContent;

        if (isFormulaEnabled) {
          const textContent = formatHelpers.extractTextContent(rawContent);

          if (formatHelpers.isFormula(textContent)) {
            const formulaResult = formatHelpers.evaluateFormula(textContent.trim());

            if (typeof formulaResult === 'string' && formulaResult.startsWith('#ERROR')) {
              formattedContent = formatHelpers.preserveRichTextStructure(rawContent, `${textContent} → ${formulaResult}`);
            } else {
              formattedContent = formatHelpers.preserveRichTextStructure(rawContent, String(formulaResult));
            }
          } else {
            formattedContent = rawContent;
          }
        } else {
          if (formatType === 'text' || pattern === 'None') {
            formattedContent = rawContent;
          } else {
            try {
              formattedContent = formatHelpers.applyFormat(rawContent, formatType, pattern);
            } catch (error) {
              DL.warn('Format error:', error);
              formattedContent = rawContent;
            }
          }
        }

        const finalContent = this.applyConditionalFormatting(formattedContent);

        if (finalContent !== previousContent) {
          this.set('content', finalContent);
        }
      },

      updateFromJsonPath(jsonPath) {
        if (jsonPath && jsonPath.trim()) {
          this.set('my-input-json', jsonPath, { silent: true });
          this.handleJsonPathChange();
        }
      },

      enableRTE() {
        this.set('is-editing', true);
      },

      disableRTE() {
        this.set('is-editing', false);
      }
    },

    view: {
      events: {
        'dblclick': 'enableRichTextEditing',
        'click': 'handleSingleClick'
      },

      init() {
        this.listenTo(this.model, 'change:is-editing', this.handleEditingChange);
        this.listenTo(this.model, 'change:content', this.render);
        this.rteActive = false;
        this.rteTimeout = null;
      },

      handleSingleClick(e) {
        if (this.rteActive) {
          e.stopPropagation();
          return;
        }

        const clickedElement = e.target;
        const linkElement = clickedElement.closest('a');

        if (linkElement) {
          e.stopPropagation();
          const em = this.model.em;
          if (!em) return;

          const linkTraits = [
            {
              type: 'text',
              name: 'href',
              label: 'Href',
              value: linkElement.getAttribute('href') || ''
            },
            {
              type: 'select',
              name: 'target',
              label: 'Target',
              options: [
                { value: '_self', label: 'This window' },
                { value: '_blank', label: 'New window' }
              ],
              value: linkElement.getAttribute('target') || '_self'
            }
          ];

          const traitManager = em.get('TraitManager');
          if (traitManager) {
            traitManager.getCurrent().forEach(trait => {
              traitManager.removeTrait(trait.get('name'));
            });

            linkTraits.forEach(traitConfig => {
              const trait = traitManager.addTrait(traitConfig);

              trait.on('change:value', () => {
                const traitName = trait.get('name');
                const traitValue = trait.get('value');

                if (traitName === 'href') {
                  linkElement.setAttribute('href', traitValue);
                } else if (traitName === 'target') {
                  linkElement.setAttribute('target', traitValue);
                }

                this.model.set('raw-content', this.el.innerHTML, { silent: true });
              });
            });
            traitManager.trigger('update');
          }

          return;
        }
      },

      handleEditingChange() {
        const isEditing = this.model.get('is-editing');
        if (isEditing && !this.rteActive) {
          this.startRTE();
        } else if (!isEditing && this.rteActive) {
          this.stopRTE();
        }
      },

      enableRichTextEditing(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.rteTimeout) {
          clearTimeout(this.rteTimeout);
          this.rteTimeout = null;
        }

        if (this.rteActive) {
          this.forceStopRTE();
          setTimeout(() => {
            this.model.enableRTE();
          }, 100);
          return;
        }

        const hideWords = this.model.get('hide-words') || '';
        if (hideWords.trim()) {
          const content = this.model.get('content') || '';
          if (content.includes('class="hidden-word"') && content.includes('display: none')) {
            window.alert("please remove hide word conditions first");
            return;
          }
        }

        this.model.enableRTE();
      },

      startRTE() {
        if (this.rteActive) {
          return;
        }

        const em = this.model.em;
        if (!em) {
          return;
        }

        const rte = em.get('RichTextEditor');
        if (!rte) {
          return;
        }

        this.rteActive = true;
        this.originalActions = rte.getAll().slice();
        this.originalActions.forEach(action => {
          try {
            rte.remove(action.name);
          } catch (e) {
          }
        });

        customRteActions.forEach(action => {
          try {
            rte.add(action.name, action);
          } catch (e) {
          }
        });

        const rawContent = this.model.get('raw-content') || '';
        const isFormulaEnabled = this.model.get('formula-label') || false;
        const content = this.model.get('content') || '';
        const templateText =
          typeof getComponentTemplateText === 'function'
            ? getComponentTemplateText(this.model)
            : (this.model.get('templateText') || '');

        if (isFormulaEnabled) {
          this.el.innerHTML = rawContent;
        } else if (
          (typeof hasDatasourceTemplatePlaceholders === 'function'
            ? hasDatasourceTemplatePlaceholders(templateText)
            : /{[^{}]+}/.test(String(templateText || '')))
        ) {
          this.el.innerHTML = templateText;
        } else {
          this.el.innerHTML = content;
        }

        this.el.contentEditable = true;

        try {
          rte.enable(this, null, {
            actions: customRteActions.map(a => a.name),
            styleWithCSS: false
          });
        } catch (e) {
          DL.error('RTE enable error:', e);
          this.rteActive = false;
          this.el.contentEditable = false;
          return;
        }

        this.rteChangeHandler = this.debounce(() => {
          const content = this.el.innerHTML;
          this.model.set('raw-content', content, { silent: true });
        }, 150);

        this.el.addEventListener('input', this.rteChangeHandler);
        this.el.addEventListener('paste', this.handleRTEPaste.bind(this));

        this.globalClickHandler = (e) => {
          if (!this.rteActive) return;
          if (!this.rteClickEnabled) return;

          const clickedInside = this.el.contains(e.target) || this.el === e.target;

          const clickedOnToolbar = e.target.closest('.gjs-rte-toolbar') ||
            e.target.closest('.gjs-toolbar') ||
            e.target.closest('.gjs-rte-actionbar');

          if (!clickedInside && !clickedOnToolbar) {
            this.handleRTEExit();
          } else if (clickedInside) {
            e.stopPropagation();
          }
        };

        this.escapeHandler = (e) => {
          if (e.key === 'Escape') {
            this.handleRTEExit();
          }
        };

        this.rteClickEnabled = false;
        const canvas = em.get('Canvas');
        const canvasBody = canvas?.getBody();
        const canvasDocument = canvas?.getDocument();

        if (canvasBody) {
          canvasBody.addEventListener('mousedown', this.globalClickHandler, true);
        }
        if (canvasDocument) {
          canvasDocument.addEventListener('mousedown', this.globalClickHandler, true);
        }
        document.addEventListener('mousedown', this.globalClickHandler, true);
        document.addEventListener('keydown', this.escapeHandler);

        setTimeout(() => {
          this.rteClickEnabled = true;
        }, 300);

        setTimeout(() => {
          if (this.rteActive && this.el) {
            this.el.focus();
            const range = document.createRange();
            const selection = window.getSelection();

            const walker = document.createTreeWalker(
              this.el,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );

            let lastTextNode = null;
            let node;
            while (node = walker.nextNode()) {
              lastTextNode = node;
            }

            if (lastTextNode) {
              range.setStart(lastTextNode, lastTextNode.textContent.length);
              range.setEnd(lastTextNode, lastTextNode.textContent.length);
            } else {
              range.selectNodeContents(this.el);
              range.collapse(false);
            }

            selection.removeAllRanges();
            selection.addRange(range);
          }
        }, 200);
      },

      debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      },

      handleRTEPaste(e) {
        setTimeout(() => {
          const content = this.el.innerHTML;
          this.model.set('raw-content', content, { silent: true });
        }, 10);
      },

      stopRTE() {
        if (!this.rteActive) {
          return;
        }

        const em = this.model.em;
        if (!em) {
          return;
        }

        const rte = em.get('RichTextEditor');
        if (!rte) {
          return;
        }

        this.rteActive = false;

        if (this.rteChangeHandler) {
          this.el.removeEventListener('input', this.rteChangeHandler);
          this.el.removeEventListener('paste', this.handleRTEPaste);
          this.rteChangeHandler = null;
        }

        if (this.globalClickHandler) {
          this.rteClickEnabled = false;
          const canvas = em.get('Canvas');
          const canvasBody = canvas?.getBody();
          const canvasDocument = canvas?.getDocument();

          if (canvasBody) {
            canvasBody.removeEventListener('mousedown', this.globalClickHandler, true);
          }
          if (canvasDocument) {
            canvasDocument.removeEventListener('mousedown', this.globalClickHandler, true);
          }
          document.removeEventListener('mousedown', this.globalClickHandler, true);

          this.globalClickHandler = null;
        }
        if (this.escapeHandler) {
          document.removeEventListener('keydown', this.escapeHandler);
          this.escapeHandler = null;
        }

        try {
          rte.disable(this);
        } catch (e) {
          DL.error('RTE disable error:', e);
        }

        // Restore original actions
        if (this.originalActions) {
          customRteActions.forEach(action => {
            try {
              rte.remove(action.name);
            } catch (e) {
              console.log('Error removing custom action:');
            }
          });

          // Add back original actions
          this.originalActions.forEach(action => {
            try {
              rte.add(action.name, action);
            } catch (e) {
              console.log('Error restoring action:');
            }
          });

          this.originalActions = null;
        }

        if (this.rteTimeout) {
          clearTimeout(this.rteTimeout);
          this.rteTimeout = null;
        }

        this.el.contentEditable = false;
        this.el.blur();
      },

      forceStopRTE() {
        if (this.rteActive) {
          if (this.rteTimeout) {
            clearTimeout(this.rteTimeout);
            this.rteTimeout = null;
          }

          this.stopRTE();
          this.model.set('is-editing', false, { silent: true });

          if (this.el) {
            this.el.contentEditable = false;
            this.el.blur();
          }
        }
      },

      handleRTEExit() {

        if (!this.rteActive) {
          return;
        }

        const content = this.el.innerHTML;

        const formatType = this.model.get('format-type');
        const isFormulaEnabled = this.model.get('formula-label') || false;
        const previousTemplateText =
          typeof getComponentTemplateText === 'function'
            ? getComponentTemplateText(this.model)
            : (this.model.get('templateText') || '');
        const hasEditedTemplate =
          typeof hasDatasourceTemplatePlaceholders === 'function'
            ? hasDatasourceTemplatePlaceholders(content)
            : /{[^{}]+}/.test(String(content || ''));
        const hadStoredTemplate =
          typeof hasDatasourceTemplatePlaceholders === 'function'
            ? hasDatasourceTemplatePlaceholders(previousTemplateText)
            : /{[^{}]+}/.test(String(previousTemplateText || ''));

        if (typeof setComponentTemplateText === 'function') {
          setComponentTemplateText(this.model, hasEditedTemplate ? content : '');
        } else {
          this.model.set('templateText', hasEditedTemplate ? content : '', { silent: true });
        }
        this.model.set('raw-content', content, { silent: true });

        // Validation and processing
        if (isFormulaEnabled) {
          const textContent = formatHelpers.extractTextContent(content);

          if (formatHelpers.isFormula(textContent)) {
            try {
              const result = formatHelpers.evaluateFormula(textContent.trim());

              if (typeof result === 'string' && result.startsWith('#ERROR')) {
                alert(`Formula Error: ${result.replace('#ERROR: ', '')}`);
                return;
              }
            } catch (error) {
              console.log('Formula validation error:');
              return;
            }
          }

          this.model.updateContent();
        } else {
          const validation = formatHelpers.validateFormat(content, formatType);

          if (!validation.valid) {
            alert(validation.error);
            const previousRawContent = this.model.previous('raw-content');
            if (previousRawContent) {
              this.el.innerHTML = previousRawContent;
              this.model.set('raw-content', previousRawContent, { silent: true });
            }
            return;
          } else {
            console.log('Validation passed, updating content');
            this.model.updateContent();
          }
        }
        this.model.disableRTE();

        if (this.model.get('my-input-json') && (hasEditedTemplate || hadStoredTemplate)) {
          setTimeout(() => {
            if (typeof this.model.handleJsonPathChange === 'function') {
              this.model.handleJsonPathChange();
            } else if (typeof window.rebindAllDatasourceComponents === 'function') {
              window.rebindAllDatasourceComponents('formatted-rich-text-template-edit');
            }
          }, 0);
        }
      },

      onRender() {

        this.el.contentEditable = false;
        const formatType = this.model.get('format-type') || 'text';
        const label = getFormatLabel(formatType);
        this.el.setAttribute('title', label);
        const isFormulaEnabled = this.model.get('formula-label') || false;
        if (isFormulaEnabled) {
          this.el.setAttribute('data-formula', 'true');
        } else {
          this.el.removeAttribute('data-formula');
        }

        const content = this.model.get('content') || '';

        if (!this.rteActive) {
          if (this.el.innerHTML !== content) {
            this.el.innerHTML = content;
          }
        } else {
        }

        this.el.style.wordWrap = 'break-word';
        this.el.style.overflowWrap = 'break-word';
      },

      destroy() {
        if (this.rteActive) {
          this.forceStopRTE();
        }

        if (this.rteTimeout) {
          clearTimeout(this.rteTimeout);
          this.rteTimeout = null;
        }

        if (this.constructor.__super__ && this.constructor.__super__.destroy) {
          this.constructor.__super__.destroy.apply(this, arguments);
        }
      }
    }
  });

  editor.Commands.add('open-condition-manager', {
    run(editor) {
      const selected = editor.getSelected();
      if (!selected || selected.get('type') !== 'formatted-rich-text') return;
      const conditions = selected.getHighlightConditions();
      const modalContent = `
        <div class="condition-manager" style="padding: 0 20px 20px 30px; max-width: 700px;color: white; border-radius: 8px;">
          <!-- Highlight Styles Section -->
          <div class="highlight-styles" style="padding: 10px 20px 20px 0; border-radius: 8px;">
            <h4 style="margin-top: 0; margin-bottom: 20px; color: #f8f9fa;">Highlight Styles</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; align-items: end;">
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Background Color:</label>
                <input type="color" id="highlight-bg-color" value="#ffff00" style="width: 100%; height: 40px; border: 2px solid #666; border-radius: 4px; background: none;">
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Text Color:</label>
                <input type="color" id="highlight-text-color" value="#000000" style="width: 100%; height: 40px; border: 2px solid #666; border-radius: 4px; background: none;">
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Font Family:</label>
                <select id="highlight-font-family" style="width: 100%; padding: 8px; border: 2px solid #666; border-radius: 4px;">
                  <option value="Default">Default</option>
                  <option value="Arial">Arial</option>
                  <option value="Arial Black">Arial Black</option>
                  <option value="Brush Script MT">Brush Script MT</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Impact">Impact</option>
                  <option value="Lucida Sans Unicode">Lucida Sans Unicode</option>
                  <option value="Tahoma">Tahoma</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Add New Condition Section -->
          <div class="add-condition-form">
            <h4 style="margin-top: 10px; margin-bottom: 20px; color: #f8f9fa;">Add New Condition</h4>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 15px;">
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Condition Type:</label>
                <select id="condition-type" style="width: 100%; padding: 10px; border: 2px solid #666; border-radius: 4px;">
                  <option value="">Select Condition Type</option>
                  <option value="contains">Text: Contains</option>
                  <option value="starts-with">Text: Starts With</option>
                  <option value="ends-with">Text: Ends With</option>
                  <option value="exact">Text: Exact Match</option>
                  <option value="once-if">Once If: Highlight individual letters/numbers/spaces</option>
                  <option value=">">Number: > (Greater than)</option>
                  <option value=">=">Number: >= (Greater than or equal)</option>
                  <option value="<">Number: < (Less than)</option>
                  <option value="<=">Number: <= (Less than or equal)</option>
                  <option value="=">Number: = (Equal to)</option>
                  <option value="!=">Number: != (Not equal to)</option>
                  <option value="between">Number: Between (range)</option>
                </select>
              </div>
              
              <div style="display: flex; align-items: center; margin-top:27px;">
                <label style="display: flex; align-items: center; color: #f8f9fa; cursor: pointer;">
                  <input type="checkbox" id="case-sensitive" style="margin-right: 8px; transform: scale(1.2);">
                  <span style="font-weight: bold;">Case Sensitive</span>
                </label>
              </div>
            </div>
            
            <div id="condition-inputs">
              <div id="single-value-input" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Value:</label>
                <input type="text" id="condition-value" style="width: 97%; padding: 10px; border: 2px solid #666; border-radius: 4px;" placeholder="Enter text, number, or space">
              </div>
              
              <div id="range-inputs" style="display: none; margin-bottom: 15px;">
                <div style="display: flex; gap: 15px;">
                  <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Min Value:</label>
                    <input type="number" id="min-value" style="width: 90%; padding: 10px; border: 2px solid #666; border-radius: 4px;">
                  </div>
                  <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Max Value:</label>
                    <input type="number" id="max-value" style="width: 90%; padding: 10px; border: 2px solid #666; border-radius: 4px;">
                  </div>
                </div>
              </div>
            </div>
            
            <button id="add-condition-btn" style="background: #3498db; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold;">Add Condition</button>
          </div>
          
          <!-- Existing Conditions Section -->
          <div class="existing-conditions" style=" padding: 20px 20px 20px 0; border-radius: 8px; margin-bottom: 3px;">
            <div style="margin-top: 5px; color: #f8f9fa; font-weight: bold">Existing Conditions</div>
            <div id="conditions-list" style="max-height: 300px; overflow-y: auto;">
              ${conditions.length === 0 ? '<p style="color: #bbb;">No conditions added yet.</p>' : ''}
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div style="text-align: right;">
            <button id="close-manager-btn" style="background: #95a5a6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-right: 15px; font-weight: bold;">Close</button>
            <button id="apply-conditions-btn" style="background: #27ae60; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold;">Apply Changes</button>
          </div>
        </div>
        `;

      const modal = editor.Modal;
      modal.setTitle('Text Highlight Condition Manager');
      modal.setContent(modalContent);
      modal.open();

      setTimeout(() => {
        initializeConditionManager(selected, conditions);
      }, 100);
    }
  });
}
