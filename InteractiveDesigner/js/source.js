function source(editor) {
  const id_Trait = {
    changeProp: 1,
    name: "id",
    label: "Id",
  };

  const name_Trait = {
    changeProp: 1,
    type: "text",
    name: "name",
    label: "Name",
    placeholder: "Audio Name",
  };

  const audio_path_Trait = {
    changeProp: 1,
    type: "text",
    name: "audiopath",
    label: "Audio Link",
    placeholder: "Enter Audio Link",
  };

  const loop_Trait = {
    changeProp: 1,
    type: "checkbox",
    name: "loop",
    label: "Loop",
  };

  const all_audio_Traits = [
    name_Trait,
    audio_path_Trait,
    loop_Trait,
  ];

  editor.Components.addType("Audio", {
    model: {
      defaults: {
        tagName: "audio",
        resizable: 1,
        droppable: 0,
        stylable: 1,
        traits: [id_Trait, ...all_audio_Traits],
        attributes: {
          controls: true,
          src: "https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/intromusic.ogg",
        },
        style: {
          padding: "10px 0px",
        },
      },

      init() {
        this.on("change:audiopath", () => {
          const path = this.get("audiopath");
          if (path && path.trim() !== "") {
            this.addAttributes({ src: path });
          } else {
            this.addAttributes({
              src: "https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/intromusic.ogg",
            });
          }
        });

        this.on("change:loop", () => {
          const shouldLoop = this.get("loop");
          if (shouldLoop) {
            this.addAttributes({ loop: true });
          } else {
            this.removeAttributes("loop");
          }
        });
      },
    },
  });

  editor.Blocks.add("source_audio", {
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> Source Audio',
    category: "Tags",
    content: {
      type: "Audio",
    },
  });

  editor.BlockManager.add("sourceVideos", {
    category: "Tags",
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> Source Video',
    content: `<video controls> <source src="video.mp4" type="video/mp4"> <source src="video.ogg" type="video/ogg"> </video>`,
  });

  editor.BlockManager.add("marquee-tag-block", {
    category: "Tags",
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> Marquee',
    content: { type: "Marquee" },
  });
}