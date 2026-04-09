
function customTableOfContents(editor) {
  const domc = editor.DomComponents;
  domc.addType('custom-heading', {
    isComponent(el) {
      if (el.tagName && /^H[1-7]$/.test(el.tagName) && el.classList.contains('custom-heading')) {
        return { type: 'custom-heading' };
      }
    },

    model: {
      defaults: {
        tagName: 'h1',
        name: 'Heading',
        content: 'New Heading',
        editable: true,
        droppable: false,
        traits: [
          {
            type: 'select',
            name: 'level',
            label: 'Heading Level',
            options: [
              { id: 'h1', name: 'Header 1' },
              { id: 'h2', name: 'Header 2' },
              { id: 'h3', name: 'Header 3' },
              { id: 'h4', name: 'Header 4' },
              { id: 'h5', name: 'Header 5' },
              { id: 'h6', name: 'Header 6' },
              { id: 'h7', name: 'Header 7' },
            ],
            changeProp: 1,
          },
        ],
        level: 'h1',
        styles: `
        h1.custom-heading { font-size: 32px; font-weight: bold; margin: 16px 0; }
        h2.custom-heading { font-size: 24px; font-weight: bold; margin: 14px 0; }
        h3.custom-heading { font-size: 18px; font-weight: bold; margin: 12px 0; }
        h4.custom-heading { font-size: 16px; font-weight: bold; margin: 10px 0; }
        h5.custom-heading { font-size: 14px; font-weight: bold; margin: 8px 0; }
        h6.custom-heading { font-size: 12px; font-weight: bold; margin: 6px 0; }
        h7.custom-heading { font-size: 11px; font-weight: bold; margin: 4px 0; }
      `,
        attributes: { class: 'custom-heading' },
      },

      init() {
        this.on('change:level', this.updateTag);
      },

      updateTag() {
        const newTag = this.get('level') || 'h1';
        const preservedContent = this.view.el
          ? this.view.el.textContent
          : this.get('content') || 'New Heading';

        const existingId = this.view.el?.id;
        if (this.view.el) {
          const newEl = document.createElement(newTag);
          newEl.className = 'custom-heading';
          newEl.textContent = preservedContent;
          newEl.setAttribute('contenteditable', 'true');
          if (existingId) newEl.id = existingId;

          this.view.el.parentNode.replaceChild(newEl, this.view.el);
          this.view.el = newEl;
          this.view.attachListeners(newEl);
        }

        this.set('content', preservedContent, { silent: true });

        setTimeout(() => editor.runCommand('generate-toc'), 100);
      },
    },

    view: {
      onRender() {
        const model = this.model;
        const tag = this.el.tagName.toLowerCase();
        model.set('level', tag, { silent: true });
        this.el.setAttribute('contenteditable', 'true');
        this.attachListeners(this.el);
      },

      attachListeners(el) {
        const model = this.model;
        el.removeEventListener('blur', this.blurHandler);
        el.removeEventListener('input', this.inputHandler);

        this.blurHandler = () => {
          model.set('content', el.textContent, { silent: true });
          editor.runCommand('generate-toc');
        };

        this.inputHandler = () => {
          model.set('content', el.textContent, { silent: true });
        };

        el.addEventListener('blur', this.blurHandler);
        el.addEventListener('input', this.inputHandler);
      },

      getCursorPosition() {
        if (!this.el || !window.getSelection) return 0;
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return 0;
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(this.el);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        return preCaretRange.toString().length;
      },

      setCursorPosition(position) {
        if (!this.el || !window.getSelection) return;
        const selection = window.getSelection();
        const range = document.createRange();

        let currentPos = 0;
        const walker = document.createTreeWalker(
          this.el,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        while ((node = walker.nextNode())) {
          const nodeLength = node.textContent.length;
          if (currentPos + nodeLength >= position) {
            range.setStart(node, position - currentPos);
            range.setEnd(node, position - currentPos);
            break;
          }
          currentPos += nodeLength;
        }

        selection.removeAllRanges();
        selection.addRange(range);
      },
    },
  });

  editor.BlockManager.add('custom-heading', {
    label: 'Heading',
    category: 'Basic',
    content: { type: 'custom-heading' },
    media: '<i class="fa fa-font fa-2x"></i>',
  });


  domc.addType('toc-block', {
    model: {
      defaults: {
        name: 'Table of Contents',
        tagName: 'div',
        draggable: true,
        droppable: false,
        traits: [
          {
            type: 'select', name: 'list-type', label: 'List Type', options: [
              { id: 'ol', name: 'Ordered' }, { id: 'ul', name: 'Unordered' }], changeProp: 1
          },
          { type: 'checkbox', name: 'want-border', label: 'Show Borders', changeProp: 1 },
          {
            type: 'select', name: 'toc-style', label: 'TOC Style', options: [
              { id: 'classic', name: 'Classic (Word-like)' },
              { id: 'modern', name: 'Modern Minimal' },
              { id: 'boxed', name: 'Boxed with Shading' }], changeProp: 1
          },
          {
            type: 'select', name: 'levels', label: 'Include Levels', options: [
              { id: '1', name: 'H1 only' }, { id: '2', name: 'H1–H2' },
              { id: '3', name: 'H1–H3' }, { id: '4', name: 'H1–H4' },
              { id: '7', name: 'H1–H7 (All)' }], changeProp: 1
          },
          {
            type: 'select', name: 'tab-leader', label: 'Tab Leader', options: [
              { id: 'dots', name: 'Dotted (....)' }, { id: 'dashes', name: 'Dashed (----)' },
              { id: 'solid', name: 'Solid (____)' }, { id: 'none', name: 'None' }], changeProp: 1
          },
          {
            type: 'select', name: 'page-align', label: 'Page Number Alignment', options: [
              { id: 'right', name: 'Right (default)' },
              { id: 'left', name: 'Left' }, { id: 'center', name: 'Center' }], changeProp: 1
          },
          ...[1, 2, 3, 4, 5, 6, 7].map(l => ({
            type: 'number', name: `spacing-h${l}`, label: `Spacing H${l} (px)`, min: 0, max: 100, step: 2, changeProp: 1
          })),
          { type: 'checkbox', name: 'clickable', label: 'Clickable Headings', changeProp: 1 },
          { type: 'checkbox', name: 'show-page-num', label: 'Show Page Numbers', changeProp: 1 },
        ],

        attributes: { class: 'table-of-contents toc-container' },
        components: `<h2>Table of Contents</h2><ul></ul>`,
        styles: `
        .table-of-contents { padding: 15px; margin: 15px 0; font-family: Arial, sans-serif; border: 1px solid #ddd; }
        .table-of-contents h2 { margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: bold; }
        .table-of-contents ul, .table-of-contents ol { margin: 0; padding: 0; list-style: none; }
        .table-of-contents li { font-size: 14px; padding: 4px 8px; display: flex; align-items: center; justify-content: space-between; }
        .table-of-contents a, .table-of-contents span.no-link { color: #333; text-decoration: none; display: flex; flex: 1; align-items: center; }
        .table-of-contents a:hover { color: #007cba; text-decoration: underline; }
        .table-of-contents .heading-text { flex-shrink: 0; margin-right: 6px; }
        .table-of-contents .dots { flex-grow: 1; border-bottom: 1px dotted #999; margin: 0 6px; height: 1px; }
        .table-of-contents .page-num { flex-shrink: 0; min-width: 30px; font-weight: bold; color: #666; }
        .table-of-contents.with-borders li { border-bottom: 1px solid #333; background: #fafafa; }
        .table-of-contents.with-borders li:nth-child(even) { background: #fff; }
        .table-of-contents.toc-style-classic .heading-text { font-family: "Times New Roman", serif; font-size: 14px; }
        .table-of-contents.toc-style-modern .heading-text { font-family: Arial, sans-serif; font-size: 15px; font-weight: 500; }
        .table-of-contents.toc-style-boxed { background: #f9f9f9; border: 2px solid #bbb; padding: 12px; border-radius: 4px; }
        .table-of-contents.toc-tab-dots .dots { border-bottom: 1px dotted #999; }
        .table-of-contents.toc-tab-dashes .dots { border-bottom: 1px dashed #666; }
        .table-of-contents.toc-tab-solid .dots { border-bottom: 1px solid #000; }
        .table-of-contents.toc-tab-none .dots { border: none; }
        .table-of-contents.toc-align-right .page-num { text-align: right; }
        .table-of-contents.toc-align-left .page-num { text-align: left; }
        .table-of-contents.toc-align-center .page-num { text-align: center; }
      `,
        'list-type': 'ul',
        'want-border': false,
        'toc-style': 'classic',
        'levels': 7,
        'tab-leader': 'dots',
        'page-align': 'right',
        'clickable': true,
        'show-page-num': true,
        ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(l => [`spacing-h${l}`, 4]))
      },

      init() {
        const refresh = () => setTimeout(() => editor.runCommand('generate-toc'), 100);
        this.on('change', refresh);
      },
    }
  });

  editor.BlockManager.add('table-of-contents', {
    label: 'Table of Contents',
    category: 'Basic',
    content: { type: 'toc-block' },
    media: '<i class="fa fa-list fa-2x"></i>',
  });

  function generateUniqueId(text, level, index) {
    const baseId = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    return `${baseId}-h${level}-${index + 1}`;
  }

  editor.Commands.add('generate-toc', {
    run(editor) {
      const tocComp = editor.getWrapper().find('.toc-container')[0];
      if (!tocComp) return;

      const listType = tocComp.get('list-type') || 'ul';
      const maxLevel = parseInt(tocComp.get('levels') || 7);
      const clickable = tocComp.get('clickable');
      const showPageNum = tocComp.get('show-page-num');

      const doc = editor.Canvas.getDocument();
      const headings = doc.querySelectorAll(
        'h1.custom-heading, h2.custom-heading, h3.custom-heading, h4.custom-heading, h5.custom-heading, h6.custom-heading, h7.custom-heading'
      );

      const items = [];
      const counters = [0, 0, 0, 0, 0, 0, 0];

      headings.forEach((el, i) => {
        const text = el.innerText.trim();
        if (!text) return;

        const level = parseInt(el.tagName.substring(1));
        if (level > maxLevel) return;

        let id = el.id;
        if (!id) {
          id = `heading-${level}-${i}-${Date.now()}`;
          el.setAttribute('id', id);
        }

        counters[level - 1]++;
        for (let j = level; j < counters.length; j++) counters[j] = 0;

        let numberString = '';
        if (listType === 'ol') {
          numberString = counters.slice(0, level).filter(n => n > 0).join('.') + '.';
        }

        const pageEl = el.closest('.page-container');
        const pageNum = pageEl ? parseInt(pageEl.getAttribute('data-page-index')) + 1 : i + 1;

        const linkStart = clickable ? `<a href="#${id}" data-target="${id}">` : `<span class="no-link">`;
        const linkEnd = clickable ? `</a>` : `</span>`;
        const pageSpan = showPageNum ? `<span class="page-num">${pageNum}</span>` : '';

        items.push(`
        <li class="level-${level}" data-level="${level}">
          ${listType === 'ol' ? `<span class="number">${numberString}</span>` : ''}
          ${linkStart}
            <span class="heading-text">${text}</span>
            <span class="dots"></span>
            ${pageSpan}
          ${linkEnd}
        </li>
      `);
      });

      const htmlContent = items.length > 0 ? items.join('') : '<li>No headings found</li>';

      const existingList = tocComp.components().find(c => c.get('tagName') === 'ul' || c.get('tagName') === 'ol');
      if (existingList) existingList.remove();

      const newListHtml = `<${listType}>${htmlContent}</${listType}>`;
      const titleComp = tocComp.components().find(c => c.get('tagName') === 'h2');

      if (titleComp) {
        tocComp.components().add(newListHtml, { parse: true, at: tocComp.components().indexOf(titleComp) + 1 });
      } else {
        tocComp.components().add(newListHtml, { parse: true });
      }

      const tocEl = tocComp.view.el;
      tocEl.querySelectorAll('li').forEach(li => {
        const lvl = parseInt(li.getAttribute('data-level')) || 1;
        const spacing = tocComp.get(`spacing-h${lvl}`) || 4;
        li.style.margin = `${spacing}px 0`;
      });

      const classes = tocComp.view.el.classList;
      classes.toggle('with-borders', tocComp.get('want-border'));

      classes.remove('toc-style-classic', 'toc-style-modern', 'toc-style-boxed');
      classes.add(`toc-style-${tocComp.get('toc-style')}`);

      classes.remove('toc-tab-dots', 'toc-tab-dashes', 'toc-tab-solid', 'toc-tab-none');
      classes.add(`toc-tab-${tocComp.get('tab-leader')}`);

      classes.remove('toc-align-right', 'toc-align-left', 'toc-align-center');
      classes.add(`toc-align-${tocComp.get('page-align')}`);
    },
  });

  editor.on('component:add', comp => {
    if (comp.get('type') === 'custom-heading') {
      setTimeout(() => editor.runCommand('generate-toc'), 200);

      // Listen for content changes
      comp.on('change:content', () => {
        setTimeout(() => editor.runCommand('generate-toc'), 100);
      });

      // Listen for level changes
      comp.on('change:level', () => {
        setTimeout(() => editor.runCommand('generate-toc'), 100);
      });
    }
  });

  editor.on('component:remove', comp => {
    if (comp.get('type') === 'custom-heading') {
      setTimeout(() => editor.runCommand('generate-toc'), 100);
    }
  });

  editor.on('export:html', ({ head, body }) => {
    const scrollScript = `
      <script>
        document.addEventListener('DOMContentLoaded', function () {
          
          document.querySelectorAll('.table-of-contents a').forEach((link, index) => {
            
            link.addEventListener('click', function (e) {
              e.preventDefault();
              const targetId = this.getAttribute('href').substring(1);
              const target = document.getElementById(targetId);
              if (target) {
                target.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start' 
                });
              
                target.style.backgroundColor = '#ffffcc';
                setTimeout(() => {
                  target.style.backgroundColor = '';
                }, 2000);
              } else {
              }
            });
          });
        });
      </script>
    `;
    body += scrollScript;
    return { head, body };
  });
}