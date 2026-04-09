function customCarousel(editor) {
  editor.Blocks.add('carousel', {
    category: 'Extra',
    label: '<i class="fa fa-sliders"></i> Carousel',
    content: {
      type: 'carousel-placeholder',
      tagName: 'div',
      style: { minHeight: '40px', border: '1px dashed #999' }
    }
  });

  editor.DomComponents.addType('carousel-placeholder', {
    model: {
      defaults: {
        droppable: false,
        selectable: true
      },

      init() {
        setTimeout(() => openModal(this), 0);
      }
    }
  });

  function openModal(placeholder) {
    editor.Modal.setTitle('Create Carousel');
    editor.Modal.setContent(`
      <div style="padding:10px">
        <label>Slides</label>
        <input id="slides" type="number" value="3" min="2"/><br/><br/>
        <label>Interval (ms)</label>
        <input id="interval" type="number" value="2000" min="1000"/><br/><br/>
        <button id="createCarousel">Create</button>
      </div>
    `);

    editor.Modal.open();

    document
      .getElementById('createCarousel')
      .onclick = () => buildCarousel(placeholder);
  }

  function buildCarousel(placeholder) {
    const slides = Math.max(2, +document.getElementById('slides').value);
    const interval = Math.max(1000, +document.getElementById('interval').value);
    const id = `carousel_${Date.now()}`;
    const items = [];

    for (let i = 0; i < slides; i++) {
      items.push({
        tagName: 'div',
        classes: ['carousel-item', i === 0 ? 'active' : ''],
        components: [{
          type: 'image',
          attributes: {
            src: `https://via.placeholder.com/800x400?text=Slide+${i + 1}`
          },
          style: {
            width: '100%',
            height: '300px',
            display: 'block',
            margin: '0 auto'
          }
        }]
      });
    }

    const carousel = {
      tagName: 'div',
      classes: ['carousel', 'slide'],
      attributes: {
        id,
        'data-ride': 'carousel',
        'data-interval': interval
      },
      components: [
        {
          tagName: 'div',
          classes: ['carousel-inner'],
          components: items
        },
        {
          tagName: 'a',
          classes: ['carousel-control-prev'],
          attributes: {
            href: `#${id}`,
            'data-slide': 'prev'
          },
          components: [{ tagName: 'span', classes: ['carousel-control-prev-icon'] }]
        },
        {
          tagName: 'a',
          classes: ['carousel-control-next'],
          attributes: {
            href: `#${id}`,
            'data-slide': 'next'
          },
          components: [{ tagName: 'span', classes: ['carousel-control-next-icon'] }]
        }
      ]
    };

    const parent = placeholder.parent();
    placeholder.remove();
    parent.append(carousel);

    editor.Modal.close();
  }
}
