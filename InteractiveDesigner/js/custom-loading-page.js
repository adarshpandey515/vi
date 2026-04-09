function customLoadingPage(editor) {
    editor.Panels.addPanel({ id: "devices-c" })
        .get("buttons")
        .add([
            {
                id: "loadPageGif",
                attributes: { title: "Loading Page With Animation", id: "loadPageGif" },
                className: "exportPDF fa fa-spinner",
            },
        ]);

    editor.on('load', function () {
        var loadPageGifClick = document.getElementById("loadPageGif");
        loadPageGifClick.addEventListener("click", addGiffilePopup, true);
    })

    let removeTag = "<div></div>";
    let defaultBGColor = "#472e90";
    function addGiffilePopup() {
        var html = editor.getHtml();
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, "text/html");
        var scriptElement = doc.querySelector("script#interactive-designer-script-loader");
        var scriptElement2 = doc.querySelector("div#interactive-designer-loader");
        var fileName = null;
        if (scriptElement) {
            scriptElement.parentNode.removeChild(scriptElement);
            scriptElement2.parentNode.removeChild(scriptElement2);
            html = doc.body.outerHTML;
            fileName = localStorage.getItem('page-load-added-name');
            defaultBGColor = localStorage.getItem('page-load-color');
            removeTag = `<div><p>Already Added Image Name : ${fileName} <a href="javascript:void(0)" style="color:red" id="removeLoadingImageT"><i class="fa fa-trash"></i> <a></p> </div>`;
        } else {
            defaultBGColor = "#472e90";
            localStorage.setItem('page-load-color', 'No');
            removeTag = "<div></div>"
        }
        editor.Modal.setTitle('Add Animation Gif image');
        editor.Modal.setContent(`<div class="new-table-form">
        ${removeTag}
        <div>
         Background Color 
        </div>
        <div> 
            <input type="color" class="form-control popupinput1" value="${defaultBGColor}" style="width:100%"  name="loadingColorInput" id="loadingColorInput">
        </div>  
        <div>
         Gif Image
        </div>
        <div> 
            <input type="file" accept="image/gif" class="form-control popupinput2" value="" style="width:95%"  name="loadingimageInput" id="loadingimageInput">
        </div>  
        <input id="loading-image-add-btn" class="popupaddbtn" type="button" value="Add" data-component-id="c1006">
        </div>
        </div>
        `);
        editor.Modal.open();
        var el = document.getElementById("loading-image-add-btn");
        el.addEventListener("click", addLoadingImage, true);
        if (fileName !== null) {
            var el2 = document.getElementById("removeLoadingImageT");
            el2.addEventListener("click", removeLoadingImage, true);
        }
    }

    function addLoadingImage() {
        const input = document.getElementById('loadingimageInput');
        const inputColor = document.getElementById('loadingColorInput');
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.addEventListener('load', (event) => {
                var html = editor.getHtml();
                const css = editor.getCss();
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, "text/html");
                var scriptElement = doc.querySelector("script#interactive-designer-script-loader");
                var scriptElement2 = doc.querySelector("div#interactive-designer-loader");
                if (scriptElement) {
                    scriptElement.parentNode.removeChild(scriptElement);
                    scriptElement2.parentNode.removeChild(scriptElement2);
                    html = doc.body.outerHTML;
                    editor.setComponents(html);
                    editor.setStyle(css);
                    removeTag = "<div></div>"
                } else {

                }
                setTimeout(() => {
                    const base64String = event.target.result;
                    const loadertag = `<div id="interactive-designer-loader"></div>`;
                    const body = editor.Canvas.getDocument().body;
                    editor.DomComponents.addComponent(loadertag, { parent: body, at: 0 });

                    var loaderScript = `<script id="interactive-designer-script-loader">             
            var loader; 
            function loadNow(opacity) {
                if (opacity <= 0) {displayContent();} else {
                    loader.style.opacity = opacity;
                    window.setTimeout(function() {loadNow(opacity - 1);}, 10000);
                }
            } 
            function displayContent() {  loader.style.display = 'none';} 
            document.addEventListener("DOMContentLoaded", function() {
                loader = document.getElementById('interactive-designer-loader'); 
                    loader.style.position=  "fixed";
                    loader.style.width=  '100%';
                    loader.style.height=  '100vh';
                    loader.style.zIndex =  1;
                    loader.style.overflow=  "visible";
                    loader.style.background=  '${inputColor.value} url(${base64String}) no-repeat center center'; 
                loadNow(1);
            });
            </script>`

                    editor.DomComponents.addComponent(loaderScript);
                    editor.Modal.close();

                    alert("Loading page with gif animation added");
                }, 500);
            });
            reader.readAsDataURL(file);
            localStorage.setItem('page-load-added-name', file.name);
            localStorage.setItem('page-load-color', inputColor.value);
        } else {
            alert('No file selected');
        }

    }

    function removeLoadingImage() {
        var html = editor.getHtml();
        const css = editor.getCss();
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, "text/html");
        var scriptElement = doc.querySelector("script#interactive-designer-script-loader");
        var scriptElement2 = doc.querySelector("div#interactive-designer-loader");
        if (scriptElement) {
            scriptElement.parentNode.removeChild(scriptElement);
            scriptElement2.parentNode.removeChild(scriptElement2);
            html = doc.body.outerHTML;
            editor.setComponents(html);
            editor.setStyle(css);
            editor.Modal.close();
            localStorage.setItem('page-load-color', '472e90');
            defaultBGColor = "#472e90";
            removeTag = "<div></div>"
        } else {

        }
        alert('Page load animation removed');

    }
}