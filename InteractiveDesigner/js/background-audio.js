function backgroundMusic(editor) {
  editor.Components.addType('background-music', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: false,
        draggable: true,
        attributes: { class: 'background-music' },
        components: [{
          tagName: 'i',
          attributes: { class: 'fas fa-volume-mute music-icon' }
        }],
        traits: [
          { type: 'id', label: 'ID' },
          { type: 'text', name: 'title', label: 'Audio Title', placeholder: 'Enter title' },
          { type: 'text', name: 'src', label: 'Audio Link', placeholder: 'https://...' },
          { type: 'checkbox', name: 'loop', label: 'Loop', valueTrue: 'loop' }
        ],
        styles: `
          .background-music .music-icon {
            cursor: pointer;
            display: inline-block;
            width: 40px;  
            height: 40px;
          }
          .background-music .music-icon::before {
            font-size: 40px;
          }
        `,
        script: function () {
          const el = this;
          let audio;
          let isPlaying = false;

          function togglePlay() {
            const src = el.getAttribute('src');
            const loop = el.getAttribute('loop');
            const icon = el.querySelector('.music-icon');

            if (!src) {
              alert('No audio link provided!');
              return;
            }

            if (!audio) {
              audio = new Audio(src);
              audio.loop = !!loop;
            }

            if (isPlaying) {
              audio.pause();
              icon.classList.remove('fa-volume-up');
              icon.classList.add('fa-volume-mute');
            } else {
              audio.play();
              icon.classList.remove('fa-volume-mute');
              icon.classList.add('fa-volume-up');
            }

            isPlaying = !isPlaying;
          }

          const icon = el.querySelector('.music-icon');
          if (icon) {
            icon.addEventListener('click', togglePlay);

            const styleTag = document.createElement('style');
            document.head.appendChild(styleTag);

            const resizeObserver = new ResizeObserver(entries => {
              for (let entry of entries) {
                const { width, height } = entry.contentRect;
                const newSize = Math.min(width, height);
                styleTag.textContent = `
                  .background-music .music-icon::before {
                    font-size: ${newSize}px !important;
                  }
                `;
              }
            });
            resizeObserver.observe(icon);
          }
        }
      }
    }
  });

  editor.BlockManager.add('background-music', {
    label: 'Background Music',
    category: 'Basic',
    attributes: { class: 'fa fa-music' },
    content: { type: 'background-music' }
  });
}
