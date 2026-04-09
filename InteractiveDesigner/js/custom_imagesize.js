function customImage(editor) {
  editor.DomComponents.addType('image', {
    extend: 'image',

    model: {
      init() {
        this.listenTo(this, 'change:src', this.adjustToParentSize);
      },

      adjustToParentSize() {
        const el = this.view?.el;
        const src = this.get('src');
        if (!el || !src) return;

        setTimeout(() => {
          const parentEl = el.parentElement;
          if (!parentEl) return;

          const parentWidth = parentEl.offsetWidth || 0;
          const parentHeight = parentEl.offsetHeight || 0;

          const img = new Image();
          img.onload = () => {
            const naturalWidth = img.width;
            const naturalHeight = img.height;
            const aspectRatio = naturalHeight / naturalWidth;

            const fitsWithinParent =
              naturalWidth <= parentWidth && naturalHeight <= parentHeight;

            if (fitsWithinParent) {
              this.setStyle({
                width: `${naturalWidth}px`,
                height: `${naturalHeight}px`,
                display: 'block',
                objectFit: 'contain',
                maxWidth: '100%',
                maxHeight: '100%',
              });
            } else {
              const widthRatio = parentWidth / naturalWidth;
              const heightRatio = parentHeight / naturalHeight;
              const scale = Math.min(widthRatio, heightRatio, 1);

              const newWidth = naturalWidth * scale;
              const newHeight = naturalHeight * scale;

              this.setStyle({
                width: `${newWidth}px`,
                height: `${newHeight}px`,
                display: 'block',
                objectFit: 'contain',
                maxWidth: '100%',
                maxHeight: '100%',
              });
            }
            this.set('aspectRatio', aspectRatio);
          };

          img.src = src;
        }, 50);
      },
    },

    view: {
      onRender() {
        const el = this.el;
        const comp = this.model;

        if (!comp._resizeObserver) {
          comp._resizeObserver = new ResizeObserver(() => {
            comp.adjustToParentSize();
          });

          const parentEl = el.parentElement;
          if (parentEl) comp._resizeObserver.observe(parentEl);
        }
      },
    },
  });
}
