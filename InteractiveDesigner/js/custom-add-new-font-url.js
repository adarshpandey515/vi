function customNewFontUrl(editor) {
  editor.Blocks.add("AddfontUrl", {
    label: '<h3>Add New font URL<h3>',
    content: '<scriptTag></scriptTad>',
    category: 'Fonts',
    attributes: { class: 'add-new-font-url' },
  });

  editor.on('block:drag:stop', (block) => {
    if (block.get('tagName') === 'scripttag') {
      AddfontUrl();
    }
  });
  var options = [
    { value: "Arial, Helvetica , sans-serif", name: "Arial" },
    { value: "Arial Black, Gadget,sans-serif", name: "Arial Black" },
    { value: "Brush Script MT, sans-serif", name: "Brush Script MT" },
    { value: "Comic Sans MS, cursive", name: "Comic Sans MS" },
    { value: "Courier New, Courier, monospace", name: "Courier New" },
    { value: "Georgia, serif", name: "Georgia" },
    { value: "Helvetica, sans-serif", name: "Helvetica" },
    { value: "Impact, Charcoal, sans-serif", name: "Impact" },
    { value: "Lucida Sans Unicode, sans-serif", name: "Lucida Sans Unicode" },
    { value: "Tahoma, Geneva, sans-serif", name: "Tahoma" },
    { value: "Times New Roman, Times, serif", name: "Times New Roman" },
    { value: "Trebuchet MS, Helvetica, sans-serif", name: "Trebuchet MS" },
    { value: "Verdana, Geneva, sans-serif", name: "Verdana" },
  ]
  var allLink = [];
  var styleManager = editor.StyleManager;
  var typographyFont = JSON.parse(localStorage.getItem("typographyFont"));
  if (typographyFont === null) {
    localStorage.setItem("typographyFont", JSON.stringify(options));
    typographyFont = options;
  }
  editor.on('load', function () {
    var iframe = editor.getContainer().querySelector('iframe');
    var contentWindow = iframe.contentWindow;
    var iframeDocument = contentWindow.document;
    var head = iframeDocument.head;
    var allFontLink = JSON.parse(localStorage.getItem("allFontLink"));
    if (allFontLink !== null) {
      allLink = allFontLink;
      for (let i = 0; i < allLink.length; i++) {
        const link = document.createElement('link');
        link.href = allLink[i].link;
        link.rel = 'stylesheet';
        head.appendChild(link);
      }
    }
    var sector = styleManager.getSector('typography');
    var properties = sector.get('properties');
    properties.remove('font-family');
    styleManager.addSector("font", {
      name: "Font",
      open: false,
      properties: [
        {
          label: "Font family",
          property: "font-family",
          type: "select",
          options: typographyFont.reverse(),
          attributes: { class: 'new-font' },
        },
      ],
    },
    );
  });

  function AddfontUrl() {
    editor.Modal.setTitle('Add New Fonts URL');
    editor.Modal.setContent(`<div class="new-table-form"> 
        <div> 
        <label for="name">Font Name</label>
          <input type="text" class="form-control" placeholder="Enter font name" value="" name="name" id="fontName" >
          <label for="fvalue" style="padding-left: 30px;">Font Value</label>
          <input type="text" class="form-control" placeholder="Enter fonts value" value="" name="fvalue" id="fontValue">
        </div>   
        <div>
        <p>for example: https://fonts.googleapis.com/css?family=Poppins</p>
        </div>
        <div> 
            <input type="text" class="form-control" value="" placeholder="Enter fonts url" style="width:95%"  name="nColumns" id="nColumns">
        </div>  
        <p>Do you want to add this font globally?</p>  
        <div class="form-check">
          <label class="form-check-label">
            <input type="radio" class="form-check-input" name="globallyFont" value="Yes">Yes
          </label>
        </div>
        <div class="form-check">
          <label class="form-check-label">
            <input type="radio" class="form-check-input" name="globallyFont" value="No">No
          </label>
        </div>

        <input id="table-button-create-new" type="button" value="Add" data-component-id="c1006">
        </div>
        </div>
        `);
    editor.Modal.open();
    var el = document.getElementById("table-button-create-new");
    el.addEventListener("click", addFontScript, true);
    editor.DomComponents.getComponents().forEach(component => {
      if (component.get('tagName') === 'scripttag') {
        component.remove('content', '');
      }
    });
    function addFontScript() {
      var fonturl = document.getElementById('nColumns').value;
      var fontName = document.getElementById('fontName').value;
      var fontValue = document.getElementById('fontValue').value;
      if (fonturl == '' || fonturl == undefined || fonturl == null) {
        alert('Font URL is required');
        return false;
      }
      if (fontName == '' || fontName == undefined || fontName == null) {
        alert('Font name is required');
        return false;
      }
      if (fontValue == '' || fontValue == undefined || fontValue == null) {
        alert('Font value is required');
        return false;
      }
      for (let i = 0; i < typographyFont.length; i++) {
        if (typographyFont[i].name === fontName) {
          alert('Already added this font name');
          return false;
        }
        if (typographyFont[i].value === fontValue) {
          alert('Already added this font value');
          return false;
        }
      }
      var radioButton = document.querySelector('input[name="globallyFont"]:checked');
      if (radioButton === null) {
        alert("Please select an option.");
        return false;
      }
      var iframe = editor.getContainer().querySelector('iframe');
      var contentWindow = iframe.contentWindow;
      var iframeDocument = contentWindow.document;
      var head = iframeDocument.head;
      var link = document.createElement('link');
      link.href = fonturl;
      link.rel = 'stylesheet';
      head.appendChild(link);
      if (radioButton.value === 'Yes') {
        var body = iframeDocument.body;
        body.style.fontFamily = fontValue;
      }
      allLink.push({ link: fonturl });
      localStorage.setItem("allFontLink", JSON.stringify(allLink));
      editor.Modal.close();
      const optionvl = { value: fontName, name: fontValue }
      var sector = styleManager.getSector('typography');
      var properties = sector.get('properties');
      properties.remove('font-family');
      typographyFont.push(optionvl);
      localStorage.setItem("typographyFont", JSON.stringify(typographyFont));
      styleManager.addSector("font", {
        name: "Font",
        open: false,
        properties: [
          {
            label: "Font family",
            property: "font-family",
            type: "select",
            default: typographyFont.value,
            options: typographyFont.reverse(),
            attributes: { class: 'new-font' },
          },
        ],
      },
      );
      styleManager.render();
    };
  }
}