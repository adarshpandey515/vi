function customTabWithNav(editor) {
  editor.on('block:drag:stop', (block) => {
    if (block.get('type') === 'nav-tabs') {
      var ccid = block.ccid;
      const iframe = editor.getContainer().querySelector('iframe');
      const contentWindow = iframe.contentWindow;
      const iframeDocument = contentWindow.document;
      const head = iframeDocument.head;
      const body = iframeDocument.body;
      const style = document.createElement('style');
      style.innerHTML = ` 
           #main-nav-div .hamburger-menu {
            display: none !important;
            text-align: right;
            font-size: 30px;
            padding: 10px; 
            color: #472e90;
            cursor: pointer;
          } 
           @media (max-width: 991px) { 
            #main-nav-div .hamburger-menu {
               display: block !important;
            }  
            #main-nav-div .tab-container, #main-nav-div .tab{
              width:99%;
              text-align:center;
           } 
          } 
          @media (max-width: 767px){
            #main-nav-div .hamburger-menu {
              display: block !important;
           }
           #$main-nav-div .tab-container, #main-nav-div .tab{
             width:98%;
          }  
          } 
          `;
      head.appendChild(style);
      const script = document.createElement('script');
      script.innerHTML = ` 
            var hamburgerMenu = document.getElementById("hamburgerMenu");  
            var tabContainer = document.querySelectorAll('#main-nav-div .tab-container'); 
            hamburgerMenu.addEventListener("click", function() {  
              if (tabContainer[0].style.display === "block") {
                tabContainer[0].style.display = "none"; 
              } else {
                tabContainer[0].style.display = "block";  
              } 
            });   

            function  updateView(){   
              const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0); 
              const tabContainer = document.querySelectorAll('#main-nav-div .tab-container');  
              if (viewportWidth >= 991) {  
                tabContainer[0].style.display = "block";
              } else{
                tabContainer[0].style.display = "none";
              }  
            } 
           window.addEventListener('resize', updateView); 
            `
      body.appendChild(script);
    }
  });
} 