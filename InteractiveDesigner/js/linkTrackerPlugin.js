function linkTrackerPlugin(editor) {
  editor.on('load', () => {
    console.log("🔗 Link Tracker started...");

    const cssc = editor.CssComposer;

    const scanLinks = () => {
      const wrapper = editor.getWrapper();
      const allLinks = wrapper.find('a');

      allLinks.forEach(linkComp => {
        const href = linkComp.getAttributes().href || '';
        let linkId = linkComp.getId();
        if (!linkId) {
          linkId = `link-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          linkComp.addAttributes({ id: linkId });
        }

        const selector = `#${linkId}`;
        const linkText = linkComp.get('content') || '';
        linkComp.addAttributes({ 'data-text': linkText });

        if (href.startsWith('#')) {
          const pageContainer = linkComp.closest('.page-container');
          if (!pageContainer) return;

          const targetId = href.slice(1);
          const target = pageContainer.find(`#${targetId}`);

          if (target && target.length > 0) {
            cssc.setRule(selector, {
              'pointer-events': 'none',
              cursor: 'default',
            });

            const printSelector = `@media print { ${selector} }`;
            cssc.setRule(printSelector, {
              'pointer-events': 'none',
              cursor: 'default',
              color: 'inherit',
              'text-decoration': 'none',
              'position': 'relative',
            });
            const printAfterSelector = `@media print { ${selector}::after }`;
            cssc.setRule(printAfterSelector, {
              content: `attr(data-text)`,
            });

          } else {
            cssc.setRule(selector, { 'pointer-events': '', cursor: '' });
            const printSelector = `@media print { ${selector} }`;
            cssc.setRule(printSelector, { 'pointer-events': '', cursor: '' });
            const printAfterSelector = `@media print { ${selector}::after }`;
            cssc.setRule(printAfterSelector, { content: '' });
          }
        } else {
          cssc.setRule(selector, { 'pointer-events': '', cursor: '' });
          const printSelector = `@media print { ${selector} }`;
          cssc.setRule(printSelector, { 'pointer-events': '', cursor: '' });
          const printAfterSelector = `@media print { ${selector}::after }`;
          cssc.setRule(printAfterSelector, { content: '' });
        }
      });
    };
    scanLinks();

    editor.on('component:add', scanLinks);
    editor.on('component:update', scanLinks);
    editor.on('component:remove', scanLinks);
  });
}
