function grapesjsHideOnPrint(editor, opts = {}) {
  const TRAIT_NAME = opts.traitName || 'hideOnPrint';
  const CLASS_NAME = opts.className || 'hide-on-print';
  const isPageSetupActive = () => {
    if (typeof opts.isPageSetupActive === 'function') {
      try {
        return !!opts.isPageSetupActive(editor);
      } catch (e) {
        return false;
      }
    }
    return !!(window.pageSetupManager && window.pageSetupManager.isInitialized);
  };

  const removeTraitFromComponent = (component) => {
    if (!component || typeof component.get !== 'function') return;

    // Remove trait entry itself
    if (typeof component.removeTrait === 'function') {
      try {
        component.removeTrait(TRAIT_NAME);
      } catch (e) {}
    } else {
      const traits = component.get('traits');
      if (traits && typeof traits.remove === 'function') {
        try {
          const toRemove = traits.find((tr) => {
            if (!tr) return false;
            return typeof tr.get === 'function'
              ? tr.get('name') === TRAIT_NAME
              : tr.name === TRAIT_NAME;
          });
          if (toRemove) traits.remove(toRemove);
        } catch (e) {}
      } else if (Array.isArray(traits)) {
        component.set(
          'traits',
          traits.filter((tr) => (tr && tr.name ? tr.name !== TRAIT_NAME : true)),
        );
      }
    }

    // Remove previous hide-on-print state from component model/classes
    try {
      component.set(TRAIT_NAME, false);
    } catch (e) {}
    try {
      const classes = component.get('classes');
      const existingClass = classes && classes.find
        ? classes.find(cls => cls.get('name') === CLASS_NAME)
        : null;
      if (existingClass && classes && classes.remove) {
        classes.remove(existingClass);
      }
    } catch (e) {}

    const children = component.get('components');
    if (children && typeof children.forEach === 'function') {
      children.forEach(child => removeTraitFromComponent(child));
    }
  };

  const applyTraitToComponent = (component) => {
    if (!component || typeof component.get !== 'function') return;
    if (isPageSetupActive()) {
      removeTraitFromComponent(component);
      return;
    }

    const traitCollection =
      (typeof component.getTraits === 'function' && component.getTraits()) ||
      component.get('traits') ||
      [];

    const traitArray = Array.isArray(traitCollection)
      ? traitCollection
      : (traitCollection.models || []);

    const alreadyHasTrait = traitArray.some(tr => {
      if (!tr) return false;
      if (typeof tr.get === 'function') return tr.get('name') === TRAIT_NAME;
      return tr.name === TRAIT_NAME;
    });

    if (!alreadyHasTrait) {
      component.addTrait({
        type: 'checkbox',
        label: opts.label || 'Hide on print',
        name: TRAIT_NAME,
        changeProp: 1,
      });
    }

    if (!component._hasHideOnPrintHandler) {
      component.on(`change:${TRAIT_NAME}`, () => {
        const shouldHide = component.get(TRAIT_NAME);
        const classes = component.get('classes');
        const existingClass = classes.find(cls => cls.get('name') === CLASS_NAME);

        if (shouldHide && !existingClass) {
          classes.add({ name: CLASS_NAME });
        } else if (!shouldHide && existingClass) {
          classes.remove(existingClass);
        }
      });

      component._hasHideOnPrintHandler = true;
    }

    const children = component.get('components');
    if (children && typeof children.forEach === 'function') {
      children.forEach(child => applyTraitToComponent(child));
    }
  };

  editor.on('load', () => {
    const wrapper = editor.getWrapper();
    applyTraitToComponent(wrapper);

    const style = `
      <style>
        @media print {
          .${CLASS_NAME} {
            display: none !important;
          }
        }
      </style>
    `;
    editor.addComponents(style);
  });

  editor.on('component:add', component => {
    applyTraitToComponent(component);
  });

  // Re-attach trait lifecycle after custom clear-canvas flow.
  document.addEventListener('canvasCleared', () => {
    setTimeout(() => {
      const wrapper = editor.getWrapper();
      if (wrapper) applyTraitToComponent(wrapper);
    }, 0);
  });

  // Safety: if a component is selected and trait is missing, attach it lazily.
  editor.on('component:selected', component => {
    applyTraitToComponent(component);
  });

  document.addEventListener('pageSetupStateChanged', () => {
    const wrapper = editor.getWrapper();
    if (!wrapper) return;
    if (isPageSetupActive()) {
      removeTraitFromComponent(wrapper);
    } else {
      applyTraitToComponent(wrapper);
    }
  });
}
