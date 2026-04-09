function object(editor) {  
const props_test_object = (i) => i;  
const id_Trait = {
 changeProp: 1,
 name: "id",
 label: "Id",
};
const name_Trait = {
 changeProp: 1,
 type: "text",
 name: "name",
 label: "name",
 placeholder: "Object Name",
};  
const object_path_Trait = ["objectpath"].map((name) => ({
 changeProp: 1,
 type: "text",
 placeholder: "Enter Object Link",
 label:"Object Link",
 name, 
})); 

const all_audio_Traits = [ 
 name_Trait,
 ...object_path_Trait, 
];   
    editor.Components.addType("Object", {
    model: {
    defaults: props_test_object({ 
        tagName: "div",    
        droppable: 0, 
        stylable: 1,
        traits: [id_Trait, ...all_audio_Traits], 
        script: `
        const init = () => { 
        const ctx = this.id;    
        let objectpath1 = "{[ objectpath ]}";     
        let audioLink = 'https://www.w3schools.com/tags/pic_trulli.jpg'; 
        if(objectpath1 !=='' && objectpath1 !== undefined && objectpath1 !==' '){
        audioLink = objectpath1;
        }
        const audioElement = document.getElementById(ctx);   
        let object = document.createElement('object');    
        object.data = audioLink; 
        audioElement.appendChild(object);       
    }; 
    if (!window.Highcharts) {  
        const scr = document.createElement("script"); 
        scr.onload = init; 
    } else { 
        init(); 
    }`,
        }), 

    init() {     
        const events = all_audio_Traits
        .filter((i) => ["strings"].indexOf(i.name) < 0).map((i) => `change:${i.name}`).join(" ");
        this.on(events, () => {   
        this.trigger("change:script");
        });
    },  

    },
    });  
    
    editor.Blocks.add("object", {
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> Object',
    category: "Tags", 
    content: {
        type: "Object",
        selectable: true,
        draggable: true,  
        droppable: true,
    },
    });   
}