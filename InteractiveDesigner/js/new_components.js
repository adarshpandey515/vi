function newComponents(editor) {
  editor.BlockManager.add("basicBtn", {
    category: "Buttons",
    label: '<h1><i class="fa fa-play fa-lg"></i></h1> Basic',
    content:
      '<div class="btn-group" role="group" aria-label="Basic example"> <button type="button" class="btn btn-primary">Left</button> <button type="button" class="btn btn-primary">Middle</button> <button type="button" class="btn btn-primary">Right</button> </div>',
  });
  editor.BlockManager.add("mixedBtn", {
    category: "Buttons",
    label: '<h1><i class="fa fa-play fa-lg"></i></h1> Mixed',
    content:
      '<div class="btn-group" role="group" aria-label="Basic mixed styles example"> <button type="button" class="btn btn-danger">Left</button> <button type="button" class="btn btn-warning">Middle</button> <button type="button" class="btn btn-success">Right</button> </div>',
  });
  editor.BlockManager.add("outlinedBtn", {
    category: "Buttons",
    label: '<h1><i class="fa fa-play fa-lg"></i></h1> Outlined',
    content:
      '<div class="btn-group" role="group" aria-label="Basic outlined example"> <button type="button" class="btn btn-outline-primary">Left</button> <button type="button" class="btn btn-outline-primary">Middle</button> <button type="button" class="btn btn-outline-primary">Right</button> </div>',
  });
  editor.BlockManager.add("bootstrapBtn", {
    category: "Buttons",
    label: '<h1><i class="fa fa-play fa-lg"></i></h1> Bootstrap Buttons',
    content:
      '<button type="button" class="btn btn-primary">Primary</button> <button type="button" class="btn btn-secondary">Secondary</button> <button type="button" class="btn btn-success">Success</button> <button type="button" class="btn btn-danger">Danger</button> <button type="button" class="btn btn-warning">Warning</button> <button type="button" class="btn btn-info">Info</button> <button type="button" class="btn btn-light">Light</button> <button type="button" class="btn btn-dark">Dark</button>',
  });
  editor.BlockManager.add("singleBtn", {
    category: "Buttons",
    label: '<h1><i class="fa fa-play fa-lg"></i></h1>Single Buttons',
    content:
      '<button type="button" class="btn btn-primary">Primary</button>',
  });
  editor.BlockManager.add("basicList", {
    category: "List group",
    label: '<h1><i class="fa fa-list fa-lg"></i></h1> Basic',
    content:
      '<ul class="list-group"> <li class="list-group-item">An item</li> <li class="list-group-item">A second item</li> <li class="list-group-item">A third item</li> <li class="list-group-item">A fourth item</li> <li class="list-group-item">And a fifth one</li></ul>',
  });
  editor.BlockManager.add("activeList", {
    category: "List group",
    label: '<h1><i class="fa fa-list fa-lg"></i></h1> Active',
    content:
      '<ul class="list-group"> <li class="list-group-item active" aria-current="true">An active item</li> <li class="list-group-item">A second item</li> <li class="list-group-item">A third item</li> <li class="list-group-item">A fourth item</li> <li class="list-group-item">And a fifth one</li> </ul>',
  });
  editor.BlockManager.add("disabledList", {
    category: "List group",
    label: '<h1><i class="fa fa-list fa-lg"></i></h1> Disabled',
    content:
      '<ul class="list-group"> <li class="list-group-item disabled" aria-disabled="true">A disabled item</li> <li class="list-group-item">A second item</li> <li class="list-group-item">A third item</li> <li class="list-group-item">A fourth item</li> <li class="list-group-item">And a fifth one</li> </ul>',
  });
  editor.BlockManager.add("variantsList", {
    category: "List group",
    label: '<h1><i class="fa fa-list fa-lg"></i></h1> Variants',
    content:
      '<ul class="list-group"> <li class="list-group-item">A simple default list group item</li> <li class="list-group-item list-group-item-primary">A simple primary list group item</li> <li class="list-group-item list-group-item-secondary">A simple secondary list group item</li> <li class="list-group-item list-group-item-success">A simple success list group item</li> <li class="list-group-item list-group-item-danger">A simple danger list group item</li> <li class="list-group-item list-group-item-warning">A simple warning list group item</li> <li class="list-group-item list-group-item-info">A simple info list group item</li> <li class="list-group-item list-group-item-light">A simple light list group item</li> <li class="list-group-item list-group-item-dark">A simple dark list group item</li> </ul>',
  });
  editor.BlockManager.add("alphabeticalOL", {
    category: "Basic",
    label: '<h1><i class="fa fa-list fa-lg"></i></h1> Alphabetical OL',
    content: '<ol type="A"><li>Item 1</li><li>Item 2</li><li>Item 3</li></ol>',
  });
  editor.BlockManager.add("numericalOL", {
    category: "Basic",
    label: '<h1><i class="fa fa-list fa-lg"></i></h1> Numerical OL',
    content:
      '<ol type="1" start="1"><li>Item 1</li><li>Item 2</li><li>Item 3</li></ol>',
  });
  editor.BlockManager.add("DLDTDD", {
    category: "Basic",
    label: '<h1><i class="fa fa-list fa-lg"></i></h1> DL Tag',
    content:
      '<dl class="dl-horizontal"><dt>Description 1</dt><dd>Item 1</dd><dt>Description 2</dt> <dd>Item 2</dd></dl>',
  });
  editor.BlockManager.add("Embed", {
    category: "Basic",
    label: '<h1><i class="fa fa-list fa-lg"></i></h1> Embed',
    content:
      '<iframe width="100%" height="auto" src="https://www.youtube.com/embed/9xwazD5SyVg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
  });
  editor.BlockManager.add("frameset", {
    category: "Basic",
    label: '<h1><i class="fa fa-list fa-lg"></i></h1> Frameset',
    content: `<div class="row"  style="width:100%;padding: 10px 0px;margin-left:0px">
      <div class="col-md-4">
        <div class="frame">Frame 1</div>
      </div>
      <div class="col-md-4">
        <div class="frame">Frame 2</div>
      </div>
      <div class="col-md-4">
        <div class="frame">Frame 3</div>
      </div>
    </div>`,
  });
  editor.BlockManager.add("Searchbar", {
    category: "Basic",
    label: '<h1><i class="fa fa-search fa-lg"></i></h1> Search Bar',
    content: ` 
    <div class="col-lg-12"> 
       <input type="text" id="searchInput" placeholder="search word">
       <button  id="highlightTextBtn" style="border: 1px solid #ccc;">Search</button>
   </div>  
   <script> 
   window.addEventListener('load', function() { 
     var tags = document.getElementsByTagName('*'); 
     for (var i = 0; i < tags.length; i++) {
       if (tags[i].innerHTML.trim() !== '') {
         tags[i].classList.add('search_bar_highlight');
       }
     }
   }); 
   document.addEventListener("click", function(event) {
    var target = event.target; 
    if (target && target.id === "highlightTextBtn") {
      highlightText();
    }
  });

   function highlightText() {
     var inputText = document.getElementById("searchInput").value;
     var elements = document.getElementsByClassName("search_bar_highlight"); 
     removeHighlights(); 
     if (inputText.trim() !== "") { 
      if(inputText.length < 2){
        alert('Minimum search word at least 2 characters');
        return false;
      }
       var regex = new RegExp(inputText, 'gi');
       for (var i = 0; i < elements.length; i++) {
         var element = elements[i];
         var innerHTML = element.innerHTML; 
         if (innerHTML.match(regex)) {
           var highlightedHTML = innerHTML.replace(regex, "<span class='highlight_text'>$&</span>");
           element.innerHTML = highlightedHTML;
         }
       }
     }
     document.getElementById("searchInput").value = inputText;
   } 
   
   function removeHighlights() {
     var highlightedElements = document.getElementsByClassName("search_bar_highlight"); 
     for (var i = 0; i < highlightedElements.length; i++) {
       var element = highlightedElements[i];
       var highlightedSpans = element.querySelectorAll(".highlight_text"); 
       for (var j = 0; j < highlightedSpans.length; j++) {
         var span = highlightedSpans[j];
         span.outerHTML = span.innerHTML;
       }
     }
   }    
   </script>
   `,
  });
  editor.BlockManager.add("iframe", {
    category: "Tags",
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> I Frame',
    content:
      '<iframe class="embed-responsive-item" src="" title="Your Title"></iframe>',
  });
  editor.BlockManager.add("span", {
    category: "Tags",
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> Span',
    content: "<span>Span Text</span>",
  });
  editor.BlockManager.add("Em", {
    category: "Tags",
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> Em',
    content: "<em>Em Text</em>",
  });
  editor.BlockManager.add("figure", {
    category: "Tags",
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> Figure',
    content: `<div> <figure> <img src="https://via.placeholder.com/150/FFFF00/" alt="Trulli"> <figcaption>Fig.1 - Trulli, Puglia, Italy.</figcaption> </figure> </div>`,
  });
  editor.BlockManager.add("Center", {
    category: "Tags",
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> Center',
    content: `<center> <p>Your centered text goes here</p></center>`,
  });
  editor.BlockManager.add("Picture", {
    category: "Tags",
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> Picture',
    content: `<div style="padding:5px 0px"><picture>
    <source media="(min-width:650px)" srcset="https://www.w3schools.com/tags/img_pink_flowers.jpg"> 
    <img src="https://www.w3schools.com/tags/img_orange_flowers.jpg" alt="Flowers" style="width:auto;">
  </picture></div>`,
  });
  editor.BlockManager.add("Canvas", {
    category: "Tags",
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> Canvas',
    content: `<canvas width="200"  height="100" style="border:1px solid #000000;">`,
  });
  editor.BlockManager.add("basicRange", {
    category: "Range",
    label: '<h1><i class="fa fa-sliders fa-lg"></i></h1> Basic',
    content: `<label for="customRange1" class="form-label w-100">Basic range</label> <input class="w-100" type="range" class="form-range" id="customRange1">`,
  });
  editor.BlockManager.add("disabledRange", {
    category: "Range",
    label: '<h1><i class="fa fa-sliders fa-lg"></i></h1> Disabled',
    content: `<label for="disabledRange" class="form-label w-100">Disabled range</label> <input type="range" class="form-range w-100" id="disabledRange" disabled>`,
  });
  editor.BlockManager.add("minMaxRange", {
    category: "Range",
    label: '<h1><i class="fa fa-sliders fa-lg"></i></h1> Min&Max',
    content: `<label for="disabledRange" class="form-label w-100">Min and max range</label> <input type="range" class="form-range w-100" min="0" max="5" id="customRange2">`,
  });
  editor.BlockManager.add("stepsRange", {
    category: "Range",
    label: '<h1><i class="fa fa-sliders fa-lg"></i></h1> Steps',
    content: `<label for="disabledRange" class="form-label w-100">Steps range</label> <input type="range" class="form-range w-100" min="0" max="5" step="0.5" id="customRange3">`,
  });
  editor.BlockManager.add('social', {
    label: 'Social Media Icons',
    category: 'Basic',
    attributes: { class: 'fa fa-share-alt' },
    content: `
      <div class="social-icons">
        <a href="#" class="fa fa-facebook mr-2"></a>
        <a href="#" class="fa fa-twitter mr-2"></a>
        <a href="#" class="fa fa-instagram mr-2"></a>
      </div>
    `,
  });
  editor.BlockManager.add('tab-2', {
    label: 'Tabs',
    media: '\n      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">\n        <path d="M22 9.3c0-.8-.5-1.3-1.3-1.3H3.4C2.5 8 2 8.5 2 9.3v7.4c0 .8.5 1.3 1.3 1.3h17.4c.8 0 1.3-.5 1.3-1.3V9.3zM21 17H3V9h18v8z" fill-rule="nonzero"/><rect x="3" y="5" width="4" height="2" rx=".5"/><rect x="8" y="5" width="4" height="2" rx=".5"/><rect x="13" y="5" width="4" height="2" rx=".5"/>\n      </svg>\n    ',
    category: "Extra",
    content: { type: 'tabs' }
  });

  editor.BlockManager.add("pdfExportBtn", {
    category: "Extra",
    label: '<h1><i class="fa fa-file-pdf-o fa-lg"></i></h1>PDF Btn',
    content:
      '<button type="button" id="exportPDFBtn" class="btn btn-primary">Download PDF</button>',
  });

  editor.on('load', function () {
    let category = editor.BlockManager.getCategories();
    category.each((category) => category.set("open", false));
  });
} 