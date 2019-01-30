var mainpage;

function createList(){
    if(document.getElementById("levelList")){
        return;
    }
    // Get main page element generated by ArcGIS
    mainpage = $('#main-page');

    // Create div element to store list
    var divider = $("<div id='levelList' class='level'></div>");
    var listDivider = $("<div id='levelDiv' class='levelDiv'></div>");

    //Create button to toggle
    // var btnDivider = $("<div class='paddles'></div>");
    var buttonUp = $("<button id='upBtn' class='up-paddle paddle hidden'></button>").text("▲");
    var buttonDown = $("<button id='downBtn' class='down-paddle paddle'></button>").text("▼");

    // Create List Element
    var list = $("<ul class='mdc-list'></ul>");
    addListElements(list, 10)

    // Append elements in order
    divider.append(buttonUp);
    listDivider.append(list);
    divider.append(listDivider);
    divider.append(buttonDown);
    mainpage.append(divider);

    // Make the DIV element draggable and add scroll events for arrows
    setScrollEvent();
    dragElement(document.getElementById("levelList"));  
}

function addListElements(mainList, number){
    var index;

    for (index = 0; index < number; index++) { 
        var listElement;
        var content = "";

        // Create List element
        listElement = $("<li class='mdc-list-item listElement'></li>");

        if(index < 9){
            listElement.css('padding-left', '34%'); // change to 34 if using chrome, 38 for IE
        }

        // Handle onclick event for list element here
        setOnclickEvent(listElement);

        // Create span element with 2 span child for double lined lists
        var span = $("<span class='mdc-list-item__text primaryText'></span>").text(content + (index +1));

        // Create separator for the lists
        var separator = $("<li  role='separator' class='mdc-list-divider'></li>");

        // Append span elements together and to the list element
        listElement.append(span);

        // Append to the main ul and add separator
        mainList.append(listElement);
        mainList.append(separator);
    }
}

function removeList(){
    if(document.getElementById("levelList")){
        document.getElementById("levelList").remove();
    }
}

function setScrollEvent(){
    // Get the list and scroll buttons elements
    var list = document.getElementById("levelDiv"); 
    var btnUp = document.getElementById("upBtn");
    var btnDown = document.getElementById("downBtn");

    // Add listeners to buttons to scroll the page and display accordingly
    btnDown.addEventListener("click", function(ev){
        list.scrollTop += 200;
        if((list.scrollHeight-list.scrollTop)<300){
            btnDown.style.display = "none";
        }
        if(list.scrollTop > 0){
            btnUp.style.display = "block";
        }
        ev.stopPropagation(); 
    });

    btnUp.addEventListener("click", function(ev){
        list.scrollTop -= 200;
        if(list.scrollTop < (list.scrollHeight-200)){
            btnDown.style.display = "block";
        }
        if(list.scrollTop == 0){
            btnUp.style.display = "none";
        }
        ev.stopPropagation(); 
    });

    // Add listeners to toggle hide or show buttons
    list.addEventListener("scroll", function(){
        if((list.scrollHeight-list.scrollTop)<300){
            btnDown.style.display = "none";
        }
        if(list.scrollTop > 0){
            btnUp.style.display = "block";
        }
        if(list.scrollTop < (list.scrollHeight-300)){
            btnDown.style.display = "block";
        }
        if(list.scrollTop == 0){
            btnUp.style.display = "none";
        }
    });
}

function setOnclickEvent(listElement){

    // Handle onclick event for list element here
    var isDragging = false;
    listElement
    .click(function(ev) {
        // Prevent click event from propagating and closing itself
        ev.stopPropagation(); 
    })
    .mousedown(function(ev) {
        $(window).mousemove(function() {
             // If mouse moved, the element is being dragged
            isDragging = true;
            $(window).off("mousemove");
        });
    })
    .mouseup(function(ev) {
        var wasDragging = isDragging;
        isDragging = false;
        $(window).off("mousemove");
        if (!wasDragging) {
            // if mouse wasnt moved, then we allow click to happen
            alert( "Handler for .click() called." ); 
        }
    });
}

// Function to make element draggable 
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV: 
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}